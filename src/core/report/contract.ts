import { t } from "../i18n-text";
import type { LText } from "../types";
import type { ContractDecision, ContractField } from "./types";

/**
 * §4 Approved data boundary — the Report Data Contract.
 * The writer receives only fields that pass these checks. Being present in software does not
 * make a value true, current, approved or relevant.
 */
export interface ContractScope {
  tenantId: string;
  entityId: string;
  periodFrom: string;
  periodTo: string;
  packId: string;
  estimatesPermitted: boolean;
  demoMode: boolean; // isolated, visibly labelled demonstration only
}

/** Patterns that must never reach report content (§4 last rows). */
const DIAGNOSTIC = [
  /\b(TODO|FIXME|lorem ipsum|undefined|NaN|null)\b/i,
  /\b(stack ?trace|exception|error:|traceback)\b/i,
  /\b(sk-[a-z0-9-]{8,}|api[_-]?key|bearer\s+[a-z0-9._-]+|password)\b/i,
  /(\/api\/|\/internal\/|localhost:\d+|\.tsx?\b|process\.env)/i,
  /\b(mock|fixture|seed|dummy|test[_ -]?value)\b/i,
];

/** Embedded instructions are content, never commands (§4, §16 "ignore the report rules"). */
const INSTRUCTION = [
  /ignore (all |the )?(previous|prior|above|report) (instructions|rules)/i,
  /disregard (the )?(rules|instructions)/i,
  /you are now|system prompt|act as/i,
  /ไม่ต้องสนใจ(คำสั่ง|กฎ)|ละเว้นกฎ/u,
];

const inPeriod = (p: string, from: string, to: string) => {
  const lo = p.length === 4 ? `${p}-01-01` : p.length === 7 ? `${p}-01` : p;
  const hi = p.length === 4 ? `${p}-12-31` : p.length === 7 ? `${p}-31` : p;
  return hi >= from && lo <= to;
};

export function admitField(f: ContractField, s: ContractScope): ContractDecision {
  const reasons: LText[] = [];
  const text = typeof f.value === "string" ? f.value : "";
  const containsInstruction = INSTRUCTION.some((r) => r.test(text));

  if (f.tenantId !== s.tenantId) reasons.push(t("ข้อมูลของผู้เช่ารายอื่น — ปฏิเสธการเข้าถึง", "Belongs to another tenant — access denied"));
  if (f.entityId !== s.entityId) reasons.push(t("ข้อมูลของหน่วยงานอื่น", "Belongs to another entity"));
  if (!inPeriod(f.period, s.periodFrom, s.periodTo)) reasons.push(t("อยู่นอกรอบรายงาน", "Outside the reporting period"));
  if (f.category === "diagnostic") reasons.push(t("ข้อมูลวินิจฉัยระบบ ไม่ใช่ผลทางธุรกิจ", "Diagnostic data, not a business result"));
  if (f.category === "demo" && !s.demoMode) reasons.push(t("ข้อมูลตัวอย่าง/จำลอง ห้ามใช้ในรายงานจริง", "Demo / mock data — excluded from real reports"));
  if (f.category === "estimate" && !s.estimatesPermitted) reasons.push(t("แพ็กนี้ไม่อนุญาตค่าประมาณ", "Estimates not permitted by this pack"));
  if (text && DIAGNOSTIC.some((r) => r.test(text))) reasons.push(t("มีข้อความวินิจฉัย/ค่าทดสอบ/ข้อมูลภายในระบบ", "Contains debug, test or internal-system text"));
  if (f.validation !== "validated") reasons.push(t("ยังไม่ผ่านการตรวจสอบ", "Not validated"));
  if (!f.sourceRef || !f.sourceVersion) reasons.push(t("ไม่มีแหล่งอ้างอิงหรือเวอร์ชัน", "No source reference or version"));
  if (!f.approvedUse.includes(s.packId)) reasons.push(t("ไม่ได้รับอนุมัติให้ใช้กับรายงานนี้", "Not approved for use in this report"));
  if (f.valueState === "value" && f.value === undefined) reasons.push(t("สถานะเป็นค่าแต่ไม่มีค่า", "Marked as a value but empty"));
  if (f.category === "management-statement" && !f.responsible) reasons.push(t("คำยืนยันของฝ่ายบริหารต้องระบุผู้รับผิดชอบ", "Management statement needs a responsible person"));

  return { key: f.key, admitted: reasons.length === 0, reasons, containsInstruction };
}

/**
 * Null, zero, unknown, unavailable and not-applicable are different states (§4).
 * Returns how a field may be rendered — never a default value.
 */
export function renderState(f: Pick<ContractField, "valueState" | "value" | "unit">): LText {
  switch (f.valueState) {
    case "value": return t(`${f.value}${f.unit ? " " + f.unit : ""}`, `${f.value}${f.unit ? " " + f.unit : ""}`);
    case "zero": return t(`0${f.unit ? " " + f.unit : ""}`, `0${f.unit ? " " + f.unit : ""}`);
    case "null": return t("ไม่มีข้อมูล (ยังไม่ได้บันทึก)", "No data recorded");
    case "unknown": return t("ไม่ทราบ", "Unknown");
    case "unavailable": return t("ไม่มีให้ใช้ (ขอข้อมูลแล้ว)", "Unavailable (requested)");
    case "not-applicable": return t("ไม่เกี่ยวข้อง", "Not applicable");
  }
}

export function buildContract(fields: ContractField[], s: ContractScope) {
  const decisions = fields.map((f) => ({ field: f, decision: admitField(f, s) }));
  return {
    admitted: decisions.filter((d) => d.decision.admitted).map((d) => d.field),
    rejected: decisions.filter((d) => !d.decision.admitted),
    flaggedInstructions: decisions.filter((d) => d.decision.containsInstruction).map((d) => d.field.key),
  };
}
