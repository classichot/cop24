import { t } from "../i18n-text";
import type { LText } from "../types";

/**
 * §2 Regulatory rules the AGI must understand — configurable, versioned and cited, never
 * hard-coded into missions. A ruleset can be replaced (a new amendment) without touching the
 * mission engine; every assessment records the ruleset version it used (REQ-GOV-002).
 */

export type Technology = "solar-rooftop" | "solar-ground" | "solar-floating" | "wind" | "biomass" | "biogas" | "msw" | "natural-gas" | "coal" | "other";
export type Stage = "pre-construction" | "construction" | "operation" | "decommissioning";
export type Scenario = "new" | "expansion" | "technology-change" | "existing";
export type Route = "cop" | "eia" | "ehia" | "iee" | "exempt" | "unknown";

export interface RegulatoryProfile {
  technology: Technology;
  capacityMW: number;
  stage: Stage;
  scenario: Scenario;
  /** set when an EIA/EHIA/IEE approval or requirement is already known from documents */
  declaredRoute?: Route;
  /** project-specific conditions from the licence, approved CoP or ERC letters (REQ-DATA-003) */
  permitConditions?: { id: string; text: string; effective: string }[];
}

export const COMBUSTION: Technology[] = ["biomass", "biogas", "msw", "natural-gas", "coal"];
export const isCombustion = (tech: Technology) => COMBUSTION.includes(tech);

export interface Citation { sourceId: string; clause: string; note?: LText }

export interface Ruleset {
  version: string;
  effective: string;
  /** monitoring report cycles — ERC CoP & CoP Monitor Regulation 2565, clause 21 */
  cycles: { combustion: { months: number; dueMonths: number[] }; nonCombustion: { months: number; dueMonths: number[] }; cite: Citation };
  /** thermal capacity at or above which an EIA (not CoP) is the route; EHIA thresholds by fuel. Verify against the current MNRE/ONEP notification. */
  eiaThermalMW: number;
  ehiaMW: Partial<Record<Technology, number>>;
  thresholdsVerified: boolean;
  /** report templates and checklists by technology */
  templates: Record<Technology, { checklist: string | null; note?: LText }>;
  rooftopAmendment: Citation;
  labRule: Citation;
  historyYears: number;
}

export const RULESET_2567: Ruleset = {
  version: "erc-cop-rules@2565+2567-r1",
  effective: "2024-01-01",
  cycles: {
    combustion: { months: 6, dueMonths: [7, 1] },
    nonCombustion: { months: 12, dueMonths: [1] },
    cite: { sourceId: "erc-cop-reg-2565", clause: "ข้อ 21", note: t("เผาไหม้: ทุก 6 เดือน ส่ง ก.ค. และ ม.ค. · ไม่เผาไหม้: ทุก 1 ปี ส่ง ม.ค. ปีถัดไป", "Combustion: every 6 months, due July and January · non-combustion: yearly, due the following January") },
  },
  eiaThermalMW: 10,
  ehiaMW: { coal: 100, biomass: 150, "natural-gas": 3000 },
  thresholdsVerified: false,
  templates: {
    "solar-rooftop": { checklist: "erc-cop-checklist-solar-rooftop", note: t("ใช้ข้อกำหนดที่แก้ไขปี 2567 สำหรับโซลาร์บนหลังคา", "Apply the 2024 (B.E. 2567) amendment for rooftop PV") },
    "solar-ground": { checklist: "erc-cop-checklist-solar-farm" },
    "solar-floating": { checklist: "erc-cop-checklist-floating-solar" },
    wind: { checklist: "erc-cop-checklist-wind" },
    biomass: { checklist: "erc-cop-checklist-biomass" },
    biogas: { checklist: "erc-cop-checklist-biogas" },
    msw: { checklist: "erc-cop-checklist-msw-direct" },
    "natural-gas": { checklist: "erc-cop-checklist-natural-gas" },
    coal: { checklist: "erc-cop-checklist-coal" },
    other: { checklist: null, note: t("ไม่มีแบบตรวจสอบเฉพาะ — ต้องให้ผู้เชี่ยวชาญยืนยัน", "No dedicated checklist — an expert must confirm") },
  },
  rooftopAmendment: { sourceId: "erc-cop-reg-2567-no2", clause: "ทั้งฉบับ", note: t("ระเบียบแก้ไขฉบับที่ 2 พ.ศ. 2567", "Amendment No. 2, B.E. 2567") },
  labRule: { sourceId: "erc-cop-reg-2565", clause: "ข้อ 19", note: t("การวิเคราะห์ตัวอย่างต้องทำโดยห้องปฏิบัติการของราชการหรือเอกชนที่ขึ้นทะเบียนตามกฎหมาย", "Sample analysis must be done by a government or legally registered private laboratory") },
  historyYears: 3,
};

export interface RouteDecision {
  route: Route;
  reason: LText;
  cites: Citation[];
  unresolved: LText[];
  checklist: string | null;
  rulesetVersion: string;
}

/** COP-002 CoP applicability — CoP, IEE/EIA/EHIA, exemption, with citations and open questions. */
export function determineRoute(p: RegulatoryProfile, rules: Ruleset = RULESET_2567): RouteDecision {
  const tpl = rules.templates[p.technology];
  const base = { cites: [] as Citation[], unresolved: [] as LText[], checklist: tpl.checklist, rulesetVersion: rules.version };
  if (!rules.thresholdsVerified) base.unresolved.push(t("เกณฑ์ EIA/EHIA ในชุดกฎยังไม่ได้ตรวจกับประกาศ ทส. ฉบับปัจจุบัน", "EIA/EHIA thresholds in this ruleset are not yet verified against the current MNRE notification"));
  if (p.declaredRoute && p.declaredRoute !== "cop" && p.declaredRoute !== "unknown") {
    return { ...base, route: p.declaredRoute, reason: t(`เอกสารระบุว่าโครงการอยู่ภายใต้ ${p.declaredRoute.toUpperCase()} — ไม่สร้างรายงาน CoP ทั่วไป`, `Documents show the project is under ${p.declaredRoute.toUpperCase()} — a generic CoP report is not generated`) };
  }
  if (isCombustion(p.technology)) {
    const ehia = rules.ehiaMW[p.technology];
    if (ehia !== undefined && p.capacityMW >= ehia) return { ...base, route: "ehia", reason: t(`โรงไฟฟ้า${p.technology} กำลังผลิต ${p.capacityMW} MW ≥ ${ehia} MW — เข้าข่าย EHIA`, `${p.technology} plant at ${p.capacityMW} MW ≥ ${ehia} MW — EHIA route`) };
    if (p.capacityMW >= rules.eiaThermalMW) return { ...base, route: "eia", reason: t(`โรงไฟฟ้าพลังความร้อน ${p.capacityMW} MW ≥ ${rules.eiaThermalMW} MW — เข้าข่าย EIA ไม่ใช่ CoP`, `Thermal plant at ${p.capacityMW} MW ≥ ${rules.eiaThermalMW} MW — EIA route, not CoP`), cites: [{ sourceId: "erc-cop-reg-2565", clause: "ข้อ 24", note: t("CoP สำหรับโรงไฟฟ้าเผาไหม้ที่ต่ำกว่า 10 MW", "CoP covers combustion plants below 10 MW") }] };
  }
  const cites: Citation[] = [{ sourceId: "erc-cop-reg-2565", clause: "ข้อ 4–6" }];
  if (p.technology === "solar-rooftop") cites.push(rules.rooftopAmendment);
  if (tpl.checklist === null) base.unresolved.push(tpl.note!);
  if (p.scenario === "expansion" || p.scenario === "technology-change") base.unresolved.push(t("การขยายกำลังผลิตหรือเปลี่ยนเชื้อเพลิงต้องทำ CoP ใหม่ทุกระยะและขอเปลี่ยนสาระสำคัญในใบอนุญาต", "Expansion or a fuel change needs a new CoP for every stage and a material licence change"));
  return { ...base, route: "cop", reason: p.technology === "solar-rooftop" ? t("โซลาร์บนหลังคา — ใช้ CoP ตามระเบียบ 2565 และข้อกำหนดที่แก้ไขปี 2567", "Rooftop PV — CoP under the 2565 regulation with the 2567 amendment") : t(`${p.technology} ${p.capacityMW} MW — อยู่ภายใต้ CoP`, `${p.technology} at ${p.capacityMW} MW — under CoP`), cites };
}

export interface ReportingPeriod { from: string; to: string; due: string; label: LText }

/** COP-015 deadline planner — reporting periods for a calendar year, from the configured cycle. */
export function monitoringPeriods(p: RegulatoryProfile, year: number, rules: Ruleset = RULESET_2567): { periods: ReportingPeriod[]; cite: Citation } {
  const cyc = isCombustion(p.technology) ? rules.cycles.combustion : rules.cycles.nonCombustion;
  const periods: ReportingPeriod[] = [];
  for (let m = 1; m <= 12; m += cyc.months) {
    const endM = m + cyc.months - 1;
    const dueYear = endM === 12 ? year + 1 : year;
    const dueMonth = endM === 12 ? 1 : endM + 1;
    const last = new Date(Date.UTC(dueYear, dueMonth, 0)).getUTCDate();
    periods.push({
      from: `${year}-${String(m).padStart(2, "0")}-01`,
      to: `${year}-${String(endM).padStart(2, "0")}-${new Date(Date.UTC(year, endM, 0)).getUTCDate()}`,
      due: `${dueYear}-${String(dueMonth).padStart(2, "0")}-${last}`,
      label: t(`ผลการปฏิบัติ ${m === 1 && cyc.months === 12 ? "ทั้งปี" : `เดือน ${m}–${endM}`} ปี ${year + 543}`, `Results ${cyc.months === 12 ? "for the year" : `months ${m}–${endM}`} ${year}`),
    });
  }
  return { periods, cite: rules.cycles.cite };
}

/** Which obligations a new permit condition touches (acceptance test: upload a new permit condition). */
export function conditionImpact(text: string): { topics: string[]; sections: LText[] } {
  const map: [RegExp, string, LText][] = [
    [/เสียง|noise/iu, "noise", t("บทผลการตรวจวัดเสียง", "Noise monitoring section")],
    [/ฝุ่น|อากาศ|air|dust/iu, "air", t("บทคุณภาพอากาศ", "Air quality section")],
    [/น้ำ|water|drain/iu, "water", t("บทคุณภาพน้ำและการระบายน้ำ", "Water and drainage section")],
    [/ของเสีย|แผง.*(ชำรุด|เสื่อม)|waste|panel/iu, "waste", t("บทการจัดการของเสีย", "Waste management section")],
    [/ชุมชน|ร้องเรียน|community|complain/iu, "community", t("บทการมีส่วนร่วมและข้อร้องเรียน", "Community and complaints section")],
    [/ความปลอดภัย|ไฟไหม้|safety|fire/iu, "safety", t("บทความปลอดภัย", "Safety section")],
  ];
  const hit = map.filter(([re]) => re.test(text));
  return { topics: hit.map((h) => h[1]), sections: hit.map((h) => h[2]) };
}
