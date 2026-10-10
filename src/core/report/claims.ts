import { t } from "../i18n-text";
import type { LText } from "../types";
import { reconcile } from "./metrics";
import type { Claim, Metric, ReportEvidence, SourceRecord, SupportStatus } from "./types";

/**
 * §6 Claim-level traceability — the Claim Ledger and citation validator.
 * A plausible title or a working URL is not support. The validator checks that the source is
 * registered, at the right version, for the right entity and period, and that the evidence
 * excerpt actually contains what the claim asserts.
 */

/** Causal language in Thai and English. A causal claim needs evidence that establishes the cause (§8). */
const CAUSAL = [/\bbecause\b/i, /\bdue to\b/i, /\bcaused by\b/i, /\bas a result of\b/i, /\bdriven by\b/i, /\bled to\b/i, /เนื่องจาก/u, /เพราะ/u, /ส่งผลให้/u, /เป็นผลมาจาก/u, /ทำให้เกิด/u];
export const isCausal = (text: string) => CAUSAL.some((r) => r.test(text));

export interface ValidationContext {
  sources: SourceRecord[];
  evidence: ReportEvidence[];
  metrics: Metric[];
  entityId: string;
  tenantId: string;
  periodFrom: string;
  periodTo: string;
  tolerances: Record<string, number>;
  /** Evidence ids that establish a cause, not just a correlation. */
  causalEvidence?: string[];
}

export interface ClaimCheck {
  claimId: string;
  status: SupportStatus;
  reasons: LText[];
}

const num = (v: number) => [String(v), v.toLocaleString("en-US"), v.toFixed(1), v.toFixed(2), v.toFixed(3)];

export function validateClaim(c: Claim, ctx: ValidationContext): ClaimCheck {
  const reasons: LText[] = [];
  let status: SupportStatus = "supported";
  const fail = (s: SupportStatus, r: LText) => { reasons.push(r); if (status === "supported" || s === "unsupported") status = s; };

  if (c.type === "gap") return { claimId: c.id, status: "unresolved", reasons: [t("ช่องว่างที่เปิดเผยไว้ — ยังไม่ยุติ", "Disclosed gap — unresolved")] };

  // connective prose needs no citation, but every factual type does
  const needsEvidence = c.type === "sourced-fact" || c.type === "derived-calculation";
  if (needsEvidence && c.evidenceIds.length === 0 && c.metricIds.length === 0) fail("unsupported", t("ไม่มีหลักฐานหรือการคำนวณรองรับ", "No evidence or calculation linked"));
  if ((c.type === "analysis" || c.type === "estimate" || c.type === "recommendation") && !(c.basis?.length)) fail("unsupported", t("การวิเคราะห์/ค่าประมาณ/ข้อเสนอแนะต้องอ้างข้อเท็จจริงหรือข้อสมมติที่รองรับ", "Analysis, estimates and recommendations must link to their basis"));

  for (const id of c.evidenceIds) {
    const ev = ctx.evidence.find((e) => e.id === id);
    if (!ev) { fail("unsupported", t(`อ้างหลักฐาน ${id} ที่ไม่ได้ลงทะเบียน — ปฏิเสธ`, `Cites evidence ${id} that was never registered — rejected`)); continue; }
    const src = ctx.sources.find((s) => s.id === ev.locator.sourceId);
    if (!src) { fail("unsupported", t(`แหล่ง ${ev.locator.sourceId} ไม่อยู่ในทะเบียนแหล่ง — ปฏิเสธ`, `Source ${ev.locator.sourceId} is not in the source registry — rejected`)); continue; }
    if (src.tenantId !== "public" && src.tenantId !== ctx.tenantId) { fail("unsupported", t("หลักฐานเป็นของผู้เช่ารายอื่น — ปฏิเสธการเข้าถึง", "Evidence belongs to another tenant — access denied")); continue; }
    if (src.version !== ev.locator.sourceVersion) fail("unsupported", t(`เวอร์ชันแหล่งไม่ตรง (${ev.locator.sourceVersion} ≠ ${src.version})`, `Source version mismatch (${ev.locator.sourceVersion} ≠ ${src.version})`));
    if (src.entityId && src.entityId !== ctx.entityId) fail("unsupported", t("หลักฐานเป็นของหน่วยงานอื่น", "Evidence is for another entity"));
    if (src.period && !(src.period >= ctx.periodFrom.slice(0, src.period.length) && src.period <= ctx.periodTo.slice(0, src.period.length))) fail("unsupported", t("หลักฐานอยู่นอกรอบรายงาน", "Evidence is outside the reporting period"));
    if (src.reviewStatus === "rejected" || ev.reviewResult === "rejected") fail("unsupported", t("หลักฐานถูกปฏิเสธในการตรวจ", "Evidence was rejected in review"));
    else if (ev.reviewResult === "pending" || src.reviewStatus === "pending") fail("partial", t(`หลักฐาน ${id} ยังรอการตรวจ — ยังนับว่ารองรับไม่ได้`, `Evidence ${id} is still pending review — cannot count as support yet`));
    if (src.extractionIssues?.length && ev.extractionMethod === "text-layer") fail("partial", t("ข้อความต้นทางมีปัญหาการสกัด — ต้องตรวจกับต้นฉบับ", "Source text has extraction issues — check against the original"));
    if (c.asserted && !num(c.asserted.value).some((s) => ev.excerpt.includes(s))) {
      fail("unsupported", t(`ข้อความที่อ้างไม่มีค่า ${c.asserted.value} — หลักฐานไม่รองรับประโยคนี้`, `The cited excerpt does not contain ${c.asserted.value} — evidence does not support this sentence`));
    }
  }

  for (const id of c.metricIds) {
    const m = ctx.metrics.find((x) => x.id === id);
    if (!m) { fail("unsupported", t(`ตัวชี้วัด ${id} ไม่มีในชั้นคำนวณ`, `Metric ${id} not in the calculation layer`)); continue; }
    if (m.boundary !== ctx.entityId) fail("unsupported", t("ตัวชี้วัดต่างขอบเขต", "Metric boundary differs from the report entity"));
    if (c.asserted) {
      const r = reconcile(c.asserted, m, ctx.tolerances[m.method.id] ?? 0);
      if (!r.ok) fail("unsupported", r.reason!);
    }
  }

  const text = `${c.text.th} ${c.text.en}`;
  if ((c.causal || isCausal(text)) && c.type !== "analysis") {
    const hasCause = c.evidenceIds.some((e) => ctx.causalEvidence?.includes(e));
    if (!hasCause) fail("unsupported", t("ประโยคระบุสาเหตุโดยไม่มีหลักฐานที่พิสูจน์สาเหตุ — ต้องระบุข้อจำกัดหรือเขียนใหม่", "States a cause without evidence that establishes it — add a limitation or rewrite"));
  }

  return { claimId: c.id, status, reasons };
}

/** Coverage from the complete inventory, not just what the model happened to cite (§11). */
export function claimCoverage(claims: Claim[], checks: ClaimCheck[]) {
  const factual = claims.filter((c) => c.type !== "gap");
  const supported = factual.filter((c) => checks.find((k) => k.claimId === c.id)?.status === "supported");
  const unresolved = claims.filter((c) => c.type === "gap");
  return { total: factual.length, supported: supported.length, unsupported: factual.length - supported.length, gaps: unresolved.length };
}
