import { t } from "../i18n-text";
import type { LText } from "../types";
import type { ReportBrief, ReportPack, Requirement, RequirementStatus } from "./types";

/**
 * §3 Report Brief and requirement mapping.
 * Missing essential scope blocks factual drafting. A requirement may be "not applicable"
 * only with a recorded rationale and an authorised reviewer.
 */
export function validateBrief(b: ReportBrief): { ok: boolean; missing: LText[] } {
  const missing: LText[] = [];
  const need = (cond: unknown, label: LText) => { if (!cond) missing.push(label); };
  need(b.purpose?.en, t("วัตถุประสงค์ของรายงาน", "Report purpose"));
  need(b.audience?.en, t("ผู้รับรายงาน / หน่วยงาน", "Audience / authority"));
  need(b.jurisdiction, t("เขตอำนาจ", "Jurisdiction"));
  need(b.packId && b.packVersion, t("รายงานแพ็กและเวอร์ชัน", "Report pack and version"));
  need(b.entityId, t("หน่วยงานและขอบเขต", "Entity and boundary"));
  need(b.period?.from && b.period?.to && b.period?.cutoff, t("รอบรายงานและวันตัดข้อมูล", "Reporting period and data cut-off"));
  need(b.language, t("ภาษา", "Language"));
  need(Object.keys(b.units ?? {}).length, t("หน่วยวัด", "Units"));
  need(b.acceptableSources?.length, t("แหล่งข้อมูลที่ยอมรับ", "Acceptable sources"));
  need(b.preparers?.length, t("ผู้จัดทำ", "Named preparers"));
  need(b.reviewers?.length, t("ผู้ตรวจ", "Named reviewers"));
  need(b.approvers?.length, t("ผู้อนุมัติ", "Named approvers"));
  return { ok: missing.length === 0, missing };
}

/** Requirements that apply to this brief (stage + plant technology). */
export function applicableRequirements(pack: ReportPack, b: ReportBrief, tech?: string): Requirement[] {
  return pack.requirements.filter((r) => (!b.stage || r.stages.includes(b.stage)) && (!r.appliesTo || (tech && r.appliesTo.includes(tech))));
}

/** A not-applicable status without rationale and approval does not count as resolved. */
export function naIsValid(s: RequirementStatus): boolean {
  return s.state !== "not-applicable" || Boolean(s.rationale?.en && s.naApprovedBy?.en);
}
