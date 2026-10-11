import { t } from "../core/i18n-text";
import type { LText } from "../core/types";

/**
 * COP24 user manual (demo edition). One source for the in-app manual (/manual) and the
 * exported Markdown (npm run manual:md → docs/12-user-manual.md). `tour` links a section to the
 * demo step that shows it.
 */
export interface ManualSection { id: string; title: LText; intro: LText; steps?: LText[]; notes?: LText[]; tour?: string }

export const MANUAL_VERSION = "COP24 user manual · demo edition · 2026-10";

export const MANUAL: ManualSection[] = [
  {
    id: "about", title: t("1. COP24 คืออะไร", "1. What COP24 is"),
    intro: t("COP24 คือแผนกปฏิบัติตาม CoP เสมือนสำหรับโรงไฟฟ้า ทีม AI ระบุข้อกำหนดของ กกพ. รวบรวมและตรวจหลักฐาน ร่างรายงาน และตรวจคุณภาพ ส่วนคุณตัดสินใจ อนุมัติ และยื่น COP24 ไม่สร้างผลตรวจวัด และไม่ยื่นรายงานแทนคุณ", "COP24 is a virtual CoP compliance department for power plants. Its AI team identifies the ERC requirements, gathers and checks evidence, drafts reports and runs QA; you decide, approve and file. COP24 never invents measurements and never files on your behalf."),
    notes: [t("ข้อมูลในเดโมเป็นข้อมูลตัวอย่างทั้งหมด", "All data in the demo is sample data.")], tour: "welcome",
  },
  {
    id: "signin", title: t("2. เข้าสู่ระบบ", "2. Signing in"),
    intro: t("เลือกบทบาทของคุณบนหน้าเข้าสู่ระบบ แต่ละบทบาทเห็นงานต่างกัน", "Choose your role on the sign-in page; each role sees different work."),
    steps: [t("เลือกบทบาท: เจ้าของโครงการ ที่ปรึกษา ผู้บริหาร หรือผู้ให้ข้อมูล", "Pick a role: Owner, Advisor, Executive or Contributor"), t("ใส่อีเมลและรหัสผ่านพื้นที่ทำงาน (ในเดโม รหัสใดก็ได้)", "Enter your email and the workspace password (any password in the demo)"), t("ผู้เข้าชมที่ได้ลิงก์เดโมเปิดลิงก์แล้วเข้าได้เลยโดยไม่ต้องใช้รหัสผ่าน", "A guest with a demo link opens it and enters without a password")],
    notes: [t("ผู้ดูแลสร้างลิงก์เดโมได้ที่ “โต๊ะผู้ดูแลเดโม” (ต้องใช้ PIN)", "Hosts mint demo links at the Host desk (PIN required)")],
  },
  {
    id: "layout", title: t("3. รู้จักหน้าจอ", "3. Finding your way around"),
    intro: t("ด้านบนคือ 24 Copilot สถานะ AI บทบาท โหมด ภาษา และธีม ด้านซ้ายคือเมนูที่มีหมายเลข ทุกหน้ามีแถบ “ต่อไป” ปุ่ม “อธิบายหน้านี้” และ “คู่มือขั้นตอน” และ Paul อยู่มุมขวาล่าง", "At the top: the 24 Copilot, AI status, role, mode, language and theme. On the left: the numbered menu. Every page has a “Next” strip, “Explain me” and “Playbook” buttons, and Paul at the bottom right."),
    steps: [t("โหมดง่ายแสดงเมนูหลัก 01–08 กด “ทุกโมดูล ▾” เพื่อดูทั้งหมด", "Easy mode shows the main items 01–08; press “All modules ▾” to see everything"), t("ป้าย AI ทึบ = หน้าจอใช้ AI ที่เชื่อมต่ออยู่ ป้ายเส้นประ = AI จะช่วยได้", "Solid AI badge = the screen uses the connected AI; dashed = AI would help"), t("ลากขอบเมนูเพื่อปรับความกว้าง หรือกด « เพื่อย่อเมนู", "Drag the menu edge to resize it, or press « to collapse it")],
    tour: "menu",
  },
  {
    id: "journey", title: t("4. เส้นทางการใช้งาน — เริ่ม ต่อไป จบ", "4. The app journey — start, next, finish"),
    intro: t("รายงาน CoP หนึ่งฉบับเดินตามเส้นทางเดียว 8 ขั้น เปิดเมนู “เส้นทางการใช้งาน” เพื่อดูแผนที่ทั้งหมด", "One CoP report follows one 8-stage path. Open the “App journey” menu to see the whole map."),
    steps: [t("เริ่ม: หน้าหลัก — บอกเป้าหมาย", "START: Home — say the goal"), t("เตรียมข้อมูล — นำเข้าเอกสารทั้งหมด", "Data preparation — import every document"), t("ศูนย์ควบคุมเอกสาร — ปิดช่องว่างหลักฐาน", "Document Control — close the evidence gaps"), t("สร้างรายงาน — ร่างคลิกเดียว", "Report generation — one-click draft"), t("งานของฉัน — ตัดสินใจและอนุมัติ", "My work — decide and approve"), t("สตูดิโอรายงาน — ตรวจทานรายบท", "Report Studio — review chapter by chapter"), t("ตรวจก่อนยื่น — แก้สิ่งที่กั้นการยื่น", "Preflight — clear the filing blockers"), t("จบ: รายงานและผลลัพธ์ — ลงนามและยื่น", "FINISH: Reports & outputs — sign and file")],
    notes: [t("ในเมนูซ้ายมีป้าย เริ่ม · 2–7 · จบ และทุกหน้าบนเส้นทางมีแถบบอกเมนูก่อนหน้าและเมนูถัดไป", "The left menu marks each stage START · 2–7 · FINISH, and every page on the path shows the previous and next menu")], tour: "journey",
  },
  {
    id: "copilot", title: t("5. ถาม 24 Copilot", "5. Ask the 24 Copilot"),
    intro: t("วิธีที่เร็วที่สุดในการเริ่มงาน บอกเป้าหมายเป็นภาษาธรรมดา", "The fastest way to start: say your goal in plain words."),
    steps: [t("กด 24 Copilot ด้านบน หรือ Ctrl+K หรือใช้ช่องบนหน้าหลัก", "Press 24 Copilot at the top, Ctrl+K, or use the box on the home page"), t("พิมพ์ เช่น “เตรียมรายงาน CoP ขั้นต้นของลพบุรี 1”", "Type e.g. “prepare the preliminary CoP report for Lopburi 1”"), t("ตรวจแผน: ข้อมูลที่มี ข้อมูลที่ขาด และขั้นตอน", "Check the plan: data in hand, data missing, steps"), t("เลือก ทำเอง / แนะนำฉัน / ทำให้ฉัน", "Choose Do it myself / Guide me / Do it for me")],
    tour: "copilot",
  },
  {
    id: "ingest", title: t("6. เตรียมข้อมูล — นำเข้าครั้งเดียว", "6. Data preparation — import once"),
    intro: t("ไม่ต้องตั้งชื่อหรือแยกหมวดเอกสาร COP24 อ่าน จัดหมวด สกัดค่า และบอกเฉพาะสิ่งที่ขาดหรือขัดแย้ง", "No naming or sorting. COP24 reads, classifies, extracts values and tells you only what is missing or conflicting."),
    steps: [t("เลือกโรงไฟฟ้า ชนิดรายงาน และปี", "Pick the plant, report type and year"), t("ลากไฟล์ โฟลเดอร์ หรือ ZIP มาวาง แล้วกดเริ่มประมวลผล", "Drop files, a folder or a ZIP and start processing"), t("ตรวจเฉพาะค่าที่ AI ไม่มั่นใจ", "Review only the values the AI is unsure of"), t("หรือส่งต่อให้ AI ขอเอกสารที่ขาดจากทีม (ต้องอนุมัติผู้รับก่อน)", "Or hand off to the AI to request missing documents (you approve the recipients first)")],
    notes: [t("ไฟล์ถูกอ่านในเบราว์เซอร์ของคุณ ไม่ถูกส่งออกไปที่ใด", "Files are read in your browser and not sent anywhere")], tour: "ingest",
  },
  {
    id: "report", title: t("7. สร้างรายงานคลิกเดียว", "7. One-click report generation"),
    intro: t("เมนู 07 สร้างรายงาน: เลือกโรงไฟฟ้าและรายงาน แล้วกดปุ่มเดียว", "Menu 07 Report generation: pick the plant and report, press one button."),
    steps: [t("เลือกโรงไฟฟ้าและรายงาน (ผลการปฏิบัติตาม ขั้นต้น ประเมินการปฏิบัติตาม หรือเตรียมรับการตรวจ)", "Pick the plant and the report (monitoring, preliminary, compliance assessment or inspection pack)"), t("กด “สร้างรายงาน — คลิกเดียว”", "Press “Generate report — one click”"), t("อ่านร่าง: บทสีเขียวมีแหล่งอ้างอิง บทสีแดงยังไม่มีหลักฐาน", "Read the draft: green sections are sourced, red ones have no evidence yet"), t("ทำรายการ “สิ่งที่ต้องให้คนทำก่อนยื่น” ในศูนย์ควบคุมภารกิจ", "Work through “What a person must do before filing” in Mission Control")],
    notes: [t("AI เขียนเนื้อความได้หลังโมเดลผ่านชุดทดสอบรายงานและมีผู้ทรงคุณวุฒิลงชื่อ", "AI writes the prose only after the model passes the report benchmark with a reviewer's sign-off")], tour: "oneclick",
  },
  {
    id: "agi", title: t("8. ภารกิจ AGI", "8. AGI missions"),
    intro: t("ให้ทีม AI ทำงานทั้งภารกิจ: เลือกภารกิจหลัก ดูตัวอย่าง แล้วกดเริ่ม", "Let the AI team run a whole mission: pick a flagship, preview it, start it."),
    steps: [t("เลือกภารกิจหลัก F01–F07 หรือจากแคตตาล็อก 108 ภารกิจ", "Pick a flagship F01–F07 or a mission from the 108-mission catalog"), t("ตรวจตัวอย่าง: ขอบเขต โหมด (Single Bot / Team / Swarm) ระดับอิสระ งบ และจุดอนุมัติ", "Check the preview: scope, mode (Single Bot / Team / Swarm), autonomy, budget and approval gates"), t("กดเริ่ม แล้วทำเฉพาะสิ่งที่ต้องเป็นคนในศูนย์ควบคุม", "Start it, then do only the human actions in Mission Control")],
    notes: [t("ภารกิจที่ยังมีรายการค้างจบแบบ “ต้องให้คนดำเนินการ” ไม่ใช่ “เสร็จสมบูรณ์”", "A mission with open items ends Needs Human Action, never Completed")], tour: "agi",
  },
  {
    id: "mywork", title: t("9. งานของฉันและการอนุมัติ", "9. My work and approvals"),
    intro: t("รวมเฉพาะงานที่ต้องใช้คน: ตัดสินใจ อนุมัติ ส่งข้อมูล และข้อยกเว้น", "Only the work that needs a person: decisions, approvals, missing data and exceptions."),
    steps: [t("ตัดสินค่าที่ขัดแย้งพร้อมเหตุผล", "Decide conflicting values, with a reason"), t("อนุมัติบทที่ AI ร่างในสตูดิโอรายงาน", "Approve AI-drafted chapters in the Report Studio"), t("ตรวจและส่งคำขอเอกสาร", "Review and send evidence requests")],
    tour: "mywork",
  },
  {
    id: "outputs", title: t("10. ตรวจก่อนยื่นและผลลัพธ์", "10. Preflight and outputs"),
    intro: t("ดูว่าพร้อมยื่นหรือยัง สิ่งใดกั้นอยู่ และผลลัพธ์ที่ได้", "See whether you are ready to file, what blocks it, and what has been produced."),
    steps: [t("เปิด “รายงานและผลลัพธ์” หรือ “ตรวจก่อนยื่น”", "Open Reports & outputs or Preflight"), t("แก้สิ่งที่กั้นการยื่นทีละข้อ", "Clear the filing blockers one by one"), t("ให้ผู้มีคุณวุฒิลงนาม แล้วยื่นผ่านช่องทางของ กกพ.", "Have the qualified signatory certify, then file through the ERC's channel")],
    tour: "outputs",
  },
  {
    id: "paul", title: t("11. ถาม Paul", "11. Ask Paul"),
    intro: t("Paul มี 3 หน้าที่: วิธีใช้แอป ที่ปรึกษากฎหมาย CoP (อ้างอิงระเบียบ กกพ. ทุกครั้ง) และรับข้อเสนอแนะ", "Paul has three jobs: how to use the app, CoP legal consultant (always citing the ERC rules) and feedback."),
    steps: [t("กด “ถาม Paul” มุมขวาล่าง หรือป้าย AI ด้านบน", "Press “Ask Paul” at the bottom right, or the AI badge at the top"), t("เลือกหัวข้อ หรือปล่อยให้ Paul เลือกเอง", "Pick a topic or let Paul choose"), t("คำตอบด้านกฎหมายมีแหล่งอ้างอิง กดดูข้อความต้นฉบับได้", "Legal answers come with sources you can open")],
    notes: [t("คำตอบของ Paul ไม่ใช่คำปรึกษาทางกฎหมายอย่างเป็นทางการ", "Paul's answers are guidance, not formal legal advice")], tour: "paul",
  },
  {
    id: "faq", title: t("12. คำถามที่พบบ่อย", "12. Troubleshooting"),
    intro: t("ปัญหาที่พบบ่อยและวิธีแก้", "Common questions and fixes."),
    steps: [t("มองไม่เห็นเมนูบางรายการ → อยู่ในโหมดง่าย กด “ทุกโมดูล ▾” หรือเปลี่ยนเป็นโหมดมืออาชีพ", "Can't see a menu item → you are in Easy mode; press “All modules ▾” or switch to Pro"), t("ป้าย “AI OFFLINE” → ยังไม่ได้เชื่อมต่อโมเดล COP24 ทำงานแบบออฟไลน์ได้", "“AI OFFLINE” badge → no model connected; COP24 still works offline"), t("ภารกิจจบแบบ “ต้องให้คนดำเนินการ” → ดูรายการค้างในศูนย์ควบคุมแล้วทำให้ครบ", "Mission ends Needs Human Action → finish the open items listed in Mission Control"), t("ไม่แน่ใจว่าหน้านี้ใช้ทำอะไร → กด “อธิบายหน้านี้” หรือ “คู่มือขั้นตอน”", "Not sure what a page is for → press “Explain me” or “Playbook”")],
  },
];
