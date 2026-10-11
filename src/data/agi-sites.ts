import { t } from "@/core/i18n-text";
import type { SiteInput, SiteMeasure } from "@/core/agi/types";

/**
 * Sites for AGI Mission Control. Lopburi 1 and 2 mirror the demo tenant and the ingestion sample
 * set (48 MW licence vs 45 MW layout, station 2 noise 72.4 dB(A), lab accreditation ว-123
 * expired 31 Aug 2026). The rooftop and biomass projects exist to show the rooftop checklist and
 * the EIA route. All values are illustrative; limits are marked unverified like the ingestion
 * standards registry.
 */

const solarMeasures = (prefix: string): SiteMeasure[] => [
  { id: `${prefix}-M1`, title: t("ควบคุมระดับเสียงจากการก่อสร้าง/ดำเนินการ", "Noise control"), topic: "noise", mandatory: true, applies: true, source: "Solar Farm checklist 2.4.1" },
  { id: `${prefix}-M2`, title: t("ควบคุมฝุ่นละออง", "Dust control"), topic: "air", mandatory: true, applies: true, source: "Solar Farm checklist 2.4.2" },
  { id: `${prefix}-M3`, title: t("การระบายน้ำและป้องกันการชะล้างพังทลายของดิน", "Drainage and erosion control"), topic: "water", mandatory: true, applies: true, source: "Solar Farm checklist 2.4.3" },
  { id: `${prefix}-M4`, title: t("จัดการแผงเซลล์ที่ชำรุดและของเสีย", "Damaged panel and waste management"), topic: "waste", mandatory: true, applies: true, source: "Solar Farm checklist 2.4.5" },
  { id: `${prefix}-M5`, title: t("รับและแก้ไขข้อร้องเรียนชุมชน", "Community complaint handling"), topic: "community", mandatory: true, applies: true, source: "Solar Farm checklist ส่วนที่ 5" },
  { id: `${prefix}-M6`, title: t("ความปลอดภัยในการทำงาน", "Occupational safety"), topic: "safety", mandatory: true, applies: true, source: "Solar Farm checklist 2.5" },
  { id: `${prefix}-M7`, title: t("คุณภาพน้ำทิ้ง", "Effluent quality"), topic: "water", mandatory: false, applies: false, source: "not applicable — no process water" },
];

const noise = { max: 70, standard: "Leq24 ≤ 70 dB(A)", verified: false };

export const AGI_SITES: SiteInput[] = [
  {
    id: "lopburi-1", name: t("โซลาร์ฟาร์ม ลพบุรี 1", "Solar Farm Lopburi 1"), year: 2026,
    profile: { technology: "solar-ground", capacityMW: 48, stage: "construction", scenario: "existing", permitConditions: [] },
    measures: solarMeasures("LB1"),
    evidence: [
      { id: "LB1-E1", measureId: "LB1-M1", title: t("ผลตรวจวัดระดับเสียง มิ.ย. 2569", "Noise report Jun 2026"), status: "needs-review", source: "noise-report.pdf p.1", note: t("หน้า 2 จาก 3 หาย", "Page 2 of 3 missing") },
      { id: "LB1-E2", measureId: "LB1-M2", title: t("ผลตรวจฝุ่น PM10/TSP", "PM10/TSP results"), status: "verified", source: "air.csv rows 2–5" },
      { id: "LB1-E3", measureId: "LB1-M3", title: t("แบบระบบระบายน้ำ rev.C", "Drainage drawing rev.C"), status: "conflicting", source: "layout-revC.pdf", note: t("กำลังผลิต 45 MW ขัดกับใบอนุญาต 48 MW", "45 MW conflicts with the 48 MW licence") },
      { id: "LB1-E4", measureId: "LB1-M4", title: t("ใบกำกับการขนส่งของเสีย", "Waste manifests"), status: "missing" },
      { id: "LB1-E5", measureId: "LB1-M5", title: t("ทะเบียนข้อร้องเรียน 2569", "Complaint register 2026"), status: "verified", source: "complaints.xlsx Sheet1" },
      { id: "LB1-E6", measureId: "LB1-M6", title: t("รายงานความปลอดภัยรายเดือน", "Monthly safety reports"), status: "missing" },
    ],
    measurements: [
      { id: "LB1-X1", param: "Leq24", station: "Station 1", period: "2026", value: 65.1, state: "value", unit: "dB(A)", limit: noise, labId: "LAB-TEL", source: "noise-report.pdf p.1" },
      { id: "LB1-X2", param: "Leq24", station: "Station 2", period: "2026", value: 72.4, state: "value", unit: "dB(A)", limit: noise, labId: "LAB-TEL", source: "noise-report.pdf p.3" },
      { id: "LB1-X3", param: "Ldn", station: "Station 1", period: "2026", value: null, state: "not-measured", unit: "dB(A)", source: "noise-report.pdf p.1" },
      { id: "LB1-X4", param: "PM10", station: "Station 1", period: "2026", value: 0.045, state: "value", unit: "mg/m³", limit: { max: 0.12, standard: "PM10 24-h ≤ 0.12 mg/m³", verified: false }, labId: "LAB-TEL", source: "air.csv row 2" },
      { id: "LB1-X5", param: "Leq24", station: "Station A", period: "2025", value: 63.0, state: "value", unit: "dB(A)", limit: noise, source: "cop-monitoring-2568.pdf p.12" },
    ],
    labs: [{ id: "LAB-TEL", name: "Thai Environmental Laboratory", accreditationNo: "ว-123", validUntil: "2026-08-31" }],
    capacityClaims: [{ source: "licence p.2", valueMW: 48 }, { source: "layout rev.C", valueMW: 45 }],
    historyYears: [2025, 2026],
  },
  {
    id: "lopburi-2", name: t("โซลาร์ฟาร์ม ลพบุรี 2", "Solar Farm Lopburi 2"), year: 2026,
    profile: { technology: "solar-ground", capacityMW: 36, stage: "operation", scenario: "existing", permitConditions: [{ id: "COND-LB2-07", text: "ให้ตรวจวัดระดับเสียงเพิ่มเติมที่จุดชุมชนบ้านโคก ทุก 6 เดือน", effective: "2026-09-01" }] },
    measures: solarMeasures("LB2"),
    evidence: [
      { id: "LB2-E1", measureId: "LB2-M1", title: t("ผลตรวจวัดระดับเสียง 2569", "Noise report 2026"), status: "verified", source: "lb2-noise-2026.pdf p.2" },
      { id: "LB2-E2", measureId: "LB2-M2", title: t("ผลตรวจฝุ่น 2569", "Dust results 2026"), status: "verified", source: "lb2-air-2026.xlsx" },
      { id: "LB2-E3", measureId: "LB2-M3", title: t("บันทึกตรวจระบบระบายน้ำ", "Drainage inspection log"), status: "verified", source: "lb2-drainage-log.pdf" },
      { id: "LB2-E4", measureId: "LB2-M4", title: t("ใบกำกับการขนส่งแผงชำรุด", "Damaged panel manifests"), status: "verified", source: "lb2-manifests.pdf" },
      { id: "LB2-E5", measureId: "LB2-M5", title: t("ทะเบียนข้อร้องเรียน", "Complaint register"), status: "verified", source: "lb2-complaints.xlsx" },
      { id: "LB2-E6", measureId: "LB2-M6", title: t("รายงานความปลอดภัย", "Safety reports"), status: "needs-review", source: "lb2-ohs.pdf", note: t("ยังไม่มีลายมือชื่อ จป.", "Not yet signed by the safety officer") },
    ],
    measurements: [
      { id: "LB2-X1", param: "Leq24", station: "Station 1", period: "2026", value: 58.2, state: "value", unit: "dB(A)", limit: noise, labId: "LAB-ENV2", source: "lb2-noise-2026.pdf p.2" },
      { id: "LB2-X2", param: "PM10", station: "Station 1", period: "2026", value: 0.031, state: "value", unit: "mg/m³", limit: { max: 0.12, standard: "PM10 24-h ≤ 0.12 mg/m³", verified: false }, labId: "LAB-ENV2", source: "lb2-air-2026.xlsx" },
      { id: "LB2-X3", param: "Leq24", station: "Station 1", period: "2025", value: 57.9, state: "value", unit: "dB(A)", limit: noise, source: "lb2-cop-2568.pdf" },
      { id: "LB2-X4", param: "Leq24", station: "Station 1", period: "2024", value: 58.4, state: "value", unit: "dB(A)", limit: noise, source: "lb2-cop-2567.pdf" },
    ],
    labs: [{ id: "LAB-ENV2", name: "Central Environmental Lab", accreditationNo: "ว-456", validUntil: "2027-06-30" }],
    capacityClaims: [{ source: "licence", valueMW: 36 }, { source: "SLD", valueMW: 36 }],
    historyYears: [2024, 2025, 2026],
  },
  {
    id: "demo-rooftop", name: t("ตัวอย่าง: โซลาร์บนหลังคาโรงงาน 0.98 MW", "Demo: factory rooftop PV 0.98 MW"), year: 2026,
    profile: { technology: "solar-rooftop", capacityMW: 0.98, stage: "operation", scenario: "existing" },
    measures: [
      { id: "RT-M1", title: t("ความมั่นคงแข็งแรงของโครงสร้างหลังคา", "Roof structural safety"), topic: "safety", mandatory: true, applies: true, source: "Rooftop checklist" },
      { id: "RT-M2", title: t("ความปลอดภัยทางไฟฟ้าและอัคคีภัย", "Electrical and fire safety"), topic: "safety", mandatory: true, applies: true, source: "Rooftop checklist" },
      { id: "RT-M3", title: t("จัดการแผงชำรุด", "Damaged panel management"), topic: "waste", mandatory: true, applies: true, source: "Rooftop checklist" },
    ],
    evidence: [
      { id: "RT-E1", measureId: "RT-M1", title: t("รายงานวิศวกรโครงสร้าง", "Structural engineer's report"), status: "verified", source: "structure.pdf" },
      { id: "RT-E2", measureId: "RT-M2", title: t("ผลตรวจระบบไฟฟ้า", "Electrical inspection"), status: "verified", source: "electrical.pdf" },
    ],
    measurements: [], labs: [], capacityClaims: [{ source: "licence-exempt notice", valueMW: 0.98 }], historyYears: [2026],
  },
  {
    id: "demo-biomass", name: t("ตัวอย่าง: โรงไฟฟ้าชีวมวล 25 MW", "Demo: biomass plant 25 MW"), year: 2026,
    profile: { technology: "biomass", capacityMW: 25, stage: "pre-construction", scenario: "new" },
    measures: [], evidence: [], measurements: [], labs: [], capacityClaims: [{ source: "application", valueMW: 25 }], historyYears: [],
  },
];

export const siteById = (id: string) => AGI_SITES.find((s) => s.id === id);
