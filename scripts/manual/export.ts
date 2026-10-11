/**
 * Exports the user manual (src/data/manual.ts), the app journey and the demo-mode steps to
 * docs/12-user-manual.md, so the manual can be shared as a document as well as read in the app.
 *   npm run manual:md
 */
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { MANUAL, MANUAL_VERSION } from "../../src/data/manual";
import { APP_JOURNEY } from "../../src/core/ux/app-journey";
import { TOUR } from "../../src/core/ux/tour";
import { navNumber } from "../../src/core/ux/nav";

const ROOT = resolve(import.meta.dirname, "../..");
const out: string[] = [];
const p = (...l: string[]) => out.push(...l);

for (const lang of ["en", "th"] as const) {
  const L = (x: { th: string; en: string }) => x[lang];
  const isEn = lang === "en";
  p(isEn ? "# COP24 user manual" : "# คู่มือผู้ใช้ COP24", "", `_${MANUAL_VERSION}_`, "");
  p(isEn ? "## The app journey at a glance" : "## เส้นทางการใช้งานโดยย่อ", "");
  p(isEn ? "| Stage | Menu | What you do | Move on when |" : "| ขั้น | เมนู | ทำอะไร | ไปต่อเมื่อ |", "| --- | --- | --- | --- |");
  APP_JOURNEY.forEach((s, i) => {
    const mark = s.kind === "start" ? (isEn ? "**START**" : "**เริ่ม**") : s.kind === "finish" ? (isEn ? "**FINISH**" : "**จบ**") : String(i + 1);
    p(`| ${mark} · ${L(s.stage)} | ${navNumber(s.route)} \`${s.route}\` | ${L(s.doHere)} | ${L(s.doneWhen)} |`);
  });
  p("");
  for (const s of MANUAL) {
    p(`## ${L(s.title)}`, "", L(s.intro), "");
    s.steps?.forEach((x, i) => p(`${i + 1}. ${L(x)}`));
    if (s.steps) p("");
    s.notes?.forEach((n) => p(`> ${L(n)}`, ""));
    if (s.tour) p(isEn ? `_In the app: press **Show me** to watch this in demo mode (step “${s.tour}”)._` : `_ในแอป: กด **ดูให้ฉันดู** เพื่อดูในโหมดเดโม (ขั้น “${s.tour}”)_`, "");
  }
  p(isEn ? "## Demo mode — the guided tour" : "## โหมดเดโม — ทัวร์นำชม", "");
  p(isEn ? "Start it with **▶ Demo** in the header, **Watch the demo** on the sign-in page, or any **Show me** button. Use Next/Back or the arrow keys, tick Auto-play to advance every 7 seconds, Esc to exit. Steps marked ⚡ are performed for you." : "เริ่มได้จากปุ่ม **▶ เดโม** ด้านบน **ดูเดโมนำชม** ที่หน้าเข้าสู่ระบบ หรือปุ่ม **ดูให้ฉันดู** ใช้ ถัดไป/ย้อนกลับ หรือปุ่มลูกศร เลือกเล่นอัตโนมัติเพื่อเลื่อนทุก 7 วินาที กด Esc เพื่อออก ขั้นที่มี ⚡ เดโมจะทำให้", "");
  TOUR.forEach((s, i) => p(`${i + 1}. **${L(s.title)}**${s.act ? " ⚡" : ""} — ${L(s.body)} _(\`${s.route}\`)_`));
  p("", "---", "");
}

const file = join(ROOT, "docs/12-user-manual.md");
writeFileSync(file, out.join("\n").replace(/\n---\n\n$/, "\n"));
console.log(`wrote ${file} · ${MANUAL.length} sections · ${APP_JOURNEY.length} journey stages · ${TOUR.length} tour steps`);
