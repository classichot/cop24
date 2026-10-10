import { t } from "@/core/i18n-text";
import type { RulePack } from "@/core/types";

/* PDPA — Personal Data Protection Act B.E. 2562 */
export const PDPA: RulePack = {
  id: "TH-PDPA-2562",
  app: "cop24",
  domain: "privacy",
  name: t("พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562", "Personal Data Protection Act B.E. 2562"),
  authority: t("สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)", "PDPC"),
  source: t("พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 และประกาศ สคส.", "PDPA B.E. 2562 and PDPC notifications"),
  version: "2025.3",
  effectiveFrom: "2022-06-01",
  criteria: [
    { id: "c1", field: "processesPersonalData", op: "truthy", label: t("เก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคล", "Collects, uses or discloses personal data") },
  ],
  obligationCount: 31,
  obligations: [
    { id: "PDPA-ROPA", title: t("บันทึกรายการประมวลผลข้อมูลส่วนบุคคล (ROPA)", "Record of processing activities (ROPA)"), summary: t("จัดทำและปรับปรุงบันทึกรายการประมวลผลให้เป็นปัจจุบัน", "Maintain a current record of processing activities"), frequency: "continuous", dueRule: t("ปรับปรุงเมื่อมีการเปลี่ยนแปลง ทบทวนปีละครั้ง", "Update on change; review annually"), evidenceRequired: [t("ทะเบียน ROPA ฉบับล่าสุด", "Current ROPA register")], ownerRole: t("เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)", "Data Protection Officer"), severity: "major" },
    { id: "PDPA-DPO", title: t("แต่งตั้งเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", "Appoint a Data Protection Officer"), summary: t("แต่งตั้ง DPO และแจ้งข้อมูลติดต่อต่อ สคส. และเจ้าของข้อมูล", "Appoint a DPO and publish contact details to the PDPC and data subjects"), frequency: "once", dueRule: t("เมื่อเข้าเงื่อนไข", "Once criteria are met"), evidenceRequired: [t("หนังสือแต่งตั้ง DPO", "DPO appointment letter")], ownerRole: t("ฝ่ายกฎหมาย", "Legal"), severity: "major" },
    { id: "PDPA-BREACH-72H", title: t("แจ้งเหตุละเมิดต่อ สคส. ภายใน 72 ชั่วโมง", "Notify the PDPC of a breach within 72 hours"), summary: t("มีกระบวนการตรวจจับ ประเมิน และแจ้งเหตุละเมิดภายในกำหนด", "Detect, assess and notify breaches within the statutory window"), frequency: "event", dueRule: t("ภายใน 72 ชั่วโมงนับแต่ทราบเหตุ", "Within 72 hours of becoming aware"), evidenceRequired: [t("ขั้นตอนรับมือเหตุละเมิดและบันทึกการซ้อม", "Breach response procedure and drill records")], ownerRole: t("DPO / ฝ่ายไอที", "DPO / IT"), severity: "material" },
    { id: "PDPA-PRIVACY-NOTICE", title: t("ประกาศความเป็นส่วนตัว", "Privacy notice"), summary: t("แจ้งวัตถุประสงค์ ฐานทางกฎหมาย และสิทธิของเจ้าของข้อมูลก่อนเก็บรวบรวม", "Inform purposes, legal basis and data-subject rights before collection"), frequency: "continuous", dueRule: t("ก่อนหรือขณะเก็บรวบรวม", "At or before collection"), evidenceRequired: [t("ประกาศความเป็นส่วนตัวฉบับเผยแพร่", "Published privacy notice")], ownerRole: t("DPO", "DPO"), severity: "major" },
  ],
  reports: [],
};

/* Labour Protection Act + OSH Act */
export const LABOUR: RulePack = {
  id: "TH-LABOUR-OSH",
  app: "cop24",
  domain: "labour",
  name: t("กฎหมายคุ้มครองแรงงานและความปลอดภัยในการทำงาน", "Labour Protection & Occupational Safety"),
  authority: t("กรมสวัสดิการและคุ้มครองแรงงาน", "Department of Labour Protection and Welfare"),
  source: t("พ.ร.บ. คุ้มครองแรงงาน พ.ศ. 2541 · พ.ร.บ. ความปลอดภัยฯ พ.ศ. 2554", "Labour Protection Act B.E. 2541 · OSH Act B.E. 2554"),
  version: "2025.1",
  effectiveFrom: "2011-07-16",
  criteria: [
    { id: "c1", field: "employees", op: "gte", value: 1, label: t("มีลูกจ้างอย่างน้อย 1 คน", "Has at least one employee") },
  ],
  obligationCount: 27,
  obligations: [
    { id: "LAB-WORKRULES", title: t("ข้อบังคับเกี่ยวกับการทำงาน", "Work rules"), summary: t("นายจ้างที่มีลูกจ้าง 10 คนขึ้นไปต้องจัดทำและเผยแพร่ข้อบังคับการทำงาน", "Employers with 10+ employees must issue and display work rules"), frequency: "once", dueRule: t("ภายใน 15 วันนับแต่มีลูกจ้างครบ 10 คน", "Within 15 days of reaching 10 employees"), evidenceRequired: [t("ข้อบังคับการทำงานฉบับประกาศ", "Posted work rules")], ownerRole: t("ฝ่ายทรัพยากรบุคคล", "Human resources"), severity: "major" },
    { id: "OSH-COMMITTEE", title: t("คณะกรรมการความปลอดภัย (คปอ.)", "Safety committee"), summary: t("สถานประกอบกิจการที่มีลูกจ้าง 50 คนขึ้นไปต้องมี คปอ. และประชุมอย่างน้อยเดือนละครั้ง", "Workplaces with 50+ employees need a safety committee meeting monthly"), frequency: "monthly", dueRule: t("ประชุมทุกเดือน", "Monthly meeting"), evidenceRequired: [t("รายงานการประชุม คปอ.", "Safety committee minutes")], ownerRole: t("จป. วิชาชีพ", "Professional safety officer"), severity: "major" },
    { id: "OSH-ANNUAL-REPORT", title: t("รายงานผลการดำเนินงานด้านความปลอดภัยประจำปี", "Annual safety performance report"), summary: t("ยื่นรายงานตามแบบที่อธิบดีกำหนด", "File the annual report in the prescribed form"), frequency: "annual", dueRule: t("ภายใน 31 ม.ค. ของปีถัดไป", "By 31 January of the following year"), evidenceRequired: [t("แบบรายงานพร้อมหลักฐานการยื่น", "Filed report with submission receipt")], ownerRole: t("จป. วิชาชีพ", "Professional safety officer"), severity: "minor" },
  ],
  reports: [],
};

/* Corporate / registry */
export const CORPORATE: RulePack = {
  id: "TH-CORPORATE-DBD",
  app: "cop24",
  domain: "corporate",
  name: t("หน้าที่ตามกฎหมายบริษัทและกรมพัฒนาธุรกิจการค้า", "Company law & DBD filings"),
  authority: t("กรมพัฒนาธุรกิจการค้า (DBD)", "Department of Business Development"),
  source: t("ประมวลกฎหมายแพ่งฯ · พ.ร.บ. บริษัทมหาชนจำกัด พ.ศ. 2535", "Civil & Commercial Code · Public Limited Companies Act B.E. 2535"),
  version: "2025.1",
  effectiveFrom: "1992-04-07",
  criteria: [
    { id: "c1", field: "type", op: "neq", value: "plant", label: t("เป็นนิติบุคคลจดทะเบียน", "Is a registered juristic person") },
  ],
  obligationCount: 14,
  obligations: [
    { id: "CORP-AGM", title: t("ประชุมสามัญผู้ถือหุ้นประจำปี", "Annual general meeting"), summary: t("จัดประชุมภายใน 4 เดือนนับแต่วันสิ้นรอบปีบัญชี", "Hold the AGM within 4 months of fiscal year-end"), frequency: "annual", dueRule: t("ภายใน 4 เดือนหลังสิ้นปีบัญชี", "Within 4 months of year-end"), evidenceRequired: [t("รายงานการประชุมผู้ถือหุ้น", "AGM minutes")], ownerRole: t("เลขานุการบริษัท", "Company secretary"), severity: "material" },
    { id: "CORP-FS-FILING", title: t("ยื่นงบการเงินต่อ DBD", "File financial statements with DBD"), summary: t("ยื่นภายใน 1 เดือนนับแต่วันที่งบได้รับอนุมัติจากที่ประชุมผู้ถือหุ้น", "File within 1 month of shareholder approval"), frequency: "annual", dueRule: t("ภายใน 1 เดือนหลัง AGM", "Within 1 month after the AGM"), evidenceRequired: [t("หลักฐานการยื่น e-Filing", "e-Filing receipt")], ownerRole: t("ฝ่ายบัญชี", "Accounting"), severity: "major" },
    { id: "CORP-BOJ5", title: t("ยื่นสำเนาบัญชีรายชื่อผู้ถือหุ้น (บอจ.5)", "File shareholder list (BorOrJor.5)"), summary: t("ภายใน 14 วันนับแต่วันประชุมสามัญผู้ถือหุ้น", "Within 14 days of the AGM"), frequency: "annual", dueRule: t("ภายใน 14 วันหลัง AGM", "Within 14 days after the AGM"), evidenceRequired: [t("หลักฐานการยื่น บอจ.5", "Filing receipt")], ownerRole: t("เลขานุการบริษัท", "Company secretary"), severity: "minor" },
  ],
  reports: [],
};

/* Cybersecurity Act — critical information infrastructure (energy) */
export const CYBER_CII: RulePack = {
  id: "TH-CYBER-CII",
  app: "cop24",
  domain: "cyber",
  name: t("พ.ร.บ. การรักษาความมั่นคงปลอดภัยไซเบอร์ — หน่วยงาน CII", "Cybersecurity Act — critical information infrastructure"),
  authority: t("สำนักงาน สกมช. (NCSA)", "National Cyber Security Agency (NCSA)"),
  source: t("พ.ร.บ. ไซเบอร์ พ.ศ. 2562 · ประกาศ กมช. ว่าด้วยมาตรฐานขั้นต่ำ", "Cybersecurity Act B.E. 2562 · NCSC minimum-standard notifications"),
  version: "2025.1",
  effectiveFrom: "2019-05-28",
  criteria: [
    { id: "c1", field: "criticalInfrastructure", op: "truthy", label: t("เป็นหน่วยงานโครงสร้างพื้นฐานสำคัญทางสารสนเทศ (พลังงาน)", "Designated critical information infrastructure (energy)") },
  ],
  obligationCount: 12,
  obligations: [
    { id: "CII-RISK-ASSESS", title: t("ประเมินความเสี่ยงไซเบอร์ประจำปี", "Annual cyber risk assessment"), summary: t("ประเมินและส่งผลต่อหน่วยงานกำกับตามรอบ", "Assess and submit results to the regulator each cycle"), frequency: "annual", dueRule: t("ปีละครั้ง", "Annually"), evidenceRequired: [t("รายงานผลการประเมินความเสี่ยง", "Risk assessment report")], ownerRole: t("CISO", "CISO"), severity: "major" },
    { id: "CII-INCIDENT", title: t("แจ้งเหตุภัยคุกคามไซเบอร์", "Report cyber incidents"), summary: t("แจ้งเหตุต่อ สกมช. ตามระดับความรุนแรงและกรอบเวลาที่กำหนด", "Notify the NCSA by severity tier within the prescribed time"), frequency: "event", dueRule: t("ตามระดับความรุนแรง", "Per severity tier"), evidenceRequired: [t("ขั้นตอนรับมือเหตุการณ์", "Incident response procedure")], ownerRole: t("CISO", "CISO"), severity: "material" },
  ],
  reports: [],
};

export const GENERAL_PACKS = [PDPA, LABOUR, CORPORATE, CYBER_CII];
