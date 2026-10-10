import { cleanText } from "./normalize";
import type { Classification, DocCategory, ParsedDocument, ReportKind } from "./types";

/**
 * COP-DI-04 — explainable multi-label classifier (rule baseline `classify-rules@1`).
 * Thai, English and mixed documents. A file may carry several categories. Each label lists the
 * cues that fired so a reviewer can see why. A benchmarked ML/LLM classifier can replace or
 * augment this through the model router; this baseline is what the acceptance gold set measures.
 */
export const CLASSIFIER_VERSION = "classify-rules@1";

type Cue = { re: RegExp; w: number; tag: string };
const C = (re: RegExp, w: number, tag: string): Cue => ({ re, w, tag });

const RULES: Record<Exclude<DocCategory, "other">, { text: Cue[]; name?: Cue[] }> = {
  licence: {
    text: [C(/ใบอนุญาต(ประกอบกิจการ)?ผลิตไฟฟ้า/u, 3, "ใบอนุญาตผลิตไฟฟ้า"), C(/เลขที่ใบอนุญาต|license no\.?|licence no\.?/iu, 2, "licence no."), C(/กกพ\.?-?ผฟ|ERC-GL/u, 3, "licence id pattern"), C(/generation licen[cs]e/iu, 3, "generation licence"), C(/เงื่อนไขแนบท้ายใบอนุญาต/u, 2, "licence conditions"), C(/ร\.ง\.\s*4|ใบอนุญาตประกอบกิจการโรงงาน/u, 2, "factory licence")],
    name: [C(/licen[cs]e|ใบอนุญาต|permit/iu, 2, "file name")],
  },
  "cop-report": {
    text: [C(/รายงานประมวลหลักการปฏิบัติ/u, 4, "รายงาน CoP"), C(/code of practice/iu, 2, "Code of Practice"), C(/รายงานผลการปฏิบัติตามประมวลหลักการปฏิบัติ|cop monitor/iu, 3, "CoP monitoring"), C(/สารบัญ/u, 1, "table of contents"), C(/บทที่\s*\d|chapter\s*\d/iu, 1, "chapters")],
    name: [C(/\bcop\b|minicop|ประมวล/iu, 2, "file name")],
  },
  "site-plan": {
    text: [C(/แผนผังโครงการ|plant layout|ผังบริเวณ/iu, 3, "layout"), C(/single line diagram|\bSLD\b|แผนผังวงจรไฟฟ้าเส้นเดี่ยว/iu, 3, "SLD"), C(/\brev\.\s*[A-Z]\b|drawing no/iu, 2, "drawing revision"), C(/มาตราส่วน|scale\s*1\s*:/iu, 1, "scale")],
    name: [C(/layout|plan|ผัง|dwg|drawing/iu, 2, "file name")],
  },
  "lab-report": {
    text: [C(/ห้องปฏิบัติการ|laboratory/iu, 2, "laboratory"), C(/ผลการ(ตรวจ)?วิเคราะห์|test report|analysis report/iu, 2, "test report"), C(/ISO\/IEC\s*17025|ขึ้นทะเบียน(ห้องปฏิบัติการ)?|ทะเบียนเลขที่\s*ว-/iu, 2, "accreditation"), C(/วิธีการวิเคราะห์|method of analysis|standard method/iu, 1, "method")],
    name: [C(/lab|ผลวิเคราะห์|test/iu, 1, "file name")],
  },
  "measurement-air": {
    text: [C(/คุณภาพอากาศ|ambient air|air quality/iu, 3, "air quality"), C(/\bPM\s*10\b|\bPM\s*2\.5\b|\bTSP\b|ฝุ่นละออง/iu, 2, "particulates")],
    name: [C(/air|อากาศ|pm10|tsp/iu, 2, "file name")],
  },
  "measurement-water": {
    text: [C(/คุณภาพน้ำ|water quality|น้ำใต้ดิน|groundwater|น้ำทิ้ง|effluent/iu, 3, "water quality"), C(/\bBOD\b|\bCOD\b|\bTSS\b|\bpH\b/u, 2, "water parameters")],
    name: [C(/water|น้ำ/iu, 2, "file name")],
  },
  "measurement-noise": {
    text: [C(/ระดับเสียง|noise level|ambient noise/iu, 3, "noise"), C(/\bLeq\b|\bL90\b|\bLdn\b|\bLmax\b|dB\s*\(?A\)?|เดซิเบล/iu, 2, "noise parameters")],
    name: [C(/noise|เสียง/iu, 2, "file name")],
  },
  waste: {
    text: [C(/ใบกำกับการขนส่ง(ของเสีย)?|waste manifest|manifest/iu, 3, "manifest"), C(/ของเสียอันตราย|hazardous waste|กากของเสีย|สิ่งปฏิกูลหรือวัสดุที่ไม่ใช้แล้ว/iu, 2, "waste"), C(/ผู้รับกำจัด|ผู้รับบำบัด|disposal contractor|รหัสของเสีย/iu, 2, "disposer"), C(/แผงเซลล์.*(ชำรุด|เสื่อมสภาพ|หมดอายุ)/u, 2, "end-of-life panels")],
    name: [C(/waste|manifest|ขยะ|กาก/iu, 2, "file name")],
  },
  ohs: {
    text: [C(/อุบัติเหตุ|accident|incident report/iu, 3, "accident"), C(/อาชีวอนามัย|ความปลอดภัยในการทำงาน|occupational (health|safety)|\bjsa\b/iu, 2, "OHS"), C(/คปอ\.|safety committee/iu, 2, "safety committee")],
    name: [C(/safety|ohs|อุบัติเหตุ|ความปลอดภัย/iu, 2, "file name")],
  },
  maintenance: {
    text: [C(/บำรุงรักษา|maintenance|preventive|ตรวจสอบอุปกรณ์|inspection report/iu, 3, "maintenance"), C(/inverter|อินเวอร์เตอร์|หม้อแปลง|transformer/iu, 1, "equipment")],
    name: [C(/maint|pm|บำรุง/iu, 1, "file name")],
  },
  "env-measures": {
    text: [C(/มาตรการป้องกัน(และแก้ไข)?ผลกระทบ|mitigation measure/iu, 3, "mitigation"), C(/มาตรการติดตามตรวจสอบ|monitoring measure/iu, 3, "monitoring measures"), C(/ตารางมาตรการ/u, 2, "measures table")],
  },
  community: {
    text: [C(/ข้อร้องเรียน|complaint/iu, 3, "complaints"), C(/รับฟังความคิดเห็น|รับฟังความเห็น|public hearing|ผู้มีส่วนได้เสีย|stakeholder/iu, 3, "hearing"), C(/ชุมชน|community/iu, 1, "community")],
    name: [C(/complaint|ร้องเรียน|hearing|รับฟัง/iu, 2, "file name")],
  },
  photo: { text: [], name: [C(/\.(jpe?g|png|heic|webp)$/iu, 4, "image file")] },
  "consultant-qualification": {
    text: [C(/ผู้จัดทำรายงาน|ผู้ชำนาญการ|qualified (person|expert)/iu, 2, "preparer"), C(/หนังสือรับรองประสบการณ์|ประวัติการทำงาน|curriculum vitae|\bCV\b|ใบอนุญาตประกอบวิชาชีพ/iu, 3, "qualification"), C(/หนังสือมอบอำนาจ|power of attorney/iu, 2, "authorisation")],
  },
  "regulator-correspondence": {
    text: [C(/สำนักงาน\s*กกพ\.?\s*ประจำเขต|เรียน\s+(เลขาธิการ|ผู้อำนวยการ)/u, 2, "to/from ERC office"), C(/ที่\s+กกพ\s*\d|หนังสือแจ้งผล|เรื่อง\s+แจ้งผลการพิจารณา/u, 3, "official letter"), C(/สิ่งที่ส่งมาด้วย|อ้างถึง/u, 1, "letter structure")],
  },
  regulation: {
    text: [C(/^\s*ระเบียบคณะกรรมการกำกับกิจการพลังงาน/mu, 4, "ERC regulation"), C(/^\s*ประกาศคณะกรรมการ/mu, 3, "notification"), C(/(ระเบียบ|ประกาศ)นี้เรียกว่า/u, 8, "enacting clause"), C(/ให้ใช้บังคับตั้งแต่วันถัดจากวันประกาศในราชกิจจานุเบกษา/u, 6, "commencement clause"), C(/ราชกิจจานุเบกษา/u, 1, "Royal Gazette")],
  },
};

const COP_SUBTYPE: [RegExp, ReportKind][] = [
  [/รายงานผลการปฏิบัติตามประมวลหลักการปฏิบัติ|cop monitor|monitoring report/iu, "monitoring"],
  [/ขั้นสุดท้าย|final cop|final report/iu, "final"],
  [/ขั้นต้น|preliminary/iu, "preliminary"],
];

/** Cues that a document is a blank ERC form or template rather than a filled-in project record. */
export function templateSignals(text: string): string[] {
  const out: string[] = [];
  if (/พิจารณาแล้ว\s*\(?\s*เจ้าหน้าที่\s*\)?/u.test(text)) out.push("blank form: officer review column");
  if ((text.match(/\.{8,}|_{8,}/g) ?? []).length >= 5) out.push("blank form: fill-in lines");
  if (/Version\s*\d+\.\d+\s*\/\s*(?:\d{4}|[ก-๙]+\s*\d{4})/iu.test(text)) out.push("blank form: version header");
  if ((text.match(/\(ระบุ[^)]{0,40}\)/gu) ?? []).length >= 2) out.push("blank form: (ระบุ…) placeholders");
  return out;
}

export function classify(doc: Pick<ParsedDocument, "fileName" | "pages" | "tables" | "mime">): { labels: Classification[]; copSubtype?: ReportKind } {
  const text = cleanText([doc.pages.map((p) => p.text).join("\n"), doc.tables.map((t) => t.rows.slice(0, 30).map((r) => r.join(" ")).join("\n")).join("\n")].join("\n")).slice(0, 60_000);
  const name = doc.fileName;
  const scored: Classification[] = [];
  for (const [cat, rule] of Object.entries(RULES) as [Exclude<DocCategory, "other">, (typeof RULES)[keyof typeof RULES]][]) {
    let s = 0;
    const signals: string[] = [];
    for (const c of rule.text) if (c.re.test(text)) { s += c.w; signals.push(c.tag); }
    for (const c of rule.name ?? []) if (c.re.test(name)) { s += c.w; signals.push(c.tag); }
    if (s > 0) scored.push({ category: cat, score: s, signals });
  }
  if (doc.mime.startsWith("image/") && !scored.some((x) => x.category === "photo")) scored.push({ category: "photo", score: 4, signals: ["image file"] });
  // Blank authority forms and templates are reference material, not project evidence.
  const tpl = templateSignals(text);
  if (tpl.length >= 2) {
    const top0 = Math.max(6, ...scored.map((x) => x.score));
    const existing = scored.find((x) => x.category === "regulation");
    if (existing) { existing.score = top0 + 4; existing.signals.push(...tpl); }
    else scored.push({ category: "regulation", score: top0 + 4, signals: tpl });
  }
  // a COP report mentions every topic; keep it primary when it self-identifies
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0]?.score ?? 0;
  const labels = scored
    .filter((x) => x.score >= Math.max(3, top * 0.45))
    .map((x) => ({ ...x, score: Math.min(1, Math.round((x.score / Math.max(top, 6)) * 100) / 100) }));
  if (!labels.length) labels.push({ category: "other", score: 0.2, signals: ["no category cues"] });
  const copSubtype = labels.some((l) => l.category === "cop-report") ? COP_SUBTYPE.find(([re]) => re.test(text))?.[1] : undefined;
  return { labels, copSubtype };
}
