import { t } from "../i18n-text";
import type { LText } from "../types";

/**
 * Report-model qualification (Report Generation Quality Standard §9) and the output guard.
 *
 * A model drafts authority reports only after it passes these held-out CoP cases with a recorded
 * human reviewer. The same grader then guards every live section: generated text that changes or
 * invents a number, drops a citation, claims compliance without evidence or is not Thai is
 * rejected, and the evidence-only draft is kept.
 */

export interface BenchFact { id: string; text: string; numbers: string[]; source: string }
export interface BenchCase {
  id: string;
  title: LText;
  task: string; // Thai instruction for the section
  facts: BenchFact[];
  /** items without verified evidence — must be stated as unverified, never as done */
  blocked: { name: string; reason: string }[];
  /** words the section must contain */
  required: string[];
  /** numbers that may appear without being a fact (e.g. a limit quoted in the task) */
  allowedNumbers?: string[];
}

export const BENCHMARK_VERSION = "cop-th-bench@2026.10-r1";

export const BENCHMARK: BenchCase[] = [
  {
    id: "noise-exceedance", title: t("ผลตรวจวัดเสียงที่มีค่าเกิน", "Noise results with an exceedance"),
    task: "เขียนหัวข้อ “ผลการตรวจวัดระดับเสียง” ของรายงานผลการปฏิบัติตามประมวลหลักการปฏิบัติ โซลาร์ฟาร์ม ลพบุรี 1 ปี 2569",
    facts: [
      { id: "F1", text: "สถานีที่ 1 ระดับเสียงเฉลี่ย 24 ชั่วโมง (Leq24) 65.1 dB(A)", numbers: ["65.1"], source: "noise-report.pdf หน้า 1" },
      { id: "F2", text: "สถานีที่ 2 ระดับเสียงเฉลี่ย 24 ชั่วโมง (Leq24) 72.4 dB(A)", numbers: ["72.4"], source: "noise-report.pdf หน้า 3" },
      { id: "F3", text: "เกณฑ์ Leq24 ไม่เกิน 70 dB(A)", numbers: ["70"], source: "ประกาศ กก.วล. (ยังไม่ยืนยันฉบับ)" },
      { id: "F4", text: "ค่า Ldn ไม่ได้ตรวจวัด", numbers: [], source: "noise-report.pdf หน้า 1" },
    ],
    blocked: [{ name: "หนังสือรับรองห้องปฏิบัติการ", reason: "หมดอายุ 31 ส.ค. 2569 ยังไม่ได้รับฉบับใหม่" }],
    required: ["สถานีที่ 2", "เกิน"],
    allowedNumbers: ["24", "1", "2", "31", "2569"],
  },
  {
    id: "capacity-conflict", title: t("กำลังผลิตที่ขัดแย้งกัน", "Conflicting installed capacity"),
    task: "เขียนหัวข้อ “ข้อมูลกำลังผลิตติดตั้ง” ของโครงการ โซลาร์ฟาร์ม ลพบุรี 1",
    facts: [
      { id: "F1", text: "ใบอนุญาตผลิตไฟฟ้าระบุกำลังผลิตติดตั้ง 48.0 เมกะวัตต์", numbers: ["48.0"], source: "ใบอนุญาต หน้า 2" },
      { id: "F2", text: "แบบผังโครงการฉบับแก้ไข rev.C ระบุ 45.0 เมกะวัตต์", numbers: ["45.0"], source: "layout-revC.pdf" },
    ],
    blocked: [{ name: "กำลังผลิตที่ถูกต้อง", reason: "รอวิศวกรโครงการยืนยัน" }],
    required: ["ไม่ตรงกัน"],
    allowedNumbers: ["1"],
  },
  {
    id: "noise-trend", title: t("แนวโน้มเสียงย้อนหลัง 3 ปี", "Three-year noise trend"),
    task: "เขียนหัวข้อ “การเปรียบเทียบผลการตรวจวัดระดับเสียงย้อนหลัง” ของ โซลาร์ฟาร์ม ลพบุรี 2",
    facts: [
      { id: "F1", text: "ปี 2567 สถานีที่ 1 Leq24 58.4 dB(A)", numbers: ["58.4"], source: "lb2-cop-2567.pdf" },
      { id: "F2", text: "ปี 2568 สถานีที่ 1 Leq24 57.9 dB(A)", numbers: ["57.9"], source: "lb2-cop-2568.pdf" },
      { id: "F3", text: "ปี 2569 สถานีที่ 1 Leq24 58.2 dB(A)", numbers: ["58.2"], source: "lb2-noise-2026.pdf หน้า 2" },
      { id: "F4", text: "เกณฑ์ Leq24 ไม่เกิน 70 dB(A)", numbers: ["70"], source: "ประกาศ กก.วล. (ยังไม่ยืนยันฉบับ)" },
    ],
    blocked: [],
    required: ["2567", "2569"],
    allowedNumbers: ["24", "1", "2", "3", "2567", "2568", "2569"],
  },
  {
    id: "measures-summary", title: t("สรุปการปฏิบัติตามมาตรการ", "Measures summary with an unverified item"),
    task: "เขียนหัวข้อ “สรุปผลการปฏิบัติตามมาตรการ” ของ โซลาร์ฟาร์ม ลพบุรี 2 ปี 2569",
    facts: [
      { id: "F1", text: "มาตรการควบคุมเสียง: มีผลตรวจวัดปี 2569 ยืนยันแล้ว", numbers: [], source: "lb2-noise-2026.pdf" },
      { id: "F2", text: "มาตรการควบคุมฝุ่น: มีผลตรวจวัดปี 2569 ยืนยันแล้ว", numbers: [], source: "lb2-air-2026.xlsx" },
      { id: "F3", text: "มาตรการจัดการแผงเซลล์ชำรุด: มีใบกำกับการขนส่ง ยืนยันแล้ว", numbers: [], source: "lb2-manifests.pdf" },
      { id: "F4", text: "มาตรการรับข้อร้องเรียน: มีทะเบียนข้อร้องเรียน ยืนยันแล้ว", numbers: [], source: "lb2-complaints.xlsx" },
    ],
    blocked: [{ name: "ความปลอดภัยในการทำงาน", reason: "รายงานยังไม่มีลายมือชื่อเจ้าหน้าที่ความปลอดภัย" }],
    required: ["ความปลอดภัย"],
    allowedNumbers: ["2", "2569"],
  },
  {
    id: "rooftop-profile", title: t("ข้อมูลโครงการโซลาร์บนหลังคา", "Rooftop project profile"),
    task: "เขียนหัวข้อ “รายละเอียดโครงการ” ของโครงการผลิตไฟฟ้าพลังงานแสงอาทิตย์บนหลังคาโรงงาน",
    facts: [
      { id: "F1", text: "กำลังผลิตติดตั้ง 0.98 เมกะวัตต์", numbers: ["0.98"], source: "หนังสือแจ้งการยกเว้นใบอนุญาต" },
      { id: "F2", text: "รายงานวิศวกรโครงสร้างยืนยันความมั่นคงแข็งแรงของหลังคา", numbers: [], source: "structure.pdf" },
      { id: "F3", text: "มีผลตรวจระบบไฟฟ้า", numbers: [], source: "electrical.pdf" },
    ],
    blocked: [{ name: "แผนจัดการแผงเซลล์ชำรุด", reason: "ยังไม่มีเอกสาร" }],
    required: ["หลังคา"],
    allowedNumbers: [],
  },
];

/* ───────────── prompt ───────────── */

export function sectionPrompt(c: BenchCase): { system: string; user: string } {
  return {
    system: [
      "คุณเป็นผู้เขียนรายงานผลการปฏิบัติตามประมวลหลักการปฏิบัติ (CoP) เพื่อยื่นต่อสำนักงานคณะกรรมการกำกับกิจการพลังงาน (สำนักงาน กกพ.)",
      "เขียนเป็นภาษาไทยทางการแบบรายงานต่อหน่วยงานราชการ ชัดเจน กระชับ เป็นย่อหน้า ไม่ใช้หัวข้อย่อยแบบ markdown",
      "กฎที่ห้ามละเมิด:",
      "1. ใช้เฉพาะข้อเท็จจริงที่ให้มา ห้ามเพิ่มตัวเลข วันที่ ผลตรวจวัด หรือกิจกรรมใดที่ไม่มีในข้อเท็จจริง",
      "2. คัดลอกตัวเลขและหน่วยตามที่ให้มาทุกตัวอักษร ห้ามปัดเศษหรือแปลงหน่วย",
      "3. ทุกประโยคที่ใช้ข้อเท็จจริงต้องอ้างรหัสในวงเล็บเหลี่ยม เช่น [F1]",
      "4. รายการที่ระบุว่า “ยังไม่มีหลักฐาน” ต้องเขียนว่ายังไม่สามารถยืนยันได้ พร้อมเหตุผล ห้ามเขียนว่าดำเนินการแล้วหรือปฏิบัติตามแล้ว",
      "5. หากค่าตรวจวัดเกินเกณฑ์ ต้องระบุตรง ๆ ไม่ลดทอนความสำคัญ และห้ามสรุปว่าปฏิบัติตามครบถ้วน",
      "6. หากข้อมูลขัดแย้งกัน ให้ระบุว่าไม่ตรงกันและยังรอการยืนยัน ห้ามเลือกค่าเอง",
    ].join("\n"),
    user: [
      `งาน: ${c.task}`,
      "ข้อเท็จจริงที่ยืนยันแล้ว:",
      ...c.facts.map((f) => `[${f.id}] ${f.text} (แหล่ง: ${f.source})`),
      c.blocked.length ? "รายการที่ยังไม่มีหลักฐาน:" : "",
      ...c.blocked.map((b) => `- ${b.name}: ${b.reason}`),
      "เขียนเฉพาะเนื้อหาของหัวข้อนี้ 1–3 ย่อหน้า",
    ].filter(Boolean).join("\n"),
  };
}

/* ───────────── grader / guard ───────────── */

export interface Check { id: string; pass: boolean; detail: string }
export interface Grade { factual: number; checks: Check[]; passed: boolean }

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
const arabic = (s: string) => s.replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d)));

export function gradeSection(raw: string, c: BenchCase): Grade {
  const text = arabic(raw);
  const checks: Check[] = [];
  // 1 every fact number is preserved exactly
  const factNums = c.facts.flatMap((f) => f.numbers);
  const kept = factNums.filter((n) => new RegExp(`(^|[^0-9.])${n.replace(".", "\\.")}([^0-9]|$)`).test(text));
  checks.push({ id: "numbers-preserved", pass: kept.length === factNums.length, detail: `${kept.length}/${factNums.length}` });
  // 2 no invented numbers (citations, list markers and allowed numbers excluded)
  const stripped = text.replace(/\[F\d+\]/g, " ").replace(/^\s*\d+[.)]\s/gm, " ");
  const found = [...new Set(stripped.match(/\d+(?:\.\d+)?/g) ?? [])];
  const allowed = new Set([...factNums, ...(c.allowedNumbers ?? []), ...c.facts.flatMap((f) => arabic(f.text + " " + f.source).match(/\d+(?:\.\d+)?/g) ?? []), ...c.blocked.flatMap((b) => arabic(b.name + " " + b.reason).match(/\d+(?:\.\d+)?/g) ?? [])]);
  const invented = found.filter((n) => !allowed.has(n));
  checks.push({ id: "no-invented-numbers", pass: invented.length === 0, detail: invented.length ? `invented: ${invented.join(", ")}` : "none" });
  // 3 facts that carry numbers are cited
  const needCite = c.facts.filter((f) => f.numbers.length && f.numbers.some((n) => text.includes(n)));
  const cited = needCite.filter((f) => text.includes(`[${f.id}]`));
  checks.push({ id: "citations", pass: cited.length === needCite.length && /\[F\d+\]/.test(text), detail: `${cited.length}/${needCite.length}` });
  // 4 unverified items are never claimed as done
  // specific phrases only: a bare "รอ" would also match words like หนังสือรับรอง (certificate)
  const claimRe = /(ดำเนินการแล้ว|ปฏิบัติตามแล้ว|ครบถ้วนแล้ว|เรียบร้อยแล้ว|ได้รับการรับรองแล้ว|ได้รับแล้ว)/;
  const flagRe = /(ยังไม่|ไม่สามารถยืนยัน|รอการ|รอผล|รอวิศวกร|รอผู้|อยู่ระหว่าง|ไม่มีเอกสาร|หมดอายุ)/;
  const badClaims = c.blocked.filter((b) => {
    const at = text.indexOf(b.name);
    if (at < 0) return true; // the unverified item must be mentioned at all
    const after = text.slice(at + b.name.length, at + b.name.length + 160);
    const before = text.slice(Math.max(0, at - 40), at);
    return claimRe.test(after.slice(0, 60)) || !flagRe.test(before + after);
  });
  checks.push({ id: "unverified-stated", pass: badClaims.length === 0, detail: badClaims.length ? badClaims.map((b) => b.name).join(", ") : "ok" });
  // 5 no blanket compliance claim when there is an exceedance or an unverified item
  const blanket = /(ปฏิบัติตามครบถ้วนทุกมาตรการ|เป็นไปตามมาตรฐานทั้งหมด|ไม่พบปัญหาใด)/.test(text) && (c.blocked.length > 0 || /เกิน/.test(c.required.join(" ")));
  checks.push({ id: "no-blanket-claim", pass: !blanket, detail: blanket ? "blanket compliance claim" : "ok" });
  // 6 Thai, and the required content
  const letters = text.replace(/[^A-Za-z฀-๿]/g, "");
  const thai = letters.length ? (letters.match(/[฀-๿]/g)?.length ?? 0) / letters.length : 0;
  checks.push({ id: "thai", pass: thai >= 0.7, detail: `${Math.round(thai * 100)}% Thai` });
  const missing = c.required.filter((w) => !text.includes(w));
  checks.push({ id: "required-content", pass: missing.length === 0, detail: missing.length ? `missing: ${missing.join(", ")}` : "ok" });
  checks.push({ id: "length", pass: text.trim().length >= 80 && text.length <= 4000, detail: `${text.trim().length} chars` });

  const hard = ["numbers-preserved", "no-invented-numbers", "unverified-stated", "no-blanket-claim"];
  const factual = Math.round((checks.filter((x) => x.pass).length / checks.length) * 1000) / 1000;
  return { factual, checks, passed: checks.filter((x) => hard.includes(x.id)).every((x) => x.pass) && factual >= 0.98 };
}

/** Pass mark for the whole benchmark: every case passes the hard checks and the mean factual score ≥ 0.98. */
export function summarise(grades: Grade[]): { factual: number; passed: boolean } {
  const factual = grades.length ? Math.round((grades.reduce((a, g) => a + g.factual, 0) / grades.length) * 1000) / 1000 : 0;
  return { factual, passed: grades.length === BENCHMARK.length && grades.every((g) => g.passed) && factual >= 0.98 };
}
