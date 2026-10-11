import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { MODEL_REGISTRY, meetsFloor, registered, route } from "@/core/report/models";
import type { ModelTask, ReportCategory, RoutingDecision } from "@/core/report/types";

/**
 * Server-side LLM access for report generation (imported only by API routes and the benchmark script). The model is never chosen by the request:
 * it comes from the environment, must be registered, must meet the authority capability floor,
 * and must be benchmark-qualified through the Report Engine's routing (fail closed).
 */

export type Provider = "openai" | "anthropic";

/** Configured report model: REPORT_MODEL, else the chat model of the configured provider. */
export function configuredReportModel(): { provider: Provider; modelId: string } | null {
  if (process.env.OPENAI_API_KEY) return { provider: "openai", modelId: process.env.REPORT_MODEL || process.env.OPENAI_MODEL || "gpt-5.5" };
  if (process.env.ANTHROPIC_API_KEY) return { provider: "anthropic", modelId: process.env.REPORT_MODEL || process.env.ANTHROPIC_MODEL || "claude-opus-5-5" };
  return null;
}

/** Decide whether a report task may run, and on which model. */
export function reportRouting(category: ReportCategory, task: ModelTask): RoutingDecision & { configured?: string } {
  const cfg = configuredReportModel();
  if (!cfg) return { task, category, outcome: "queued", reason: { th: "ยังไม่ได้เชื่อมต่อ AI", en: "No AI provider connected" } };
  const m = registered(cfg.modelId);
  if (!m) return { task, category, outcome: "queued", configured: cfg.modelId, reason: { th: `โมเดล ${cfg.modelId} ไม่อยู่ในทะเบียนโมเดลรายงาน — ไม่ใช้ร่างรายงาน`, en: `${cfg.modelId} is not in the report model registry — not used for reports` } };
  if (!meetsFloor(m, category, task)) return { task, category, outcome: "queued", configured: cfg.modelId, reason: { th: `โมเดล ${cfg.modelId} ต่ำกว่าระดับขั้นต่ำสำหรับรายงานต่อหน่วยงาน`, en: `${cfg.modelId} is below the capability floor for authority reports` } };
  // only models whose provider is configured can be used
  const unavailable = MODEL_REGISTRY.filter((x) => x.modelId !== cfg.modelId).map((x) => x.modelId);
  return { ...route(category, task, { unavailable }), configured: cfg.modelId };
}

/** One generation at high reasoning effort. Used only after routing allows it (or by the benchmark). */
export async function generate(provider: Provider, model: string, system: string, user: string): Promise<string> {
  if (provider === "openai") {
    const r = await new OpenAI().responses.create({ model, instructions: system, input: user, reasoning: { effort: "high" } });
    return r.output_text;
  }
  const r = await new Anthropic().messages.create({ model, max_tokens: 8000, system, messages: [{ role: "user", content: user }] });
  return r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}
