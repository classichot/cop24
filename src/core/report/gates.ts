import { t } from "../i18n-text";
import type { LText } from "../types";
import { naIsValid } from "./brief";
import { claimCoverage, type ClaimCheck } from "./claims";
import type { EditorialStatus } from "./editorial";
import { hashOf } from "./hash";
import type { ApprovalRecord, Claim, Gate, GateResult, ReportStatuses, Requirement, RequirementStatus, ReviewFinding } from "./types";

/**
 * §11 Quality gates and report status; §12 approval binding.
 * Unknown validation results fail closed. A high style score never overrides a failed
 * factual, confidentiality or mandatory-disclosure gate. Administrators cannot override a
 * failure and keep "approved".
 */
export interface GateInput {
  dataBoundary: { rejectedInReport: number; checked: boolean };
  claims: Claim[];
  checks: ClaimCheck[];
  numbers: { reconciled: number; total: number; failures: LText[]; checked: boolean };
  references: { fabricated: number; unresolved: number; mismatched: number; checked: boolean };
  requirements: Requirement[];
  requirementStatus: RequirementStatus[];
  editorial: EditorialStatus;
  findings: ReviewFinding[];
  approvals: ApprovalRecord[];
  requiredApproverRoles: string[];
  currentContentHash: string;
  currentEvidenceHash: string;
  packVersion: string;
  exportCheck: { checked: boolean; passed: boolean; issues: LText[] };
}

const g = (id: Gate["id"], title: LText, condition: LText, result: GateResult, detail: LText, numerator?: number, denominator?: number): Gate => ({ id, title, condition, result, detail, numerator, denominator });

export function approvalValid(a: ApprovalRecord, contentHash: string, evidenceHash: string, packVersion: string) {
  return a.contentHash === contentHash && a.evidenceSnapshotHash === evidenceHash && a.packVersion === packVersion;
}

export function evaluateGates(i: GateInput): Gate[] {
  const cov = claimCoverage(i.claims, i.checks);
  const reqApplicable = i.requirementStatus.filter((s) => s.state !== "not-applicable" || !naIsValid(s));
  const reqDone = i.requirementStatus.filter((s) => s.state === "fulfilled" || (s.state === "not-applicable" && naIsValid(s)));
  const blocking = i.findings.filter((f) => f.status === "open" && (f.severity === "critical" || f.severity === "major"));
  const validApprovals = i.approvals.filter((a) => approvalValid(a, i.currentContentHash, i.currentEvidenceHash, i.packVersion));
  const rolesCovered = i.requiredApproverRoles.every((r) => validApprovals.some((a) => a.role.en === r));

  return [
    g("data-boundary", t("ขอบเขตข้อมูล", "Data boundary"), t("ไม่มีข้อมูลที่ไม่ได้รับอนุญาต ข้อมูลทดสอบ ข้อมูลวินิจฉัย หรือข้อมูลข้ามหน่วยงาน", "No unauthorised, test, diagnostic or cross-entity data"),
      !i.dataBoundary.checked ? "unknown" : i.dataBoundary.rejectedInReport === 0 ? "pass" : "fail",
      t(`${i.dataBoundary.rejectedInReport} รายการที่ถูกปฏิเสธยังอยู่ในรายงาน`, `${i.dataBoundary.rejectedInReport} rejected field(s) present in the report`)),
    g("evidence", t("หลักฐาน", "Evidence"), t("ทุกข้อเท็จจริงมีหลักฐานที่ใช้ได้ ทุกการอนุมาน/ค่าประมาณ/ข้อเสนอแนะมีที่มาและติดป้าย", "Every factual claim has valid support; every inference, estimate and recommendation has lineage and labels"),
      i.checks.length < i.claims.length ? "unknown" : cov.unsupported === 0 && cov.gaps === 0 ? "pass" : "fail",
      t(`รองรับ ${cov.supported} จาก ${cov.total} ข้อความ · ไม่รองรับ ${cov.unsupported} · ช่องว่างที่เปิดเผย ${cov.gaps}`, `${cov.supported} of ${cov.total} claims supported · ${cov.unsupported} unsupported · ${cov.gaps} disclosed gap(s)`), cov.supported, cov.total),
    g("numbers", t("ตัวเลข", "Numbers"), t("ตัวเลขทุกตัวกระทบยอดกับอินพุตหรือการคำนวณที่อนุมัติภายในค่าคลาดเคลื่อนที่กำหนด", "Every number reconciles to approved inputs or calculations within defined tolerances"),
      !i.numbers.checked ? "unknown" : i.numbers.failures.length === 0 ? "pass" : "fail",
      i.numbers.failures.length ? t(i.numbers.failures.map((f) => f.th).join(" · "), i.numbers.failures.map((f) => f.en).join(" · ")) : t(`กระทบยอดครบ ${i.numbers.reconciled}/${i.numbers.total}`, `All ${i.numbers.reconciled}/${i.numbers.total} reconcile`), i.numbers.reconciled, i.numbers.total),
    g("references", t("การอ้างอิง", "References"), t("ไม่มีการอ้างอิงที่แต่งขึ้น ไม่ยุติ หรือไม่ตรง", "No fabricated, unresolved or mismatched citations"),
      !i.references.checked ? "unknown" : i.references.fabricated + i.references.unresolved + i.references.mismatched === 0 ? "pass" : "fail",
      t(`แต่งขึ้น ${i.references.fabricated} · ไม่ยุติ ${i.references.unresolved} · ไม่ตรง ${i.references.mismatched}`, `fabricated ${i.references.fabricated} · unresolved ${i.references.unresolved} · mismatched ${i.references.mismatched}`)),
    g("requirements", t("ข้อกำหนด", "Requirements"), t("ทุกข้อกำหนดที่บังคับใช้ได้รับการปฏิบัติ หรือการละเว้นที่อนุญาตได้รับการเปิดเผยและอนุมัติ", "Every applicable requirement is fulfilled, or a permitted omission is disclosed and approved"),
      i.requirementStatus.length < i.requirements.length ? "unknown" : reqDone.length === i.requirementStatus.length ? "pass" : "fail",
      t(`ครบ ${reqDone.length} จาก ${i.requirementStatus.length} · ไม่เกี่ยวข้องที่อนุมัติ ${i.requirementStatus.filter((s) => s.state === "not-applicable" && naIsValid(s)).length}`, `${reqDone.length} of ${i.requirementStatus.length} complete · ${i.requirementStatus.filter((s) => s.state === "not-applicable" && naIsValid(s)).length} approved not-applicable`), reqDone.length, reqApplicable.length),
    g("writing", t("คุณภาพการเขียน", "Writing"), t("Human Editorial Quality มากกว่า 98/100 ตามเกณฑ์ที่ตกลง", "Human Editorial Quality above 98/100 under the agreed rubric"),
      i.editorial.state === "meets-target" ? "pass" : i.editorial.state === "below-target" ? "fail" : "unknown", i.editorial.label),
    g("review-findings", t("ประเด็นจากการตรวจ", "Review findings"), t("ไม่มีประเด็นระดับวิกฤตหรือสำคัญค้าง", "Zero unresolved critical or major issues"),
      blocking.length === 0 ? "pass" : "fail", t(`ค้าง ${blocking.length} ประเด็นระดับวิกฤต/สำคัญ`, `${blocking.length} open critical/major finding(s)`)),
    g("approval", t("การอนุมัติ", "Approval"), t("ผู้อนุมัติที่กำหนดอนุมัติรายงานฉบับนี้และชุดหลักฐานนี้", "Required reviewers approve this exact report and evidence snapshot"),
      rolesCovered ? "pass" : "fail",
      i.approvals.length && !validApprovals.length ? t("การอนุมัติเดิมไม่ตรงกับเนื้อหาปัจจุบัน — ถูกยกเลิก", "Prior approval no longer matches the current content — invalidated") : t(`อนุมัติที่ยังมีผล ${validApprovals.length} · ต้องมี ${i.requiredApproverRoles.length} บทบาท`, `${validApprovals.length} valid approval(s) · ${i.requiredApproverRoles.length} role(s) required`)),
    g("export", t("การส่งออก", "Export"), t("ไฟล์ที่เรนเดอร์ผ่านการตรวจรูปแบบ เนื้อหา และการอ้างอิง", "Rendered output passes layout, content and citation checks"),
      !i.exportCheck.checked ? "unknown" : i.exportCheck.passed ? "pass" : "fail",
      i.exportCheck.checked ? (i.exportCheck.issues.length ? t(i.exportCheck.issues.map((x) => x.th).join(" · "), i.exportCheck.issues.map((x) => x.en).join(" · ")) : t("ผ่าน", "Passed")) : t("ยังไม่ได้เรนเดอร์ไฟล์ฉบับจริงเพื่อตรวจ", "Candidate final artifact not yet rendered for checking")),
  ];
}

/** Final export / submission only when every gate passes; unknown fails closed. */
export const releasable = (gates: Gate[]) => gates.every((x) => x.result === "pass");

export function statuses(gates: Gate[], i: GateInput, submitted = false): ReportStatuses {
  const cov = claimCoverage(i.claims, i.checks);
  const get = (id: Gate["id"]) => gates.find((x) => x.id === id)!.result;
  const validApprovals = i.approvals.filter((a) => approvalValid(a, i.currentContentHash, i.currentEvidenceHash, i.packVersion));
  const approval: ReportStatuses["approval"] = i.approvals.length && !validApprovals.length ? "invalidated" : validApprovals.length && get("approval") === "pass" ? "approved" : i.approvals.length ? "pending" : "not-requested";
  const factualOk = ["data-boundary", "evidence", "numbers", "references", "requirements"].every((id) => get(id as Gate["id"]) === "pass");
  return {
    dataReadiness: get("data-boundary") === "fail" ? "blocked" : factualOk ? "ready" : "incomplete",
    evidenceCoverage: { covered: cov.supported, total: cov.total },
    requirementCompleteness: {
      fulfilled: i.requirementStatus.filter((s) => s.state === "fulfilled").length,
      applicable: i.requirementStatus.filter((s) => s.state !== "not-applicable").length,
      notApplicable: i.requirementStatus.filter((s) => s.state === "not-applicable").length,
    },
    editorialReview: i.editorial.state,
    approval,
    submission: submitted ? "submitted" : "not-submitted",
    lifecycle: submitted ? "submitted" : releasable(gates) ? "approved" : factualOk ? "ready-for-review" : "generated",
  };
}

/** §12: content and evidence hashes that approvals are bound to. */
export const bindingHashes = (sections: unknown, evidenceManifest: unknown) => ({ contentHash: hashOf(sections), evidenceHash: hashOf(evidenceManifest) });
