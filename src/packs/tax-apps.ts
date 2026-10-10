import { t } from "@/core/i18n-text";
import type { RulePack } from "@/core/types";

/* ACC24 — periodic accounting & tax compliance (Revenue Code) */
export const ACC24_TAX: RulePack = {
  id: "TH-REVENUE-PERIODIC",
  app: "acc24",
  domain: "tax",
  name: t("ภาษีตามรอบ — ประมวลรัษฎากร", "Periodic tax filings — Revenue Code"),
  authority: t("กรมสรรพากร", "Revenue Department"),
  source: t("ประมวลรัษฎากร มาตรา 68, 69, 83", "Revenue Code s.68, 69, 83"),
  version: "2025.4",
  effectiveFrom: "2024-01-01",
  criteria: [
    { id: "c1", field: "type", op: "neq", value: "plant", label: t("เป็นนิติบุคคลที่มีหน้าที่เสียภาษี", "Taxable juristic person") },
  ],
  obligationCount: 18,
  obligations: [
    { id: "TAX-PND50", title: t("ยื่น ภ.ง.ด.50 ประจำปี", "Annual corporate income tax return (PND.50)"), summary: t("ยื่นภายใน 150 วันนับแต่วันสิ้นรอบระยะเวลาบัญชี", "File within 150 days of fiscal year-end"), frequency: "annual", dueRule: t("ภายใน 150 วันหลังสิ้นปีบัญชี", "Within 150 days of year-end"), evidenceRequired: [t("แบบ ภ.ง.ด.50 พร้อมใบเสร็จ", "PND.50 with receipt")], ownerRole: t("ฝ่ายภาษี", "Tax"), severity: "material", citations: [{ sourceId: "revenue-code", clause: "มาตรา 68" }] },
    { id: "TAX-PND51", title: t("ยื่น ภ.ง.ด.51 ครึ่งปี", "Half-year corporate tax return (PND.51)"), summary: t("ยื่นภายใน 2 เดือนนับแต่วันสุดท้ายของครึ่งรอบปีบัญชี", "File within 2 months of the end of the first half"), frequency: "annual", dueRule: t("ภายใน 2 เดือนหลังครึ่งปี", "Within 2 months of half-year"), evidenceRequired: [t("แบบ ภ.ง.ด.51", "PND.51")], ownerRole: t("ฝ่ายภาษี", "Tax"), severity: "major", citations: [{ sourceId: "revenue-code", clause: "มาตรา 67 ทวิ" }] },
    { id: "TAX-PP30", title: t("ยื่น ภ.พ.30 รายเดือน", "Monthly VAT return (PP.30)"), summary: t("ยื่นภายในวันที่ 15 ของเดือนถัดไป (e-Filing +8 วัน)", "File by the 15th of the following month (e-Filing +8 days)"), frequency: "monthly", dueRule: t("ภายในวันที่ 15 ของเดือนถัดไป", "By the 15th of the next month"), evidenceRequired: [t("แบบ ภ.พ.30 พร้อมใบเสร็จ", "PP.30 with receipt")], ownerRole: t("ฝ่ายบัญชี", "Accounting"), severity: "major", citations: [{ sourceId: "revenue-code", clause: "มาตรา 83" }] },
  ],
  reports: [],
};

/* TP24 — transfer pricing */
export const TP24: RulePack = {
  id: "TH-TRANSFER-PRICING",
  app: "tp24",
  domain: "tax",
  name: t("ราคาโอน — มาตรา 71 ทวิ / 71 ตรี", "Transfer pricing — s.71 bis / 71 ter"),
  authority: t("กรมสรรพากร", "Revenue Department"),
  source: t("ประมวลรัษฎากร มาตรา 71 ทวิ, 71 ตรี · กฎกระทรวง ฉบับที่ 370", "Revenue Code s.71 bis, 71 ter · Ministerial Regulation No. 370"),
  version: "2025.2",
  effectiveFrom: "2019-01-01",
  criteria: [
    { id: "c1", field: "revenueTHB", op: "gte", value: 200_000_000, label: t("รายได้รวม ≥ 200 ล้านบาท", "Total revenue ≥ THB 200 million") },
    { id: "c2", field: "intercompanyTransactions", op: "truthy", label: t("มีธุรกรรมกับบริษัทหรือห้างหุ้นส่วนที่เกี่ยวข้องกัน", "Has related-party transactions") },
  ],
  obligationCount: 11,
  obligations: [
    { id: "TP-DISCLOSURE", title: t("ยื่นแบบรายงานข้อมูลธุรกรรมระหว่างกัน (Disclosure Form)", "Transfer pricing disclosure form"), summary: t("ยื่นพร้อม ภ.ง.ด.50 ภายใน 150 วันหลังสิ้นปีบัญชี", "File with PND.50 within 150 days of year-end"), frequency: "annual", dueRule: t("ภายใน 150 วันหลังสิ้นปีบัญชี", "Within 150 days of year-end"), evidenceRequired: [t("Disclosure Form ที่ยื่นแล้ว", "Filed disclosure form")], ownerRole: t("ฝ่ายภาษี", "Tax"), severity: "material", citations: [{ sourceId: "revenue-code", clause: "มาตรา 71 ตรี" }] },
    { id: "TP-LOCAL-FILE", title: t("เอกสารราคาโอน (Local File)", "Local file"), summary: t("จัดเตรียมพร้อมส่งภายใน 60 วันเมื่อเจ้าพนักงานร้องขอ (180 วันปีแรก)", "Ready to deliver within 60 days of request (180 days in year one)"), frequency: "annual", dueRule: t("พร้อมใช้ ณ วันยื่น ภ.ง.ด.50", "Ready by the PND.50 filing date"), evidenceRequired: [t("Local File ฉบับสมบูรณ์พร้อมการวิเคราะห์เทียบเคียง", "Complete local file with benchmarking")], ownerRole: t("ฝ่ายภาษี / ที่ปรึกษา TP", "Tax / TP advisor"), severity: "material", citations: [{ sourceId: "revenue-code", clause: "มาตรา 71 ตรี" }, { sourceId: "mr-370-transfer-pricing" }] },
  ],
  reports: [
    { id: "tp-local-file", name: t("Local File ราคาโอน", "Transfer pricing local file"), purpose: t("เอกสารรองรับราคาโอนตามแนวทาง OECD และกรมสรรพากร", "OECD / Revenue Department aligned documentation"), chapters: [] },
  ],
};

/* GMT24 — Pillar Two */
export const GMT24: RulePack = {
  id: "TH-PILLAR-TWO",
  app: "gmt24",
  domain: "tax",
  name: t("ภาษีส่วนเพิ่ม (Pillar Two / GloBE)", "Top-up tax (Pillar Two / GloBE)"),
  authority: t("กรมสรรพากร", "Revenue Department"),
  source: t("พ.ร.ก. ภาษีส่วนเพิ่ม พ.ศ. 2567 (มีผล 1 ม.ค. 2568)", "Emergency Decree on Top-up Tax B.E. 2567 (effective 1 Jan 2025)"),
  version: "2025.1",
  effectiveFrom: "2025-01-01",
  criteria: [
    { id: "c1", field: "groupRevenueEUR", op: "gte", value: 750_000_000, label: t("รายได้รวมของกลุ่ม ≥ 750 ล้านยูโร ใน 2 จาก 4 ปีล่าสุด", "Consolidated group revenue ≥ EUR 750m in 2 of the last 4 years") },
  ],
  obligationCount: 9,
  obligations: [
    { id: "GMT-GIR", title: t("ยื่น GloBE Information Return", "File the GloBE Information Return"), summary: t("ภายใน 15 เดือนหลังสิ้นปีบัญชี (18 เดือนปีแรก)", "Within 15 months of year-end (18 months in the transition year)"), frequency: "annual", dueRule: t("ภายใน 15 เดือนหลังสิ้นปีบัญชี", "Within 15 months of year-end"), evidenceRequired: [t("GIR ที่ยื่นแล้ว", "Filed GIR")], ownerRole: t("ฝ่ายภาษีกลุ่ม", "Group tax"), severity: "material", citations: [{ sourceId: "top-up-tax-decree-2567" }] },
  ],
  reports: [],
};

/* TRADE24 — customs / FTA origin */
export const TRADE24: RulePack = {
  id: "TH-CUSTOMS-FTA",
  app: "trade24",
  domain: "trade",
  name: t("ศุลกากร ถิ่นกำเนิดสินค้า และสิทธิประโยชน์ FTA", "Customs, rules of origin and FTA preferences"),
  authority: t("กรมศุลกากร / กรมการค้าต่างประเทศ", "Thai Customs / Department of Foreign Trade"),
  source: t("พ.ร.บ. ศุลกากร พ.ศ. 2560 · ความตกลง FTA ที่เกี่ยวข้อง", "Customs Act B.E. 2560 · applicable FTAs"),
  version: "2025.1",
  effectiveFrom: "2017-11-13",
  criteria: [
    { id: "c1", field: "exportsGoods", op: "truthy", label: t("มีการนำเข้าหรือส่งออกสินค้า", "Imports or exports goods") },
  ],
  obligationCount: 16,
  obligations: [
    { id: "TRADE-COO", title: t("หนังสือรับรองถิ่นกำเนิดสินค้า", "Certificate of origin"), summary: t("จัดทำและเก็บหลักฐานถิ่นกำเนิดสำหรับการใช้สิทธิ FTA", "Prepare and retain origin evidence for FTA claims"), frequency: "event", dueRule: t("ทุกครั้งที่ใช้สิทธิ", "Every preference claim"), evidenceRequired: [t("Form D/E/AK และต้นทุนถิ่นกำเนิด", "Form D/E/AK and origin costing")], ownerRole: t("ฝ่ายโลจิสติกส์", "Logistics"), severity: "major", citations: [{ sourceId: "customs-act-2560" }] },
  ],
  reports: [],
};

export const TAX_APP_PACKS = [ACC24_TAX, TP24, GMT24, TRADE24];
