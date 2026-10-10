import { t } from "@/core/i18n-text";
import type { RulePack } from "@/core/types";

/**
 * ESG24 Pack — SET/SEC 56-1 One Report, IFRS S1/S2 (TFRS S), GRI, GHG/TGO.
 * ESG24 is the first vertical built on the COP24 engine: same Compliance Universe,
 * Applicability, Obligation Register, Evidence Pipeline, Calendar, Control Testing,
 * Gap & Remediation, Regulatory Change, Audit Trail and Execution Engine — ESG-skinned.
 */
export const SET_ONE_REPORT: RulePack = {
  id: "SET-56-1-ONE-REPORT",
  app: "esg24",
  domain: "esg",
  name: t("แบบ 56-1 One Report — ส่วนความยั่งยืน", "Form 56-1 One Report — sustainability section"),
  authority: t("สำนักงาน ก.ล.ต. / ตลาดหลักทรัพย์ฯ", "SEC Thailand / SET"),
  source: t("ประกาศ ก.ล.ต. ที่ ทจ. 55/2563 และคู่มือ One Report", "SEC Notification TorJor. 55/2563 and One Report guidelines"),
  version: "2025.2",
  effectiveFrom: "2025-01-01",
  criteria: [
    { id: "c1", field: "listed", op: "truthy", label: t("เป็นบริษัทจดทะเบียนในตลาดหลักทรัพย์", "Listed on the Stock Exchange of Thailand") },
  ],
  obligationCount: 48,
  obligations: [
    { id: "SET-OR-3.1", title: t("นโยบายและเป้าหมายการจัดการด้านความยั่งยืน", "Sustainability policy and targets"), summary: t("เปิดเผยนโยบาย เป้าหมาย และการกำกับดูแลด้านความยั่งยืนที่คณะกรรมการอนุมัติ", "Disclose board-approved sustainability policy, targets and oversight"), frequency: "annual", dueRule: t("พร้อมแบบ 56-1 ภายใน 3 เดือนหลังสิ้นปีบัญชี", "With Form 56-1 within 3 months of fiscal year-end"), evidenceRequired: [t("มติคณะกรรมการอนุมัตินโยบาย", "Board resolution approving the policy")], ownerRole: t("เลขานุการบริษัท", "Company secretary"), severity: "material", citations: [{ sourceId: "sec-tj-55-2563" }, { sourceId: "sec-one-report-manual" }], reportDest: t("56-1 ส่วนที่ 1 หัวข้อ 3.1", "56-1 Part 1 §3.1") },
    { id: "SET-OR-3.2", title: t("การจัดการผลกระทบต่อผู้มีส่วนได้เสีย", "Stakeholder impact management"), summary: t("ห่วงโซ่คุณค่า ผู้มีส่วนได้เสีย และประเด็นสาระสำคัญ (materiality)", "Value chain, stakeholders and material topics"), frequency: "annual", dueRule: t("พร้อมแบบ 56-1", "With Form 56-1"), evidenceRequired: [t("ผลการประเมินประเด็นสาระสำคัญ", "Materiality assessment")], ownerRole: t("ฝ่ายความยั่งยืน", "Sustainability team"), severity: "material", citations: [{ sourceId: "sec-tj-55-2563" }, { sourceId: "sec-one-report-manual" }], reportDest: t("56-1 ส่วนที่ 1 หัวข้อ 3.2", "56-1 Part 1 §3.2") },
    { id: "SET-OR-3.3-GHG", title: t("ข้อมูลก๊าซเรือนกระจก Scope 1 และ 2", "GHG emissions Scope 1 and 2"), summary: t("เปิดเผยปริมาณการปล่อยพร้อมการทวนสอบจากผู้ทวนสอบที่ อบก. ขึ้นทะเบียน", "Disclose emissions with verification by a TGO-registered verifier"), frequency: "annual", dueRule: t("พร้อมแบบ 56-1", "With Form 56-1"), evidenceRequired: [t("รายงานการทวนสอบ GHG", "GHG verification statement"), t("บัญชีก๊าซเรือนกระจก", "GHG inventory")], ownerRole: t("ฝ่ายความยั่งยืน", "Sustainability team"), severity: "material", citations: [{ sourceId: "sec-tj-55-2563" }, { sourceId: "sec-one-report-manual" }], reportDest: t("56-1 ส่วนที่ 1 หัวข้อ 3.3", "56-1 Part 1 §3.3") },
    { id: "SET-OR-3.4", title: t("การจัดการด้านสังคม: พนักงาน ชุมชน สิทธิมนุษยชน", "Social: employees, community, human rights"), summary: t("ข้อมูลพนักงาน ความปลอดภัย การร้องเรียนจากชุมชน และการประเมินสิทธิมนุษยชน", "Workforce data, safety, community grievances and human-rights due diligence"), frequency: "annual", dueRule: t("พร้อมแบบ 56-1", "With Form 56-1"), evidenceRequired: [t("ทะเบียนข้อร้องเรียนชุมชน", "Community grievance register"), t("สถิติอุบัติเหตุ", "Injury statistics")], ownerRole: t("ฝ่ายทรัพยากรบุคคล", "Human resources"), severity: "major", citations: [{ sourceId: "sec-tj-55-2563" }, { sourceId: "sec-one-report-manual" }], reportDest: t("56-1 ส่วนที่ 1 หัวข้อ 3.4", "56-1 Part 1 §3.4") },
  ],
  reports: [
    {
      id: "one-report-sustainability",
      name: t("56-1 One Report — ส่วนการขับเคลื่อนธุรกิจเพื่อความยั่งยืน", "56-1 One Report — sustainability section"),
      purpose: t("ยื่นต่อ ก.ล.ต. พร้อมรายงานประจำปี", "Filed with the SEC alongside the annual report"),
      chapters: [
        { id: "policy", num: "3.1", title: t("นโยบายและเป้าหมาย", "Policy and targets"), obligationIds: ["SET-OR-3.1"], locked: true },
        { id: "stake", num: "3.2", title: t("ผู้มีส่วนได้เสียและประเด็นสาระสำคัญ", "Stakeholders and materiality"), obligationIds: ["SET-OR-3.2"], locked: true },
        { id: "env", num: "3.3", title: t("สิ่งแวดล้อมและก๊าซเรือนกระจก", "Environment and GHG"), obligationIds: ["SET-OR-3.3-GHG"], locked: true },
        { id: "social", num: "3.4", title: t("สังคม", "Social"), obligationIds: ["SET-OR-3.4"], locked: true },
      ],
    },
  ],
};

export const IFRS_S1_S2: RulePack = {
  id: "TFRS-S1-S2",
  app: "esg24",
  domain: "esg",
  name: t("IFRS S1 / S2 (TFRS S) — การเปิดเผยด้านความยั่งยืนและสภาพภูมิอากาศ", "IFRS S1 / S2 (TFRS S) — sustainability & climate disclosure"),
  authority: t("สภาวิชาชีพบัญชี / ก.ล.ต.", "TFAC / SEC Thailand"),
  source: t("แผนการนำ TFRS S1 และ S2 มาใช้ (บังคับใช้เป็นระยะ)", "TFRS S1 and S2 adoption roadmap (phased)"),
  version: "2026.0",
  effectiveFrom: "2027-01-01",
  criteria: [
    { id: "c1", field: "listed", op: "truthy", label: t("เป็นบริษัทจดทะเบียน (ระยะที่ 1: SET50/SET100)", "Listed company (phase 1: SET50/SET100)") },
  ],
  obligationCount: 22,
  obligations: [
    { id: "S2-CLIMATE-RISK", title: t("ความเสี่ยงและโอกาสด้านสภาพภูมิอากาศ", "Climate-related risks and opportunities"), summary: t("การกำกับดูแล กลยุทธ์ การบริหารความเสี่ยง ตัวชี้วัดและเป้าหมาย พร้อมการวิเคราะห์สถานการณ์", "Governance, strategy, risk management, metrics & targets, with scenario analysis"), frequency: "annual", dueRule: t("พร้อมรายงานประจำปี เมื่อมีผลบังคับ", "With the annual report once effective"), evidenceRequired: [t("ผลการวิเคราะห์สถานการณ์สภาพภูมิอากาศ", "Climate scenario analysis")], ownerRole: t("ฝ่ายความยั่งยืน", "Sustainability team"), severity: "material", citations: [{ sourceId: "tfrs-s1-s2" }], reportDest: t("รายงานความยั่งยืน — S2", "Sustainability report — S2") },
  ],
  reports: [],
};

export const TGO_GHG: RulePack = {
  id: "TGO-GHG-VERIFY",
  app: "esg24",
  domain: "environmental",
  name: t("การทวนสอบคาร์บอนฟุตพริ้นท์องค์กร (อบก.)", "TGO corporate carbon footprint verification"),
  authority: t("องค์การบริหารจัดการก๊าซเรือนกระจก (อบก.)", "Thailand Greenhouse Gas Management Organization (TGO)"),
  source: t("แนวทาง CFO ของ อบก. และ TGO-registered verifier", "TGO CFO guideline and registered-verifier scheme"),
  version: "2025.1",
  effectiveFrom: "2025-01-01",
  criteria: [
    { id: "c1", field: "listed", op: "truthy", label: t("บริษัทจดทะเบียนที่ต้องเปิดเผย GHG ใน 56-1", "Listed company disclosing GHG in 56-1") },
  ],
  obligationCount: 9,
  obligations: [
    { id: "TGO-CFO-01", title: t("จัดทำบัญชีก๊าซเรือนกระจกองค์กรและทวนสอบ", "Prepare and verify the corporate GHG inventory"), summary: t("ขอบเขตองค์กร ปัจจัยการปล่อย และข้อความรับรองจากผู้ทวนสอบ", "Organisational boundary, emission factors and verifier's statement"), frequency: "annual", dueRule: t("ก่อนยื่น 56-1", "Before filing 56-1"), evidenceRequired: [t("ข้อความรับรองการทวนสอบ", "Verification statement")], ownerRole: t("ฝ่ายความยั่งยืน", "Sustainability team"), severity: "major", citations: [{ sourceId: "tgo-cfo-guideline" }], reportDest: t("56-1 หัวข้อ 3.3", "56-1 §3.3") },
  ],
  reports: [],
};

export const ESG24_PACKS = [SET_ONE_REPORT, IFRS_S1_S2, TGO_GHG];
