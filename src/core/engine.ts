import { t } from "./i18n-text";
import { buildRegister } from "./register";
import { buildCalendar } from "./calendar";
import { buildControlViews, controlSummary } from "./controls";
import { deriveGaps } from "./gaps";
import { assessAll } from "./changes";
import { runPreflight } from "./preflight";
import { scoreEvidence } from "./evidence";
import { nextBestAction } from "./nba";
import type { EngineDef, EntityProfile, EvidenceItem, Control, ControlTest, RegChange, ReportDraft, RulePack, CalendarEvent, Gap, LText } from "./types";

/**
 * COP24 Core Engine — the nine engines every 24-series app runs on.
 * `createSnapshot` wires them together: packs → applicability → register →
 * evidence → controls → gaps → calendar → change impact → preflight → next action.
 */
export const ENGINES: EngineDef[] = [
  { id: "regulation", name: t("Regulation / Obligation Engine", "Regulation / Obligation Engine"), role: t("แปลงกฎหมายและชุดกฎเป็นข้อผูกพันที่มีเจ้าของ ความถี่ และหลักฐานที่ต้องมี", "Turns law and rule packs into obligations with an owner, a frequency and required evidence"), capability: t("ทะเบียนข้อผูกพัน · Compliance Universe", "Obligation Register · Compliance Universe"), inputs: t("ชุดกฎ (packs) และเวอร์ชัน", "Rule packs and versions"), outputs: t("ObligationInstance ต่อหน่วยงาน", "ObligationInstance per entity") },
  { id: "applicability", name: t("Applicability Engine", "Applicability Engine"), role: t("ตัดสินว่าชุดกฎใดบังคับใช้กับหน่วยงานใด พร้อมเหตุผล ข้อสมมติ และทางเลือกที่ตัดออก", "Decides which packs bind which entity, with reasons, assumptions and the alternatives ruled out"), capability: t("Applicability Engine · Easy Start", "Applicability Engine · Easy Start"), inputs: t("โปรไฟล์หน่วยงาน + เกณฑ์ของชุดกฎ", "Entity profile + pack criteria"), outputs: t("ApplicabilityResult (explainable)", "ApplicabilityResult (explainable)") },
  { id: "workflow", name: t("Workflow & Execution Engine", "Workflow & Execution Engine"), role: t("ปฏิทิน ภารกิจ เกณฑ์ปล่อยผ่าน 4 ขั้น และการล็อกบทที่อนุมัติ", "Calendar, missions, the 4-stage release gate and locking approved chapters"), capability: t("Compliance Calendar · Execution Engine", "Compliance Calendar · Execution Engine"), inputs: t("ทะเบียนข้อผูกพัน + เหตุการณ์", "Register + events"), outputs: t("CalendarEvent · Gate stage", "CalendarEvent · Gate stage") },
  { id: "evidence", name: t("Evidence Engine", "Evidence Engine"), role: t("ประเมินหลักฐาน 3 ชั้น: มีหรือไม่ · ใช้ได้จริงหรือไม่ · พิสูจน์ได้หรือไม่ และกั้นข้อความที่ไม่มีแหล่งอ้างอิง", "Scores evidence on three layers — exists, valid, proves — and blocks unsourced assertions"), capability: t("Evidence Pipeline · Evidence Guard", "Evidence Pipeline · Evidence Guard"), inputs: t("ไฟล์ คอนเนกเตอร์ OCR", "Files, connectors, OCR"), outputs: t("EvidenceScore · Guard verdict", "EvidenceScore · Guard verdict") },
  { id: "document", name: t("Document Control", "Document Control"), role: t("เวอร์ชัน การลงนาม การตรึงสแนปช็อตหลักฐานกับรายงาน และคำขอเอกสารที่คนหน้างานอ่านรู้เรื่อง", "Versioning, signatures, pinning evidence snapshots to reports, and evidence requests written for people on site"), capability: t("Document Control Center", "Document Control Center"), inputs: t("เอกสาร + ผู้รับผิดชอบ", "Documents + owners"), outputs: t("คำขอเอกสาร · เวอร์ชันที่ตรึงแล้ว", "Evidence requests · pinned versions") },
  { id: "control", name: t("Control / Test Engine", "Control / Test Engine"), role: t("การควบคุมที่ทำให้ข้อผูกพันถูกปฏิบัติ และการทดสอบว่าการควบคุมทำงานจริง", "The controls that keep obligations met, and the tests proving they operated"), capability: t("Control Testing · Preflight 9 ชั้น", "Control Testing · 9-layer Preflight"), inputs: t("Control + ControlTest", "Control + ControlTest"), outputs: t("ประสิทธิผล · PreflightResult", "Effectiveness · PreflightResult") },
  { id: "change", name: t("Regulatory Change Engine", "Regulatory Change Engine"), role: t("รับกฎที่เปลี่ยน แล้วกระจายผลกระทบไปยังข้อผูกพัน บท และหน่วยงานที่เกี่ยวข้อง", "Ingests changes and propagates impact to obligations, chapters and entities"), capability: t("Regulatory Change Monitor", "Regulatory Change Monitor"), inputs: t("RegChange", "RegChange"), outputs: t("ChangeImpact · ข้อผูกพันใหม่", "ChangeImpact · new obligations") },
  { id: "reporting", name: t("Reporting / Submission Engine", "Reporting / Submission Engine"), role: t("ประกอบรายงานตามแบบของหน่วยงานกำกับ ตรวจก่อนยื่น และส่งออก DOCX/PDF พร้อมเลขเวอร์ชันชุดกฎ", "Assembles reports to the regulator's template, preflights and exports DOCX/PDF with the rulepack version"), capability: t("Report Factory · Studio · X-Ray", "Report Factory · Studio · X-Ray"), inputs: t("ReportTemplate + หลักฐาน + ข้อเท็จจริง", "ReportTemplate + evidence + facts"), outputs: t("ReportDraft · ชุดเอกสารสำหรับยื่น", "ReportDraft · submission bundle") },
  { id: "agent", name: t("Agent / AGI Engine", "Agent / AGI Engine"), role: t("ทีมเอเจนต์ (กฎระเบียบ เอกสาร รายงาน QA) ที่จัดลำดับงานเอง แต่ทำได้เฉพาะในขอบเขตที่กำหนด", "A team of agents (Regulation, Document, Report, QA) that sequence work themselves — inside fixed guardrails"), capability: t("ASK 24 · Mission Mode", "ASK 24 · Mission Mode"), inputs: t("เป้าหมายเป็นภาษาธรรมดา", "A goal in plain language"), outputs: t("แผนภารกิจ · ผลลัพธ์ที่ต้องให้คนตัดสิน", "Mission plan · decisions left to humans") },
];

export interface TenantData {
  entities: EntityProfile[];
  packs: RulePack[];
  evidence: EvidenceItem[];
  controls: Control[];
  tests: ControlTest[];
  changes: RegChange[];
  report: ReportDraft;
  conflicts: { field: LText; a: string; b: string; whereA: LText; whereB: LText }[];
  facts: { total: number; sourced: number };
  extraEvents: CalendarEvent[];
  manualGaps: Gap[];
}

export function createSnapshot(d: TenantData) {
  const { applicability, instances } = buildRegister(d.entities, d.packs, d.evidence);
  const controls = buildControlViews(d.controls, d.tests);
  const controlStats = controlSummary(controls);
  const gaps = deriveGaps(instances, controls, d.manualGaps);
  const calendar = buildCalendar(instances, d.extraEvents);
  const impacts = assessAll(d.changes, instances, d.packs);

  const reportPack = d.packs.find((p) => p.id === d.report.packId)!;
  const reportEvidence = d.evidence.filter((e) => e.entityId === d.report.entityId && e.obligationIds.some((id) => reportPack.obligations.some((o) => o.id === id)));
  const preflight = runPreflight({
    report: d.report,
    pack: reportPack,
    applicability: applicability.find((a) => a.packId === d.report.packId && a.entityId === d.report.entityId)!,
    evidence: reportEvidence,
    conflicts: d.conflicts,
    factsTotal: d.facts.total,
    factsSourced: d.facts.sourced,
    certified: false,
    hasPriorPeriod: false,
    coverSigned: false,
    annexCertifiedCopies: false,
  });

  const evidenceScore = scoreEvidence(reportEvidence, 52 /* mandatory items in the full 61-obligation pack */);
  const nba = nextBestAction(gaps.filter((g) => g.entityId === d.report.entityId), preflight);

  return { applicability, instances, controls, controlStats, gaps, calendar, impacts, preflight, reportEvidence, evidenceScore, nba };
}

export type Snapshot = ReturnType<typeof createSnapshot>;
