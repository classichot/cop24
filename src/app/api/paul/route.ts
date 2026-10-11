import { readFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { appHelp, detectMode, feedbackOffline, legalOffline, systemPrompt, triageFeedback, citation, type ChatMessage, type Lang, type PaulAction, type PaulMode } from "@/core/paul/paul";
import { preferredSources, searchPassages, type Hit, type PassageIndex } from "@/core/paul/retrieve";
import type { UxContext } from "@/core/ux/context";

/**
 * POST /api/paul — Paul's reply as newline-delimited JSON:
 *   {"type":"meta", mode, provider, model, sources, actions, triage}
 *   {"type":"delta","text":"…"}   (repeated)
 *   {"type":"done"}
 *
 * Provider is chosen from the environment and never from the request:
 *   OPENAI_API_KEY    → OpenAI Responses API   (model: OPENAI_MODEL, default gpt-5.5)
 *   ANTHROPIC_API_KEY → Claude Messages API    (model: ANTHROPIC_MODEL, default claude-opus-5-5)
 *   PAUL_PROVIDER     → "openai" | "anthropic" | "offline" to force one when both keys exist
 * With no key, or if the provider fails, Paul answers offline from the same grounding.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let INDEX: PassageIndex | null = null;
function corpus(): PassageIndex {
  if (!INDEX) INDEX = JSON.parse(readFileSync(join(process.cwd(), "corpus/passages.json"), "utf8")) as PassageIndex;
  return INDEX;
}

type Provider = "openai" | "anthropic" | "offline";
function provider(): { name: Provider; model: string } {
  const forced = process.env.PAUL_PROVIDER as Provider | undefined;
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY), hasClaude = Boolean(process.env.ANTHROPIC_API_KEY);
  const name: Provider = forced === "offline" ? "offline"
    : forced === "openai" && hasOpenAI ? "openai"
      : forced === "anthropic" && hasClaude ? "anthropic"
        : hasOpenAI ? "openai" : hasClaude ? "anthropic" : "offline";
  const model = name === "openai" ? process.env.OPENAI_MODEL || "gpt-5.5" : name === "anthropic" ? process.env.ANTHROPIC_MODEL || "claude-opus-5-5" : "rules";
  return { name, model };
}

interface Body { messages: ChatMessage[]; mode?: PaulMode; lang?: Lang; route?: string; ctx: UxContext }

export async function POST(req: Request) {
  let body: Body;
  try { body = (await req.json()) as Body; } catch { return Response.json({ error: "invalid JSON" }, { status: 400 }); }
  const messages = (body.messages ?? []).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-16).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last || !body.ctx) return Response.json({ error: "a user message and ctx are required" }, { status: 400 });
  const lang: Lang = body.lang === "en" ? "en" : "th";
  const route = typeof body.route === "string" ? body.route.slice(0, 80) : "/";
  const mode = detectMode(last.content, body.mode);
  const tech = body.ctx.hasPowerPlant ? "solar-ground" : undefined;

  // grounding — identical whether or not a model is connected
  let hits: Hit[] = [];
  if (mode === "legal") {
    // include the previous user turn so follow-ups (“and for rooftop?”) keep their topic
    const prev = messages.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join(" ");
    hits = searchPassages(corpus(), prev, 6, preferredSources(tech));
  }
  const triage = mode === "feedback" ? triageFeedback(last.content, route) : undefined;
  const help = mode === "help" ? appHelp(last.content, body.ctx, lang) : undefined;
  const actions: PaulAction[] = help?.actions ?? (mode === "feedback" ? [{ label: lang === "th" ? "ดูข้อเสนอแนะทั้งหมด" : "See all feedback", href: "/feedback" }] : [{ label: lang === "th" ? "คลังกฎหมาย" : "Legal Corpus", href: "/corpus" }]);
  const offline = mode === "legal" ? legalOffline(last.content, hits, lang) : mode === "feedback" ? feedbackOffline(triage!, lang) : help!.text;

  const p = provider();
  const sources = hits.map((h) => ({ id: h.passage.id, cite: citation(h, lang), title: h.source[lang], url: h.source.url, excerpt: h.passage.t.slice(0, 600) }));
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      send({ type: "meta", mode, provider: p.name, model: p.model, sources, actions, triage });
      try {
        if (p.name === "offline") {
          send({ type: "delta", text: offline });
        } else {
          const system = systemPrompt(mode, body.ctx, lang, hits, triage);
          let wrote = false;
          if (p.name === "openai") {
            const client = new OpenAI();
            const s = await client.responses.create({ model: p.model, instructions: system, input: messages.map((m) => ({ role: m.role, content: m.content })), stream: true });
            for await (const ev of s) if (ev.type === "response.output_text.delta") { send({ type: "delta", text: ev.delta }); wrote = true; }
          } else {
            const client = new Anthropic();
            const s = client.messages.stream({ model: p.model, max_tokens: 4000, system, messages });
            for await (const ev of s) if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") { send({ type: "delta", text: ev.delta.text }); wrote = true; }
          }
          if (!wrote) send({ type: "delta", text: offline });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message.slice(0, 160) : "unknown error";
        send({ type: "provider-error", message: msg });
        send({ type: "delta", text: offline });
      }
      send({ type: "done" });
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}

/**
 * GET /api/paul — which provider is configured and whether it is actually reachable (never the key).
 * "connected" comes from a real, token-free model lookup with the configured key, cached for
 * 10 minutes, so a missing, wrong or expired key never shows as connected.
 */
let STATUS: { at: number; key: string; connected: boolean; error?: string } | null = null;
const STATUS_TTL = 10 * 60_000;

export async function GET() {
  const p = provider();
  const key = `${p.name}:${p.model}`;
  if (p.name === "offline") return Response.json({ provider: p.name, model: p.model, connected: false });
  if (!STATUS || STATUS.key !== key || Date.now() - STATUS.at > STATUS_TTL) {
    try {
      if (p.name === "openai") await new OpenAI().models.retrieve(p.model);
      else await new Anthropic().models.retrieve(p.model);
      STATUS = { at: Date.now(), key, connected: true };
    } catch (err) {
      STATUS = { at: Date.now(), key, connected: false, error: err instanceof Error ? err.message.slice(0, 120) : "unreachable" };
    }
  }
  return Response.json({ provider: p.name, model: p.model, connected: STATUS.connected, error: STATUS.error, checkedAt: new Date(STATUS.at).toISOString() });
}
