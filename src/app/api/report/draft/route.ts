import { gradeSection, sectionPrompt, type BenchCase } from "@/core/report/benchmark";
import { configuredReportModel, generate, reportRouting } from "@/lib/llm/server";

/**
 * POST /api/report/draft — AI-written report sections for an authority report.
 * Runs only when the configured model is registered, meets the frontier floor and is
 * benchmark-qualified with a human reviewer (fail closed: otherwise "queued" with the reason).
 * Every generated section passes the same guard as the benchmark; a failing section is
 * returned as rejected so the caller keeps its evidence-only text.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const d = reportRouting("authority-th", "drafting");
  return Response.json({ outcome: d.outcome, modelId: d.modelId, configured: d.configured, reason: d.reason });
}

export async function POST(req: Request) {
  let body: { sections?: BenchCase[] };
  try { body = await req.json(); } catch { return Response.json({ error: "invalid JSON" }, { status: 400 }); }
  const sections = (body.sections ?? []).slice(0, 12);
  if (!sections.length) return Response.json({ error: "sections required" }, { status: 400 });
  const d = reportRouting("authority-th", "drafting");
  if (d.outcome === "queued" || !d.modelId) return Response.json({ outcome: "queued", reason: d.reason, configured: d.configured });
  const cfg = configuredReportModel()!;
  const results = [];
  for (const s of sections) {
    const { system, user } = sectionPrompt(s);
    try {
      const text = await generate(cfg.provider, d.modelId, system, user);
      const grade = gradeSection(text, s);
      results.push({ id: s.id, text, accepted: grade.passed, grade });
    } catch (err) {
      results.push({ id: s.id, text: "", accepted: false, error: err instanceof Error ? err.message.slice(0, 160) : "generation failed" });
    }
  }
  return Response.json({ outcome: d.outcome, modelId: d.modelId, reason: d.reason, results });
}
