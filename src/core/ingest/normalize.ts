import { normalizeThai, thaiDigitsToArabic } from "../corpus-text";
import type { ValueState } from "./types";

/**
 * Deterministic normalisation (COP-DI-05). Original values are always kept by the caller;
 * these functions only produce the normalised counterpart.
 */

export const cleanText = (s: string) => normalizeThai(thaiDigitsToArabic(s));

const TH_MONTHS: [RegExp, number][] = [
  [/^(มกราคม|ม\.ค\.?|มค)/u, 1], [/^(กุมภาพันธ์|ก\.พ\.?|กพ)/u, 2], [/^(มีนาคม|มี\.ค\.?|มีค)/u, 3], [/^(เมษายน|เม\.ย\.?|เมย)/u, 4],
  [/^(พฤษภาคม|พ\.ค\.?|พค)/u, 5], [/^(มิถุนายน|มิ\.ย\.?|มิย)/u, 6], [/^(กรกฎาคม|ก\.ค\.?|กค)/u, 7], [/^(สิงหาคม|ส\.ค\.?|สค)/u, 8],
  [/^(กันยายน|ก\.ย\.?|กย)/u, 9], [/^(ตุลาคม|ต\.ค\.?|ตค)/u, 10], [/^(พฤศจิกายน|พ\.ย\.?|พย)/u, 11], [/^(ธันวาคม|ธ\.ค\.?|ธค)/u, 12],
];
const EN_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Buddhist Era → Common Era. 2-digit BE years (e.g. "69") are read as 25xx in Thai context. */
export function toCE(year: number, thaiContext: boolean): number {
  if (year >= 2400) return year - 543;
  if (year < 100) return thaiContext ? 2500 + year - 543 : 2000 + year;
  return year;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => (m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${pad(m)}-${pad(d)}` : undefined);

export interface DateHit { raw: string; iso: string; index: number }

/** Find dates in Thai or English text: "12 มิถุนายน 2569", "12 มิ.ย. 69", "12/06/2569", "2026-06-12", "12 Jun 2026". */
export function findDates(text: string): DateHit[] {
  const s = cleanText(text);
  const out: DateHit[] = [];
  const thai = /(\d{1,2})\s*(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(?:พ\.ศ\.\s*)?(\d{2,4})/gu;
  for (const m of s.matchAll(thai)) {
    const mon = TH_MONTHS.find(([re]) => re.test(m[2]))?.[1];
    const d = mon ? iso(toCE(Number(m[3]), true), mon, Number(m[1])) : undefined;
    if (d) out.push({ raw: m[0], iso: d, index: m.index! });
  }
  for (const m of s.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    const d = iso(toCE(Number(m[1]), false), Number(m[2]), Number(m[3]));
    if (d) out.push({ raw: m[0], iso: d, index: m.index! });
  }
  for (const m of s.matchAll(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/g)) {
    const y = Number(m[3]);
    const d = iso(toCE(y, y >= 2400 || /[฀-๿]/u.test(s)), Number(m[2]), Number(m[1]));
    if (d) out.push({ raw: m[0], iso: d, index: m.index! });
  }
  for (const m of s.matchAll(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})\b/gi)) {
    const d = iso(Number(m[3]), EN_MONTHS.indexOf(m[2].toLowerCase()) + 1, Number(m[1]));
    if (d) out.push({ raw: m[0], iso: d, index: m.index! });
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Canonical units. Unknown units are kept as written, never guessed. */
const UNIT_MAP: [RegExp, string][] = [
  [/^(dB\s*\(?A\)?|dBA|เดซิเบล\s*เอ|เดซิเบล\(เอ\))$/iu, "dB(A)"],
  [/^(mg\/m3|mg\/m³|มก\.?\/ลบ\.?ม\.?|มิลลิกรัม\/ลูกบาศก์เมตร)$/iu, "mg/m³"],
  [/^(µg\/m3|ug\/m3|µg\/m³|มคก\.?\/ลบ\.?ม\.?|ไมโครกรัม\/ลูกบาศก์เมตร)$/iu, "µg/m³"],
  [/^(mg\/l|มก\.?\/ล\.?|มิลลิกรัม\/ลิตร)$/iu, "mg/L"],
  [/^(mw|เมกะวัตต์)$/iu, "MW"],
  [/^(mwp|เมกะวัตต์พีค)$/iu, "MWp"],
  [/^(kwp)$/iu, "kWp"],
  [/^(kw|กิโลวัตต์)$/iu, "kW"],
  [/^(kva|กิโลโวลต์แอมแปร์)$/iu, "kVA"],
  [/^(mva)$/iu, "MVA"],
  [/^(kv|กิโลโวลต์)$/iu, "kV"],
  [/^(ไร่|rai)$/iu, "ไร่"],
  [/^(m|ม\.|เมตร)$/iu, "m"],
  [/^(km|กม\.|กิโลเมตร)$/iu, "km"],
  [/^(°c|องศาเซลเซียส)$/iu, "°C"],
  [/^(ตัน|tonne|tonnes|t)$/iu, "t"],
  [/^(กก\.|kg|กิโลกรัม)$/iu, "kg"],
];
export const normalizeUnit = (u: string | undefined): string | undefined => {
  if (!u) return undefined;
  const s = u.trim();
  return UNIT_MAP.find(([re]) => re.test(s))?.[1] ?? s;
};

/**
 * Parse a measured value without inventing anything. "ND", "<0.01", "ไม่พบ" → not-detected;
 * "ไม่ได้ตรวจวัด", "N/M" → not-measured; "-", "ไม่มีข้อมูล", "" → not-provided; "0" → zero.
 */
export function parseValue(raw: string | number | null | undefined): { state: ValueState; value: number | null; detectionLimit?: number } {
  if (raw === null || raw === undefined) return { state: "not-provided", value: null };
  if (typeof raw === "number") return Number.isFinite(raw) ? { state: raw === 0 ? "zero" : "value", value: raw } : { state: "unclear", value: null };
  const s = cleanText(raw).trim();
  if (!s || /^[-–—]+$/.test(s) || /^(n\/?a|ไม่มีข้อมูล|ไม่ระบุ|not provided)$/iu.test(s)) return { state: "not-provided", value: null };
  if (/^(n\/?m|ไม่ได้ตรวจวัด|ไม่ได้วัด|not measured)$/iu.test(s)) return { state: "not-measured", value: null };
  const lt = s.match(/^<\s*(\d+(?:\.\d+)?)/);
  if (/^(nd|n\.d\.|ไม่พบ|ตรวจไม่พบ|not detected)\b/iu.test(s) || lt) return { state: "not-detected", value: null, detectionLimit: lt ? Number(lt[1]) : undefined };
  const n = s.replace(/,/g, "").match(/^-?\d+(?:\.\d+)?$/);
  if (n) { const v = Number(n[0]); return { state: v === 0 ? "zero" : "value", value: v }; }
  return { state: "unclear", value: null };
}

/** Parse "48.0", "48,000", "45" etc. Returns null when not a clean number. */
export const parseNumber = (s: string): number | null => {
  const m = cleanText(s).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};

export const NOISE_PARAMS: [RegExp, string][] = [
  [/leq\s*,?\s*24|leq\s*24\s*(hr|ชม\.?|ชั่วโมง)?|เฉลี่ย\s*24\s*ชั่วโมง/iu, "Leq24"],
  [/\bl\s*90\b|ระดับเสียงพื้นฐาน/iu, "L90"],
  [/\bldn\b|กลางวัน-กลางคืน/iu, "Ldn"],
  [/\blmax\b|ระดับเสียงสูงสุด/iu, "Lmax"],
];
export const AIR_PARAMS: [RegExp, string][] = [
  [/pm\s*2\.5/iu, "PM2.5"],
  [/pm\s*10/iu, "PM10"],
  [/\btsp\b|ฝุ่นละอองรวม/iu, "TSP"],
  [/\bno2\b|ไนโตรเจนไดออกไซด์/iu, "NO2"],
  [/\bso2\b|ซัลเฟอร์ไดออกไซด์/iu, "SO2"],
];
export const WATER_PARAMS: [RegExp, string][] = [
  [/^\s*ph\b|ความเป็นกรด/iu, "pH"],
  [/\bbod\b/iu, "BOD"],
  [/\bcod\b/iu, "COD"],
  [/\btss\b|ของแข็งแขวนลอย/iu, "TSS"],
  [/\btds\b/iu, "TDS"],
  [/oil\s*&?\s*grease|น้ำมันและไขมัน/iu, "Oil & Grease"],
];

export function canonicalParameter(label: string): { medium: "noise" | "air" | "water" | "other"; parameter: string } {
  const s = cleanText(label);
  for (const [re, p] of NOISE_PARAMS) if (re.test(s)) return { medium: "noise", parameter: p };
  for (const [re, p] of AIR_PARAMS) if (re.test(s)) return { medium: "air", parameter: p };
  for (const [re, p] of WATER_PARAMS) if (re.test(s)) return { medium: "water", parameter: p };
  return { medium: "other", parameter: s.trim() };
}
