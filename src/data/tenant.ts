import { t } from "@/core/i18n-text";
import type { AgentDef, AuditEvent, CalendarEvent, Control, ControlTest, EntityProfile, EvidenceItem, Gap, MissionTemplate, RegChange, ReportDraft } from "@/core/types";

/**
 * Demo tenant: Lopburi Green Power group (all data is illustrative).
 * The same tenant the original COP24 prototype used — now modelled as a group
 * with a listed parent, so one Compliance Universe spans licensing, ESG,
 * privacy, labour, corporate, tax and cyber obligations.
 */

export const ENTITIES: EntityProfile[] = [
  {
    id: "lgp-pcl",
    name: t("บมจ. ลพบุรี กรีน พาวเวอร์", "Lopburi Green Power PCL"),
    type: "company",
    country: "TH",
    sector: t("ผลิตไฟฟ้าพลังงานหมุนเวียน", "Renewable power generation"),
    listed: true,
    employees: 386,
    revenueTHB: 3_240_000_000,
    groupRevenueEUR: 82_000_000,
    processesPersonalData: true,
    hasPowerPlant: false,
    intercompanyTransactions: true,
    relatedPartyTHB: 410_000_000,
    exportsGoods: false,
    criticalInfrastructure: true,
    fiscalYearEnd: "12-31",
  },
  {
    id: "lopburi-1",
    name: t("โซลาร์ฟาร์ม ลพบุรี 1", "Solar Farm Lopburi 1"),
    type: "plant",
    parentId: "lgp-pcl",
    country: "TH",
    sector: t("โรงไฟฟ้าโซลาร์บนพื้นดิน 48 MW · ท่าวุ้ง ลพบุรี", "48 MW ground-mounted solar · Tha Wung, Lopburi"),
    listed: false,
    employees: 24,
    revenueTHB: 0,
    groupRevenueEUR: 82_000_000,
    processesPersonalData: false,
    hasPowerPlant: true,
    plantTech: "solar-ground",
    plantMW: 48,
    plantPhase: "pre-construction",
    publicHearingDone: false,
    eiaRequired: false,
    intercompanyTransactions: false,
    relatedPartyTHB: 0,
    exportsGoods: false,
    criticalInfrastructure: false,
    fiscalYearEnd: "12-31",
  },
  {
    id: "lopburi-2",
    name: t("โซลาร์ฟาร์ม ลพบุรี 2", "Solar Farm Lopburi 2"),
    type: "plant",
    parentId: "lgp-pcl",
    country: "TH",
    sector: t("โรงไฟฟ้าโซลาร์บนพื้นดิน 36 MW · โคกสำโรง ลพบุรี", "36 MW ground-mounted solar · Khok Samrong, Lopburi"),
    listed: false,
    employees: 18,
    revenueTHB: 0,
    groupRevenueEUR: 82_000_000,
    processesPersonalData: false,
    hasPowerPlant: true,
    plantTech: "solar-ground",
    plantMW: 36,
    plantPhase: "pre-construction",
    publicHearingDone: false,
    eiaRequired: false,
    intercompanyTransactions: false,
    relatedPartyTHB: 0,
    exportsGoods: false,
    criticalInfrastructure: false,
    fiscalYearEnd: "12-31",
  },
];

export const USER = {
  initials: "ณ",
  name: t("ณัฐวุฒิ ส.", "Nattawut S."),
  org: t("บจก. ลพบุรี กรีน พาวเวอร์", "Lopburi Green Power"),
};

/* ───────────── Evidence (Document Control Center) ───────────── */

export const EVIDENCE: EvidenceItem[] = [
  { id: "E-01", entityId: "lopburi-1", name: t("ใบอนุญาตผลิตไฟฟ้า", "Electricity generation licence"), meta: t("กกพ.-ผฟ-2567-0412 · PDF 12 หน้า", "ERC-GL-2567-0412 · PDF, 12 pages"), purpose: t("ระบุเงื่อนไขแนบท้ายใบอนุญาตที่กลายเป็นข้อผูกพันในรายงาน", "Licence conditions that become obligations in the report"), obligationIds: ["ERC-CoP-SOLAR-0101"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("SharePoint /Permits", "SharePoint /Permits") },
  { id: "E-02", entityId: "lopburi-1", name: t("แบบผังบริเวณโครงการและแผนที่ที่ตั้ง", "Site layout and location map"), meta: t("rev.C · DWG + PDF · ขัดแย้งกับ rev.B", "rev.C · DWG + PDF · conflicts with rev.B"), purpose: t("ยืนยันขอบเขตพื้นที่โครงการ ระยะห่างชุมชน และการวางแผงเซลล์", "Confirms site boundary, distance to community and panel layout"), obligationIds: ["ERC-CoP-SOLAR-0101", "ERC-CoP-SOLAR-0205"], layers: [1, 0, -1], status: "warn", statusLabel: t("ต้องตรวจ", "Needs review"), source: t("Google Drive /Engineering", "Google Drive /Engineering") },
  { id: "E-03", entityId: "lopburi-1", name: t("รายงานผลวิเคราะห์คุณภาพน้ำใต้ดิน", "Groundwater quality laboratory report"), meta: t("ไม่พบในระบบ · ขอไปที่ไซต์แล้ว", "Not in the system · requested from site"), purpose: t("รองรับมาตรการเฝ้าระวังคุณภาพน้ำตามข้อ ERC-CoP-SOLAR-0317", "Supports groundwater monitoring under ERC-CoP-SOLAR-0317"), obligationIds: ["ERC-CoP-SOLAR-0317"], layers: [-1, -1, -1], status: "bad", statusLabel: t("ขาด", "Missing"), source: t("—", "—"), requestedOn: "2026-10-08" },
  { id: "E-04", entityId: "lopburi-1", name: t("ผลตรวจวัดระดับเสียงโดยรอบ", "Ambient noise measurement"), meta: t("PDF 8 หน้า · เก็บตัวอย่าง มิ.ย. 2569 · ไม่ครอบคลุมกลางคืน", "PDF, 8 pages · sampled Jun 2026 · no night-time coverage"), purpose: t("แสดงระดับเสียงพื้นฐานก่อนเริ่มก่อสร้าง", "Baseline noise before construction"), obligationIds: ["ERC-CoP-SOLAR-0309"], layers: [1, 1, 0], status: "warn", statusLabel: t("ต้องตรวจ", "Needs review"), source: t("Upload · lab-noise-0626.pdf", "Upload · lab-noise-0626.pdf") },
  { id: "E-05", entityId: "lopburi-1", name: t("หนังสือรับรองห้องปฏิบัติการ", "Laboratory accreditation certificate"), meta: t("หมดอายุ 31 ส.ค. 2569 · เกินกำหนด", "Expired 31 Aug 2026 · overdue"), purpose: t("ทำให้ผลวิเคราะห์ที่แนบมาใช้อ้างอิงได้ตามระเบียบ", "Makes attached analyses citable under the regulation"), obligationIds: ["ERC-CoP-SOLAR-0321"], layers: [1, -1, -1], status: "bad", statusLabel: t("ไม่ถูกต้อง", "Invalid"), source: t("Upload · lab-cert-2568.pdf", "Upload · lab-cert-2568.pdf") },
  { id: "E-06", entityId: "lopburi-1", name: t("บันทึกการรับฟังความคิดเห็นของผู้มีส่วนได้เสีย", "Stakeholder hearing minutes"), meta: t("ยังไม่ได้จัดเวที · ตามแผน พ.ย. 2569", "Hearing not yet held · planned Nov 2026"), purpose: t("จำเป็นเมื่อแปลงรายงานขั้นต้นเป็นรายงานขั้นสุดท้าย", "Needed when converting the preliminary report to final"), obligationIds: ["ERC-CoP-SOLAR-0601"], layers: [-1, 0, 0], status: "cond", statusLabel: t("มีเงื่อนไข", "Conditional"), source: t("—", "—") },
  { id: "E-07", entityId: "lopburi-1", name: t("รายงานการศึกษาธรณีวิทยาและอุทกวิทยา", "Geology and hydrology study"), meta: t("PDF 64 หน้า · ลงนามโดยผู้ชำนาญการ", "PDF, 64 pages · signed by a specialist"), purpose: t("ใช้บรรยายสภาพแวดล้อมปัจจุบันในบทที่ 3", "Describes current conditions in Chapter 3"), obligationIds: ["ERC-CoP-SOLAR-0312"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("SharePoint /Studies", "SharePoint /Studies") },
  { id: "E-08", entityId: "lopburi-1", name: t("ภาพถ่ายสภาพพื้นที่ปัจจุบัน", "Current site photographs"), meta: t("41 ภาพ · มีพิกัด GPS 38 ภาพ", "41 photos · 38 geotagged"), purpose: t("ประกอบการบรรยายพื้นที่และใช้เป็นหลักฐานภาคสนาม", "Supports the site description as field evidence"), obligationIds: ["ERC-CoP-SOLAR-0312"], layers: [1, 0, 1], status: "warn", statusLabel: t("ต้องตรวจ", "Needs review"), source: t("Google Drive /Site photos", "Google Drive /Site photos") },
  { id: "E-09", entityId: "lopburi-1", name: t("ผลตรวจวัดคุณภาพอากาศ มิ.ย. 2569", "Air quality results, Jun 2026"), meta: t("PDF 6 หน้า · 3 จุดตรวจวัด", "PDF, 6 pages · 3 stations"), purpose: t("ค่าฝุ่นละอองเทียบมาตรฐานในบทที่ 3", "Particulate levels vs standards in Chapter 3"), obligationIds: ["ERC-CoP-SOLAR-0312"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("Upload · lab-air-0626.pdf", "Upload · lab-air-0626.pdf") },
  { id: "E-10", entityId: "lopburi-1", name: t("บันทึกการล้างแผงเซลล์", "Panel-washing log"), meta: t("ยังไม่เริ่มดำเนินการ · โรงไฟฟ้ายังไม่ก่อสร้าง", "Not started · plant not yet built"), purpose: t("หลักฐานมาตรการจัดการน้ำล้างแผง", "Evidence for the panel-washing measure"), obligationIds: ["ERC-CoP-SOLAR-0404"], layers: [-1, 0, 0], status: "cond", statusLabel: t("มีเงื่อนไข", "Conditional"), source: t("—", "—") },
  // Group-level evidence
  { id: "E-20", entityId: "lgp-pcl", name: t("รายงานการทวนสอบ GHG ปี 2568", "GHG verification statement FY2025"), meta: t("ผู้ทวนสอบขึ้นทะเบียน อบก. · PDF 22 หน้า", "TGO-registered verifier · PDF, 22 pages"), purpose: t("รองรับการเปิดเผย Scope 1–2 ใน 56-1", "Supports Scope 1–2 disclosure in 56-1"), obligationIds: ["SET-OR-3.3-GHG", "TGO-CFO-01"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("ESG24 · evidence vault", "ESG24 · evidence vault") },
  { id: "E-21", entityId: "lgp-pcl", name: t("ผลการประเมินประเด็นสาระสำคัญ 2569", "Materiality assessment 2026"), meta: t("ร่าง · ยังไม่ผ่านคณะกรรมการ", "Draft · not yet board-approved"), purpose: t("หัวข้อ 3.2 ของ 56-1", "56-1 §3.2"), obligationIds: ["SET-OR-3.2"], layers: [1, 0, 0], status: "warn", statusLabel: t("ต้องตรวจ", "Needs review"), source: t("ESG24 · materiality workspace", "ESG24 · materiality workspace") },
  { id: "E-22", entityId: "lgp-pcl", name: t("มติคณะกรรมการอนุมัตินโยบายความยั่งยืน", "Board resolution — sustainability policy"), meta: t("ครั้งที่ 4/2569 · ลงนามแล้ว", "Meeting 4/2026 · signed"), purpose: t("หัวข้อ 3.1 ของ 56-1", "56-1 §3.1"), obligationIds: ["SET-OR-3.1"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("Board portal", "Board portal") },
  { id: "E-23", entityId: "lgp-pcl", name: t("ทะเบียน ROPA", "ROPA register"), meta: t("ปรับปรุงล่าสุด มี.ค. 2568 · เกิน 12 เดือน", "Last updated Mar 2025 · older than 12 months"), purpose: t("บันทึกรายการประมวลผลตาม PDPA", "PDPA record of processing"), obligationIds: ["PDPA-ROPA"], layers: [1, -1, 0], status: "bad", statusLabel: t("ไม่ถูกต้อง", "Invalid"), source: t("Legal share /PDPA", "Legal share /PDPA") },
  { id: "E-24", entityId: "lgp-pcl", name: t("หนังสือแต่งตั้ง DPO", "DPO appointment letter"), meta: t("ลงนาม ก.พ. 2566", "Signed Feb 2023"), purpose: t("หลักฐานการแต่งตั้ง DPO", "Evidence of DPO appointment"), obligationIds: ["PDPA-DPO"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("Legal share /PDPA", "Legal share /PDPA") },
  { id: "E-25", entityId: "lgp-pcl", name: t("ขั้นตอนรับมือเหตุละเมิดและบันทึกการซ้อม", "Breach response procedure & drill record"), meta: t("ซ้อมล่าสุด ส.ค. 2569", "Last drill Aug 2026"), purpose: t("พิสูจน์ความพร้อมแจ้งเหตุใน 72 ชม.", "Proves 72-hour notification readiness"), obligationIds: ["PDPA-BREACH-72H"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("IT GRC", "IT GRC") },
  { id: "E-26", entityId: "lgp-pcl", name: t("รายงานการประชุม คปอ. ก.ย. 2569", "Safety committee minutes, Sep 2026"), meta: t("ลงนามครบ", "Fully signed"), purpose: t("การประชุมรายเดือนของ คปอ.", "Monthly safety committee meeting"), obligationIds: ["OSH-COMMITTEE"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("HR share", "HR share") },
  { id: "E-27", entityId: "lgp-pcl", name: t("Disclosure Form ราคาโอน ปี 2568", "TP disclosure form FY2025"), meta: t("ยื่นแล้ว 28 พ.ค. 2569", "Filed 28 May 2026"), purpose: t("หลักฐานการยื่นตามมาตรา 71 ตรี", "Filing evidence under s.71 ter"), obligationIds: ["TP-DISCLOSURE"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("TP24 · filings", "TP24 · filings") },
  { id: "E-28", entityId: "lgp-pcl", name: t("Local File ปี 2568", "Local file FY2025"), meta: t("ร่างฉบับที่ปรึกษา · ยังไม่มีการวิเคราะห์เทียบเคียง", "Advisor draft · benchmarking missing"), purpose: t("เอกสารราคาโอนพร้อมส่งเมื่อถูกร้องขอ", "TP documentation ready on request"), obligationIds: ["TP-LOCAL-FILE"], layers: [1, 0, -1], status: "warn", statusLabel: t("ต้องตรวจ", "Needs review"), source: t("TP24 · workspace", "TP24 · workspace") },
  { id: "E-29", entityId: "lgp-pcl", name: t("รายงานผลการประเมินความเสี่ยงไซเบอร์ 2569", "Cyber risk assessment 2026"), meta: t("ส่ง สกมช. แล้ว", "Submitted to NCSA"), purpose: t("หน้าที่ CII ประจำปี", "Annual CII duty"), obligationIds: ["CII-RISK-ASSESS"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("IT GRC", "IT GRC") },
  { id: "E-30", entityId: "lgp-pcl", name: t("รายงานการประชุมสามัญผู้ถือหุ้น 2569", "AGM minutes 2026"), meta: t("ประชุม 24 เม.ย. 2569", "Held 24 Apr 2026"), purpose: t("หลักฐานการจัดประชุมภายใน 4 เดือน", "Evidence the AGM was held within 4 months"), obligationIds: ["CORP-AGM"], layers: [1, 1, 1], status: "ok", statusLabel: t("ยอมรับแล้ว", "Accepted"), source: t("Company secretary", "Company secretary") },
];

/* ───────────── Controls & tests ───────────── */

export const CONTROLS: Control[] = [
  { id: "C-01", name: t("ตรวจสอบวันหมดอายุหนังสือรับรองห้องปฏิบัติการก่อนรับผล", "Check lab accreditation expiry before accepting results"), obligationIds: ["ERC-CoP-SOLAR-0321"], owner: t("หน่วยสิ่งแวดล้อมประจำไซต์", "Site environmental unit"), frequency: "event", type: "preventive", automated: true },
  { id: "C-02", name: t("ปฏิทินเก็บตัวอย่างน้ำใต้ดินทุก 6 เดือน", "Six-monthly groundwater sampling calendar"), obligationIds: ["ERC-CoP-SOLAR-0317"], owner: t("หน่วยสิ่งแวดล้อมประจำไซต์", "Site environmental unit"), frequency: "semiannual", type: "detective", automated: true },
  { id: "C-03", name: t("ทบทวนเงื่อนไขแนบท้ายใบอนุญาตประจำปี", "Annual review of licence conditions"), obligationIds: ["ERC-CoP-SOLAR-0101"], owner: t("ฝ่ายกำกับดูแลกิจการ", "Regulatory affairs"), frequency: "annual", type: "detective", automated: false },
  { id: "C-04", name: t("กระทบยอดกำลังผลิตติดตั้งระหว่างใบอนุญาต แบบผัง และรายงาน", "Reconcile installed capacity across licence, layout and report"), obligationIds: ["ERC-CoP-SOLAR-0205"], owner: t("วิศวกรโครงการ", "Project engineer"), frequency: "event", type: "detective", automated: true },
  { id: "C-05", name: t("ทบทวน ROPA รายปีและเมื่อมีระบบใหม่", "ROPA review annually and on new systems"), obligationIds: ["PDPA-ROPA"], owner: t("DPO", "DPO"), frequency: "annual", type: "preventive", automated: false },
  { id: "C-06", name: t("ซ้อมแผนรับมือเหตุละเมิดข้อมูลปีละครั้ง", "Annual breach-response drill"), obligationIds: ["PDPA-BREACH-72H"], owner: t("DPO / ฝ่ายไอที", "DPO / IT"), frequency: "annual", type: "corrective", automated: false },
  { id: "C-07", name: t("กระทบยอดข้อมูลกิจกรรม GHG กับระบบบัญชี", "Reconcile GHG activity data with the ledger"), obligationIds: ["SET-OR-3.3-GHG", "TGO-CFO-01"], owner: t("ฝ่ายความยั่งยืน", "Sustainability team"), frequency: "quarterly", type: "detective", automated: true },
  { id: "C-08", name: t("ปฏิทินยื่นภาษีอัตโนมัติ (ภ.พ.30 / ภ.ง.ด.50/51)", "Automated tax filing calendar (PP.30 / PND.50/51)"), obligationIds: ["TAX-PP30", "TAX-PND50", "TAX-PND51"], owner: t("ฝ่ายภาษี", "Tax"), frequency: "monthly", type: "preventive", automated: true },
  { id: "C-09", name: t("ตรวจสอบธุรกรรมระหว่างกันเทียบนโยบายราคาโอนรายไตรมาส", "Quarterly intercompany review vs TP policy"), obligationIds: ["TP-LOCAL-FILE", "TP-DISCLOSURE"], owner: t("ฝ่ายภาษี", "Tax"), frequency: "quarterly", type: "detective", automated: false },
  { id: "C-10", name: t("ประชุม คปอ. รายเดือนและติดตามมติ", "Monthly safety committee and action tracking"), obligationIds: ["OSH-COMMITTEE"], owner: t("จป. วิชาชีพ", "Safety officer"), frequency: "monthly", type: "detective", automated: false },
];

export const CONTROL_TESTS: ControlTest[] = [
  { id: "T-01", controlId: "C-01", date: "2026-09-30", result: "failed", note: t("ไม่ได้ขัดขวางการรับผลวิเคราะห์ 3 ฉบับที่อ้างหนังสือรับรองหมดอายุ", "did not block 3 results citing an expired accreditation"), tester: t("QA Agent", "QA Agent") },
  { id: "T-02", controlId: "C-02", date: "2026-10-01", result: "exception", note: t("รอบ มิ.ย. 2569 ไม่มีผลเข้าระบบ", "no result recorded for the Jun 2026 round"), tester: t("QA Agent", "QA Agent") },
  { id: "T-03", controlId: "C-03", date: "2026-08-15", result: "effective", note: t("ทบทวนครบทุกข้อ", "all conditions reviewed"), tester: t("ฝ่ายตรวจสอบภายใน", "Internal audit") },
  { id: "T-04", controlId: "C-04", date: "2026-10-09", result: "exception", note: t("พบ 48.0 MW กับ 45.0 MW ไม่ตรงกัน รอวิศวกรยืนยัน", "found 48.0 MW vs 45.0 MW mismatch; awaiting engineer"), tester: t("QA Agent", "QA Agent") },
  { id: "T-05", controlId: "C-05", date: "2026-07-01", result: "failed", note: t("ไม่ได้ทบทวนมากว่า 12 เดือน", "not reviewed for over 12 months"), tester: t("ฝ่ายตรวจสอบภายใน", "Internal audit") },
  { id: "T-06", controlId: "C-06", date: "2026-08-20", result: "effective", note: t("ซ้อมแล้ว แจ้งภายใน 31 ชม.", "drill completed; notification in 31 h"), tester: t("ฝ่ายตรวจสอบภายใน", "Internal audit") },
  { id: "T-07", controlId: "C-07", date: "2026-10-05", result: "effective", note: t("ผลต่างต่ำกว่า 0.5%", "variance under 0.5%"), tester: t("ESG24 · reconciliation", "ESG24 · reconciliation") },
  { id: "T-08", controlId: "C-08", date: "2026-10-07", result: "effective", note: t("ยื่นตรงเวลา 12/12 เดือน", "filed on time 12/12 months"), tester: t("ACC24 · calendar", "ACC24 · calendar") },
  { id: "T-09", controlId: "C-09", date: "2026-09-28", result: "exception", note: t("ธุรกรรมบริการระหว่างกัน 2 รายการไม่มีสัญญาอ้างอิง", "2 intercompany service transactions lack a reference agreement"), tester: t("TP24 · review", "TP24 · review") },
  { id: "T-10", controlId: "C-10", date: "2026-09-26", result: "effective", note: t("ประชุมครบ 9/9 เดือน", "met 9/9 months"), tester: t("จป. วิชาชีพ", "Safety officer") },
];

/* ───────────── Regulatory change feed ───────────── */

export const REG_CHANGES: RegChange[] = [
  {
    id: "RC-2026-014",
    packId: "ERC-CoP-SOLAR-GROUND",
    title: t("ร่างแก้ไขระเบียบ กกพ. — เพิ่มข้อกำหนดการจัดการแผงเสื่อมสภาพและน้ำล้างแผง", "Draft ERC amendment — end-of-life panel and panel-washing requirements"),
    authority: t("สำนักงาน กกพ.", "ERC"),
    publishedOn: "2026-09-22",
    effectiveOn: "2027-01-01",
    summary: t("กำหนดให้ระบุผู้รับกำจัดที่ได้รับอนุญาตล่วงหน้าในรายงานขั้นต้น และบันทึกปริมาณน้ำล้างแผงรายเดือน", "Requires naming the licensed disposal contractor in the preliminary report and logging panel-washing water monthly"),
    affectedObligationIds: ["ERC-CoP-SOLAR-0404", "ERC-CoP-SOLAR-0406"],
    status: "assessed",
  },
  {
    id: "RC-2026-019",
    packId: "SET-56-1-ONE-REPORT",
    title: t("ก.ล.ต. ปรับคู่มือ One Report — เพิ่ม Scope 3 หมวดที่มีนัยสำคัญ", "SEC One Report guideline update — material Scope 3 categories"),
    authority: t("สำนักงาน ก.ล.ต.", "SEC Thailand"),
    publishedOn: "2026-10-02",
    effectiveOn: "2027-01-01",
    summary: t("บริษัทจดทะเบียนต้องเปิดเผย Scope 3 ในหมวดที่มีนัยสำคัญ เริ่มรอบปีบัญชี 2570", "Listed companies must disclose material Scope 3 categories from FY2027"),
    affectedObligationIds: ["SET-OR-3.3-GHG"],
    newObligations: [
      { id: "SET-OR-3.3-S3", title: t("ข้อมูลก๊าซเรือนกระจก Scope 3 (หมวดที่มีนัยสำคัญ)", "GHG Scope 3 (material categories)"), summary: t("ประเมินและเปิดเผย Scope 3 หมวดที่มีนัยสำคัญพร้อมวิธีคำนวณ", "Assess and disclose material Scope 3 categories with methodology"), frequency: "annual", dueRule: t("พร้อมแบบ 56-1 รอบปี 2570", "With Form 56-1 for FY2027"), evidenceRequired: [t("บัญชี Scope 3 พร้อมวิธีคำนวณ", "Scope 3 inventory with methodology")], ownerRole: t("ฝ่ายความยั่งยืน", "Sustainability team"), severity: "material", reportDest: t("56-1 หัวข้อ 3.3", "56-1 §3.3") },
    ],
    status: "new",
  },
  {
    id: "RC-2026-021",
    packId: "TH-PDPA-2562",
    title: t("ประกาศ สคส. — หลักเกณฑ์การแจ้งเหตุละเมิดฉบับปรับปรุง", "PDPC notification — revised breach-notification criteria"),
    authority: t("สคส.", "PDPC"),
    publishedOn: "2026-09-10",
    effectiveOn: "2026-12-01",
    summary: t("ขยายนิยามเหตุละเมิดที่ต้องแจ้ง และกำหนดแบบฟอร์มแจ้งเหตุใหม่", "Broadens notifiable breaches and prescribes a new notification form"),
    affectedObligationIds: ["PDPA-BREACH-72H"],
    status: "applied",
  },
];

/* ───────────── Report draft (Studio) ───────────── */

export const REPORT_DRAFT: ReportDraft = {
  id: "RPT-LB1-COP-PRE",
  entityId: "lopburi-1",
  packId: "ERC-CoP-SOLAR-GROUND",
  templateId: "cop-preliminary",
  version: "v0.4",
  rulepackVersion: "2024.1",
  chapters: [
    { id: "profile", num: "1", title: t("ข้อมูลทั่วไปของโครงการ", "General project information"), state: "approved", meta: t("อนุมัติและล็อกแล้ว · ลงนามโดย ณัฐวุฒิ ส. เมื่อ 2 ต.ค. 2569", "Approved and locked · signed by Nattawut S. on 2 Oct 2026"), evidenceIds: ["E-01", "E-02"], unresolved: [], obligationIds: ["ERC-CoP-SOLAR-0101"], paras: [
      t("โครงการโรงไฟฟ้าพลังงานแสงอาทิตย์แบบติดตั้งบนพื้นดิน ลพบุรี 1 ดำเนินการโดยบริษัท ลพบุรี กรีน พาวเวอร์ จำกัด ตั้งอยู่ในตำบลบางลี่ อำเภอท่าวุ้ง จังหวัดลพบุรี บนพื้นที่โครงการรวม 412 ไร่ กำลังผลิตติดตั้ง 48.0 เมกะวัตต์ ตามใบอนุญาตผลิตไฟฟ้าเลขที่ กกพ.-ผฟ-2567-0412", "The Lopburi 1 ground-mounted solar power project is operated by Lopburi Green Power Co., Ltd. in Bang Li sub-district, Tha Wung district, Lopburi, on a 412-rai site with 48.0 MW installed capacity under generation licence ERC-GL-2567-0412."),
      t("โครงการอยู่ระหว่างขั้นตอนก่อนการก่อสร้าง และจัดทำรายงาน CoP ขั้นต้นเพื่อใช้ประกอบการรับฟังความคิดเห็นของผู้มีส่วนได้เสียตามที่ระเบียบกำหนด", "The project is in the pre-construction phase; this preliminary CoP report supports the stakeholder hearing required by the regulation."),
    ] },
    { id: "design", num: "2", title: t("รายละเอียดการออกแบบโรงไฟฟ้า", "Plant design details"), state: "approved", meta: t("อนุมัติและล็อกแล้ว · มีข้อสังเกตจากการตรวจก่อนยื่น 1 รายการ", "Approved and locked · 1 preflight observation"), evidenceIds: ["E-02"], unresolved: [], obligationIds: ["ERC-CoP-SOLAR-0205"], paras: [
      t("ระบบผลิตไฟฟ้าประกอบด้วยแผงเซลล์แสงอาทิตย์ชนิดผลึกซิลิคอน จำนวน 86,400 แผง ติดตั้งบนโครงสร้างรองรับแบบปรับมุมคงที่ ร่วมกับอินเวอร์เตอร์แบบสตริงรวม 192 ชุด และหม้อแปลงไฟฟ้ากำลัง 4 ชุด", "The generation system comprises 86,400 crystalline-silicon modules on fixed-tilt structures, 192 string inverters and 4 power transformers."),
      t("การเชื่อมโยงระบบไฟฟ้าเข้าสู่สถานีไฟฟ้าย่อยของการไฟฟ้าส่วนภูมิภาคที่ระดับแรงดัน 115 กิโลโวลต์ ผ่านสายส่งระยะทางประมาณ 3.2 กิโลเมตร", "Grid connection is to the PEA substation at 115 kV via a transmission line of about 3.2 km."),
    ] },
    { id: "env", num: "3", title: t("สภาพแวดล้อมปัจจุบันของพื้นที่โครงการ", "Current environmental conditions"), state: "drafting", meta: t("ร่างโดย AI · ยังไม่ได้ตรวจ · อ้างอิง 11 แหล่ง", "AI draft · unreviewed · 11 sources"), evidenceIds: ["E-07", "E-09", "E-04", "E-02", "E-03"], unresolved: [t("ผลตรวจคุณภาพน้ำใต้ดินรอบนี้ยังไม่เข้าระบบ COP24 จะไม่เขียนค่าใด ๆ ลงในช่องนี้และจะไม่ยอมให้ปิดบทนี้จนกว่าจะมีผลจากห้องปฏิบัติการ", "This period's groundwater result is not in the system. COP24 will not write any value here and will not let this chapter close until the laboratory result arrives.")], obligationIds: ["ERC-CoP-SOLAR-0312", "ERC-CoP-SOLAR-0309"], paras: [
      t("พื้นที่โครงการเดิมเป็นพื้นที่เกษตรกรรมประเภทนาข้าวและไร่มันสำปะหลัง สภาพภูมิประเทศเป็นที่ราบ ความลาดชันเฉลี่ยน้อยกว่าร้อยละ 2 ไม่อยู่ในเขตพื้นที่ชุ่มน้ำหรือเขตอนุรักษ์ที่มีการประกาศ ชุมชนที่ใกล้ที่สุดอยู่ห่างจากขอบเขตพื้นที่โครงการประมาณ 680 เมตร ทางทิศตะวันออกเฉียงเหนือ", "The site was formerly paddy and cassava farmland; terrain is flat with average slope under 2%, outside any declared wetland or conservation zone. The nearest community lies about 680 m to the north-east."),
      t("ผลตรวจวัดคุณภาพอากาศในบรรยากาศโดยทั่วไป ณ จุดตรวจวัด 3 จุด ระหว่างวันที่ 12–14 มิถุนายน 2569 พบค่าฝุ่นละอองรวมและฝุ่นละอองขนาดไม่เกิน 10 ไมครอน อยู่ในเกณฑ์มาตรฐานทุกจุดตรวจวัด", "Ambient air quality at 3 stations on 12–14 June 2026 showed TSP and PM10 within standards at every station."),
      t("ผลตรวจวัดระดับเสียงเฉลี่ย 24 ชั่วโมง ณ จุดตรวจวัด 3 จุด อยู่ระหว่าง 48.2–53.7 เดซิเบลเอ ซึ่งอยู่ในเกณฑ์มาตรฐาน อย่างไรก็ตามช่วงเวลาเก็บตัวอย่างยังไม่ครอบคลุมช่วงกลางคืน จึงยังไม่สามารถสรุปการเปรียบเทียบกับค่ามาตรฐานระดับเสียงกลางคืนได้ในรายงานฉบับนี้", "24-hour average noise at 3 stations was 48.2–53.7 dB(A), within standards; however sampling did not cover night-time, so no comparison with the night-time standard can be concluded in this report."),
    ] },
    { id: "measure", num: "4", title: t("มาตรการป้องกันและแก้ไขผลกระทบสิ่งแวดล้อม", "Mitigation measures"), state: "todo", meta: t("ยังไม่ได้ร่าง · มีหลักฐานที่เกี่ยวข้องรออยู่ 11 รายการ", "Not drafted · 11 related evidence items waiting"), evidenceIds: ["E-10"], unresolved: [], obligationIds: ["ERC-CoP-SOLAR-0404", "ERC-CoP-SOLAR-0406"], paras: [] },
    { id: "monitor", num: "5", title: t("มาตรการติดตามตรวจสอบผลกระทบสิ่งแวดล้อม", "Monitoring measures"), state: "todo", meta: t("ยังไม่ได้ร่าง · มีหลักฐานที่เกี่ยวข้องรออยู่ 8 รายการ", "Not drafted · 8 related evidence items waiting"), evidenceIds: ["E-03", "E-04", "E-05"], unresolved: [], obligationIds: ["ERC-CoP-SOLAR-0317", "ERC-CoP-SOLAR-0309"], paras: [] },
    { id: "annex", num: "6", title: t("เอกสารแนบและหลักฐานประกอบ", "Annexes and supporting evidence"), state: "todo", meta: t("ประกอบอัตโนมัติเมื่อบทที่ 1–5 ถูกล็อกครบ", "Assembled automatically once chapters 1–5 are locked"), evidenceIds: ["E-05"], unresolved: [], obligationIds: ["ERC-CoP-SOLAR-0321"], paras: [] },
  ],
};

export const REPORT_CONFLICTS = [
  { field: t("กำลังผลิตติดตั้ง", "Installed capacity"), a: "48.0 MW", b: "45.0 MW", whereA: t("บทที่ 2 ตาราง 2-1 / ใบอนุญาต หน้า 2", "Chapter 2 Table 2-1 / licence p.2"), whereB: t("บทที่ 5 ตาราง 5-3", "Chapter 5 Table 5-3") },
];

export const REPORT_FACTS = { total: 412, sourced: 406 };

/* ───────────── Extra calendar events (hearings, sampling rounds) ───────────── */

export const EXTRA_EVENTS: CalendarEvent[] = [
  { id: "ev-hearing", date: "2026-11-27", entityId: "lopburi-1", packId: "ERC-CoP-SOLAR-GROUND", domain: "licensing", obligationId: "ERC-CoP-SOLAR-0601", kind: "hearing", label: t("เวทีรับฟังความคิดเห็น ลพบุรี 1", "Public hearing — Lopburi 1"), status: "cond" },
  { id: "ev-gw-dec", date: "2026-12-15", entityId: "lopburi-1", packId: "ERC-CoP-SOLAR-GROUND", domain: "licensing", obligationId: "ERC-CoP-SOLAR-0317", kind: "sampling", label: t("เก็บตัวอย่างน้ำใต้ดิน รอบ ธ.ค.", "Groundwater sampling — Dec round"), status: "warn" },
  { id: "ev-pp30", date: "2026-10-15", entityId: "lgp-pcl", packId: "TH-REVENUE-PERIODIC", domain: "tax", obligationId: "TAX-PP30", kind: "submission", label: t("ยื่น ภ.พ.30 เดือน ก.ย.", "File PP.30 for September"), status: "ok" },
  { id: "ev-agm-plan", date: "2027-04-23", entityId: "lgp-pcl", packId: "TH-CORPORATE-DBD", domain: "corporate", obligationId: "CORP-AGM", kind: "meeting", label: t("ประชุมสามัญผู้ถือหุ้น 2570", "AGM 2027"), status: "info" },
  { id: "ev-561", date: "2027-03-31", entityId: "lgp-pcl", packId: "SET-56-1-ONE-REPORT", domain: "esg", obligationId: "SET-OR-3.3-GHG", kind: "submission", label: t("ยื่น 56-1 One Report ปี 2569", "File 56-1 One Report FY2026"), status: "warn" },
  { id: "ev-cop-annual", date: "2027-01-31", entityId: "lopburi-1", packId: "ERC-CoP-SOLAR-GROUND", domain: "licensing", obligationId: "ERC-CoP-SOLAR-0702", kind: "submission", label: t("ยื่นรายงานผลการปฏิบัติตาม CoP รอบปี", "File annual CoP compliance report"), status: "info" },
];

/* ───────────── Manual gaps (from preflight / change) ───────────── */

export const MANUAL_GAPS: Gap[] = [
  { id: "G-PF1", key: "lopburi-1:ERC-CoP-SOLAR-0205", entityId: "lopburi-1", obligationId: "ERC-CoP-SOLAR-0205", packId: "ERC-CoP-SOLAR-GROUND", domain: "licensing", severity: "material", source: "preflight", cause: t("กำลังผลิตติดตั้ง 48.0 MW (บทที่ 2 / ใบอนุญาต) ไม่ตรงกับ 45.0 MW (บทที่ 5 ตาราง 5-3)", "Installed capacity 48.0 MW (Chapter 2 / licence) disagrees with 45.0 MW (Chapter 5 Table 5-3)"), remediation: t("วิศวกรโครงการยืนยันค่าที่ถูกต้อง แล้ว COP24 จะแก้ทุกจุดที่อ้างถึงพร้อมบันทึกเหตุผล", "Project engineer confirms the correct value; COP24 then updates every citation with an audit note"), owner: t("วิศวกรโครงการ", "Project engineer"), due: "2026-10-18", status: "open" },
  { id: "G-RC1", key: "lgp-pcl:SET-OR-3.3-GHG", entityId: "lgp-pcl", obligationId: "SET-OR-3.3-GHG", packId: "SET-56-1-ONE-REPORT", domain: "esg", severity: "major", source: "change", cause: t("คู่มือ One Report ฉบับใหม่ต้องการ Scope 3 หมวดที่มีนัยสำคัญตั้งแต่รอบปี 2570", "New One Report guideline requires material Scope 3 from FY2027"), remediation: t("ESG24 เริ่มคัดกรองหมวด Scope 3 และตั้งข้อผูกพันใหม่ SET-OR-3.3-S3 ในทะเบียน", "ESG24 screens Scope 3 categories and registers new obligation SET-OR-3.3-S3"), owner: t("ฝ่ายความยั่งยืน", "Sustainability team"), due: "2027-01-31", status: "in-progress" },
];

/* ───────────── Agents & missions (Agent / AGI Engine) ───────────── */

export const AGENTS: AgentDef[] = [
  { id: "reg", name: t("เอเจนต์ด้านกฎระเบียบ", "Regulation Agent"), engine: "regulation", job: t("ตรวจว่าหน่วยงานเข้าข่ายระเบียบใด ดึงข้อผูกพันที่บังคับใช้ และตรึงเวอร์ชันของชุดกฎไว้กับร่างฉบับนี้", "Determines which regimes apply, pulls the binding obligations and pins the rulepack version to this draft"), logs: [t("รอคิว", "Queued"), t("กำลังเทียบโปรไฟล์หน่วยงานกับ 12 ชุดกฎ", "Matching entity profile against 12 rule packs"), t("ตรึงชุดกฎ SOLAR-GROUND 2024.1 · 61 ข้อผูกพัน", "Pinned SOLAR-GROUND 2024.1 · 61 obligations"), t("ตรึงชุดกฎ SOLAR-GROUND 2024.1 · 61 ข้อผูกพัน", "Pinned SOLAR-GROUND 2024.1 · 61 obligations")], guardrails: [t("ไม่ตีความกฎนอกเหนือข้อความที่ประกาศ", "Never interprets beyond the published text")] },
  { id: "doc", name: t("เอเจนต์ด้านเอกสาร", "Document Agent"), engine: "evidence", job: t("จัดหมวดหมู่ไฟล์ สกัดข้อเท็จจริง ตรวจความสมบูรณ์ของเอกสาร และร่างคำขอเอกสารที่ขาด", "Classifies files, extracts facts, checks document integrity and drafts requests for missing evidence"), logs: [t("รอคิว", "Queued"), t("รอชุดกฎจากเอเจนต์กฎระเบียบ", "Waiting for the rulepack from the Regulation Agent"), t("OCR 41 ไฟล์ · ผูกหลักฐาน 29/34 ข้อผูกพัน", "OCR on 41 files · evidence bound for 29/34 obligations"), t("ส่งคำขอ 2 ฉบับไปที่หน่วยสิ่งแวดล้อมประจำไซต์", "2 requests sent to the site environmental unit")], guardrails: [t("ไม่สร้างผลตรวจวัดขึ้นเอง", "Never fabricates a measurement")] },
  { id: "rep", name: t("เอเจนต์ด้านรายงาน", "Report Agent"), engine: "reporting", job: t("เขียนทุกบทตามแบบของหน่วยงานกำกับ สร้างตารางและกราฟ และเว้นช่องที่ไม่มีหลักฐานไว้อย่างชัดเจน", "Writes every chapter to the regulator's template, builds tables and charts, and leaves unsupported slots visibly empty"), logs: [t("รอคิว", "Queued"), t("รอข้อเท็จจริงจากเอเจนต์เอกสาร", "Waiting for facts from the Document Agent"), t("กำลังเขียนบทที่ 3–6", "Writing chapters 3–6"), t("ร่างครบ 6 บท · 17 ตาราง · 412 การอ้างอิง", "6 chapters drafted · 17 tables · 412 citations")], guardrails: [t("ไม่เติมตัวเลขที่ไม่มีแหล่งอ้างอิง", "Never fills a number without a source")] },
  { id: "qa", name: t("เอเจนต์ตรวจสอบคุณภาพ", "QA Agent"), engine: "control", job: t("ท้วงร่างในมุมของผู้ตรวจ จับข้อความที่ไม่มีหลักฐาน และขัดขวางการปล่อยผ่านที่ยังไม่พร้อม", "Challenges the draft as the regulator's reviewer would, catches unsupported statements and vetoes premature release"), logs: [t("รอคิว", "Queued"), t("รอร่างจากเอเจนต์รายงาน", "Waiting for the draft from the Report Agent"), t("กำลังตรวจ 9 ชั้น", "Running the 9-layer preflight"), t("ยับยั้งการปล่อยผ่าน · เหลือ 6 ประเด็นให้คนตัดสิน", "Release vetoed · 6 issues left for humans")], guardrails: [t("ไม่รับรองผลห้องปฏิบัติการ ไม่ยื่นรายงานแทนคุณ", "Never certifies lab results; never files on your behalf")] },
];

export const MISSION_CATALOG: MissionTemplate[] = [
  { id: "m1", app: "cop24", title: t("เตรียมรายงาน CoP ขั้นต้น", "Prepare the preliminary CoP report"), desc: t("จากเอกสารโครงการที่มีอยู่", "From existing project documents"), route: "/factory" },
  { id: "m2", app: "cop24", title: t("แปลงขั้นต้นเป็นขั้นสุดท้าย", "Convert preliminary to final"), desc: t("นำผลการรับฟังความคิดเห็นเข้ามาและสรุปสิ่งที่เปลี่ยน", "Bring in hearing outcomes and summarise changes"), route: "/factory" },
  { id: "m3", app: "cop24", title: t("จัดทำรายงานผลการปฏิบัติตาม CoP รอบปี", "Annual CoP compliance report"), desc: t("ยกยอดข้อมูลเดิมและเติมหลักฐานรอบใหม่", "Carry forward and add the new period's evidence"), route: "/factory" },
  { id: "m4", app: "cop24", title: t("ตรวจรายงานที่มีอยู่", "X-ray an existing report"), desc: t("เทียบกับชุดกฎที่บังคับใช้จริง", "Against the pack that actually binds"), route: "/xray" },
  { id: "m5", app: "cop24", title: t("ปิดหลักฐานที่ยังขาด", "Close missing evidence"), desc: t("ไล่ขอเอกสารจากผู้รับผิดชอบจนครบ", "Chase owners until every item is in"), route: "/evidence" },
  { id: "m6", app: "cop24", title: t("ประเมินผลกระทบจากกฎที่เปลี่ยน", "Assess a regulatory change"), desc: t("ระบุข้อผูกพัน บท และหน่วยงานที่กระทบ", "Identify affected obligations, chapters and entities"), route: "/changes" },
  { id: "m7", app: "esg24", title: t("ESG24 · เตรียม 56-1 ส่วนความยั่งยืน", "ESG24 · Prepare the 56-1 sustainability section"), desc: t("GHG, materiality และสังคม จากหลักฐานใน ESG24", "GHG, materiality and social, from ESG24 evidence"), route: "/factory" },
  { id: "m8", app: "esg24", title: t("ESG24 · คัดกรอง Scope 3", "ESG24 · Screen Scope 3"), desc: t("เตรียมรับกฎใหม่ของ ก.ล.ต. ปี 2570", "Get ahead of the SEC's FY2027 rule"), route: "/changes" },
  { id: "m9", app: "tp24", title: t("TP24 · ปิด Local File ปี 2568", "TP24 · Finish the FY2025 local file"), desc: t("เติมการวิเคราะห์เทียบเคียงและสัญญาที่ขาด", "Add benchmarking and missing agreements"), route: "/gaps" },
  { id: "m10", app: "cop24", title: t("จัดชุดเอกสารสำหรับยื่น", "Assemble the submission bundle"), desc: t("รายงาน แบบฟอร์ม ดัชนีหลักฐาน และคำแนะนำการยื่น", "Report, forms, evidence index and filing guide"), route: "/preflight" },
];

/* ───────────── Audit trail ───────────── */

export const AUDIT: AuditEvent[] = [
  { id: "A-118", at: "2026-10-11 09:42", actor: t("QA Agent", "QA Agent"), kind: "ai", action: t("ยับยั้งการปล่อยผ่าน", "Vetoed release"), object: t("รายงาน CoP ขั้นต้น v0.4 · บทที่ 3", "Preliminary CoP report v0.4 · Chapter 3"), detail: t("หลักฐาน E-03 ยังขาด (ชั้นที่ 1) — บทไม่สามารถปิดได้ภายใต้ Evidence Guard", "Evidence E-03 missing (layer 1) — chapter cannot close under Evidence Guard"), engine: "control" },
  { id: "A-117", at: "2026-10-11 09:41", actor: t("Report Agent", "Report Agent"), kind: "ai", action: t("ร่างบท", "Drafted chapter"), object: t("บทที่ 3 สภาพแวดล้อมปัจจุบัน", "Chapter 3 — Current environmental conditions"), detail: t("3 ย่อหน้า · 11 การอ้างอิง · 1 ช่อง “ยังไม่ยุติ”", "3 paragraphs · 11 citations · 1 unresolved slot"), engine: "reporting" },
  { id: "A-116", at: "2026-10-09 16:05", actor: t("Document Agent", "Document Agent"), kind: "ai", action: t("พบข้อมูลขัดแย้ง", "Detected conflict"), object: t("กำลังผลิตติดตั้ง", "Installed capacity"), detail: t("48.0 MW (ใบอนุญาต หน้า 2) ≠ 45.0 MW (บทที่ 5 ตาราง 5-3) — เปิด G-PF1 ให้วิศวกรโครงการ", "48.0 MW (licence p.2) ≠ 45.0 MW (Ch.5 Table 5-3) — opened G-PF1 for the project engineer"), engine: "evidence" },
  { id: "A-115", at: "2026-10-08 11:20", actor: t("Document Agent", "Document Agent"), kind: "ai", action: t("ส่งคำขอเอกสาร", "Sent evidence request"), object: t("E-03 ผลวิเคราะห์คุณภาพน้ำใต้ดิน", "E-03 Groundwater laboratory report"), detail: t("ถึง หัวหน้าหน่วยสิ่งแวดล้อมประจำไซต์ · กำหนดส่ง 22 ต.ค. 2569", "To the site environmental lead · due 22 Oct 2026"), engine: "evidence" },
  { id: "A-114", at: "2026-10-02 14:30", actor: t("ณัฐวุฒิ ส.", "Nattawut S."), kind: "human", action: t("อนุมัติและล็อกบท", "Approved and locked chapter"), object: t("บทที่ 1 ข้อมูลทั่วไปของโครงการ", "Chapter 1 — General project information"), detail: t("ลงนามอิเล็กทรอนิกส์ · ตรึงหลักฐาน E-01, E-02", "e-signed · evidence E-01, E-02 pinned"), engine: "workflow" },
  { id: "A-113", at: "2026-10-02 14:12", actor: t("ณัฐวุฒิ ส.", "Nattawut S."), kind: "human", action: t("อนุมัติและล็อกบท", "Approved and locked chapter"), object: t("บทที่ 2 รายละเอียดการออกแบบ", "Chapter 2 — Plant design details"), detail: t("รับทราบข้อสังเกต 1 รายการจากการตรวจก่อนยื่น", "Acknowledged 1 preflight observation"), engine: "workflow" },
  { id: "A-112", at: "2026-10-02 09:00", actor: t("Regulatory Change Engine", "Regulatory Change Engine"), kind: "system", action: t("รับการเปลี่ยนแปลงกฎ", "Ingested regulatory change"), object: t("RC-2026-019 · คู่มือ One Report Scope 3", "RC-2026-019 · One Report Scope 3 guideline"), detail: t("กระทบ 1 ข้อผูกพัน · 1 หน่วยงาน · เสนอข้อผูกพันใหม่ SET-OR-3.3-S3", "Impacts 1 obligation · 1 entity · proposes new obligation SET-OR-3.3-S3"), engine: "change" },
  { id: "A-111", at: "2026-09-30 17:48", actor: t("QA Agent", "QA Agent"), kind: "ai", action: t("ทดสอบการควบคุม", "Tested control"), object: t("C-01 ตรวจวันหมดอายุหนังสือรับรองห้องปฏิบัติการ", "C-01 Lab accreditation expiry check"), detail: t("ไม่มีประสิทธิผล — 3 ผลวิเคราะห์อ้างหนังสือรับรองที่หมดอายุ 31 ส.ค. 2569", "Failed — 3 results cite an accreditation that expired 31 Aug 2026"), engine: "control" },
  { id: "A-110", at: "2026-09-28 10:15", actor: t("Regulation Agent", "Regulation Agent"), kind: "ai", action: t("ตรึงชุดกฎ", "Pinned rulepack"), object: t("ERC-CoP-SOLAR-GROUND 2024.1", "ERC-CoP-SOLAR-GROUND 2024.1"), detail: t("โซลาร์ฟาร์ม ลพบุรี 1 · เข้าข่าย CoP · ไม่เข้าข่าย IEE/EIA · ข้อสมมติ 1 ข้อยังไม่ยืนยัน", "Solar Farm Lopburi 1 · in scope of CoP · not IEE/EIA · 1 assumption unconfirmed"), engine: "applicability" },
];

/* ───────────── Portfolio (advisor view) ───────────── */

export const PORTFOLIO = [
  { name: t("โซลาร์ฟาร์ม ลพบุรี 1", "Solar Farm Lopburi 1"), client: t("ลพบุรี กรีน พาวเวอร์", "Lopburi Green Power"), tech: t("โซลาร์บนพื้นดิน", "Ground solar"), report: t("CoP ขั้นต้น", "Preliminary CoP"), n: 72, due: "2026-11-30", k: "bad" as const, risk: t("เสี่ยงสูง", "High risk") },
  { name: t("โซลาร์ฟาร์ม ลพบุรี 2", "Solar Farm Lopburi 2"), client: t("ลพบุรี กรีน พาวเวอร์", "Lopburi Green Power"), tech: t("โซลาร์บนพื้นดิน", "Ground solar"), report: t("CoP ขั้นต้น", "Preliminary CoP"), n: 41, due: "2026-11-30", k: "bad" as const, risk: t("เสี่ยงสูง", "High risk") },
  { name: t("สระบุรี โซลาร์รูฟ (รวม 18 อาคาร)", "Saraburi Solar Roof (18 buildings)"), client: t("เอสบี พร็อพเพอร์ตี้", "SB Property"), tech: t("โซลาร์บนหลังคา", "Rooftop solar"), report: t("ติดตามผล รอบปี", "Annual monitoring"), n: 88, due: "2027-01-31", k: "ok" as const, risk: t("ปกติ", "Normal") },
  { name: t("โรงไฟฟ้าชีวมวล นครสวรรค์", "Nakhon Sawan Biomass"), client: t("เอ็นเอส ไบโอเอนเนอร์ยี", "NS Bioenergy"), tech: t("ชีวมวล", "Biomass"), report: t("ติดตามผล รอบครึ่งปี", "Half-year monitoring"), n: 63, due: "2027-01-31", k: "warn" as const, risk: t("ต้องติดตาม", "Watch") },
  { name: t("โซลาร์ลอยน้ำ อุบลราชธานี", "Ubon Floating Solar"), client: t("อีสาน รีนิวเอเบิล", "Isan Renewable"), tech: t("โซลาร์ลอยน้ำ", "Floating solar"), report: t("CoP ขั้นสุดท้าย", "Final CoP"), n: 79, due: "2026-12-15", k: "warn" as const, risk: t("ต้องติดตาม", "Watch") },
  { name: t("วินด์ฟาร์ม ชัยภูมิ 2", "Chaiyaphum Wind 2"), client: t("ชัยภูมิ วินด์", "Chaiyaphum Wind"), tech: t("พลังงานลม", "Wind"), report: t("ติดตามผล รอบปี", "Annual monitoring"), n: 95, due: "2027-01-31", k: "ok" as const, risk: t("ปกติ", "Normal") },
  { name: t("โรงไฟฟ้าก๊าซชีวภาพ ราชบุรี", "Ratchaburi Biogas"), client: t("อาร์บี ไบโอแก๊ส", "RB Biogas"), tech: t("ก๊าซชีวภาพ", "Biogas"), report: t("ติดตามผล รอบครึ่งปี", "Half-year monitoring"), n: 54, due: "2027-01-31", k: "bad" as const, risk: t("เสี่ยงสูง", "High risk") },
];
