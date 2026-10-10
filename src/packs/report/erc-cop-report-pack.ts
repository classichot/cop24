import { t } from "@/core/i18n-text";
import type { ReportPack, Requirement } from "@/core/report/types";

/**
 * COP24 report pack — ERC Code of Practice report, ground-mounted solar (Solar Farm).
 *
 * Built from the official ERC form "รายการตรวจสอบ (checklist) มาตรการด้านสิ่งแวดล้อมตาม
 * ประมวลหลักการปฏิบัติ - Solar Farm", Version 1.0 / ตุลาคม 2565, annexed to the ERC
 * Regulation on CoP reports B.E. 2565 (as amended 2567) — corpus sources
 * `erc-cop-checklist-solar-farm` and `erc-cop-reg-2565`. Requirement ids follow the form's
 * numbering. The rooftop form (Version 1.0/2567) has a different five-part layout and gets
 * its own pack variant.
 *
 * Status: the pack is a COP24 encoding of the form and has NOT yet been approved by a domain
 * owner (§3 of the report standard), so it may not be described as ready for authority filing.
 */
const F = "erc-cop-checklist-solar-farm";
const ALL = ["preliminary", "final", "monitoring"] as const;
const PRE = ["preliminary", "final"] as const;

const req = (r: Omit<Requirement, "stages"> & { stages?: readonly ("preliminary" | "final" | "monitoring")[] }): Requirement => ({ ...r, stages: [...(r.stages ?? PRE)] });

export const ERC_COP_SOLAR_FARM_REQUIREMENTS: Requirement[] = [
  // ── Cover: ส่วนที่ 1–2 (operator and preparer) ──
  req({ id: "CoP-C1-OPERATOR", part: "ปก ส่วนที่ 1", section: "C1", title: t("ข้อมูลการประกอบกิจการ: ผู้ขอรับใบอนุญาต ประเภทคำขอ โครงการ ที่ตั้ง", "Operator information: applicant, request type, project, location"), kind: "form", evidence: [t("ใบอนุญาตผลิตไฟฟ้า (กรณีขยาย/เปลี่ยนแปลง)", "Generation licence (expansion / change cases)")], source: { sourceId: F, clause: "ส่วนที่ 1" } }),
  req({ id: "CoP-C1-CAPACITY", part: "ปก ส่วนที่ 1", section: "C1", title: t("กำลังการผลิตติดตั้งรวม — แผงเซลล์ (MWp, ทศนิยม 3 ตำแหน่ง) และอินเวอร์เตอร์ (kVA, ทศนิยม 2 ตำแหน่ง)", "Total installed capacity — panels (MWp, 3 decimals) and inverters (kVA, 2 decimals)"), kind: "table", evidence: [t("ข้อมูลจำเพาะแผงและอินเวอร์เตอร์", "Panel and inverter specifications")], source: { sourceId: F, clause: "ส่วนที่ 1" }, precision: [{ metric: "capacity.dc", unit: "MWp", decimals: 3 }, { metric: "capacity.ac", unit: "kVA", decimals: 2 }], stages: ALL }),
  req({ id: "CoP-C2-PREPARER", part: "ปก ส่วนที่ 2", section: "C2", title: t("ข้อมูลผู้จัดทำรายงาน CoP และหลักฐานประสบการณ์", "CoP report preparer and evidence of experience"), kind: "signature", evidence: [t("เอกสารแสดงประสบการณ์ด้านระบบผลิตไฟฟ้าจากแสงอาทิตย์หรือการประเมินผลกระทบสิ่งแวดล้อม", "Evidence of solar design/construction or EIA experience")], qualifiedSignatory: t("ผู้จัดทำรายงาน CoP ที่มีคุณสมบัติตามระเบียบ", "Qualified CoP report preparer"), source: { sourceId: F, clause: "ส่วนที่ 2" } }),
  req({ id: "CoP-C2-CERT", part: "ปก ส่วนที่ 2", section: "C2", title: t("คำรับรองของผู้ประสงค์ขอรับใบอนุญาตและผู้จัดทำรายงาน (ลงนาม)", "Certification by applicant and preparer (signed)"), kind: "signature", evidence: [t("ลายมือชื่อผู้จัดทำ ผู้ประสงค์ขอรับใบอนุญาต/ผู้มีอำนาจกระทำการแทน และหนังสือมอบอำนาจ (ถ้ามี)", "Signatures of preparer and applicant/authorised signatory; power of attorney if any")], qualifiedSignatory: t("ผู้มีอำนาจลงนามแทนนิติบุคคล", "Authorised signatory"), source: { sourceId: F, clause: "ส่วนที่ 2" }, stages: ALL }),

  // ── ส่วนที่ 1 มาตรการทั่วไป ──
  req({ id: "CoP-1-GENERAL", part: "ส่วนที่ 1", section: "1", title: t("มาตรการทั่วไป: ปฏิบัติตาม CoP ทุกระยะ บรรจุในสัญญาผู้รับจ้าง แจ้ง สำนักงาน กกพ. เมื่อมีปัญหา/ข้อร้องเรียน และแจ้งการเปลี่ยนแปลงก่อนดำเนินการ", "General measures: comply in every phase, flow into contractor contracts, notify the ERC office of problems/complaints, and notify changes before acting"), kind: "content", evidence: [t("ร่างสัญญาจ้างที่อ้างมาตรการ CoP", "Contract clause citing CoP measures")], source: { sourceId: F, clause: "ส่วนที่ 1 (2)" }, stages: ALL }),

  // ── ส่วนที่ 2 มาตรการระยะเตรียมการก่อสร้าง ──
  req({ id: "CoP-2.1-SITE", part: "ส่วนที่ 2", section: "2.1", title: t("เกณฑ์ด้านพื้นที่ก่อสร้าง: ไม่ขัดผังเมือง กฎหมายสิ่งแวดล้อม โบราณสถาน มติ ครม. และได้รับอนุญาตตามกฎหมายอื่น", "Site criteria: no conflict with zoning, environmental, heritage law or cabinet resolutions; other-law permits obtained"), kind: "evidence", evidence: [t("แบบฟอร์มรับรองตนเอง เรื่อง ที่ตั้งโครงการ", "Self-certification form — project location")], source: { sourceId: F, clause: "ส่วนที่ 2 (2)" } }),
  req({ id: "CoP-2.2-LAYOUT", part: "ส่วนที่ 2", section: "2.2", title: t("แผนผังโครงการ (Plant Layout) และตารางสัดส่วนการใช้พื้นที่ รวม 100%", "Plant layout and land-use proportion table summing to 100%"), kind: "table", evidence: [t("แผนผังโครงการ โฉนด/สิทธิการใช้ที่ดิน", "Plant layout; title deeds / land-use rights")], source: { sourceId: F, clause: "ส่วนที่ 2 (2)" } }),
  req({ id: "CoP-2.3-DESIGN", part: "ส่วนที่ 2", section: "2.3", title: t("การออกแบบระบบไฟฟ้าและความปลอดภัย ลงนามรับรองโดยวิศวกรควบคุม (แผง อินเวอร์เตอร์ หม้อแปลง SLD โครงสร้าง แสงสะท้อน อัคคีภัย)", "Electrical design and safety certified by a licensed control engineer (panels, inverters, transformers, SLD, structure, glare, fire)"), kind: "evidence", evidence: [t("แบบที่วิศวกรลงนาม + สำเนาใบอนุญาตวิศวกร", "Engineer-signed drawings + engineer licence copies")], qualifiedSignatory: t("วิศวกรผู้ได้รับใบอนุญาตประกอบวิชาชีพวิศวกรรมควบคุม", "Licensed control engineer"), source: { sourceId: F, clause: "ส่วนที่ 2 (2)" } }),
  req({ id: "CoP-2.4.1-NOISE", part: "ส่วนที่ 2", section: "2.4.1", title: t("เกณฑ์ด้านเสียงในการออกแบบ (วิศวกรรับรอง หรือหนังสือรับรองระดับเสียงอุปกรณ์จากผู้ผลิต)", "Noise design criteria (engineer certification or manufacturer noise certificates)"), kind: "evidence", evidence: [t("หนังสือรับรองระดับเสียงของอุปกรณ์", "Equipment noise certificates")], source: { sourceId: F, clause: "ส่วนที่ 2 (2)" } }),
  req({ id: "CoP-2.4.2-WATER", part: "ส่วนที่ 2", section: "2.4.2–2.4.3", title: t("น้ำใช้ น้ำทิ้ง และการระบายน้ำ (รวมน้ำล้างแผง)", "Water use, wastewater and drainage (including panel washing)"), kind: "content", evidence: [t("แผนการใช้น้ำและการระบายน้ำ", "Water use and drainage plan")], source: { sourceId: F, clause: "ส่วนที่ 2 (2)" } }),
  req({ id: "CoP-2.4.4-WASTE", part: "ส่วนที่ 2", section: "2.4.4", title: t("การจัดการมูลฝอยและกากของเสีย รวมแผงชำรุด/หมดอายุ — สถานที่จัดเก็บ วิธีกำจัด และแผนกรณีส่งกำจัดไม่ทัน", "Waste management including damaged/end-of-life panels — storage, disposal method, contingency plan"), kind: "content", evidence: [t("ตำแหน่งที่จัดเก็บในผัง และวิธีกำจัดโดยผู้รับกำจัดที่ได้รับอนุญาต", "Storage location on the layout; disposal by a licensed contractor")], source: { sourceId: F, clause: "ส่วนที่ 2 (2)" } }),

  // ── ส่วนที่ 3 การตรวจวัดคุณภาพสิ่งแวดล้อมพื้นฐาน ──
  req({ id: "CoP-3.1.1-NOISE-BASELINE", part: "ส่วนที่ 3", section: "3.1.1", title: t("ตรวจวัดเสียงพื้นฐาน ≥ 1 ครั้ง ≥ 2 สถานี ต่อเนื่อง ≥ 5 วัน ครอบคลุมวันทำการและวันหยุด (Leq24, L90, Ldn, Lmax) พร้อมตาราง แผนภูมิ และแผนที่สถานี", "Baseline noise: ≥1 round, ≥2 stations, ≥5 consecutive days covering workdays and holidays (Leq24, L90, Ldn, Lmax), with tables, charts and a station map"), kind: "evidence", evidence: [t("รายงานผลการตรวจวัดจากห้องปฏิบัติการ", "Laboratory measurement report")], source: { sourceId: F, clause: "ส่วนที่ 3" }, thresholds: [{ key: "noise.baseline.days", min: 5, unit: "วัน", label: t("ตรวจวัดต่อเนื่องอย่างน้อย 5 วัน ครอบคลุมวันทำการและวันหยุด", "At least 5 consecutive days covering workdays and holidays") }, { key: "noise.baseline.stations", min: 2, unit: "สถานี", label: t("อย่างน้อย 2 สถานี", "At least 2 stations") }] }),
  req({ id: "CoP-3.1.2-SOIL", part: "ส่วนที่ 3", section: "3.1.2", title: t("ทรัพยากรดินและการชะล้างพังทลายของดิน", "Soil resources and erosion"), kind: "evidence", evidence: [t("ผลการสำรวจดิน", "Soil survey results")], source: { sourceId: F, clause: "ส่วนที่ 3" } }),
  req({ id: "CoP-3.2-METHOD", part: "ส่วนที่ 3", section: "3.2", title: t("วิธีการตรวจวัดตามมาตรฐานและห้องปฏิบัติการที่ขึ้นทะเบียน", "Measurement methods per standard; registered laboratory"), kind: "evidence", evidence: [t("หนังสือรับรองห้องปฏิบัติการที่ยังไม่หมดอายุ", "Valid laboratory accreditation")], source: { sourceId: F, clause: "ส่วนที่ 3" } }),

  // ── ส่วนที่ 4 มาตรการระยะก่อสร้าง ──
  req({ id: "CoP-4-CONSTRUCTION", part: "ส่วนที่ 4", section: "4.1–4.7", title: t("มาตรการระยะก่อสร้าง: อากาศ เสียง น้ำ คมนาคม ขยะ อาชีวอนามัย เศรษฐกิจสังคมและการมีส่วนร่วม — ทั้งมาตรการป้องกันและติดตามตรวจสอบ", "Construction phase: air, noise, water, traffic, waste, OHS, socio-economic and participation — prevention and monitoring"), kind: "content", evidence: [t("ตารางมาตรการระยะก่อสร้าง", "Construction-phase measures table")], source: { sourceId: F, clause: "ส่วนที่ 4" } }),

  // ── ส่วนที่ 5 มาตรการระยะดำเนินการ ──
  req({ id: "CoP-5.1-WATER-OPS", part: "ส่วนที่ 5", section: "5.1", title: t("คุณภาพน้ำระยะดำเนินการ — มาตรการป้องกันและติดตามตรวจสอบ", "Operation-phase water quality — prevention and monitoring"), kind: "content", evidence: [t("แผนติดตามคุณภาพน้ำ", "Water monitoring plan")], source: { sourceId: F, clause: "ส่วนที่ 5" }, stages: ALL }),
  req({ id: "CoP-5.2-WASTE-OPS", part: "ส่วนที่ 5", section: "5.2", title: t("ขยะและแผงเสื่อมสภาพระยะดำเนินการ — บันทึกรายเดือน รายงานปีละครั้ง แจ้ง สำนักงาน กกพ. ภายใน 30 วันหากส่งออกนอกประเทศ", "Operation-phase waste and end-of-life panels — monthly records, annual report, notify the ERC office within 30 days of any export"), kind: "content", evidence: [t("ทะเบียนการจัดการแผงเสื่อมสภาพ", "End-of-life panel register")], source: { sourceId: F, clause: "ส่วนที่ 5" }, stages: ALL }),
  req({ id: "CoP-5.3-OHS", part: "ส่วนที่ 5", section: "5.3", title: t("อาชีวอนามัย ความปลอดภัย และสุขภาพ", "Occupational health and safety"), kind: "content", evidence: [t("แผนความปลอดภัย", "Safety plan")], source: { sourceId: F, clause: "ส่วนที่ 5" }, stages: ALL }),
  req({ id: "CoP-5.4-SOCIAL", part: "ส่วนที่ 5", section: "5.4", title: t("เศรษฐกิจ สังคม และการมีส่วนร่วม — ช่องทางรับข้อร้องเรียนและการแก้ไขทันที", "Socio-economic and participation — complaint channel and immediate remedy"), kind: "content", evidence: [t("ทะเบียนข้อร้องเรียน", "Complaint register")], source: { sourceId: F, clause: "ส่วนที่ 5" }, stages: ALL }),
  req({ id: "CoP-5.5-GREEN", part: "ส่วนที่ 5", section: "5.5", title: t("พื้นที่สีเขียวและสุนทรียภาพ", "Green space and visual amenity"), kind: "content", evidence: [t("แผนพื้นที่สีเขียว", "Green-space plan")], source: { sourceId: F, clause: "ส่วนที่ 5" }, stages: ALL }),

  // ── ส่วนที่ 6 มาตรการระยะรื้อถอน ──
  req({ id: "CoP-6-DECOM", part: "ส่วนที่ 6", section: "6.1–6.8", title: t("มาตรการระยะรื้อถอนบางส่วนหรือทั้งหมด รวมการฟื้นฟูสภาพพื้นที่", "Partial or full decommissioning measures, including site restoration"), kind: "content", evidence: [t("แผนรื้อถอนและฟื้นฟู", "Decommissioning and restoration plan")], source: { sourceId: F, clause: "ส่วนที่ 6" } }),

  // ── Report types and the hearing (regulation-level) ──
  req({ id: "CoP-REG-HEARING", part: "ระเบียบ", section: "การรับฟังความเห็น", title: t("ผลการรับฟังความเห็นและทำความเข้าใจกับประชาชนและผู้มีส่วนได้เสีย (รายงานขั้นสุดท้าย)", "Outcome of the public and stakeholder hearing (final report)"), kind: "evidence", evidence: [t("รายงานสรุปผลการรับฟังความเห็นและหลักฐานตามระเบียบ กกพ. พ.ศ. 2565", "Hearing summary and evidence under the ERC hearing regulation 2565")], source: { sourceId: "erc-public-hearing-reg-2565" }, stages: ["final"] }),
];

export const ERC_COP_SOLAR_FARM_PACK: ReportPack = {
  id: "ERC-CoP-REPORT-SOLAR-FARM",
  version: "0.1.0",
  app: "cop24",
  reportType: t("รายงานประมวลหลักการปฏิบัติ (CoP) — โรงไฟฟ้าโซลาร์บนพื้นดิน", "Code of Practice (CoP) report — ground-mounted solar"),
  authority: t("สำนักงาน กกพ.", "Office of the ERC"),
  primarySources: ["erc-cop-reg-2565", "erc-cop-reg-2567-no2", F, "erc-public-hearing-reg-2565"],
  domainOwnerApproval: { approved: false },
  languages: ["th", "en"],
  defaultLanguage: "th",
  requirements: ERC_COP_SOLAR_FARM_REQUIREMENTS,
  approvalPolicy: [
    { role: t("ผู้จัดทำรายงาน CoP", "CoP report preparer"), qualification: t("ประสบการณ์ระบบผลิตไฟฟ้าแสงอาทิตย์หรือ EIA ≥ 1 ปี", "≥1 year solar or EIA experience"), required: true },
    { role: t("วิศวกรควบคุม", "Licensed control engineer"), qualification: t("ใบอนุญาตประกอบวิชาชีพวิศวกรรมควบคุม", "Control engineering licence"), required: true },
    { role: t("ผู้มีอำนาจลงนาม", "Authorised signatory"), required: true },
  ],
  tolerances: { sum: 0.001, "pct-change": 0.05, ratio: 0.005, "unit-convert": 0.0005, range: 0 },
  reportCategory: "authority-th",
};
