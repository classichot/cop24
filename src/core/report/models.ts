import { t } from "../i18n-text";
import type { ModelRoute, ModelTask, RegisteredModel, ReportCategory, RoutingDecision } from "./types";
import { MODEL_EVALUATIONS } from "../../data/model-evaluations";

/**
 * §9 Approved Report Model Registry and routing.
 *
 * Model brand, size, price or a leaderboard rank never establishes suitability: a model is
 * "approved" for a report category and task only after a recorded benchmark on held-out
 * report cases with qualified human assessment. Until then it is a candidate and the job
 * queues instead of running — there is no silent downgrade and no unqualified fallback.
 *
 * Capability data: Anthropic models list (cached 2026-10-06). Recheck with the Models API
 * before evaluation; the registry is replaceable without touching report data or evidence.
 */
export const REGISTRY_VERSION = "2026.10-r1";

const BASE_REGISTRY: RegisteredModel[] = [
  { provider: "anthropic", modelId: "claude-fable-5-1", tier: "frontier", contextTokens: 1_000_000, maxOutputTokens: 128_000, versionPinned: true, status: "candidate", evaluations: [], notes: t("โมเดลที่มีความสามารถสูงสุดที่เปิดให้ใช้ทั่วไป — ผู้สมัครหลักสำหรับรายงานยาวต่อหน่วยงานกำกับ ต้องผ่านการประเมินก่อน", "Most capable generally available model — lead candidate for long authority reports; must pass evaluation first") },
  { provider: "anthropic", modelId: "claude-opus-5-5", tier: "frontier", contextTokens: 1_000_000, maxOutputTokens: 128_000, versionPinned: true, status: "candidate", evaluations: [], notes: t("ผู้สมัครสำหรับการร่างและการวิเคราะห์", "Candidate for drafting and analysis") },
  { provider: "anthropic", modelId: "claude-sonnet-5-5", tier: "standard", contextTokens: 1_000_000, maxOutputTokens: 128_000, versionPinned: true, status: "candidate", evaluations: [], notes: t("ผู้สมัครสำหรับงานสนับสนุนหลังผ่านการทดสอบเฉพาะงาน", "Candidate for supporting tasks after task-specific validation") },
  { provider: "anthropic", modelId: "claude-haiku-5-5", tier: "small", contextTokens: 1_000_000, maxOutputTokens: 128_000, versionPinned: true, status: "candidate", evaluations: [], notes: t("ผู้สมัครสำหรับงานสนับสนุนขนาดเล็ก ไม่ใช้ร่างรายงานต่อหน่วยงาน", "Candidate for small supporting tasks; not for drafting authority reports") },
  { provider: "openai", modelId: "gpt-5.5", tier: "frontier", contextTokens: 400_000, maxOutputTokens: 128_000, versionPinned: false, status: "candidate", evaluations: [], notes: t("โมเดลเรือธงของ OpenAI ที่เชื่อมต่ออยู่ — ผู้สมัคร ต้องผ่านชุดทดสอบรายงาน CoP และผู้ตรวจที่เป็นคนก่อนใช้ร่างรายงานต่อหน่วยงาน · ความจุบริบทเป็นค่าสมมติ ตรวจกับ Models API", "The connected OpenAI flagship — a candidate; must pass the CoP report benchmark and human review before drafting authority reports · context size assumed, confirm with the Models API") },
];

/** Recorded benchmark results applied to the registry: approved only by a pass with a named human reviewer. */
export const MODEL_REGISTRY: RegisteredModel[] = BASE_REGISTRY.map((m) => {
  const evaluations = [...m.evaluations, ...MODEL_EVALUATIONS.filter((e) => e.modelId === m.modelId).map((e) => e.evaluation)];
  const approved = evaluations.some((e) => e.passed && e.reviewers.length > 0);
  return { ...m, evaluations, status: m.status === "suspended" || m.status === "retired" ? m.status : approved ? "approved" : "candidate" };
});

/** Authority reports (to the ERC) may only be drafted or analysed by frontier models at high reasoning effort. */
export const AUTHORITY_FLOOR: Record<ModelTask, RegisteredModel["tier"]> = { drafting: "frontier", analysis: "frontier", "editorial-rewrite": "frontier", "evidence-review": "standard" };
const TIER_RANK = { small: 0, standard: 1, frontier: 2 } as const;
export const meetsFloor = (m: RegisteredModel | undefined, category: ReportCategory, task: ModelTask) =>
  !!m && (!category.startsWith("authority") || TIER_RANK[m.tier] >= TIER_RANK[AUTHORITY_FLOOR[task]]);

/** Look up a configured model id; anything unregistered (e.g. a "mini" model set in .env) is refused for reports. */
export const registered = (modelId: string, registry = MODEL_REGISTRY) => registry.find((m) => m.modelId === modelId);

/** Routes are configuration; preferred order follows demonstrated quality, not cost (§9). */
export const MODEL_ROUTES: ModelRoute[] = [
  { category: "authority-th", task: "drafting", preferred: "claude-fable-5-1", fallbacks: ["claude-opus-5-5", "gpt-5.5"], settings: { effort: "high", maxOutputTokens: 64_000 }, promptTemplateVersion: "cop-draft@0.1" },
  { category: "authority-th", task: "analysis", preferred: "claude-fable-5-1", fallbacks: ["claude-opus-5-5", "gpt-5.5"], settings: { effort: "xhigh", maxOutputTokens: 64_000 }, promptTemplateVersion: "cop-analysis@0.1" },
  { category: "authority-th", task: "editorial-rewrite", preferred: "claude-opus-5-5", fallbacks: ["claude-fable-5-1", "gpt-5.5"], settings: { effort: "high", maxOutputTokens: 32_000 }, promptTemplateVersion: "cop-rewrite@0.1" },
  { category: "authority-th", task: "evidence-review", preferred: "claude-opus-5-5", fallbacks: ["claude-fable-5-1", "gpt-5.5"], settings: { effort: "high", maxOutputTokens: 32_000 }, promptTemplateVersion: "cop-review@0.1" },
];

const qualified = (m: RegisteredModel | undefined, category: ReportCategory, task: ModelTask) =>
  !!m && meetsFloor(m, category, task) && m.status === "approved" && m.evaluations.some((e) => e.category === category && e.task === task && e.passed && e.reviewers.length > 0);

/**
 * Pick a model. Preferred if qualified; otherwise a qualified fallback, recorded and shown;
 * otherwise queue with a reason. Context is checked so evidence is never silently truncated.
 */
export function route(category: ReportCategory, task: ModelTask, opts: { unavailable?: string[]; evidenceTokens?: number } = {}, registry = MODEL_REGISTRY, routes = MODEL_ROUTES): RoutingDecision {
  const r = routes.find((x) => x.category === category && x.task === task);
  if (!r) return { task, category, outcome: "queued", reason: t("ไม่มีเส้นทางโมเดลที่อนุมัติสำหรับงานนี้", "No approved route for this task") };
  const fits = (id: string) => {
    const m = registry.find((x) => x.modelId === id);
    return !!m && (opts.evidenceTokens ?? 0) + r.settings.maxOutputTokens <= m.contextTokens;
  };
  const usable = (id: string) => !opts.unavailable?.includes(id) && qualified(registry.find((x) => x.modelId === id), category, task) && fits(id);

  if (usable(r.preferred)) return { task, category, outcome: "run", modelId: r.preferred, reason: t("โมเดลที่ผ่านการประเมินสำหรับงานนี้", "Benchmark-qualified for this task") };
  const fb = r.fallbacks.find(usable);
  if (fb) return { task, category, outcome: "fallback", modelId: fb, substitutedFrom: r.preferred, reason: t(`ใช้ ${fb} แทน ${r.preferred} — บันทึกและแสดงในพื้นที่รายงาน`, `Using ${fb} instead of ${r.preferred} — recorded and shown in the workspace`) };
  const anyEvaluated = registry.some((m) => m.status === "approved");
  if (!anyEvaluated) return { task, category, outcome: "queued", reason: t("ยังไม่มีโมเดลใดผ่านการประเมินกับชุดทดสอบรายงานของหมวดนี้ — งานถูกพักไว้ ไม่ลดคุณภาพแบบเงียบ", "No model has passed the report benchmark for this category yet — job queued; no silent downgrade") };
  if (opts.evidenceTokens && !fits(r.preferred)) return { task, category, outcome: "queued", reason: t("หลักฐานเกินความจุ — ต้องแบ่งงานเป็นรายบท ห้ามตัดหลักฐานทิ้ง", "Evidence exceeds capacity — split section by section; never truncate evidence") };
  return { task, category, outcome: "queued", reason: t("ไม่มีโมเดลสำรองที่ผ่านการประเมิน — พักงานและแจ้งเหตุผล", "No qualified fallback — job paused with reason") };
}
