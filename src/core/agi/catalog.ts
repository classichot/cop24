import { t } from "../i18n-text";
import type { LText } from "../types";

/**
 * §4 — the complete COP24 mission catalog: 108 reusable building blocks in 12 categories.
 * `route` is set only when COP24 can actually perform the mission today; every other mission is
 * listed as planned and is never offered as a working capability (§13).
 */

export type Mode = "S" | "T" | "W";
export type Priority = "P0" | "P1" | "P2";
export type CategoryId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

export interface Category { id: CategoryId; name: LText; objective: LText }
export interface CatalogMission { id: string; category: CategoryId; mode: Mode; priority: Priority; title: LText; route: string | null; flagships: string[]; tags: TagId[] }

/* ───────────── grouping tags — cross-cutting topics, so missions can be grouped beyond their category ───────────── */

export type TagId = "setup" | "regulatory" | "evidence" | "site" | "environment" | "testing" | "engineering" | "community" | "preliminary" | "final" | "monitoring" | "reporting" | "deadlines" | "field" | "corrective" | "regulator" | "technology" | "portfolio";

export const TAGS: { id: TagId; name: LText }[] = [
  { id: "setup", name: t("ตั้งค่าโครงการ", "Project setup") },
  { id: "regulatory", name: t("กฎระเบียบ", "Regulatory") },
  { id: "evidence", name: t("หลักฐานและเอกสาร", "Evidence & documents") },
  { id: "site", name: t("พื้นที่โครงการ", "Site") },
  { id: "environment", name: t("สิ่งแวดล้อม", "Environment") },
  { id: "testing", name: t("ตรวจวัดและห้องปฏิบัติการ", "Testing & laboratory") },
  { id: "engineering", name: t("วิศวกรรมและความปลอดภัย", "Engineering & safety") },
  { id: "community", name: t("ชุมชนและผู้มีส่วนได้เสีย", "Community & stakeholders") },
  { id: "preliminary", name: t("CoP ขั้นต้น", "Preliminary CoP") },
  { id: "final", name: t("CoP ขั้นสุดท้าย", "Final CoP") },
  { id: "monitoring", name: t("รายงานผลการปฏิบัติตาม", "CoP Monitoring") },
  { id: "reporting", name: t("จัดทำรายงาน", "Report production") },
  { id: "deadlines", name: t("กำหนดเวลาและรอบ", "Deadlines & cycles") },
  { id: "field", name: t("งานภาคสนาม", "Field work") },
  { id: "corrective", name: t("แก้ไขปัญหา", "Corrective action") },
  { id: "regulator", name: t("ติดต่อหน่วยงานกำกับ", "Regulator interaction") },
  { id: "technology", name: t("เฉพาะเทคโนโลยี", "Technology-specific") },
  { id: "portfolio", name: t("หลายโรงไฟฟ้า", "Multi-plant") },
];

const CATEGORY_TAGS: Record<CategoryId, TagId[]> = {
  A: ["setup", "regulatory"], B: ["regulatory"], C: ["evidence"], D: ["site", "environment"], E: ["preliminary", "reporting"], F: ["final", "reporting"],
  G: ["field"], H: ["environment", "testing"], I: ["corrective"], J: ["monitoring", "reporting"], K: ["regulator"], L: ["portfolio"],
};
const KEYWORD_TAGS: [RegExp, TagId][] = [
  [/consult|stakeholder|community|complaint/i, "community"],
  [/lab|sampling|measurement|baseline|testing|quality|noise|air|water|exceedance|trend/i, "testing"],
  [/engineer|design|structural|safety|credential/i, "engineering"],
  [/report|package|annex|export|qa|template|studio/i, "reporting"],
  [/evidence|document|data/i, "evidence"],
  [/deadline|cycle|calendar|schedul|milestone|extension/i, "deadlines"],
  [/solar|rooftop|floating|technology|wind/i, "technology"],
  [/portfolio|multi-plant|bulk|executive/i, "portfolio"],
  [/corrective|remediation|capa|incident|root cause|escalation/i, "corrective"],
  [/regulator|erc|authority|inspection/i, "regulator"],
  [/monitoring/i, "monitoring"],
];
export function tagsFor(category: CategoryId, titleEn: string): TagId[] {
  const out = new Set<TagId>(CATEGORY_TAGS[category]);
  for (const [re, tag] of KEYWORD_TAGS) if (re.test(titleEn)) out.add(tag);
  return TAGS.map((x) => x.id).filter((id) => out.has(id));
}
export const tagName = (id: TagId) => TAGS.find((x) => x.id === id)!.name;

/** How the catalog can be grouped. A mission with several tags appears under each of them. */
export type GroupBy = "category" | "tag" | "mode" | "priority" | "flagship" | "status";
export function groupCatalog(list: CatalogMission[], by: GroupBy): { key: string; badge: string; name: LText; note?: LText; missions: CatalogMission[] }[] {
  const groups = new Map<string, CatalogMission[]>();
  const add = (k: string, m: CatalogMission) => groups.set(k, [...(groups.get(k) ?? []), m]);
  for (const m of list) {
    if (by === "category") add(m.category, m);
    else if (by === "tag") m.tags.forEach((x) => add(x, m));
    else if (by === "mode") add(m.mode, m);
    else if (by === "priority") add(m.priority, m);
    else if (by === "flagship") (m.flagships.length ? m.flagships : ["—"]).forEach((x) => add(x, m));
    else add(m.route !== null ? "available" : "planned", m);
  }
  const order: string[] = by === "category" ? CATEGORIES.map((c) => c.id) : by === "tag" ? TAGS.map((x) => x.id) : by === "mode" ? ["S", "T", "W"] : by === "priority" ? ["P0", "P1", "P2"] : by === "flagship" ? ["F01", "F02", "F03", "F04", "F05", "F06", "F07", "—"] : ["available", "planned"];
  const MODE: Record<string, LText> = { S: t("Single Bot", "Single Bot"), T: t("ทีม AI", "AI Team"), W: t("Cooperative Swarm", "Cooperative Swarm") };
  const PRI: Record<string, LText> = { P0: t("P0 · ใช้งานหลัก", "P0 · Core launch"), P1: t("P1 · ขยายการดำเนินงาน", "P1 · Operational expansion"), P2: t("P2 · อัตโนมัติขั้นสูง", "P2 · Advanced automation") };
  return order.filter((k) => groups.has(k)).map((k) => {
    const missions = groups.get(k)!;
    if (by === "category") { const c = CATEGORIES.find((x) => x.id === k)!; return { key: k, badge: k, name: c.name, note: c.objective, missions }; }
    if (by === "tag") return { key: k, badge: "#", name: tagName(k as TagId), missions };
    if (by === "mode") return { key: k, badge: k, name: MODE[k], missions };
    if (by === "priority") return { key: k, badge: k, name: PRI[k], missions };
    if (by === "flagship") return { key: k, badge: k === "—" ? "·" : k.replace("F0", "F"), name: k === "—" ? t("ภารกิจย่อยเดี่ยว", "Standalone building blocks") : t(`ภารกิจหลัก ${k}`, `Flagship ${k}`), missions };
    return { key: k, badge: k === "available" ? "✓" : "…", name: k === "available" ? t("ใช้งานได้", "Available") : t("วางแผน · ยังเริ่มไม่ได้", "Planned · not startable"), missions };
  });
}

export const CATEGORIES: Category[] = [
  { id: "A", name: t("ตั้งค่าโครงการและการบังคับใช้", "Project Setup & Applicability"), objective: t("เข้าใจโครงการก่อนใช้ข้อกำหนดใด ๆ", "Understand the power project before applying any requirement") },
  { id: "B", name: t("ข่าวกรองด้านกฎระเบียบ", "Regulatory Intelligence"), objective: t("แปลงกฎระเบียบและใบอนุญาตเป็นข้อกำหนดที่ทำได้จริง", "Turn regulations and permits into executable requirements") },
  { id: "C", name: t("นำเข้าข้อมูลและควบคุมหลักฐาน", "Data Ingestion & Evidence Control"), objective: t("ลดภาระการหา อัปโหลด และจัดระเบียบหลักฐาน", "Remove the burden of finding, uploading and organising evidence") },
  { id: "D", name: t("ประเมินพื้นที่และสิ่งแวดล้อม", "Site & Environmental Assessment"), objective: t("คำอธิบายพื้นที่ ข้อมูลพื้นฐาน และมาตรการที่ถูกต้อง", "Accurate site descriptions, baselines and protection measures") },
  { id: "E", name: t("CoP ขั้นต้นและการรับฟังความคิดเห็น", "Preliminary CoP & Community Consultation"), objective: t("เอกสารขั้นต้นและกระบวนการรับฟังความคิดเห็น", "Preliminary documentation and stakeholder consultation") },
  { id: "F", name: t("CoP ขั้นสุดท้ายและใบอนุญาต", "Final CoP & Licensing"), objective: t("ชุดยื่น CoP ขั้นสุดท้ายที่ครบและตรวจย้อนได้", "A complete, traceable Final CoP package") },
  { id: "G", name: t("ก่อสร้าง ดำเนินการ และติดตามภาคสนาม", "Construction, Operation & Field Monitoring"), objective: t("เปลี่ยนมาตรการที่อนุมัติเป็นงานต่อเนื่อง", "Turn approved measures into ongoing operational tasks") },
  { id: "H", name: t("การทดสอบสิ่งแวดล้อมและการควบคุมตามเทคโนโลยี", "Environmental Testing & Technology Controls"), objective: t("ข้อกำหนดการติดตามเฉพาะของแต่ละโรงไฟฟ้า — ใช้เฉพาะที่เข้าข่าย", "Plant-specific monitoring — applicability-gated") },
  { id: "I", name: t("ตรวจการปฏิบัติตามและแก้ไข", "Compliance Review & Corrective Execution"), objective: t("พบปัญหาแล้วผลักดันการแก้ไขจริง", "Detect problems and drive real corrective work") },
  { id: "J", name: t("จัดทำรายงานผลการปฏิบัติตาม CoP", "CoP Monitoring Report Production"), objective: t("รายงานติดตามผลคุณภาพสูงด้วยงานมือน้อยที่สุด", "High-quality monitoring reports with minimum manual work") },
  { id: "K", name: t("ติดต่อ กกพ. การตรวจ และการเปลี่ยนแปลง", "ERC Interaction, Inspection & Change Control"), objective: t("ตอบหน่วยงานกำกับและพร้อมรับการตรวจ", "Respond to the regulator and stay inspection-ready") },
  { id: "L", name: t("หลายโรงไฟฟ้าและ AGI ขั้นสูง", "Multi-Plant & Advanced AGI"), objective: t("รองรับกลุ่มพลังงานและสำนักงานที่ปรึกษาขนาดใหญ่", "Support energy groups and large consultancies") },
];

type Row = [string, CategoryId, Mode, Priority, string, string, string | null, string?];
// [id, category, mode, priority, English, Thai, route when implemented, flagships]
const ROWS: Row[] = [
  ["COP-001", "A", "S", "P0", "One-Click Project Creation", "สร้างโครงการด้วยคลิกเดียว", "/ingest", "F02"],
  ["COP-002", "A", "T", "P0", "CoP Applicability Assessment", "ประเมินการเข้าข่าย CoP / IEE / EIA / EHIA", "/agi", "F01,F02,F03"],
  ["COP-003", "A", "S", "P0", "Power Technology Classification", "จำแนกเทคโนโลยีการผลิตไฟฟ้า", "/agi", "F01,F02"],
  ["COP-004", "A", "T", "P0", "Licensing Route Assessment", "ประเมินเส้นทางใบอนุญาต", "/agi", "F02"],
  ["COP-005", "A", "S", "P0", "Project Lifecycle Identification", "ระบุระยะของโครงการ", "/agi", "F01,F02"],
  ["COP-006", "A", "S", "P0", "License Condition Extraction", "สกัดเงื่อนไขใบอนุญาต", "/ingest", "F02,F03"],
  ["COP-007", "A", "S", "P0", "PPA & Milestone Review", "ตรวจสัญญาซื้อขายไฟฟ้าและหมุดหมาย", null],
  ["COP-008", "A", "T", "P1", "Qualified Personnel Check", "ตรวจคุณสมบัติบุคลากรและห้องปฏิบัติการ", "/ingest", "F02"],
  ["COP-009", "A", "T", "P0", "Master Compliance Plan", "แผนการปฏิบัติตามหลักของโครงการ", "/agi", "F02,F07"],
  ["COP-010", "B", "S", "P0", "Regulatory Corpus Retrieval", "ค้นและตรึงแหล่งกฎหมายที่ใช้บังคับ", "/corpus", "F01,F02"],
  ["COP-011", "B", "T", "P0", "Legal Obligation Mapping", "จัดทำเมทริกซ์ข้อผูกพันของโครงการ", "/obligations", "F01,F03"],
  ["COP-012", "B", "T", "P0", "Approved CoP Commitment Extraction", "สกัดมาตรการจากรายงาน CoP ที่อนุมัติแล้ว", null],
  ["COP-013", "B", "S", "P0", "Permit-Specific Obligation Mapping", "เพิ่มข้อผูกพันจากเงื่อนไขใบอนุญาตจริง", "/agi", "F03,F07"],
  ["COP-014", "B", "S", "P0", "Monitoring Requirement Extraction", "ระบุพารามิเตอร์ วิธี ความถี่ และเกณฑ์การตรวจวัด", "/ingest", "F01"],
  ["COP-015", "B", "S", "P0", "Regulatory Deadline Planner", "วางแผนกำหนดเวลาตามกฎ", "/calendar", "F01,F07"],
  ["COP-016", "B", "T", "P0", "Official Template Selection", "เลือกแบบรายงานและแบบตรวจสอบที่ถูกฉบับ", "/agi", "F01,F02"],
  ["COP-017", "B", "T", "P1", "Regulatory Change Review", "ทบทวนผลกระทบจากกฎที่แก้ไข", "/changes", "F07"],
  ["COP-018", "B", "W", "P2", "Portfolio Regulatory Impact Analysis", "ประเมินผลกระทบของกฎใหม่ทั้งพอร์ต", "/changes", "F06"],
  ["COP-019", "C", "S", "P0", "One-Click Document Ingestion", "นำเข้าเอกสารคลิกเดียว", "/ingest", "F01,F02,F03"],
  ["COP-020", "C", "T", "P1", "AI Evidence Collection Handoff", "ส่งต่อให้ AI ขอเอกสารที่ขาด", "/ingest", "F01"],
  ["COP-021", "C", "S", "P0", "Thai/English Document Extraction", "สกัดข้อความ ตาราง และข้อมูลเอกสารไทย/อังกฤษ", "/ingest", "F01"],
  ["COP-022", "C", "S", "P0", "Plant Master Data Extraction", "สกัดข้อมูลหลักของโรงไฟฟ้า", "/ingest", "F02"],
  ["COP-023", "C", "S", "P0", "Document Classification & Versioning", "จัดหมวดและควบคุมฉบับเอกสาร", "/ingest", "F01"],
  ["COP-024", "C", "T", "P0", "Cross-Document Consistency Check", "ตรวจความขัดแย้งระหว่างเอกสาร", "/agi", "F01,F03"],
  ["COP-025", "C", "S", "P0", "Evidence-to-Requirement Mapping", "จับคู่หลักฐานกับข้อกำหนด", "/ingest", "F01,F03"],
  ["COP-026", "C", "S", "P0", "Missing Evidence Detection", "ตรวจหาหลักฐานที่ขาด", "/agi", "F01,F03,F05"],
  ["COP-027", "C", "T", "P1", "Evidence Integrity Audit", "ตรวจความถูกต้องและที่มาของหลักฐาน", "/ingest", "F05"],
  ["COP-028", "D", "S", "P0", "Project Boundary Mapping", "จัดทำแผนที่ขอบเขตโครงการ", null],
  ["COP-029", "D", "T", "P1", "Land-Use & Zoning Assessment", "ประเมินการใช้ที่ดินและผังเมือง", null],
  ["COP-030", "D", "T", "P1", "Sensitive Receptor Identification", "ระบุผู้รับผลกระทบที่อ่อนไหว", null],
  ["COP-031", "D", "S", "P1", "Land & Building Rights Review", "ตรวจสิทธิในที่ดินและอาคาร", null],
  ["COP-032", "D", "T", "P1", "Plant Design Evidence Review", "ตรวจหลักฐานแบบโรงไฟฟ้า", "/ingest", "F02"],
  ["COP-033", "D", "T", "P1", "Environmental Baseline Compilation", "รวบรวมข้อมูลพื้นฐานสิ่งแวดล้อม", "/ingest", "F02"],
  ["COP-034", "D", "T", "P1", "Baseline Sampling Gap Analysis", "วิเคราะห์ช่องว่างการเก็บตัวอย่างพื้นฐาน", "/ingest", "F02"],
  ["COP-035", "D", "T", "P1", "Technology-Specific Impact Assessment", "ประเมินผลกระทบตามเทคโนโลยี", null],
  ["COP-036", "D", "W", "P2", "Integrated Site Risk Assessment", "ประเมินความเสี่ยงพื้นที่แบบบูรณาการ", null],
  ["COP-037", "E", "T", "P0", "Preliminary CoP Preparation", "จัดทำรายงาน CoP ขั้นต้น", "/factory", "F02"],
  ["COP-038", "E", "T", "P1", "Pre-Construction Measures Plan", "แผนมาตรการก่อนก่อสร้าง", null],
  ["COP-039", "E", "T", "P1", "Environmental Monitoring Plan", "แผนการติดตามตรวจสอบสิ่งแวดล้อม", null],
  ["COP-040", "E", "T", "P0", "Preliminary Report Completeness Review", "ตรวจความครบถ้วนรายงานขั้นต้น", "/preflight", "F02"],
  ["COP-041", "E", "T", "P0", "Preliminary Submission Package", "จัดชุดเอกสารยื่นขั้นต้น", "/preflight", "F02"],
  ["COP-042", "E", "T", "P1", "Stakeholder Consultation Planning", "วางแผนการรับฟังความคิดเห็น", null],
  ["COP-043", "E", "T", "P1", "Consultation Material Preparation", "เตรียมเอกสารประกอบการรับฟังความคิดเห็น", null],
  ["COP-044", "E", "T", "P1", "Consultation Record Processing", "ประมวลบันทึกการรับฟังความคิดเห็น", null],
  ["COP-045", "E", "T", "P1", "Community Response Matrix", "ตารางคำตอบต่อข้อคิดเห็นชุมชน", null],
  ["COP-046", "F", "T", "P0", "Preliminary-to-Final Reconciliation", "กระทบยอดจากขั้นต้นสู่ขั้นสุดท้าย", null],
  ["COP-047", "F", "T", "P1", "Baseline Laboratory Evidence Review", "ตรวจหลักฐานผลแล็บพื้นฐาน", "/agi", "F02"],
  ["COP-048", "F", "T", "P0", "Final Mitigation & Monitoring Matrix", "ตารางมาตรการลดผลกระทบและติดตามขั้นสุดท้าย", null],
  ["COP-049", "F", "S", "P1", "Author & Engineer Credential Validation", "ตรวจคุณวุฒิผู้จัดทำและวิศวกร", "/ingest", "F02"],
  ["COP-050", "F", "T", "P1", "Final Project Data Reconciliation", "กระทบยอดข้อมูลโครงการขั้นสุดท้าย", "/agi", "F02"],
  ["COP-051", "F", "T", "P0", "Final CoP Report Generation", "จัดทำรายงาน CoP ขั้นสุดท้าย", null],
  ["COP-052", "F", "T", "P0", "Independent Final Report QA", "ตรวจคุณภาพรายงานขั้นสุดท้ายโดยอิสระ", "/report-quality", "F02"],
  ["COP-053", "F", "S", "P0", "Final Report Formatting & Export", "จัดรูปแบบและส่งออกรายงานขั้นสุดท้าย", null],
  ["COP-054", "F", "T", "P0", "Filing Readiness & Tracking", "ความพร้อมยื่นและติดตามการยื่น", "/preflight", "F02"],
  ["COP-055", "G", "S", "P0", "Monitoring Cycle Activation", "เปิดรอบการติดตามตรวจสอบ", "/agi", "F01,F07"],
  ["COP-056", "G", "T", "P1", "Sampling & Inspection Scheduling", "นัดหมายเก็บตัวอย่างและตรวจสอบ", null],
  ["COP-057", "G", "S", "P1", "Field Evidence Collection", "รวบรวมหลักฐานภาคสนาม (ภาพถ่าย พิกัด เวลา)", "/ingest", "F01"],
  ["COP-058", "G", "T", "P1", "Construction Compliance Review", "ตรวจการปฏิบัติตามระยะก่อสร้าง", null],
  ["COP-059", "G", "T", "P1", "Operating Compliance Review", "ตรวจการปฏิบัติตามระยะดำเนินการ", null],
  ["COP-060", "G", "T", "P1", "Safety & Maintenance Evidence Review", "ตรวจหลักฐานความปลอดภัยและบำรุงรักษา", null],
  ["COP-061", "G", "T", "P1", "Community Complaint Register", "ทะเบียนข้อร้องเรียนชุมชน", null],
  ["COP-062", "G", "T", "P1", "Decommissioning Compliance Plan", "แผนการปฏิบัติตามระยะรื้อถอน", null],
  ["COP-063", "G", "T", "P1", "Periodic Control Verification", "ตรวจการควบคุมตามรอบ", "/controls", "F03"],
  ["COP-064", "H", "S", "P0", "Laboratory Report Validation", "ตรวจรายงานผลห้องปฏิบัติการ", "/agi", "F01,F03"],
  ["COP-065", "H", "T", "P1", "Air Quality & Emission Assessment", "ประเมินคุณภาพอากาศและการระบาย", "/agi", "F01"],
  ["COP-066", "H", "T", "P1", "Water Quality Monitoring Review", "ทบทวนผลคุณภาพน้ำ", "/agi", "F01"],
  ["COP-067", "H", "T", "P1", "Noise, Dust, Odor & Vibration Review", "ทบทวนเสียง ฝุ่น กลิ่น และความสั่นสะเทือน", "/agi", "F01"],
  ["COP-068", "H", "T", "P1", "Waste & Hazardous Material Control", "ควบคุมของเสียและวัตถุอันตราย", null],
  ["COP-069", "H", "T", "P1", "Solar Rooftop Safety Evidence Review", "ตรวจหลักฐานความปลอดภัยโซลาร์บนหลังคา", null],
  ["COP-070", "H", "T", "P1", "Ground-Mounted Solar Controls", "มาตรการโซลาร์ภาคพื้นดิน", null],
  ["COP-071", "H", "T", "P1", "Floating Solar Controls", "มาตรการโซลาร์ลอยน้ำ", null],
  ["COP-072", "H", "T", "P1", "Other Technology Specialist Pack", "ชุดผู้เชี่ยวชาญเทคโนโลยีอื่น", null],
  ["COP-073", "I", "T", "P0", "Measure-by-Measure Compliance Audit", "ตรวจการปฏิบัติตามรายมาตรการ", "/agi", "F01,F03,F05"],
  ["COP-074", "I", "S", "P0", "Missing Evidence Register", "ทะเบียนหลักฐานที่ขาด", "/my-work", "F01,F03,F04"],
  ["COP-075", "I", "S", "P0", "Measurement Exceedance Detection", "ตรวจค่าเกินมาตรฐาน", "/agi", "F01,F03,F04"],
  ["COP-076", "I", "T", "P1", "Incident Intake & Triage", "รับและคัดแยกเหตุการณ์", null],
  ["COP-077", "I", "T", "P1", "Root Cause Investigation", "สืบหาสาเหตุราก", null],
  ["COP-078", "I", "T", "P1", "Corrective Action Plan (CAPA)", "แผนปฏิบัติการแก้ไข (CAPA)", "/agi", "F04"],
  ["COP-079", "I", "T", "P1", "Corrective Work Dispatch", "มอบหมายงานแก้ไข", "/agi", "F04"],
  ["COP-080", "I", "T", "P1", "Remediation Verification", "ตรวจยืนยันการแก้ไข", "/agi", "F04"],
  ["COP-081", "I", "T", "P1", "Regulatory Escalation Preparation", "เตรียมการแจ้งหน่วยงานกำกับ", null],
  ["COP-082", "J", "T", "P0", "Reporting Period Data Collection", "รวบรวมข้อมูลของรอบรายงาน", "/ingest", "F01"],
  ["COP-083", "J", "T", "P0", "CoP Compliance Results Matrix", "ตารางผลการปฏิบัติตามรายมาตรการ", "/agi", "F01"],
  ["COP-084", "J", "S", "P0", "Environmental Trend Analysis", "วิเคราะห์แนวโน้มสิ่งแวดล้อม", "/agi", "F01"],
  ["COP-085", "J", "T", "P1", "Exception & Complaint Narrative", "คำอธิบายข้อยกเว้นและข้อร้องเรียน", "/agi", "F01"],
  ["COP-086", "J", "T", "P0", "One-Click CoP Monitoring Report", "รายงานผลการปฏิบัติตาม CoP คลิกเดียว", "/agi", "F01"],
  ["COP-087", "J", "T", "P0", "Automated Annex Assembly", "ประกอบภาคผนวกอัตโนมัติ", "/agi", "F01"],
  ["COP-088", "J", "T", "P0", "Regulatory & Numerical QA", "ตรวจคุณภาพด้านกฎระเบียบและตัวเลข", "/agi", "F01"],
  ["COP-089", "J", "S", "P0", "Report Studio Review", "ตรวจทานในสตูดิโอรายงาน", "/studio", "F01"],
  ["COP-090", "J", "T", "P0", "Final Monitoring Package", "ชุดรายงานติดตามผลฉบับสมบูรณ์", "/agi", "F01"],
  ["COP-091", "K", "T", "P1", "Pre-Submission Readiness Simulation", "จำลองการตรวจก่อนยื่นแบบ กกพ.", "/preflight", "F05"],
  ["COP-092", "K", "S", "P1", "Regulator Letter Interpretation", "ตีความหนังสือจากหน่วยงานกำกับ", null],
  ["COP-093", "K", "T", "P1", "Regulatory Clarification Response Draft", "ร่างคำชี้แจงต่อหน่วยงานกำกับ", null],
  ["COP-094", "K", "T", "P1", "Deficiency Correction & Resubmission", "แก้ไขข้อบกพร่องและยื่นใหม่", null],
  ["COP-095", "K", "T", "P1", "Authority Communication Package", "ชุดหนังสือติดต่อหน่วยงาน", null],
  ["COP-096", "K", "T", "P1", "Inspection Readiness Pack", "ชุดเตรียมรับการตรวจ", "/agi", "F05"],
  ["COP-097", "K", "T", "P1", "Inspection Finding Follow-Up", "ติดตามข้อสังเกตจากการตรวจ", null],
  ["COP-098", "K", "T", "P1", "Project Modification Impact Review", "ประเมินผลกระทบการเปลี่ยนแปลงโครงการ", "/agi", "F02"],
  ["COP-099", "K", "T", "P1", "Deadline Extension & Official Status Tracking", "ขอขยายเวลาและติดตามสถานะทางการ", null],
  ["COP-100", "L", "W", "P2", "Multi-Plant Compliance Dashboard", "แดชบอร์ดการปฏิบัติตามหลายโรงไฟฟ้า", "/portfolio", "F06"],
  ["COP-101", "L", "W", "P2", "Bulk Annual Report Generation", "จัดทำรายงานประจำปีหลายแห่งพร้อมกัน", "/agi", "F06"],
  ["COP-102", "L", "W", "P2", "Portfolio Risk Prioritization", "จัดลำดับความเสี่ยงทั้งพอร์ต", "/portfolio", "F06"],
  ["COP-103", "L", "T", "P2", "Compliance Budget Forecast", "พยากรณ์งบประมาณการปฏิบัติตาม", null],
  ["COP-104", "L", "W", "P2", "Recurring Issue Detection", "ตรวจหาปัญหาที่เกิดซ้ำ", null],
  ["COP-105", "L", "T", "P2", "Consultant & Laboratory Coordination", "ประสานงานที่ปรึกษาและห้องปฏิบัติการ", null],
  ["COP-106", "L", "T", "P2", "Custom AI Compliance Team Builder", "สร้างทีม AI ตามองค์กร", "/agi", "F07"],
  ["COP-107", "L", "T", "P2", "ESG24 Evidence Synchronization", "ซิงก์หลักฐานกับ ESG24", null],
  ["COP-108", "L", "W", "P2", "Executive Compliance Intelligence", "รายงานข่าวกรองการปฏิบัติตามสำหรับผู้บริหาร", null],
];

export const CATALOG: CatalogMission[] = ROWS.map(([id, category, mode, priority, en, th, route, fl]) => ({ id, category, mode, priority, title: t(th, en), route, flagships: fl ? fl.split(",") : [], tags: tagsFor(category, en) }));

export const catalogById = (id: string) => CATALOG.find((m) => m.id === id);
export const isAvailable = (m: CatalogMission) => m.route !== null;
