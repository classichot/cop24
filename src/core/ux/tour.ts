import { t } from "../i18n-text";
import type { LText } from "../types";

/**
 * Demo mode — the guided tour. Each step names the page it lives on, the element it spotlights
 * (a CSS selector, optionally narrowed by visible text), what to say, and whether the demo should
 * perform the action itself ("act") so the viewer sees the result without doing anything.
 */
export interface TourStep {
  id: string;
  route: string;
  selector?: string;
  text?: RegExp;
  title: LText;
  body: LText;
  act?: "click";
}

export const TOUR: TourStep[] = [
  { id: "welcome", route: "/", title: t("ยินดีต้อนรับสู่ COP24", "Welcome to COP24"), body: t("ทัวร์นี้พาดูวิธีใช้ COP24 ใน 3 นาที: ถามเป้าหมาย นำเข้าเอกสาร สร้างรายงานคลิกเดียว ภารกิจ AI และสิ่งที่คุณต้องอนุมัติ ข้อมูลทั้งหมดเป็นตัวอย่าง กด “ถัดไป” หรือเปิดเล่นอัตโนมัติ", "This tour shows how to use COP24 in about 3 minutes: ask for a goal, import documents, generate a report in one click, run an AI mission and see what you approve. All data is sample data. Press Next, or switch on auto-play.") },
  { id: "ai-badge", route: "/", selector: ".ai-badge", title: t("สถานะ AI", "AI status"), body: t("“AI READY” กะพริบเมื่อเชื่อมต่อโมเดล AI ได้จริง ถ้าไม่มี COP24 ยังทำงานได้แบบออฟไลน์จากข้อมูลของตัวเอง กดที่นี่เพื่อเปิด Paul", "“AI READY” blinks when an AI model is genuinely connected. Without one, COP24 still works offline from its own data. Click it to open Paul.") },
  { id: "copilot", route: "/", selector: ".copilot-trigger", title: t("24 Copilot — เริ่มจากเป้าหมาย", "24 Copilot — start from a goal"), body: t("เปิดได้ทุกหน้า (Ctrl+K) บอกสิ่งที่ต้องการเป็นภาษาธรรมดา Copilot จะเลือกภารกิจ บอกข้อมูลที่มีและที่ขาด และวางแผนให้", "Open it from any page (Ctrl+K). Say what you need in plain words; the Copilot picks the mission, shows the data you have and what is missing, and plans the work.") },
  { id: "ask", route: "/", selector: ".ask-panel", title: t("ถาม 24 บนหน้าหลัก", "Ask 24 on the home page"), body: t("พิมพ์ เช่น “เตรียมรายงาน CoP ขั้นต้นของลพบุรี 1” แล้วเลือก ทำเอง / แนะนำฉัน / ทำให้ฉัน หรือกดการ์ดเป้าหมายที่พบบ่อย", "Type e.g. “prepare the preliminary CoP report for Lopburi 1”, then choose Do it myself / Guide me / Do it for me — or tap one of the common goal cards.") },
  { id: "header", route: "/", selector: ".app-header .hdr-group", title: t("บทบาท โหมด ภาษา และธีม", "Role, mode, language and theme"), body: t("บทบาทเปลี่ยนสิ่งที่เห็น (ผู้ให้ข้อมูลเห็นเฉพาะงานของตัวเอง) โหมดง่ายซ่อนเครื่องมือผู้เชี่ยวชาญ โหมด AGI เปิดทีม AI แบบ Swarm", "The role changes what you see (a contributor sees only their own tasks). Easy mode hides expert tools; AGI mode adds AI swarms.") },
  { id: "menu", route: "/", selector: ".sidenav", title: t("เมนูซ้าย", "The left menu"), body: t("ทุกเมนูมีหมายเลข ป้าย AI ทึบ = ใช้ AI ที่เชื่อมต่ออยู่ ป้ายเส้นประ = AI จะช่วยได้ ลากขอบเพื่อปรับความกว้าง หรือย่อเหลือแต่หมายเลข", "Every item is numbered. A solid AI badge means the screen uses the connected AI; a dashed one means AI would help. Drag the edge to resize, or collapse it to the numbers.") },
  { id: "journey", route: "/journey", selector: ".jmap-line", title: t("เส้นทางการใช้งาน — เริ่ม ต่อไป จบ", "App journey — start, next, finish"), body: t("รายงานหนึ่งฉบับเดินตามเส้นทางเดียว 8 ขั้น เริ่มที่หน้าหลัก ผ่านนำเข้าเอกสาร สร้างร่าง อนุมัติ ตรวจก่อนยื่น และจบที่รายงานและผลลัพธ์ ในเมนูซ้ายมีป้าย เริ่ม · 2–7 · จบ กำกับไว้", "One report follows one 8-stage path: start at Home, then import, generate, approve, preflight, and finish at Reports & outputs. The left menu marks each stage START · 2–7 · FINISH.") },
  { id: "next", route: "/missions", selector: ".nextstep", title: t("“ต่อไป” บนทุกหน้า", "“Next” on every page"), body: t("แถบนี้บอกเสมอว่าควรทำอะไรต่อ คำนวณจากสถานะจริงของโครงการ", "This strip always says what to do next, worked out from the project's live status.") },
  { id: "tools", route: "/missions", selector: ".page-tools", title: t("อธิบายหน้านี้ และคู่มือขั้นตอน", "Explain me and Playbook"), body: t("ทุกหน้ามีปุ่มอธิบายว่าหน้านี้ใช้ทำอะไร และคู่มือทีละขั้น พร้อมส่งต่อให้ Paul อธิบายเพิ่ม", "Every page has a button explaining what it is for and a step-by-step playbook, with a hand-off to Paul for more.") },
  { id: "jstrip", route: "/ingest", selector: ".jstrip", title: t("แถบเส้นทางบนทุกหน้า", "The journey strip on every page"), body: t("บอกว่าหน้านี้เป็นขั้นที่เท่าไร เสร็จเมื่อไร เมนูก่อนหน้า และเมนูถัดไป", "It says which stage this page is, when it is done, the previous menu and the next one.") },
  { id: "ingest", route: "/ingest", selector: "button", text: /ลองชุดตัวอย่าง|Try the sample set/, title: t("นำเข้าเอกสารครั้งเดียว", "Import everything once"), body: t("ลากไฟล์ โฟลเดอร์ หรือ ZIP มาวาง ไม่ต้องตั้งชื่อหรือแยกหมวด เดโมจะโหลดชุดตัวอย่างให้", "Drop files, a folder or a ZIP — no naming or sorting. The demo loads the sample set for you."), act: "click" },
  { id: "ingest-result", route: "/ingest", selector: ".cells", title: t("AI อ่าน จัดหมวด และตรวจให้", "The AI reads, sorts and checks"), body: t("ความพร้อมของหลักฐาน สิ่งที่ AI ทำแล้ว และสิ่งที่ต้องการความสนใจ — คุณตรวจเฉพาะข้อยกเว้น", "Evidence readiness, what the AI has done and what needs attention — you review only the exceptions.") },
  { id: "oneclick", route: "/factory", selector: ".oneclick", title: t("สร้างรายงานคลิกเดียว", "One-click report generation"), body: t("เลือกโรงไฟฟ้าและชนิดรายงาน เดโมจะกดสร้างให้", "Pick the plant and the report. The demo presses Generate for you.") },
  { id: "generate", route: "/factory", selector: ".oneclick-btn", title: t("กดครั้งเดียว", "One click"), body: t("ทีม AI ระบุข้อกำหนด ตรวจหลักฐาน ร่างทุกบท และตรวจคุณภาพ", "The AI team identifies requirements, checks evidence, drafts every section and runs QA."), act: "click" },
  { id: "draft", route: "/factory", selector: ".oneclick-report", title: t("ร่างจากหลักฐานจริง", "A draft from real evidence"), body: t("บทที่มีหลักฐานแสดงแหล่งอ้างอิง บทที่ไม่มีหลักฐานถูกกั้นไว้เป็นสีแดง — ไม่มีการแต่งข้อมูล", "Sections with evidence show their sources; sections without evidence are blocked in red — nothing is invented.") },
  { id: "agi", route: "/agi", selector: ".agi-flag", title: t("ภารกิจ AGI", "AGI missions"), body: t("ภารกิจหลัก F01–F07 เลือกแล้วดูตัวอย่าง: ขอบเขต โหมด AI ระดับอิสระ งบ และจุดอนุมัติ ก่อนกดเริ่ม", "Flagships F01–F07. Pick one to preview scope, AI mode, autonomy, budget and approval gates before starting.") },
  { id: "catalog", route: "/agi", selector: ".agi-filters", title: t("แคตตาล็อก 108 ภารกิจ", "The 108-mission catalog"), body: t("จัดกลุ่มตามหมวด แท็ก โหมด ระยะ หรือสถานะ ภารกิจที่ยังไม่ได้สร้างแสดงเป็น “วางแผน” และเริ่มไม่ได้", "Group by category, tag, mode, priority or status. Missions not built yet show as planned and cannot be started.") },
  { id: "mywork", route: "/my-work", selector: ".page h1", title: t("งานของฉัน — เฉพาะงานที่ต้องเป็นคน", "My work — only what needs a person"), body: t("ตัดสินค่าที่ขัดแย้ง อนุมัติบทที่ AI ร่าง ส่งคำขอเอกสาร และจัดการข้อยกเว้น", "Decide conflicting values, approve AI-drafted chapters, send evidence requests and handle exceptions.") },
  { id: "outputs", route: "/outputs", selector: ".interp", title: t("พร้อมยื่นหรือยัง", "Ready to file?"), body: t("ผลลัพธ์ทุกชิ้นบอกว่าคืออะไร สถานะ และต้องทำอะไรต่อ — COP24 เตรียมชุดยื่น ส่วนการลงนามและการยื่นเป็นของคน", "Every output says what it is, its status and what next. COP24 prepares the package; signing and filing stay with people.") },
  { id: "paul", route: "/outputs", selector: ".paul-fab", title: t("Paul — ผู้ช่วยของคุณ", "Paul — your assistant"), body: t("ถามวิธีใช้แอป ถามข้อกฎหมาย CoP (ตอบพร้อมอ้างอิงระเบียบ กกพ.) หรือบอกสิ่งที่ควรปรับปรุง", "Ask how to use the app, ask about CoP law (answers cite the ERC rules), or tell us what should improve.") },
  { id: "done", route: "/outputs", title: t("จบทัวร์", "That's the tour"), body: t("เปิด “คู่มือผู้ใช้” ได้จากปุ่มเดโมด้านบน หรือถาม Paul เมื่อต้องการความช่วยเหลือ", "Open the user manual from the Demo button at the top, or ask Paul whenever you need help.") },
];

export const tourIndex = (id: string) => Math.max(0, TOUR.findIndex((s) => s.id === id));
