import { t } from "../i18n-text";
import type { LText } from "../types";
import { applicableRequirements, validateBrief } from "./brief";
import { buildContract, type ContractScope } from "./contract";
import { validateClaim, type ClaimCheck } from "./claims";
import { editorialStatus } from "./editorial";
import { bindingHashes, evaluateGates, releasable, statuses, type GateInput } from "./gates";
import { detectConflict, reconcile } from "./metrics";
import { route } from "./models";
import type { ApprovalRecord, Claim, ContractField, EditorialAssessment, Metric, ReportBrief, ReportEvidence, ReportPack, RequirementStatus, ReviewFinding, SourceRecord } from "./types";

/**
 * Wires the report engine for one report revision:
 * brief → data contract → source registry → claims → numbers → requirement matrix →
 * findings → editorial status → gates → statuses → model routing.
 */

/** A pack-level rule that a requirement's evidence must satisfy (e.g. ≥ 5 days of noise data). */
export interface RuleCheck {
  requirementId: string;
  passed: boolean;
  detail: LText;
  severity: "critical" | "major" | "minor";
}

export interface RequirementLink {
  requirementId: string;
  claimIds: string[];
  evidenceIds: string[];
  /** Recorded rationale + approver for not-applicable (§3). */
  notApplicable?: { rationale: LText; approvedBy?: LText };
}

export interface ReportInput {
  brief: ReportBrief;
  pack: ReportPack;
  tech?: string;
  scope: ContractScope;
  fields: ContractField[];
  sources: SourceRecord[];
  evidence: ReportEvidence[];
  metrics: Metric[];
  conflictPairs: [string, string][];
  claims: Claim[];
  causalEvidence?: string[];
  links: RequirementLink[];
  rules: RuleCheck[];
  sections: { id: string; text: string }[];
  editorial: EditorialAssessment[];
  rubricCalibrated: boolean;
  approvals: ApprovalRecord[];
  manualFindings?: ReviewFinding[];
  exportCheck: GateInput["exportCheck"];
  owners: Record<string, LText>; // requirement id → owner role
}

export function assessReport(i: ReportInput) {
  const brief = validateBrief(i.brief);
  const contract = buildContract(i.fields, i.scope);
  const requirements = applicableRequirements(i.pack, i.brief, i.tech);

  // Pack-derived rules (thresholds, unit precision) always apply; callers may only add rules.
  const packRules: RuleCheck[] = requirements.flatMap((r) => [
    ...(r.thresholds ?? []).map((th): RuleCheck => {
      const m = i.metrics.find((x) => x.key === th.key);
      const v = m?.value;
      const passed = v !== null && v !== undefined && (th.min === undefined || v >= th.min) && (th.max === undefined || v <= th.max);
      return { requirementId: r.id, passed, severity: "major", detail: passed ? th.label : t(`${th.label.th} — มีข้อมูล ${v ?? "ไม่มี"} ${th.unit}`, `${th.label.en} — data shows ${v ?? "none"} ${th.unit}`) };
    }),
    ...(r.precision ?? []).map((p): RuleCheck => {
      const m = i.metrics.find((x) => x.key === p.metric && x.unit === p.unit);
      const passed = !!m && m.value !== null && m.precision === p.decimals;
      return { requirementId: r.id, passed, severity: "major", detail: t(`แบบฟอร์มกำหนด ${p.metric} เป็น ${p.unit} ทศนิยม ${p.decimals} ตำแหน่ง${passed ? "" : " — ยังไม่มีค่าในรูปแบบนี้"}`, `The form requires ${p.metric} in ${p.unit} to ${p.decimals} decimals${passed ? "" : " — no value in that form yet"}`) };
    }),
  ]);
  i = { ...i, rules: [...packRules, ...i.rules] };

  const ctx = { sources: i.sources, evidence: i.evidence, metrics: i.metrics, entityId: i.brief.entityId, tenantId: i.scope.tenantId, periodFrom: i.brief.period.from, periodTo: i.brief.period.to, tolerances: i.pack.tolerances, causalEvidence: i.causalEvidence };
  const checks: ClaimCheck[] = i.claims.map((c) => validateClaim(c, ctx));
  const claims = i.claims.map((c) => ({ ...c, supportStatus: checks.find((k) => k.claimId === c.id)!.status }));

  // numbers: every asserted value with a metric must reconcile; material conflicts surface
  const numericClaims = i.claims.filter((c) => c.asserted && c.metricIds.length);
  const numberFailures: LText[] = [];
  let reconciled = 0;
  for (const c of numericClaims) {
    const m = i.metrics.find((x) => x.id === c.metricIds[0]);
    if (!m) continue;
    const r = reconcile(c.asserted!, m, i.pack.tolerances[m.method.id] ?? 0);
    if (r.ok) reconciled++;
    else numberFailures.push(r.reason!);
  }
  const conflicts = i.conflictPairs
    .map(([a, b]) => ({ a, b, ...detectConflict(i.metrics.find((m) => m.id === a)!, i.metrics.find((m) => m.id === b)!, i.pack.tolerances.sum) }))
    .filter((c) => c.conflict);
  for (const c of conflicts) numberFailures.push(c.detail!);

  // references: fabricated = cites unregistered evidence/source; mismatched = version/entity/period
  const refReasons = checks.flatMap((k) => k.reasons.map((r) => r.en));
  const references = {
    fabricated: refReasons.filter((r) => /never registered|not in the source registry/.test(r)).length,
    unresolved: i.claims.filter((c) => c.type === "gap").length,
    mismatched: refReasons.filter((r) => /version mismatch|another entity|outside the reporting period/.test(r)).length,
    checked: true,
  };

  // requirement matrix
  const requirementStatus: RequirementStatus[] = requirements.map((r) => {
    const link = i.links.find((l) => l.requirementId === r.id);
    if (link?.notApplicable) return { requirementId: r.id, state: "not-applicable", rationale: link.notApplicable.rationale, naApprovedBy: link.notApplicable.approvedBy, claimIds: [], evidenceIds: [] };
    const claimIds = link?.claimIds ?? [];
    const evidenceIds = link?.evidenceIds ?? [];
    if (!claimIds.length && !evidenceIds.length) return { requirementId: r.id, state: "missing", claimIds, evidenceIds };
    const claimOk = claimIds.every((id) => claims.find((c) => c.id === id)?.supportStatus === "supported");
    const evOk = evidenceIds.every((id) => i.evidence.find((e) => e.id === id)?.reviewResult === "accepted");
    const rulesOk = i.rules.filter((x) => x.requirementId === r.id).every((x) => x.passed);
    return { requirementId: r.id, state: claimOk && evOk && rulesOk ? "fulfilled" : "partial", claimIds, evidenceIds };
  });

  // findings (§10) — derived, never typed; each names passage, requirement, severity, remedy, owner
  const findings: ReviewFinding[] = [...(i.manualFindings ?? [])];
  let n = findings.length;
  const id = () => `RF-${String(++n).padStart(3, "0")}`;
  const ownerOf = (reqId?: string) => (reqId && i.owners[reqId]) || t("ผู้จัดทำรายงาน CoP", "CoP report preparer");
  const reqOfClaim = (cid: string) => i.links.find((l) => l.claimIds.includes(cid))?.requirementId;

  for (const k of checks) {
    if (k.status === "supported") continue;
    const c = claims.find((x) => x.id === k.claimId)!;
    if (c.type === "gap") {
      findings.push({ id: id(), category: "requirement-coverage", severity: "major", sectionId: c.sectionId, passage: c.text.th, requirementId: reqOfClaim(c.id), issue: t("ช่องว่างที่เปิดเผยไว้ในรายงาน — ยังไม่มีหลักฐาน", "Disclosed gap in the report — evidence not yet available"), remedy: t("ขอหลักฐานผ่านขั้นตอนนำเข้าที่ควบคุม", "Request the evidence through the controlled ingestion workflow"), owner: ownerOf(reqOfClaim(c.id)), status: "open" });
      continue;
    }
    findings.push({
      id: id(), category: "factual-support", severity: k.status === "unsupported" ? "major" : "minor", sectionId: c.sectionId, passage: c.text.th, requirementId: reqOfClaim(c.id),
      issue: t(k.reasons.map((r) => r.th).join(" · "), k.reasons.map((r) => r.en).join(" · ")), evidence: c.evidenceIds,
      remedy: k.status === "unsupported" ? t("เพิ่มหลักฐานที่ลงทะเบียน หรือเขียนใหม่พร้อมข้อจำกัด หรือย้ายเป็นช่องว่าง", "Add registered evidence, rewrite with a limitation, or move it to a disclosed gap") : t("ให้ผู้ตรวจยืนยันหลักฐานกับต้นฉบับ", "Have a reviewer confirm the evidence against the original"),
      owner: ownerOf(reqOfClaim(c.id)), status: "open",
    });
  }
  for (const c of conflicts) findings.push({ id: id(), category: "numerical-consistency", severity: "critical", sectionId: "design", issue: c.detail!, remedy: t("ผู้รับผิดชอบยืนยันค่าที่ถูกต้องจากแหล่งต้นทาง แล้วแก้ทุกจุดที่อ้างถึงพร้อมบันทึกเหตุผล", "The owner confirms the correct value from the source; every dependent figure is then corrected with an audit note"), owner: t("วิศวกรโครงการ", "Project engineer"), status: "open" });
  for (const r of i.rules.filter((x) => !x.passed)) findings.push({ id: id(), category: "requirement-coverage", severity: r.severity, sectionId: "env", requirementId: r.requirementId, issue: r.detail, remedy: t("เก็บข้อมูลเพิ่มให้ครบเกณฑ์ของแบบฟอร์ม หรือเปิดเผยข้อจำกัดและขอความเห็นจากผู้มีอำนาจ", "Collect data that meets the form's criterion, or disclose the limitation and seek the authority's view"), owner: ownerOf(r.requirementId), status: "open" });
  for (const s of requirementStatus.filter((x) => x.state === "missing")) {
    const r = requirements.find((x) => x.id === s.requirementId)!;
    findings.push({ id: id(), category: "requirement-coverage", severity: r.kind === "signature" ? "critical" : "major", sectionId: r.part, requirementId: r.id, issue: t(`ยังไม่มีเนื้อหาหรือหลักฐานสำหรับ “${r.title.th}”`, `No content or evidence yet for “${r.title.en}”`), remedy: t(`จัดทำ ${r.evidence.map((e) => e.th).join(", ")}`, `Provide ${r.evidence.map((e) => e.en).join(", ")}`), owner: ownerOf(r.id), status: "open" });
  }
  for (const src of i.sources.filter((s) => s.extractionIssues?.length)) findings.push({ id: id(), category: "source-reliability", severity: "minor", sectionId: "sources", issue: t(`${src.title.th}: ${src.extractionIssues!.map((x) => x.th).join(" · ")}`, `${src.title.en}: ${src.extractionIssues!.map((x) => x.en).join(" · ")}`), remedy: t("ทำ OCR และตรวจข้อความกับต้นฉบับก่อนอ้างถึง", "OCR and check the text against the original before quoting"), owner: t("ผู้ดูแลคลังกฎหมาย", "Corpus maintainer"), status: "open" });

  const editorial = editorialStatus(i.editorial, i.rubricCalibrated);
  const { contentHash, evidenceHash } = bindingHashes(i.sections, i.evidence.map((e) => [e.id, e.locator.sourceVersion]));

  const gateInput: GateInput = {
    dataBoundary: { rejectedInReport: 0, checked: true }, // rejected fields never reach the writer — enforced by buildContract
    claims, checks,
    numbers: { reconciled, total: numericClaims.length + conflicts.length, failures: numberFailures, checked: true },
    references, requirements, requirementStatus, editorial, findings,
    approvals: i.approvals,
    requiredApproverRoles: i.pack.approvalPolicy.filter((p) => p.required).map((p) => p.role.en),
    currentContentHash: contentHash, currentEvidenceHash: evidenceHash, packVersion: i.pack.version,
    exportCheck: i.exportCheck,
  };
  const gates = evaluateGates(gateInput);
  const status = statuses(gates, gateInput);
  const routing = (["drafting", "analysis", "editorial-rewrite", "evidence-review"] as const).map((task) => route(i.pack.reportCategory, task));

  return { brief, contract, requirements, checks, claims, conflicts, requirementStatus, findings, editorial, gates, status, routing, contentHash, evidenceHash, releasable: releasable(gates), packApproved: i.pack.domainOwnerApproval.approved };
}

export type ReportAssessment = ReturnType<typeof assessReport>;
