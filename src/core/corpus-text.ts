import type { Clause, SourceType } from "./corpus";

/**
 * Pure text helpers for the Legal Corpus: Thai PDF repair and clause chunking.
 * Kept free of Node APIs so they are unit-tested and reusable in the app.
 */

/** Thai digits ๐–๙ → 0–9, so clause ids are stable ("ข้อ ๑๒" → "ข้อ 12"). */
export const thaiDigitsToArabic = (x: string): string =>
  x.replace(/[๐-๙]/gu, (d) => String(d.charCodeAt(0) - 0x0e50));

/**
 * Repair a common pdf.js defect in Thai: SARA AM (ำ) is emitted as a space followed by
 * SARA AA ("ก ากับ" for "กำกับ", "น้ า" for "น้ำ"). No Thai word starts with า, so a space
 * before า that follows a consonant (and optional tone mark) is always this defect.
 */
export const normalizeThai = (t: string): string =>
  t
    .replace(/[-]/gu, (c) => THAI_PUA[c.charCodeAt(0) - 0xf700] ?? "")
    // SARA AM decomposed as NIKHAHIT + (tone) + SARA AA → SARA AM ("กําลัง" → "กำลัง")
    .replace(/ํ([่-๋]?)า/gu, "$1ำ")
    .replace(/([ก-ฮ][่-๋]?) า/gu, "$1ำ");

/**
 * Legacy Thai fonts place positional glyph variants of tone marks and vowels in the Private Use
 * Area (U+F700–U+F71A). PDFs built with them extract "ผูจัดทํา" instead of "ผู้จัดทำ". This is the
 * standard PUA → Unicode mapping, indexed from U+F700.
 */
const THAI_PUA = [
  "ฐ", // F700 ฐ without descender
  "ิ", "ี", "ึ", "ื", // F701–F704 shifted-left upper vowels
  "่", "้", "๊", "๋", "์", // F705–F709 shifted-left tone marks + thanthakhat
  "่", "้", "๊", "๋", "์", // F70A–F70E lowered tone marks + thanthakhat
  "ญ", // F70F ญ without descender
  "ั", "ํ", "็", // F710–F712 shifted-left mai han-akat, nikhahit, maitaikhu
  "่", "้", "๊", "๋", "์", // F713–F717 lowered + shifted-left tone marks
  "ุ", "ู", "ฺ", // F718–F71A lowered sara u, sara uu, phinthu
];

/** Tone marks per Thai consonant. Normal prose is about 0.1–0.3; near 0 means the PDF font dropped them. */
export function thaiMarkRatio(text: string): number | undefined {
  const consonants = (text.match(/[ก-ฮ]/gu) ?? []).length;
  if (consonants < 200) return undefined;
  const tones = (text.match(/[่-๋]/gu) ?? []).length;
  return Math.round((tones / consonants) * 1000) / 1000;
}

const NUM = "[\\d\\u0E50-\\u0E59]+";

/** Section-heading regex for a source type. Anchored to a line start; tone marks optional. */
export function headingPattern(type: SourceType): RegExp {
  // [^\S\n]* = any horizontal whitespace including NBSP, but not a line break
  if (type === "act" || type === "decree") return new RegExp(`^[^\\S\\n]*(มาตรา\\s*${NUM}(?:/${NUM})?(?:\\s*(?:ทวิ|ตรี|จัตวา|เบญจ))?)`, "gmu");
  if (type === "form" || type === "standard" || type === "other") return new RegExp(`^[^\\S\\n]*(ส\\u0E48?วนที่\\s*${NUM})`, "gmu");
  return new RegExp(`^[^\\S\\n]*(ข\\u0E49?อ\\s*${NUM}(?:/${NUM})?)(?=\\s)`, "gmu");
}

const tidyLabel = (raw: string) =>
  thaiDigitsToArabic(raw.replace(/\s+/g, " "))
    .replace(/^สวนที่/u, "ส่วนที่")
    .replace(/^ขอ /u, "ข้อ ");

/**
 * Split a document into clauses. Acts and decrees split on มาตรา N, regulations and
 * notifications on ข้อ N, report forms on ส่วนที่ N — across the whole document, not per page.
 * Numbers may be Thai numerals. Line anchoring keeps in-text references ("ตามข้อ ๑๒") inside
 * their clause. A heading repeated on the next page is merged; one repeated later gets " (2)".
 * Documents with fewer than two headings fall back to paragraphs.
 */
export function chunkClauses(sourceId: string, type: SourceType, pages: string[]): Clause[] {
  const starts: number[] = [];
  let doc = "";
  pages.forEach((p, i) => {
    starts[i] = doc.length;
    doc += p + "\n";
  });
  const pageAt = (off: number) => {
    let i = 0;
    while (i + 1 < starts.length && starts[i + 1] <= off) i++;
    return i + 1;
  };

  const heads = [...doc.matchAll(headingPattern(type))];
  const clauses: Clause[] = [];

  if (heads.length >= 2) {
    const preamble = doc.slice(0, heads[0].index).trim();
    if (preamble.length > 40) clauses.push({ id: `${sourceId}#preamble`, sourceId, label: "preamble", text: preamble, page: 1 });
    const seen = new Map<string, number>();
    let prevBase = "";
    heads.forEach((m, i) => {
      const from = m.index!;
      const to = i + 1 < heads.length ? heads[i + 1].index! : doc.length;
      const text = doc.slice(from, to).trim();
      const base = tidyLabel(m[1]);
      if (base === prevBase && clauses.length) {
        clauses[clauses.length - 1].text += "\n" + text; // same heading continued on the next page
        return;
      }
      prevBase = base;
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      const label = n === 1 ? base : `${base} (${n})`;
      clauses.push({ id: `${sourceId}#${label}`, sourceId, label, text, page: pageAt(from) });
    });
    return clauses;
  }

  let seq = 0;
  pages.forEach((p, i) => {
    for (const para of p.split(/\n{2,}/).map((x) => x.trim()).filter((x) => x.length > 40)) {
      seq++;
      clauses.push({ id: `${sourceId}#¶ ${seq}`, sourceId, label: `¶ ${seq}`, text: para, page: i + 1 });
    }
  });
  return clauses;
}
