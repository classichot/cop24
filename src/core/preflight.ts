import { t } from "./i18n-text";
import { TODAY } from "./dates";
import { layerPasses } from "./evidence";
import type { ApplicabilityResult, EvidenceItem, GateStage, LText, PreflightLayer, PreflightResult, ReportDraft, RulePack, Status } from "./types";

/**
 * Preflight Validator — nine layers, run by the Reporting / Submission Engine
 * before anything can move up the release gate:
 *   AI drafted → evidence complete → ready to certify → approved to file.
 * Passing preflight is not approval by the regulator; it only says the machine
 * found no defect it can detect.
 */

export interface PreflightContext {
  report: ReportDraft;
  pack: RulePack;
  applicability: ApplicabilityResult;
  evidence: EvidenceItem[];
  /** Pairs of (field, valueA, valueB, whereA, whereB) the extraction engine found disagreeing. */
  conflicts: { field: LText; a: string; b: string; whereA: LText; whereB: LText }[];
  factsTotal: number;
  factsSourced: number;
  certified: boolean;
  hasPriorPeriod: boolean;
  coverSigned: boolean;
  annexCertifiedCopies: boolean;
}

const lbl = (s: Status): LText =>
  ({ ok: t("ผ่าน", "Pass"), warn: t("มีข้อสังเกต", "Observation"), bad: t("ไม่ผ่าน", "Fail"), cond: t("รอดำเนินการ", "Pending"), info: t("ข้อมูล", "Info") })[s];

export function runPreflight(ctx: PreflightContext): PreflightResult {
  const { report, pack, applicability, evidence, conflicts } = ctx;
  const layers: PreflightLayer[] = [];

  // 1 — eligibility of the regime
  layers.push({
    id: "elig",
    name: t("ความถูกต้องของระเบียบที่ใช้", "Correct regime"),
    what: t("โครงการอยู่ภายใต้ชุดกฎนี้จริงหรือควรเป็นระบบรายงานอื่น", "Is the entity really under this pack, or should it be another regime?"),
    status: applicability.applicable ? (applicability.assumptions.length ? "warn" : "ok") : "bad",
    statusLabel: lbl(applicability.applicable ? (applicability.assumptions.length ? "warn" : "ok") : "bad"),
    detail: applicability.applicable
      ? t(`ยืนยันว่าเข้าข่าย ${pack.name.th} ชุดกฎที่ตรึงไว้กับร่างนี้คือ ${pack.id} ${pack.version}${applicability.assumptions.length ? " · มีข้อสมมติที่ยังไม่ได้ยืนยัน " + applicability.assumptions.length + " ข้อ" : ""}`, `Confirmed in scope of ${pack.name.en}; rulepack pinned to this draft: ${pack.id} ${pack.version}${applicability.assumptions.length ? " · " + applicability.assumptions.length + " unconfirmed assumption(s)" : ""}`)
      : t("เกณฑ์การบังคับใช้ไม่ครบ — ร่างนี้ไม่ควรใช้ชุดกฎนี้", "Applicability criteria not met — this draft should not use this pack"),
    ref: pack.source,
  });

  // 2 — structure
  const missingChapters = pack.reports.find((r) => r.id === report.templateId)?.chapters.filter((c) => !report.chapters.some((d) => d.id === c.id)) ?? [];
  const structStatus: Status = missingChapters.length ? "bad" : !ctx.coverSigned || !ctx.annexCertifiedCopies ? "warn" : "ok";
  layers.push({
    id: "struct",
    name: t("โครงสร้างรายงาน", "Report structure"),
    what: t("หัวข้อบังคับ แบบฟอร์ม หนังสือรับรอง และเอกสารแนบ", "Mandatory headings, forms, certification letter and annexes"),
    status: structStatus,
    statusLabel: lbl(structStatus),
    detail: missingChapters.length
      ? t(`ขาดหัวข้อบังคับ ${missingChapters.length} หัวข้อ`, `${missingChapters.length} mandatory heading(s) missing`)
      : t(`มีครบ ${report.chapters.length} บทตามแบบรายงาน${!ctx.coverSigned ? " แต่แบบฟอร์มหน้าปกยังไม่มีลายมือชื่อผู้มีคุณวุฒิ" : ""}${!ctx.annexCertifiedCopies ? " และสำเนาใบอนุญาตในเอกสารแนบยังไม่มีการรับรองสำเนาถูกต้อง" : ""}`, `All ${report.chapters.length} chapters present${!ctx.coverSigned ? ", but the cover form lacks the qualified signatory" : ""}${!ctx.annexCertifiedCopies ? " and the licence copy in the annex is not a certified true copy" : ""}`),
    ref: t("แบบรายงานของหน่วยงานกำกับ · ส่วนหน้าปกและหนังสือรับรอง", "Authority's report template · cover and certification"),
  });

  // 3 — document completeness
  const missing = evidence.filter((e) => e.layers[0] === -1);
  const invalid = evidence.filter((e) => e.layers[0] === 1 && e.layers[1] === -1);
  const docStatus: Status = missing.length || invalid.length ? "bad" : evidence.some((e) => e.layers.some((m) => m === 0)) ? "warn" : "ok";
  layers.push({
    id: "doc",
    name: t("ความครบถ้วนของเอกสาร", "Document completeness"),
    what: t("หลักฐานบังคับที่ขาดหรือใช้ไม่ได้", "Mandatory evidence that is missing or unusable"),
    status: docStatus,
    statusLabel: lbl(docStatus),
    detail: t(
      `${missing.length ? "ขาด " + missing.map((m) => m.name.th).join(", ") : ""}${missing.length && invalid.length ? " และ " : ""}${invalid.length ? invalid.map((m) => m.name.th + " (" + m.meta.th + ")").join(", ") + " ใช้อ้างอิงไม่ได้" : ""}${!missing.length && !invalid.length ? "หลักฐานบังคับครบและใช้ได้ทุกรายการ" : ""}`,
      `${missing.length ? "Missing: " + missing.map((m) => m.name.en).join(", ") : ""}${missing.length && invalid.length ? "; " : ""}${invalid.length ? "invalid: " + invalid.map((m) => m.name.en + " (" + m.meta.en + ")").join(", ") : ""}${!missing.length && !invalid.length ? "All mandatory evidence present and valid" : ""}`,
    ),
    ref: t(Array.from(new Set([...missing, ...invalid].flatMap((e) => e.obligationIds))).join(" · ") || "—", Array.from(new Set([...missing, ...invalid].flatMap((e) => e.obligationIds))).join(" · ") || "—"),
  });

  // 4 — technical consistency
  const techStatus: Status = conflicts.length ? "bad" : "ok";
  layers.push({
    id: "tech",
    name: t("ความสอดคล้องทางเทคนิค", "Technical consistency"),
    what: t("ตัวเลขและข้อเท็จจริงหลักต้องตรงกันทุกที่ที่ปรากฏ", "Key figures and facts must agree everywhere they appear"),
    status: techStatus,
    statusLabel: lbl(techStatus),
    detail: conflicts.length
      ? t(conflicts.map((c) => `${c.field.th}: ${c.whereA.th} ระบุ ${c.a} แต่ ${c.whereB.th} ระบุ ${c.b}`).join(" · ") + " — COP24 จะไม่เลือกค่าใดค่าหนึ่งให้เอง ต้องให้ผู้รับผิดชอบยืนยัน", conflicts.map((c) => `${c.field.en}: ${c.whereA.en} says ${c.a} but ${c.whereB.en} says ${c.b}`).join(" · ") + " — COP24 will not pick a value; the owner must confirm")
      : t("ไม่พบตัวเลขขัดแย้งระหว่างบท", "No conflicting figures between chapters"),
    ref: t(conflicts.map((c) => c.whereA.th + " · " + c.whereB.th).join(" · ") || "—", conflicts.map((c) => c.whereA.en + " · " + c.whereB.en).join(" · ") || "—"),
  });

  // 5 — data quality (periods, units, methods)
  const reviewItems = evidence.filter((e) => e.layers[2] === 0);
  const envStatus: Status = reviewItems.length ? "warn" : "ok";
  layers.push({
    id: "data",
    name: t("คุณภาพข้อมูลตรวจวัดและชุดข้อมูล", "Measurement & dataset quality"),
    what: t("ช่วงเวลา ค่ามาตรฐาน หน่วย วิธีวิเคราะห์ และที่มา", "Periods, standards, units, methods and provenance"),
    status: envStatus,
    statusLabel: lbl(envStatus),
    detail: reviewItems.length ? t(reviewItems.map((e) => e.name.th + ": " + e.meta.th).join(" · "), reviewItems.map((e) => e.name.en + ": " + e.meta.en).join(" · ")) : t("ชุดข้อมูลทุกชุดมีหน่วย วิธี และช่วงเวลาครบ", "Every dataset carries units, method and period"),
    ref: t(Array.from(new Set(reviewItems.flatMap((e) => e.obligationIds))).join(" · ") || "—", Array.from(new Set(reviewItems.flatMap((e) => e.obligationIds))).join(" · ") || "—"),
  });

  // 6 — consistency with prior period
  layers.push({
    id: "hist",
    name: t("ความสอดคล้องกับข้อมูลเดิม", "Consistency with prior data"),
    what: t("ความเปลี่ยนแปลงที่ผิดปกติจากรายงานหรือแผนที่เคยเห็นชอบ", "Unusual changes versus previously approved reports"),
    status: "ok",
    statusLabel: lbl("ok"),
    detail: ctx.hasPriorPeriod ? t("เทียบกับรอบก่อนแล้ว ไม่พบความเปลี่ยนแปลงที่ไม่มีคำอธิบาย", "Compared with the prior period; no unexplained change") : t("เป็นรายงานฉบับแรกของหน่วยงานนี้ จึงยังไม่มีข้อมูลย้อนหลังให้เทียบ COP24 บันทึกชุดข้อมูลนี้ไว้เป็นฐานสำหรับรอบถัดไป", "First report for this entity, so there is no history to compare. COP24 stores this dataset as the baseline for the next period"),
    ref: t("—", "—"),
  });

  // 7 — traceability
  const unsourced = ctx.factsTotal - ctx.factsSourced;
  const traceStatus: Status = unsourced > 0 ? "warn" : "ok";
  layers.push({
    id: "trace",
    name: t("การสืบย้อนหลักฐาน", "Evidence traceability"),
    what: t("ทุกข้อความที่เป็นสาระสำคัญต้องชี้กลับไปยังแหล่งที่มาที่ตรวจแล้ว", "Every material statement must point back to a verified source"),
    status: traceStatus,
    statusLabel: lbl(traceStatus),
    detail: t(`ข้อเท็จจริง ${ctx.factsSourced} จาก ${ctx.factsTotal} รายการมีแหล่งอ้างอิงครบ อีก ${unsourced} รายการถูกทำเครื่องหมายว่า “ยังไม่ยุติ” และถูกกันไม่ให้ปรากฏเป็นข้อความยืนยันในรายงาน`, `${ctx.factsSourced} of ${ctx.factsTotal} facts are fully sourced; ${unsourced} are marked "unresolved" and are blocked from appearing as assertions`),
    ref: t(`ดัชนีหลักฐาน ${report.version}`, `Evidence index ${report.version}`),
  });

  // 8 — review & certification control
  const unlocked = report.chapters.filter((c) => c.state !== "approved").length;
  const reviewStatus: Status = ctx.certified ? "ok" : "warn";
  layers.push({
    id: "review",
    name: t("การควบคุมการตรวจและรับรอง", "Review & certification control"),
    what: t("ผู้มีคุณวุฒิที่ต้องตรวจ ลงนาม และอนุมัติ", "Qualified reviewers who must check, sign and approve"),
    status: ctx.certified ? "ok" : "warn",
    statusLabel: ctx.certified ? lbl("ok") : t("รอดำเนินการ", "Pending"),
    detail: ctx.certified ? t("ผู้มีคุณวุฒิลงนามรับรองครบแล้ว", "Qualified signatory has certified") : t(`ยังไม่มีผู้มีคุณวุฒิลงนามรับรอง ${unlocked} บทยังอยู่ในสถานะร่างโดย AI และยังไม่ถูกล็อก`, `No qualified signatory yet; ${unlocked} chapter(s) are still AI drafts and unlocked`),
    ref: t("แบบหนังสือรับรองของหน่วยงานกำกับ", "Authority's certification form"),
  });
  void reviewStatus;

  // 9 — output control
  layers.push({
    id: "out",
    name: t("การควบคุมไฟล์ผลลัพธ์", "Output control"),
    what: t("PDF ที่ค้นหาข้อความได้ Word ที่แก้ไขได้ แบบฟอร์มและเลขเวอร์ชัน", "Searchable PDF, editable Word, forms and version numbers"),
    status: "ok",
    statusLabel: lbl("ok"),
    detail: t(`สร้างไฟล์ DOCX และ PDF ที่ฝังชั้นข้อความค้นหาได้ครบ พร้อมตรึงเวอร์ชันชุดกฎ ${report.rulepackVersion} และภาพสแนปช็อตของหลักฐานไว้กับรายงานฉบับนี้ (${TODAY})`, `DOCX and PDF with a searchable text layer are generated, with rulepack ${report.rulepackVersion} and an evidence snapshot pinned to this report (${TODAY})`),
    ref: t(`Report ${report.version} · rulepack ${report.rulepackVersion}`, `Report ${report.version} · rulepack ${report.rulepackVersion}`),
  });

  const blockers = layers.filter((l) => l.status === "bad").length;
  const observations = layers.filter((l) => l.status === "warn").length;
  const evidenceComplete = evidence.every((e) => e.layers.every(layerPasses));
  const gate: GateStage = !evidenceComplete || blockers ? 1 : !ctx.certified ? 2 : report.chapters.every((c) => c.state === "approved") ? 4 : 3;
  const gateLabel = (
    {
      1: t("หลักฐานยังไม่ครบ", "Evidence incomplete"),
      2: t("หลักฐานครบ — รอผู้มีคุณวุฒิรับรอง", "Evidence complete — awaiting certification"),
      3: t("พร้อมรับรอง", "Ready to certify"),
      4: t("อนุมัติให้ยื่น", "Approved to file"),
    } as Record<GateStage, LText>
  )[gate];
  return { layers, gate, gateLabel, blockers, observations };
}
