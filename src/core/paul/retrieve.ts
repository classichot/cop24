/**
 * Paul — legal retrieval over the committed ERC passage index (corpus/passages.json).
 * Thai has no spaces between words, so Thai text is matched by character trigrams; Latin words
 * and numbers are matched whole. English questions are expanded with the Thai legal terms the
 * corpus actually uses. Scores are IDF-weighted with a coverage bonus, and no more than three
 * passages come from one source so an answer can compare documents.
 */

export interface SourceMeta { th: string; en: string; short: { th: string; en: string }; type: string; year?: number; url?: string }
export interface Passage { id: string; s: string[]; l: string; p?: number; t: string }
export interface PassageIndex { version: number; sources: Record<string, SourceMeta>; passages: Passage[] }
export interface Hit { passage: Passage; source: SourceMeta; score: number; matched: string[] }

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
const norm = (s: string) => s.replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d))).toLowerCase();

/** English → the Thai terms ERC documents use. */
const EXPAND: [RegExp, string[]][] = [
  [/\bnoise|sound\b/, ["ระดับเสียง", "เสียง"]],
  [/\bair\b|dust|particulate|pm10|pm2\.5|tsp/, ["คุณภาพอากาศ", "ฝุ่น"]],
  [/\bwater|effluent|wastewater/, ["คุณภาพน้ำ", "น้ำทิ้ง"]],
  [/\bwaste|garbage|hazardous/, ["ของเสีย", "กากของเสีย"]],
  [/hearing|consultation|participation|stakeholder/, ["รับฟังความคิดเห็น", "ผู้มีส่วนได้เสีย"]],
  [/licen[cs]e|permit/, ["ใบอนุญาต"]],
  [/\breport/, ["รายงาน"]],
  [/preliminary/, ["ขั้นต้น"]],
  [/\bfinal\b/, ["ขั้นสุดท้าย"]],
  [/monitor/, ["ผลการปฏิบัติตาม", "ติดตามตรวจสอบ"]],
  [/deadline|due|within|days|period|submit|when/, ["ภายใน", "ระยะเวลา", "ยื่น"]],
  [/solar|pv|photovoltaic/, ["แสงอาทิตย์", "โซลาร์"]],
  [/rooftop|roof/, ["หลังคา"]],
  [/floating/, ["ลอยน้ำ"]],
  [/\bwind\b/, ["พลังงานลม", "กังหันลม"]],
  [/capacity|megawatt|\bmw\b/, ["กำลังผลิต", "เมกะวัตต์"]],
  [/\bfee/, ["ค่าธรรมเนียม"]],
  [/penalt|fine\b|sanction/, ["โทษ", "ปรับ"]],
  [/location|site|zoning|land use/, ["ที่ตั้ง", "ผังเมือง"]],
  [/safety|accident|occupational/, ["ความปลอดภัย", "อาชีวอนามัย"]],
  [/complain/, ["ร้องเรียน"]],
  [/communit/, ["ชุมชน"]],
  [/measure|mitigat/, ["มาตรการ"]],
  [/consultant|preparer|qualif/, ["ผู้จัดทำรายงาน", "คุณสมบัติ"]],
  [/exempt/, ["ยกเว้น"]],
  [/\bcop\b|code of practice/, ["ประมวลหลักการปฏิบัติ"]],
  [/amend/, ["แก้ไขเพิ่มเติม"]],
  [/\bsoil|erosion/, ["ทรัพยากรดิน", "ชะล้าง"]],
  [/self[- ]?cert/, ["รับรองตนเอง"]],
  [/biogas/, ["ก๊าซชีวภาพ"]], [/biomass/, ["ชีวมวล"]], [/\bcoal\b/, ["ถ่านหิน"]], [/natural gas/, ["ก๊าซธรรมชาติ"]],
  [/municipal|msw/, ["ขยะชุมชน"]],
];

const STOP = new Set(["the", "a", "an", "of", "for", "to", "in", "on", "and", "or", "is", "are", "do", "does", "what", "which", "how", "i", "we", "our", "my", "me", "with", "about", "need", "must", "should", "can", "be", "it", "this", "that", "there", "any"]);

const NORMALISED = new WeakMap<PassageIndex, string[]>();

export function queryTerms(q: string): string[] {
  const n = norm(q);
  const terms = new Set<string>();
  for (const w of n.match(/[a-z0-9][a-z0-9.\-]*/g) ?? []) if (w.length >= 2 && !STOP.has(w)) terms.add(w);
  const thai = [...(n.match(/[฀-๿]+/g) ?? []), ...EXPAND.filter(([re]) => re.test(n)).flatMap(([, th]) => th)];
  for (const run of thai) {
    if (run.length <= 3) { terms.add(run); continue; }
    for (let i = 0; i + 3 <= run.length; i++) terms.add(run.slice(i, i + 3));
  }
  return [...terms];
}

export function searchPassages(idx: PassageIndex, query: string, k = 6, prefer: string[] = []): Hit[] {
  const terms = queryTerms(query);
  if (!terms.length) return [];
  const N = idx.passages.length;
  let texts = NORMALISED.get(idx);
  if (!texts) { texts = idx.passages.map((p) => norm(p.t)); NORMALISED.set(idx, texts); }
  const tx = texts;
  const df = terms.map((t) => tx.reduce((a, x) => a + (x.includes(t) ? 1 : 0), 0));
  const idf = df.map((d) => (d === 0 ? 0 : Math.log(1 + N / d)));
  const maxScore = idf.reduce((a, b) => a + b, 0) || 1;
  const scored: Hit[] = [];
  tx.forEach((x, i) => {
    let s = 0;
    const matched: string[] = [];
    terms.forEach((t, j) => { if (idf[j] && x.includes(t)) { s += idf[j]; matched.push(t); } });
    if (!s) return;
    const coverage = s / maxScore;
    const p = idx.passages[i];
    const boost = p.s.some((id) => prefer.includes(id)) ? 1.25 : 1;
    scored.push({ passage: p, source: idx.sources[p.s[0]], score: s * (0.4 + coverage) * boost, matched });
  });
  scored.sort((a, b) => b.score - a.score);
  const perSource = new Map<string, number>();
  const out: Hit[] = [];
  for (const h of scored) {
    const sid = h.passage.s[0];
    if ((perSource.get(sid) ?? 0) >= 3) continue;
    perSource.set(sid, (perSource.get(sid) ?? 0) + 1);
    out.push(h);
    if (out.length >= k) break;
  }
  return out;
}

/** Sources to prefer for a plant technology — e.g. the Solar Farm checklist for ground solar. */
export function preferredSources(tech?: string): string[] {
  const base = ["erc-cop-reg-2565", "erc-cop-reg-2567-no2"];
  const by: Record<string, string> = { "solar-ground": "erc-cop-checklist-solar-farm", "solar-roof": "erc-cop-checklist-solar-rooftop", "solar-floating": "erc-cop-checklist-floating-solar", wind: "erc-cop-checklist-wind", biomass: "erc-cop-checklist-biomass", biogas: "erc-cop-checklist-biogas" };
  return tech && by[tech] ? [...base, by[tech]] : base;
}
