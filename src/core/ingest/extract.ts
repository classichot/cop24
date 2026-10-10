import { t } from "../i18n-text";
import type { LText } from "../types";
import { canonicalParameter, cleanText, findDates, normalizeUnit, parseNumber, parseValue } from "./normalize";
import type { Confidence, DocCategory, ExtractedField, Locator, Measurement, ParsedDocument } from "./types";

/**
 * COP-DI-05 — rule-based extraction (`rule-extract@1`) with exact locators.
 * Raw values are kept; normalised values sit beside them. Nothing is inferred when a value
 * is missing or unclear — the field is either absent or carries a non-value state.
 */
export const EXTRACTOR_VERSION = "rule-extract@1";

let seq = 0;
const fid = (docId: string, key: string) => `FLD-${docId.slice(4, 12)}-${key.replace(/[^a-z0-9]/gi, "").slice(0, 10)}-${++seq}`;

const conf = (extraction: number, integrity: Confidence["integrity"] = "ok"): Confidence => ({ extraction, integrity, reconciliation: "unchecked", regulatory: "unverified", approval: "pending" });

interface Ctx { documentId: string; versionId: string; sha256: string; method: string; ocr: boolean }

function field(ctx: Ctx, key: string, label: LText, raw: string, loc: Omit<Locator, "documentId" | "versionId" | "sha256">, extra: Partial<ExtractedField> = {}, c = 0.9): ExtractedField {
  return {
    id: fid(ctx.documentId, key), key, label, raw, state: "value",
    locator: { documentId: ctx.documentId, versionId: ctx.versionId, sha256: ctx.sha256, ...loc },
    method: ctx.method, confidence: conf(ctx.ocr ? Math.min(c, 0.75) : c, ctx.ocr ? "degraded" : "ok"), corrections: [], ...extra,
  };
}

/** Line iterator with page/line numbers over cleaned text. */
function* lines(doc: ParsedDocument) {
  for (const p of doc.pages) {
    const ls = cleanText(p.text).split(/\n/);
    for (let i = 0; i < ls.length; i++) yield { page: p.page, line: i + 1, text: ls[i], next: ls[i + 1] ?? "" };
  }
}

const CAPACITY = /(กำลัง(การ)?ผลิต(ไฟฟ้า)?(ติดตั้ง)?(รวม)?|installed capacity|capacity)[^\d\n]{0,40}?(\d[\d,]*(?:\.\d+)?)\s*(MWp|MW|kWp|kW|kVA|MVA|เมกะวัตต์|กิโลวัตต์)/iu;
const LICENCE_NO = /(?:เลขที่(?:ใบอนุญาต)?|licen[cs]e\s*no\.?)\s*[:：]?\s*((?:กกพ\.?-?ผฟ|ERC-GL|สกพ)[-\s]?[\dA-Z]{2,6}[-/][\dA-Z]{2,6}(?:[-/][\dA-Z]{1,6})?)/iu;
const LICENCE_BARE = /\b((?:กกพ\.?-?ผฟ|ERC-GL)-\d{4}-\d{3,5})\b/u;
const VALID_UNTIL = /(หมดอายุ|วันสิ้นอายุ|ใช้ได้ถึง|valid (?:until|to)|expir(?:y|es|ation)(?: date)?)\s*[:：]?\s*/iu;
const OWNER = /(บริษัท\s+[^\n]{2,60}?\s+จำกัด(?:\s*\(มหาชน\))?|[A-Z][A-Za-z&.,\s]{2,60}\b(?:Co\.,?\s*Ltd\.?|PCL|Public Company Limited))/u;
const PROJECT = /(?:ชื่อโครงการ|โครงการ|project(?: name)?)\s*[:：]?\s*((?:โรงไฟฟ้า|โซลาร์|solar|wind|biomass|ชีวมวล)[^\n]{2,70})/iu;
const LOCATION = /(ตำบล|ต\.)\s*([^\s]+)\s*(อำเภอ|อ\.)\s*([^\s]+)\s*(จังหวัด|จ\.)\s*([^\s\n]+)/u;
const UTM = /\b(\d{6})\s*E\s*[,/ ]\s*(\d{7})\s*N\b/iu;
const LATLON = /\b(1[0-9]|20|[5-9])\.(\d{3,7})\s*[,°N ]+\s*(9[7-9]|10[0-6])\.(\d{3,7})\b/u;
const TECH: [RegExp, string][] = [
  [/ทุ่นลอยน้ำ|floating/iu, "solar-float"],
  [/บนหลังคา|rooftop|roof/iu, "solar-roof"],
  [/(พลังงาน)?แสงอาทิตย์.*(พื้นดิน|ground)|solar farm|ground[- ]mounted/iu, "solar-ground"],
  [/พลังงานลม|wind (farm|turbine)/iu, "wind"],
  [/ก๊าซชีวภาพ|biogas/iu, "biogas"],
  [/ชีวมวล|biomass/iu, "biomass"],
];
const PHASE: [RegExp, string][] = [
  [/ระยะรื้อถอน|decommission/iu, "decommissioning"],
  [/ระยะดำเนินการ|เปิดดำเนินการ|commercial operation|\bCOD\b/iu, "operation"],
  [/ระยะก่อสร้าง|ระหว่างก่อสร้าง|under construction/iu, "construction"],
  [/ก่อนการก่อสร้าง|ระยะเตรียมการ|pre-construction/iu, "pre-construction"],
];
/** A named laboratory: "ห้องปฏิบัติการ <name> จำกัด", "บริษัท … จำกัด" after ห้องปฏิบัติการ, or "<Name> Laboratory". */
const LAB = /(?:ห้องปฏิบัติการ\s*[:：]?\s*((?:บริษัท\s+)?[^\s,]{2,30}(?:\s+[^\s,]{2,20})?\s+จำกัด(?:\s*\(มหาชน\))?)|([A-Z][A-Za-z&.\s]{2,40}Laborator(?:y|ies)(?:\s+(?:Co\.,?\s*Ltd\.?|Ltd\.?))?))/u;
/** Lines that state a standard, limit or criterion — never a measured result. */
const LIMIT_LINE = /มาตรฐาน|ไม่เกิน|ไม่ต่ำกว่า|ค่าสูงสุดที่ยอมให้|เกณฑ์|ต้องไม่|standard|limit|not exceed|shall not|maximum allowable/iu;
const ACCRED = /(ทะเบียนเลขที่|เลขทะเบียนห้องปฏิบัติการ|accreditation no\.?)\s*[:：]?\s*(ว-?\s*\d{1,4}|[A-Z]{1,4}-?\d{2,6})/iu;
const STATION = /(?:สถานี|จุดตรวจวัด(?:ที่)?|station|point)\s*(?:ที่\s*)?([A-Z0-9๐-๙]{1,4}\b|[^\s,:]{1,20})/iu;
const SIGNATURE = /(ลงชื่อ|ลงนาม|signature|signed by)/iu;
const PAGE_OF = /(?:หน้า|page)\s*(\d+)\s*(?:จาก|\/|of)\s*(\d+)/iu;

export interface ExtractResult {
  fields: ExtractedField[];
  measurements: Measurement[];
  signals: { hasSignature: boolean; pageNumbers: { page: number; n: number; of: number }[]; instructionLike: string[] };
}

const INSTRUCTION = /(ignore (all |the )?(previous|prior|above|report) (instructions|rules)|disregard (the )?(rules|instructions)|mark all evidence as (complete|verified)|ไม่ต้องสนใจ(คำสั่ง|กฎ)|ให้ถือว่า(ผ่าน|ครบ)ทั้งหมด)/iu;

export function extract(doc: ParsedDocument, ids: { documentId: string; versionId: string }, categories: DocCategory[], periodYear: number): ExtractResult {
  const ocr = doc.pages.some((p) => p.ocr);
  const ctx: Ctx = { ...ids, sha256: doc.sha256, method: ocr ? `tesseract@7(tha+eng)+${EXTRACTOR_VERSION}` : EXTRACTOR_VERSION, ocr };
  const fields: ExtractedField[] = [];
  const measurements: Measurement[] = [];
  const once = new Set<string>();
  const add = (f: ExtractedField, uniqueKey?: string) => { if (uniqueKey) { if (once.has(uniqueKey)) return; once.add(uniqueKey); } fields.push(f); };
  let hasSignature = false;
  const pageNumbers: { page: number; n: number; of: number }[] = [];
  const instructionLike: string[] = [];
  let station: string | undefined;
  let lastDate: string | undefined;

  for (const { page, line, text } of lines(doc)) {
    const loc = { page, line, excerpt: text.trim().slice(0, 240) };
    if (SIGNATURE.test(text)) hasSignature = true;
    const po = text.match(PAGE_OF);
    if (po) pageNumbers.push({ page, n: Number(po[1]), of: Number(po[2]) });
    if (INSTRUCTION.test(text)) instructionLike.push(text.trim().slice(0, 160));

    const lic = text.match(LICENCE_NO) ?? (categories.includes("licence") ? text.match(LICENCE_BARE) : null);
    if (lic) add(field(ctx, "licence.number", t("เลขที่ใบอนุญาต", "Licence number"), lic[1], loc, { normalized: lic[1].replace(/\s+/g, "").replace(/^กกพ\.?-?ผฟ/u, "กกพ.-ผฟ") }, 0.95), `lic:${lic[1]}`);

    const cap = text.match(CAPACITY);
    if (cap) {
      const unit = normalizeUnit(cap[7])!;
      const v = parseNumber(cap[6]);
      const key = unit === "MWp" || unit === "kWp" ? "capacity.dc" : unit === "kVA" || unit === "MVA" ? "capacity.inverter" : "capacity.ac";
      if (v !== null) add(field(ctx, key, t("กำลังผลิตติดตั้ง", "Installed capacity"), `${cap[6]} ${cap[7]}`, loc, { normalized: unit === "kW" || unit === "kWp" ? v / 1000 : v, unit: unit === "kW" ? "MW" : unit === "kWp" ? "MWp" : unit }, 0.9), `${key}:${v}:${unit}:${page}`);
    }

    const vu = text.match(VALID_UNTIL);
    if (vu) {
      const d = findDates(text.slice(vu.index! + vu[0].length - 1))[0] ?? findDates(text)[0];
      if (d) add(field(ctx, "validity.until", t("ใช้ได้ถึง / หมดอายุ", "Valid until / expiry"), d.raw, loc, { normalized: d.iso, date: d.iso }, 0.9), `vu:${d.iso}`);
    }

    const ow = text.match(OWNER);
    if (ow && /ผู้รับใบอนุญาต|ผู้ประกอบกิจการ|เจ้าของ|owner|licensee|operator|^บริษัท/iu.test(text)) add(field(ctx, "project.owner", t("เจ้าของโครงการ / ผู้รับใบอนุญาต", "Owner / licensee"), ow[1].trim(), loc, { normalized: ow[1].replace(/\s+/g, " ").trim() }, 0.8), "owner");

    const pj = text.match(PROJECT);
    if (pj) add(field(ctx, "project.name", t("ชื่อโครงการ", "Project name"), pj[1].trim(), loc, { normalized: pj[1].replace(/\s+/g, " ").trim().replace(/[.,;]+$/, "") }, 0.75), "project");

    const lc = text.match(LOCATION);
    if (lc) add(field(ctx, "site.location", t("ที่ตั้ง", "Location"), lc[0], loc, { normalized: `ต.${lc[2]} อ.${lc[4]} จ.${lc[6]}` }, 0.85), "location");

    const utm = text.match(UTM);
    if (utm) add(field(ctx, "site.coordinates", t("พิกัด", "Coordinates"), utm[0], loc, { normalized: `UTM ${utm[1]}E ${utm[2]}N` }, 0.85), "coord");
    const ll = text.match(LATLON);
    if (ll && !utm) add(field(ctx, "site.coordinates", t("พิกัด", "Coordinates"), ll[0], loc, { normalized: `${ll[1]}.${ll[2]}, ${ll[3]}.${ll[4]}` }, 0.8), "coord");

    for (const [re, tech] of TECH) if (re.test(text)) { add(field(ctx, "project.technology", t("เทคโนโลยี", "Technology"), text.trim().slice(0, 80), loc, { normalized: tech }, 0.7), `tech:${tech}`); break; }
    for (const [re, ph] of PHASE) if (re.test(text)) { add(field(ctx, "project.phase", t("ระยะของโครงการ", "Project phase"), text.trim().slice(0, 80), loc, { normalized: ph }, 0.6), `phase:${ph}`); break; }

    // Blank forms and regulations state limits, not results: never mine them for measurements.
    if (categories[0] !== "regulation" && categories.some((c) => c === "lab-report" || c.startsWith("measurement-"))) {
      const lab = text.match(LAB);
      const labName = lab ? (lab[1] ?? lab[2])?.trim() : undefined;
      if (labName) add(field(ctx, "lab.name", t("ห้องปฏิบัติการ", "Laboratory"), labName, loc, { normalized: labName.replace(/\s+/g, " ") }, 0.8), "lab");
      const ac = text.match(ACCRED);
      if (ac) add(field(ctx, "lab.accreditation", t("เลขทะเบียนห้องปฏิบัติการ", "Laboratory accreditation no."), ac[2], loc, { normalized: ac[2].replace(/\s+/g, "") }, 0.9), "accred");
      const st = text.match(STATION);
      if (st && st[1] && !/^\d{2,}$/.test(st[1])) station = `สถานี ${st[1].replace(/[:：]/g, "")}`;
      const dts = findDates(text);
      if (dts.length) lastDate = dts[0].iso;

      // measurement lines: "<parameter> ... <value> <unit>"
      const { medium, parameter } = LIMIT_LINE.test(text) ? { medium: "other" as const, parameter: "" } : canonicalParameter(text);
      if (medium !== "other") {
        const m = text.match(/(?:^|\s|:|：)(ND|N\.D\.|ไม่พบ|ไม่ได้ตรวจวัด|N\/M|<\s*\d+(?:\.\d+)?|-?\d[\d,]*(?:\.\d+)?)\s*(dB\s*\(?A\)?|dBA|เดซิเบลเอ|mg\/m3|mg\/m³|µg\/m3|ug\/m3|mg\/l|มก\.\/ลบ\.ม\.|มก\.\/ล\.)?\s*$/iu);
        if (m && !/^\d{4}$/.test(m[1])) {
          const pv = parseValue(m[1]);
          const unit = normalizeUnit(m[2]);
          const f = field(ctx, `measurement.${medium}.${parameter}`, t(`ผลตรวจวัด ${parameter}`, `${parameter} result`), m[0].trim(), loc, { normalized: pv.value ?? undefined, unit, state: pv.state, date: lastDate }, pv.state === "unclear" ? 0.4 : 0.85);
          fields.push(f);
          measurements.push({ id: `MEA-${f.id.slice(4)}`, fieldId: f.id, medium, parameter, station, date: lastDate, value: pv.value, state: pv.state, unit, detectionLimit: pv.detectionLimit, periodLabel: lastDate && Number(lastDate.slice(0, 4)) < periodYear ? "historical" : "current", sourceDocumentId: ids.documentId });
        }
      }
    }
  }

  // spreadsheets / CSV: header-driven measurement rows
  for (const tbl of doc.tables) {
    const header = (tbl.rows[0] ?? []).map((h) => cleanText(String(h ?? "")).toLowerCase());
    const col = (re: RegExp) => header.findIndex((h) => re.test(h));
    const cParam = col(/parameter|พารามิเตอร์|ดัชนี/iu), cVal = col(/^(value|result|ผล|ค่า)/iu), cUnit = col(/unit|หน่วย/iu), cSt = col(/station|สถานี|จุด/iu), cDate = col(/date|วันที่/iu);
    if (cParam < 0 || cVal < 0) continue;
    tbl.rows.slice(1).forEach((row, i) => {
      const label = String(row[cParam] ?? "");
      const { medium, parameter } = canonicalParameter(label);
      const pv = parseValue(row[cVal] as string | number | null);
      const unit = normalizeUnit(cUnit >= 0 ? String(row[cUnit] ?? "") : undefined);
      const date = cDate >= 0 ? (typeof row[cDate] === "string" ? findDates(String(row[cDate]))[0]?.iso : undefined) : undefined;
      const cell = `${String.fromCharCode(65 + cVal)}${i + 2}`;
      const f = field(ctx, `measurement.${medium}.${parameter}`, t(`ผลตรวจวัด ${parameter}`, `${parameter} result`), String(row[cVal] ?? ""), { sheet: tbl.sheet, cell, excerpt: row.join(" | ").slice(0, 240) }, { normalized: pv.value ?? undefined, unit, state: pv.state, date }, pv.state === "unclear" ? 0.4 : 0.92);
      fields.push(f);
      measurements.push({ id: `MEA-${f.id.slice(4)}`, fieldId: f.id, medium: medium === "other" ? "other" : medium, parameter, station: cSt >= 0 ? String(row[cSt] ?? "") || undefined : undefined, date, value: pv.value, state: pv.state, unit, detectionLimit: pv.detectionLimit, periodLabel: date && Number(date.slice(0, 4)) < periodYear ? "historical" : "current", sourceDocumentId: ids.documentId });
    });
  }

  // photos: provenance only from metadata; unknown stays unknown (COP-DI-14)
  if (doc.image) {
    fields.push(field(ctx, "photo.takenAt", t("วันที่ถ่ายภาพ", "Photo date"), doc.image.takenAt ?? "unknown", { excerpt: doc.fileName }, { state: doc.image.takenAt ? "value" : "not-provided", normalized: doc.image.takenAt, date: doc.image.takenAt }, doc.image.takenAt ? 0.95 : 0));
    fields.push(field(ctx, "photo.gps", t("พิกัดภาพถ่าย", "Photo GPS"), doc.image.gps ? `${doc.image.gps.lat},${doc.image.gps.lon}` : "unknown", { excerpt: doc.fileName }, { state: doc.image.gps ? "value" : "not-provided", normalized: doc.image.gps ? `${doc.image.gps.lat.toFixed(5)}, ${doc.image.gps.lon.toFixed(5)}` : undefined }, doc.image.gps ? 0.95 : 0));
  }

  // document-level dates: first date on page 1 is a weak "as-of" signal
  const firstDate = findDates(doc.pages[0]?.text ?? "")[0];
  if (firstDate) fields.push(field(ctx, "document.date", t("วันที่เอกสาร", "Document date"), firstDate.raw, { page: 1, excerpt: firstDate.raw }, { normalized: firstDate.iso, date: firstDate.iso }, 0.6));

  return { fields, measurements, signals: { hasSignature, pageNumbers, instructionLike } };
}
