import { t } from "../i18n-text";
import type { LText } from "../types";
import type { DocCategory, MissingEvidence, Phase, ReportKind } from "./types";

/**
 * Versioned rules engine (COP-DI-02, 06, 08). Legal applicability and numeric standards come
 * from here — never from a language model. Every rule names its source. Where COP24 has no
 * encoded rule for a technology, the item is "conditional — verify", never silently demanded
 * or dropped.
 */
export const RULESET_VERSION = "cop-evidence-rules@2026.10-r1";
export type RegulationVersion = "2565" | "2565+2567";

type Lvl = "mandatory" | "conditional" | "optional" | "not-applicable";
type Applies = (c: { report: ReportKind; phase: Phase; tech?: string; reg: RegulationVersion; hasPrior: boolean }) => { level: Lvl; reason?: LText };

export interface EvidenceType {
  id: string;
  label: LText;
  categories: DocCategory[];
  /** Optional text cue for evidence that shares a category with others (e.g. self-certification forms). */
  match?: RegExp;
  why: LText;
  clause: { sourceId: string; clause?: string };
  owner: LText;
  refresh: "standing" | "per-period";
  method: MissingEvidence["collectionMethod"];
  reportSections: string[];
  applies: Applies;
  /** Measurements that must be present (medium.parameter) for the item to be complete. */
  requiredMeasurements?: string[];
}

const SOLAR = (tech?: string) => !!tech && tech.startsWith("solar");
const PRE_FINAL = (r: ReportKind) => r === "preliminary" || r === "final";
const noRule = (tech?: string): { level: Lvl; reason: LText } => ({ level: "conditional", reason: t(`COP24 ยังไม่มีชุดกฎสำหรับเทคโนโลยี ${tech ?? "ไม่ระบุ"} — ต้องยืนยันกับแบบฟอร์มและเงื่อนไขใบอนุญาต`, `COP24 has no encoded rule for technology ${tech ?? "unknown"} — verify against the form and licence conditions`) });
const SF = "erc-cop-checklist-solar-farm";

export const EVIDENCE_TYPES: EvidenceType[] = [
  {
    id: "ET-LICENCE", label: t("ใบอนุญาตผลิตไฟฟ้าและเงื่อนไขแนบท้าย", "Generation licence and attached conditions"), categories: ["licence"],
    why: t("ระบุหน่วยงาน กำลังผลิต และเงื่อนไขที่กลายเป็นข้อผูกพันในรายงาน", "Identifies the entity, capacity and the conditions that become report obligations"), clause: { sourceId: "erc-licensing-reg-2551" },
    owner: t("ฝ่ายกำกับดูแลกิจการ", "Regulatory affairs"), refresh: "standing", method: "authorized-source", reportSections: ["cover", "1"],
    applies: ({ report }) => ({ level: report === "preliminary" ? "conditional" : "mandatory", reason: report === "preliminary" ? t("รายงานขั้นต้นอาจจัดทำก่อนได้รับใบอนุญาต — ใช้คำขอรับใบอนุญาตแทนได้", "A preliminary report may precede the licence — the application can stand in") : undefined }),
  },
  {
    id: "ET-SITE-PLAN", label: t("แผนผังโครงการ (Plant Layout) และเอกสารสิทธิ์ที่ดิน", "Plant layout and land rights"), categories: ["site-plan"],
    why: t("แบบฟอร์ม CoP ข้อ 2.2 ต้องการแผนผังและตารางสัดส่วนพื้นที่", "CoP form §2.2 requires the layout and land-use proportions"), clause: { sourceId: SF, clause: "ส่วนที่ 2 (2)" },
    owner: t("วิศวกรโครงการ", "Project engineer"), refresh: "standing", method: "internal-request", reportSections: ["2.2"],
    applies: ({ report, tech }) => (!SOLAR(tech) ? noRule(tech) : { level: PRE_FINAL(report) ? "mandatory" : "conditional", reason: report === "monitoring" ? t("ต้องส่งเฉพาะเมื่อแผนผังเปลี่ยน", "Needed only if the layout changed") : undefined }),
  },
  {
    id: "ET-ENG-DESIGN", label: t("แบบระบบไฟฟ้า/SLD/โครงสร้างที่วิศวกรควบคุมลงนาม", "Engineer-signed electrical design, SLD and structure"), categories: ["site-plan"], match: /single line|SLD|วิศวกร|engineer/iu,
    why: t("แบบฟอร์ม CoP ข้อ 2.3 ต้องมีวิศวกรควบคุมลงนามรับรอง", "CoP form §2.3 requires certification by a licensed control engineer"), clause: { sourceId: SF, clause: "ส่วนที่ 2 (2)" },
    owner: t("วิศวกรควบคุม", "Licensed control engineer"), refresh: "standing", method: "internal-request", reportSections: ["2.3"],
    applies: ({ report, tech }) => (!SOLAR(tech) ? noRule(tech) : { level: PRE_FINAL(report) ? "mandatory" : "not-applicable", reason: report === "monitoring" ? t("รายงานผลการปฏิบัติตามไม่ต้องยื่นแบบซ้ำ เว้นแต่มีการเปลี่ยนแปลง", "Monitoring reports do not resubmit designs unless changed") : undefined }),
  },
  {
    id: "ET-LOCATION-CERT", label: t("แบบฟอร์มรับรองตนเอง เรื่อง ที่ตั้งโครงการ", "Self-certification form — project location"), categories: ["other", "regulator-correspondence", "site-plan"], match: /รับรองตนเอง.{0,20}ที่ตั้ง|self[- ]certification.{0,20}location/iu,
    why: t("ยืนยันว่าพื้นที่ไม่ขัดผังเมืองหรือเขตคุ้มครอง (ข้อสมมติสำคัญของ Applicability)", "Confirms the site does not conflict with zoning or protected areas (a key applicability assumption)"), clause: { sourceId: "erc-selfcert-location" },
    owner: t("ฝ่ายกำกับดูแลกิจการ", "Regulatory affairs"), refresh: "standing", method: "declaration", reportSections: ["2.1"],
    applies: ({ report, reg }) => (!PRE_FINAL(report) ? { level: "not-applicable", reason: t("ใช้ในขั้นขอใบอนุญาต", "Used at the licensing stage") } : reg === "2565+2567" ? { level: "mandatory" } : { level: "optional", reason: t("แบบฟอร์มนี้ออกหลังระเบียบฉบับ 2565 — ต้องการเมื่อใช้ชุดกฎที่รวมฉบับแก้ไข 2567", "This form postdates the 2565 version — required under the 2567-amended rules") }),
  },
  {
    id: "ET-PREPARER", label: t("คุณสมบัติผู้จัดทำรายงาน CoP และหนังสือมอบอำนาจ", "CoP preparer qualifications and authorisation"), categories: ["consultant-qualification"],
    why: t("ปกส่วนที่ 2 ของแบบฟอร์มต้องแสดงประสบการณ์ ≥ 1 ปี", "Cover Part 2 of the form requires ≥1 year relevant experience"), clause: { sourceId: SF, clause: "ส่วนที่ 2" },
    owner: t("ที่ปรึกษาสิ่งแวดล้อม", "Environmental consultant"), refresh: "standing", method: "supplier-request", reportSections: ["cover"],
    applies: ({ report }) => ({ level: PRE_FINAL(report) ? "mandatory" : "optional" }),
  },
  {
    id: "ET-NOISE-BASELINE", label: t("ผลตรวจวัดเสียงพื้นฐานก่อนมีโครงการ (≥ 2 สถานี ≥ 5 วัน)", "Baseline noise before the project (≥2 stations, ≥5 days)"), categories: ["measurement-noise", "lab-report"], requiredMeasurements: ["noise.Leq24", "noise.L90", "noise.Ldn", "noise.Lmax"],
    why: t("แบบฟอร์ม Solar Farm ข้อ 3.1.1", "Solar Farm form §3.1.1"), clause: { sourceId: SF, clause: "ส่วนที่ 3" },
    owner: t("หน่วยสิ่งแวดล้อมประจำไซต์", "Site environmental unit"), refresh: "per-period", method: "supplier-request", reportSections: ["3.1.1"],
    applies: ({ report, tech }) => tech === "solar-ground" ? { level: PRE_FINAL(report) ? "mandatory" : "not-applicable", reason: report === "monitoring" ? t("เป็นข้อมูลพื้นฐานก่อนก่อสร้าง", "Baseline is a pre-construction item") : undefined } : tech === "solar-roof" ? { level: "not-applicable", reason: t("แบบฟอร์ม Rooftop V1.0/2567 ไม่มีส่วนตรวจวัดพื้นฐาน", "The Rooftop form V1.0/2567 has no baseline-measurement part") } : noRule(tech),
  },
  {
    id: "ET-SOIL", label: t("ข้อมูลทรัพยากรดินและการชะล้าง", "Soil resources and erosion"), categories: ["lab-report", "env-measures", "other"], match: /ดิน|soil|erosion|ชะล้าง/iu,
    why: t("แบบฟอร์ม Solar Farm ข้อ 3.1.2", "Solar Farm form §3.1.2"), clause: { sourceId: SF, clause: "ส่วนที่ 3" },
    owner: t("ที่ปรึกษาสิ่งแวดล้อม", "Environmental consultant"), refresh: "standing", method: "supplier-request", reportSections: ["3.1.2"],
    applies: ({ report, tech }) => tech === "solar-ground" ? { level: PRE_FINAL(report) ? "mandatory" : "not-applicable" } : tech === "solar-roof" ? { level: "not-applicable", reason: t("ติดตั้งบนอาคาร", "Building-mounted") } : noRule(tech),
  },
  {
    id: "ET-LAB-ACCRED", label: t("หนังสือรับรองห้องปฏิบัติการที่ยังไม่หมดอายุ", "Valid laboratory accreditation"), categories: ["lab-report"], match: /ขึ้นทะเบียน|ทะเบียนเลขที่|17025|accredit/iu,
    why: t("ผลวิเคราะห์ต้องมาจากห้องปฏิบัติการที่ขึ้นทะเบียน (ข้อ 3.2)", "Results must come from a registered laboratory (§3.2)"), clause: { sourceId: SF, clause: "ส่วนที่ 3" },
    owner: t("ห้องปฏิบัติการผู้ให้บริการ", "Laboratory provider"), refresh: "per-period", method: "supplier-request", reportSections: ["3.2", "annex"],
    applies: ({ tech }) => (tech === "solar-roof" ? { level: "not-applicable", reason: t("ไม่มีการตรวจวัดในแบบฟอร์ม Rooftop", "No measurements in the Rooftop form") } : { level: "conditional", reason: t("ต้องมีเมื่อมีผลตรวจวัด", "Required whenever measurements are reported") }),
  },
  {
    id: "ET-MEASURES-TABLE", label: t("ตารางมาตรการป้องกัน แก้ไข และติดตามตรวจสอบ", "Mitigation and monitoring measures table"), categories: ["env-measures", "cop-report"],
    why: t("มาตรการใน CoP เป็นเงื่อนไขแนบท้ายใบอนุญาต", "CoP measures become licence conditions"), clause: { sourceId: SF, clause: "ส่วนที่ 1 (2)" },
    owner: t("ที่ปรึกษาสิ่งแวดล้อม", "Environmental consultant"), refresh: "standing", method: "reuse-prior", reportSections: ["4", "5", "6"],
    applies: ({ report }) => ({ level: PRE_FINAL(report) ? "mandatory" : "conditional", reason: report === "monitoring" ? t("ใช้ตารางที่ได้รับความเห็นชอบแล้วเป็นฐาน", "The approved measures table is the baseline") : undefined }),
  },
  {
    id: "ET-HEARING", label: t("ผลการรับฟังความเห็นและหลักฐาน", "Public hearing outcome and evidence"), categories: ["community"], match: /รับฟังความ(คิด)?เห็น|hearing/iu,
    why: t("ระเบียบ กกพ. ว่าด้วยการรับฟังความเห็น พ.ศ. 2565 และส่วนที่ 5 ของรายงานขั้นสุดท้าย", "ERC hearing regulation 2565 and Part 5 of the final report"), clause: { sourceId: "erc-public-hearing-reg-2565" },
    owner: t("ฝ่ายชุมชนสัมพันธ์", "Community relations"), refresh: "standing", method: "internal-request", reportSections: ["5"],
    applies: ({ report }) => (report === "final" ? { level: "mandatory" } : { level: "not-applicable", reason: report === "preliminary" ? t("รายงานขั้นต้นจัดทำก่อนเวทีรับฟังความเห็น", "The preliminary report precedes the hearing") : t("ไม่ใช่ส่วนหนึ่งของรายงานผลการปฏิบัติตาม", "Not part of the monitoring report") }),
  },
  {
    id: "ET-AIR-CONSTRUCTION", label: t("ผลตรวจวัดคุณภาพอากาศระยะก่อสร้าง", "Construction-phase air quality results"), categories: ["measurement-air", "lab-report"], requiredMeasurements: ["air.TSP", "air.PM10"],
    why: t("แบบฟอร์ม Solar Farm ข้อ 4.1.2", "Solar Farm form §4.1.2"), clause: { sourceId: SF, clause: "ส่วนที่ 4" },
    owner: t("ผู้รับเหมาก่อสร้าง / ห้องปฏิบัติการ", "Contractor / laboratory"), refresh: "per-period", method: "supplier-request", reportSections: ["4.1"],
    applies: ({ report, phase, tech }) => (report !== "monitoring" ? { level: "not-applicable", reason: t("เป็นผลการติดตามระหว่างก่อสร้าง", "A construction-phase monitoring result") } : tech !== "solar-ground" ? noRule(tech) : { level: phase === "construction" ? "mandatory" : "not-applicable", reason: phase !== "construction" ? t("เฉพาะระยะก่อสร้าง", "Construction phase only") : undefined }),
  },
  {
    id: "ET-NOISE-CONSTRUCTION", label: t("ผลตรวจวัดเสียงระยะก่อสร้าง", "Construction-phase noise results"), categories: ["measurement-noise", "lab-report"], requiredMeasurements: ["noise.Leq24", "noise.Lmax"],
    why: t("แบบฟอร์ม Solar Farm ข้อ 4.2.2", "Solar Farm form §4.2.2"), clause: { sourceId: SF, clause: "ส่วนที่ 4" },
    owner: t("ผู้รับเหมาก่อสร้าง / ห้องปฏิบัติการ", "Contractor / laboratory"), refresh: "per-period", method: "supplier-request", reportSections: ["4.2"],
    applies: ({ report, phase, tech }) => (report !== "monitoring" ? { level: "not-applicable" } : tech !== "solar-ground" ? noRule(tech) : { level: phase === "construction" ? "mandatory" : "not-applicable", reason: phase !== "construction" ? t("แบบฟอร์ม Solar Farm ไม่มีการติดตามเสียงในระยะดำเนินการ", "The Solar Farm form has no operation-phase noise monitoring") : undefined }),
  },
  {
    id: "ET-WATER-OPS", label: t("ผลการติดตามคุณภาพน้ำระยะดำเนินการ", "Operation-phase water quality monitoring"), categories: ["measurement-water", "lab-report"],
    why: t("แบบฟอร์ม Solar Farm ข้อ 5.1.2", "Solar Farm form §5.1.2"), clause: { sourceId: SF, clause: "ส่วนที่ 5" },
    owner: t("หน่วยสิ่งแวดล้อมประจำไซต์", "Site environmental unit"), refresh: "per-period", method: "supplier-request", reportSections: ["5.1"],
    applies: ({ report, phase, tech }) => (report !== "monitoring" ? { level: "not-applicable" } : tech !== "solar-ground" ? noRule(tech) : { level: phase === "operation" ? "mandatory" : "not-applicable" }),
  },
  {
    id: "ET-WASTE", label: t("บันทึกการจัดการขยะ/แผงเสื่อมสภาพ และใบกำกับการขนส่ง", "Waste and end-of-life panel records with manifests"), categories: ["waste"],
    why: t("บันทึกรายเดือน รายงานปีละครั้ง แจ้งภายใน 30 วันหากส่งออกนอกประเทศ", "Monthly records, annual report, notify within 30 days of any export"), clause: { sourceId: SF, clause: "ส่วนที่ 5" },
    owner: t("ฝ่ายปฏิบัติการโรงไฟฟ้า", "Plant operations"), refresh: "per-period", method: "internal-request", reportSections: ["4.5", "5.2", "6.5"],
    applies: ({ report, phase }) => (report !== "monitoring" ? { level: "not-applicable" } : { level: phase === "pre-construction" ? "not-applicable" : "mandatory" }),
  },
  {
    id: "ET-OHS", label: t("บันทึกอาชีวอนามัย ความปลอดภัย และอุบัติเหตุ", "Occupational safety and accident records"), categories: ["ohs"],
    why: t("แบบฟอร์ม Solar Farm ข้อ 4.6 / 5.3", "Solar Farm form §4.6 / §5.3"), clause: { sourceId: SF, clause: "ส่วนที่ 5" },
    owner: t("จป. วิชาชีพ", "Safety officer"), refresh: "per-period", method: "internal-request", reportSections: ["4.6", "5.3"],
    applies: ({ report, phase }) => (report !== "monitoring" ? { level: "not-applicable" } : { level: phase === "construction" || phase === "operation" ? "mandatory" : "optional" }),
  },
  {
    id: "ET-COMPLAINTS", label: t("ทะเบียนข้อร้องเรียนและการแก้ไข", "Complaint register and remedies"), categories: ["community"], match: /ร้องเรียน|complaint/iu,
    why: t("ต้องมีช่องทางรับข้อร้องเรียนและแก้ไขทันที (ข้อ 4.7 / 5.4)", "A complaint channel with immediate remedy is required (§4.7 / §5.4)"), clause: { sourceId: SF, clause: "ส่วนที่ 5" },
    owner: t("ฝ่ายชุมชนสัมพันธ์", "Community relations"), refresh: "per-period", method: "internal-request", reportSections: ["4.7", "5.4"],
    applies: ({ report }) => ({ level: report === "monitoring" ? "mandatory" : "optional" }),
  },
  {
    id: "ET-PHOTOS", label: t("ภาพถ่ายการดำเนินมาตรการ (มีวันที่และพิกัด)", "Dated, geotagged photos of measures in place"), categories: ["photo"],
    why: t("หลักฐานภาคสนามประกอบรายงานผลการปฏิบัติตาม", "Field evidence for the monitoring report"), clause: { sourceId: "erc-cop-reg-2565" },
    owner: t("หน่วยสิ่งแวดล้อมประจำไซต์", "Site environmental unit"), refresh: "per-period", method: "internal-request", reportSections: ["annex"],
    applies: ({ report }) => ({ level: report === "monitoring" ? "mandatory" : "optional" }),
  },
  {
    id: "ET-HISTORY", label: t("รายงานผลการปฏิบัติตามรอบก่อน (ข้อมูลเทียบย้อนหลัง)", "Prior monitoring reports (historical comparison)"), categories: ["cop-report"],
    why: t("ใช้เปรียบเทียบผลย้อนหลังและตรวจความเปลี่ยนแปลง — ไม่ใช่หลักฐานของรอบปัจจุบัน", "Used for historical comparison and change detection — never current-period evidence"), clause: { sourceId: "erc-cop-reg-2565", clause: "ข้อ 6" },
    owner: t("ฝ่ายกำกับดูแลกิจการ", "Regulatory affairs"), refresh: "standing", method: "reuse-prior", reportSections: ["trend"],
    applies: ({ report, hasPrior }) => (report !== "monitoring" ? { level: "optional" } : { level: hasPrior ? "mandatory" : "conditional", reason: hasPrior ? undefined : t("ต้องมีเมื่อเคยยื่นรายงานรอบก่อน", "Required when earlier periods were reported") }),
  },
];

/* ───────── Numeric standards registry (COP-DI-08) ───────── */
export interface NumericStandard {
  key: string; // medium.parameter
  limitMax?: number;
  limitMin?: number;
  unit: string;
  averaging?: string;
  source: LText;
  /** False until a domain owner confirms the value against the legal source in the corpus. */
  verified: boolean;
}

export const STANDARDS_VERSION = "th-env-standards@2026.10-r1 (unverified)";
export const STANDARDS: NumericStandard[] = [
  { key: "noise.Leq24", limitMax: 70, unit: "dB(A)", averaging: "24 h", source: t("ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ ฉบับที่ 15 (พ.ศ. 2540)", "National Environment Board Notification No. 15 (B.E. 2540)"), verified: false },
  { key: "noise.Lmax", limitMax: 115, unit: "dB(A)", source: t("ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ ฉบับที่ 15 (พ.ศ. 2540)", "National Environment Board Notification No. 15 (B.E. 2540)"), verified: false },
  { key: "air.TSP", limitMax: 0.33, unit: "mg/m³", averaging: "24 h", source: t("มาตรฐานคุณภาพอากาศในบรรยากาศโดยทั่วไป", "General ambient air quality standard"), verified: false },
  { key: "air.PM10", limitMax: 0.12, unit: "mg/m³", averaging: "24 h", source: t("มาตรฐานคุณภาพอากาศในบรรยากาศโดยทั่วไป", "General ambient air quality standard"), verified: false },
  { key: "air.PM2.5", limitMax: 37.5, unit: "µg/m³", averaging: "24 h", source: t("มาตรฐานฝุ่นละอองขนาดไม่เกิน 2.5 ไมครอน", "PM2.5 ambient standard"), verified: false },
  { key: "water.pH", limitMin: 5.5, limitMax: 9.0, unit: "", source: t("มาตรฐานควบคุมการระบายน้ำทิ้ง (อ้างอิง)", "Effluent discharge standard (reference)"), verified: false },
  { key: "water.BOD", limitMax: 20, unit: "mg/L", source: t("มาตรฐานควบคุมการระบายน้ำทิ้ง (อ้างอิง)", "Effluent discharge standard (reference)"), verified: false },
  { key: "water.TSS", limitMax: 50, unit: "mg/L", source: t("มาตรฐานควบคุมการระบายน้ำทิ้ง (อ้างอิง)", "Effluent discharge standard (reference)"), verified: false },
];
