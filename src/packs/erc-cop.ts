import { t } from "@/core/i18n-text";
import type { RulePack } from "@/core/types";

/**
 * ERC Code of Practice (CoP) for solar power plants — ground-mounted.
 * Energy Regulatory Commission (กกพ.) regulation B.E. 2565, amended B.E. 2567.
 * This is the pack behind the original COP24 prototype (Solar Farm Lopburi 1).
 */
export const ERC_COP_SOLAR_GROUND: RulePack = {
  id: "ERC-CoP-SOLAR-GROUND",
  app: "cop24",
  domain: "licensing",
  name: t("ประมวลหลักการปฏิบัติ (CoP) โรงไฟฟ้าโซลาร์บนพื้นดิน", "ERC Code of Practice — ground-mounted solar"),
  authority: t("สำนักงาน กกพ.", "Energy Regulatory Commission (ERC)"),
  source: t("ระเบียบ กกพ. พ.ศ. 2565 และที่แก้ไขเพิ่มเติม พ.ศ. 2567", "ERC Regulation B.E. 2565, as amended B.E. 2567"),
  version: "2024.1",
  effectiveFrom: "2024-03-01",
  criteria: [
    { id: "c1", field: "hasPowerPlant", op: "truthy", label: t("เป็นผู้ได้รับใบอนุญาตผลิตไฟฟ้า", "Holds an electricity generation licence") },
    { id: "c2", field: "plantTech", op: "eq", value: "solar-ground", label: t("เทคโนโลยี: โซลาร์ติดตั้งบนพื้นดิน", "Technology: ground-mounted solar") },
    { id: "c3", field: "plantMW", op: "gte", value: 1, label: t("กำลังผลิตติดตั้ง ≥ 1 MW", "Installed capacity ≥ 1 MW") },
  ],
  exclusions: [
    { id: "x1", field: "eiaRequired", op: "truthy", label: t("เข้าเงื่อนไขต้องจัดทำ IEE / EIA / EHIA", "Project requires IEE / EIA / EHIA") },
  ],
  assumptions: [
    t("พื้นที่โครงการไม่อยู่ในเขตคุ้มครองสิ่งแวดล้อมหรือพื้นที่ชุ่มน้ำที่ประกาศไว้ — ยังไม่ได้ยืนยันด้วยเอกสารราชการ", "Project site is not inside a declared environmental protection zone or wetland — not yet confirmed by an official document"),
  ],
  obligationCount: 61,
  obligations: [
    { id: "ERC-CoP-SOLAR-0101", title: t("ข้อมูลทั่วไปของโครงการ", "General project information"), summary: t("ระบุผู้ประกอบการ ที่ตั้ง ขอบเขตพื้นที่ กำลังผลิตติดตั้ง และเลขที่ใบอนุญาต", "State operator, location, site boundary, installed capacity and licence number"), frequency: "once", dueRule: t("ก่อนการรับฟังความคิดเห็น", "Before public hearing"), evidenceRequired: [t("ใบอนุญาตผลิตไฟฟ้า", "Generation licence"), t("แบบผังบริเวณโครงการ", "Site layout")], ownerRole: t("ฝ่ายกำกับดูแลกิจการ", "Regulatory affairs"), severity: "material", reportDest: t("บทที่ 1", "Chapter 1") },
    { id: "ERC-CoP-SOLAR-0205", title: t("รายละเอียดการออกแบบโรงไฟฟ้า", "Plant design details"), summary: t("แผง อินเวอร์เตอร์ หม้อแปลง และการเชื่อมโยงระบบไฟฟ้า", "Panels, inverters, transformers and grid connection"), frequency: "once", dueRule: t("ก่อนการรับฟังความคิดเห็น", "Before public hearing"), evidenceRequired: [t("แบบผังบริเวณ rev. ล่าสุด", "Latest site layout revision"), t("หนังสือแจ้งกำลังผลิตติดตั้ง", "Installed-capacity notice")], ownerRole: t("วิศวกรโครงการ", "Project engineer"), severity: "material", reportDest: t("บทที่ 2 ตาราง 2-1", "Chapter 2 Table 2-1") },
    { id: "ERC-CoP-SOLAR-0309", title: t("ตรวจวัดระดับเสียงพื้นฐาน", "Baseline noise measurement"), summary: t("ตรวจวัด 24 ชั่วโมงครอบคลุมกลางวันและกลางคืน ณ ขอบเขตโครงการ", "24-hour measurement covering day and night at the site boundary"), frequency: "annual", dueRule: t("ก่อนก่อสร้าง แล้วปีละครั้ง", "Pre-construction, then annually"), evidenceRequired: [t("ผลตรวจวัดระดับเสียง 24 ชม.", "24-hour noise results")], ownerRole: t("หน่วยสิ่งแวดล้อมประจำไซต์", "Site environmental unit"), severity: "major", reportDest: t("บทที่ 3 / บทที่ 5 ตาราง 5-3", "Chapter 3 / Chapter 5 Table 5-3") },
    { id: "ERC-CoP-SOLAR-0312", title: t("บรรยายสภาพแวดล้อมปัจจุบัน", "Describe current environmental conditions"), summary: t("สภาพแวดล้อมพื้นที่โครงการและข้างเคียง: อากาศ เสียง น้ำ และการใช้ที่ดิน", "Site and surroundings: air, noise, water and land use"), frequency: "once", dueRule: t("ก่อนการรับฟังความคิดเห็น", "Before public hearing"), evidenceRequired: [t("รายงานธรณีวิทยาและอุทกวิทยา", "Geology & hydrology study"), t("ผลตรวจวัดคุณภาพอากาศ", "Air quality results"), t("แผนที่การใช้ประโยชน์ที่ดิน", "Land-use map")], ownerRole: t("ที่ปรึกษาสิ่งแวดล้อม", "Environmental consultant"), severity: "material", reportDest: t("บทที่ 3", "Chapter 3") },
    { id: "ERC-CoP-SOLAR-0317", title: t("เฝ้าระวังคุณภาพน้ำใต้ดิน", "Groundwater quality monitoring"), summary: t("เก็บตัวอย่างบ่อสังเกตการณ์ทุก 6 เดือน วิเคราะห์โดยห้องปฏิบัติการที่ขึ้นทะเบียน", "Sample observation wells every 6 months; analysed by a registered laboratory"), frequency: "semiannual", dueRule: t("ทุก 6 เดือน", "Every 6 months"), evidenceRequired: [t("รายงานผลห้องปฏิบัติการฉบับเต็ม", "Full laboratory report"), t("หนังสือรับรองห้องปฏิบัติการที่ยังไม่หมดอายุ", "Valid laboratory accreditation")], ownerRole: t("หน่วยสิ่งแวดล้อมประจำไซต์", "Site environmental unit"), severity: "material", reportDest: t("บทที่ 5 ตาราง 5-2", "Chapter 5 Table 5-2") },
    { id: "ERC-CoP-SOLAR-0321", title: t("ห้องปฏิบัติการวิเคราะห์ต้องขึ้นทะเบียน", "Analyses must come from a registered laboratory"), summary: t("ผลวิเคราะห์ทุกฉบับต้องมีหนังสือรับรองห้องปฏิบัติการที่ยังมีผล", "Every analytical result needs a valid laboratory accreditation"), frequency: "continuous", dueRule: t("ทุกครั้งที่อ้างผลวิเคราะห์", "Whenever a result is cited"), evidenceRequired: [t("หนังสือรับรองห้องปฏิบัติการ", "Laboratory accreditation certificate")], ownerRole: t("หน่วยสิ่งแวดล้อมประจำไซต์", "Site environmental unit"), severity: "major", reportDest: t("เอกสารแนบ", "Annex") },
    { id: "ERC-CoP-SOLAR-0404", title: t("จัดการน้ำล้างแผงเซลล์", "Manage panel-washing water"), summary: t("บันทึกปริมาณน้ำ สารที่ใช้ และปลายทางการระบาย", "Record water volume, agents used and discharge destination"), frequency: "event", dueRule: t("ทุกครั้งที่ล้าง", "Every wash"), evidenceRequired: [t("บันทึกการล้างแผง", "Panel-washing log")], ownerRole: t("ฝ่ายปฏิบัติการโรงไฟฟ้า", "Plant operations"), severity: "major", reportDest: t("บทที่ 4 หัวข้อ 4.3", "Chapter 4 §4.3") },
    { id: "ERC-CoP-SOLAR-0406", title: t("จัดการแผงเสื่อมสภาพและของเสียอันตราย", "Manage end-of-life panels & hazardous waste"), summary: t("ส่งกำจัดโดยผู้รับกำจัดที่ได้รับอนุญาต พร้อมใบกำกับการขนส่ง", "Dispose via a licensed contractor with waste manifests"), frequency: "event", dueRule: t("ทุกครั้งที่ส่งกำจัด", "Every disposal"), evidenceRequired: [t("ใบกำกับการขนส่งของเสีย", "Waste manifest"), t("ใบรับจากผู้รับกำจัด", "Contractor receipt")], ownerRole: t("ฝ่ายจัดซื้อและคลัง", "Procurement & stores"), severity: "major", reportDest: t("บทที่ 4 หัวข้อ 4.6", "Chapter 4 §4.6") },
    { id: "ERC-CoP-SOLAR-0601", title: t("รับฟังความคิดเห็นของผู้มีส่วนได้เสีย", "Stakeholder public hearing"), summary: t("จัดเวทีรับฟังความคิดเห็นและบันทึกผลก่อนแปลงรายงานขั้นต้นเป็นขั้นสุดท้าย", "Hold the hearing and record outcomes before converting the preliminary report to final"), frequency: "once", dueRule: t("ก่อนยื่นรายงานขั้นสุดท้าย", "Before the final report"), evidenceRequired: [t("บันทึกการรับฟังความคิดเห็น", "Hearing minutes")], ownerRole: t("ฝ่ายชุมชนสัมพันธ์", "Community relations"), severity: "material", reportDest: t("บทที่ 6", "Chapter 6") },
    { id: "ERC-CoP-SOLAR-0702", title: t("รายงานผลการปฏิบัติตาม CoP รอบปี", "Annual CoP compliance report"), summary: t("ยื่นภายในเดือนมกราคมของปีถัดไป พร้อมผลตรวจวัดเทียบย้อนหลัง 3 ปี", "File within January of the following year, with 3-year comparative monitoring data"), frequency: "annual", dueRule: t("ภายใน 31 ม.ค. ของปีถัดไป", "By 31 January of the following year"), evidenceRequired: [t("ทะเบียนมาตรการต่อหลักฐานครบทุกรายการ", "Complete measure-to-evidence register")], ownerRole: t("ฝ่ายกำกับดูแลกิจการ", "Regulatory affairs"), severity: "material", reportDest: t("รายงานผลการปฏิบัติตาม", "Compliance report") },
  ],
  reports: [
    {
      id: "cop-preliminary",
      name: t("รายงาน CoP ขั้นต้น", "Preliminary CoP report"),
      purpose: t("ใช้ประกอบการรับฟังความคิดเห็นของผู้มีส่วนได้เสีย", "Used for the stakeholder public hearing"),
      chapters: [
        { id: "profile", num: "1", title: t("ข้อมูลทั่วไปของโครงการ", "General project information"), obligationIds: ["ERC-CoP-SOLAR-0101"], locked: true },
        { id: "design", num: "2", title: t("รายละเอียดการออกแบบโรงไฟฟ้า", "Plant design details"), obligationIds: ["ERC-CoP-SOLAR-0205"], locked: true },
        { id: "env", num: "3", title: t("สภาพแวดล้อมปัจจุบันของพื้นที่โครงการ", "Current environmental conditions"), obligationIds: ["ERC-CoP-SOLAR-0312", "ERC-CoP-SOLAR-0309"], locked: true },
        { id: "measure", num: "4", title: t("มาตรการป้องกันและแก้ไขผลกระทบสิ่งแวดล้อม", "Mitigation measures"), obligationIds: ["ERC-CoP-SOLAR-0404", "ERC-CoP-SOLAR-0406"], locked: true },
        { id: "monitor", num: "5", title: t("มาตรการติดตามตรวจสอบผลกระทบสิ่งแวดล้อม", "Monitoring measures"), obligationIds: ["ERC-CoP-SOLAR-0317", "ERC-CoP-SOLAR-0309"], locked: true },
        { id: "annex", num: "6", title: t("เอกสารแนบและหลักฐานประกอบ", "Annexes and supporting evidence"), obligationIds: ["ERC-CoP-SOLAR-0321"], locked: true },
      ],
    },
    {
      id: "cop-final",
      name: t("รายงาน CoP ขั้นสุดท้าย", "Final CoP report"),
      purpose: t("นำผลการรับฟังความคิดเห็นเข้ามาและสรุปสิ่งที่เปลี่ยน", "Incorporates hearing outcomes and summarises what changed"),
      chapters: [],
    },
    {
      id: "cop-annual",
      name: t("รายงานผลการปฏิบัติตาม CoP รอบปี", "Annual CoP compliance report"),
      purpose: t("ยกยอดข้อมูลเดิมและเติมหลักฐานรอบใหม่", "Carries forward approved data and adds the new period's evidence"),
      chapters: [],
    },
  ],
};
