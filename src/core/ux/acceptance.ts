import { t } from "../i18n-text";
import type { LText } from "../types";

/**
 * §21 UX acceptance test + §22 mandatory two-layer rule.
 * Every screen declares its Capability layer (what it can do) and its Experience layer (how a
 * normal person gets the outcome), and records the seven acceptance tests. The test suite fails
 * if a route exists without an entry, or if an entry claims a component the page does not use.
 */

export const UX_TESTS = ["thirty", "nextStep", "terminology", "ai", "progressive", "outcome", "exception"] as const;
export type UxTest = (typeof UX_TESTS)[number];
export const UX_TEST_LABEL: Record<UxTest, { name: LText; q: LText }> = {
  thirty: { name: t("ทดสอบ 30 วินาที", "30-second test"), q: t("ผู้ใช้ครั้งแรกที่ไม่ใช่ผู้เชี่ยวชาญเข้าใจได้ใน 30 วินาทีว่าหน้านี้มีไว้ทำอะไร", "Can a first-time non-expert tell what this screen is for within 30 seconds?") },
  nextStep: { name: t("ทดสอบขั้นถัดไป", "Next-step test"), q: t("ผู้ใช้รู้ทันทีว่าควรทำอะไรต่อ", "Can the user immediately see what to do next?") },
  terminology: { name: t("ทดสอบศัพท์เฉพาะ", "Terminology test"), q: t("ทำงานให้เสร็จได้โดยไม่ต้องรู้ศัพท์เฉพาะ", "Can the workflow be completed without specialist terminology?") },
  ai: { name: t("ทดสอบ AI", "AI test"), q: t("AI ทำหรือแนะนำส่วนที่ยากได้", "Can AI perform or guide the difficult parts?") },
  progressive: { name: t("ทดสอบการเปิดเผยทีละขั้น", "Progressive disclosure test"), q: t("การควบคุมขั้นสูงถูกซ่อนจนกว่าจะต้องใช้", "Are advanced controls hidden until needed?") },
  outcome: { name: t("ทดสอบผลลัพธ์", "Outcome test"), q: t("หน้าจอสื่อผลลัพธ์ทางธุรกิจ ไม่ใช่แค่ฟีเจอร์", "Does the screen communicate the business outcome, not just the feature?") },
  exception: { name: t("ทดสอบข้อยกเว้น", "Exception test"), q: t("คนทำเฉพาะงานที่ต้องใช้คนจริง ๆ", "Are humans doing only work that genuinely needs a person?") },
};

export type Verdict = "yes" | "partial" | "no";

export interface ScreenSpec {
  route: string;
  name: LText;
  /** §22 A — what the application can technically do here */
  capability: LText;
  /** §22 B — how a normal person achieves the outcome without the underlying complexity */
  experience: LText;
  tests: Record<UxTest, Verdict>;
  /** components the screen must use for its claims to hold — verified against the source */
  uses: ("ExplainThis" | "ResultInterpreter" | "AdvancedSettings" | "CopilotBox" | "MissionCard" | "GuidedJourney" | "AssistLevel" | "WhyAI")[];
  /** primary nav (normal users) or All modules (professional) */
  tier: "primary" | "module";
  note?: LText;
}

const Y = "yes" as const, P = "partial" as const;
const all = (over: Partial<Record<UxTest, Verdict>> = {}): Record<UxTest, Verdict> => ({ thirty: Y, nextStep: Y, terminology: Y, ai: Y, progressive: Y, outcome: Y, exception: Y, ...over });

export const SCREENS: ScreenSpec[] = [
  { route: "/", tier: "primary", name: t("หน้าหลัก · ถาม 24", "Home · Ask 24"), capability: t("ทุกเครื่องยนต์ผ่านสแนปช็อตเดียว", "Every engine through one snapshot"), experience: t("พิมพ์เป้าหมาย → Copilot เลือกภารกิจและวางแผน · ส่วน A–E ตามมาตรฐาน", "Type a goal → the Copilot picks the mission and plans it · sections A–E per the standard"), tests: all(), uses: ["CopilotBox", "MissionCard", "ExplainThis", "ResultInterpreter"] },
  { route: "/missions", tier: "primary", name: t("ภารกิจของฉัน", "My missions"), capability: t("แคตตาล็อกภารกิจ แผนการทำงาน และทีมเอเจนต์", "Mission catalogue, plans and the agent team"), experience: t("เปิดภารกิจ → เส้นทาง 7 ขั้น · ทำเอง / แนะนำฉัน / ทำให้ฉัน · ทำไม AI เลือกสิ่งนี้", "Open a mission → 7-stage journey · Do it myself / Guide me / Do it for me · why AI chose it"), tests: all(), uses: ["MissionCard", "GuidedJourney", "AssistLevel", "WhyAI", "ExplainThis"] },
  { route: "/my-work", tier: "primary", name: t("งานของฉัน", "My work"), capability: t("ข้อขัดแย้ง บทที่รออนุมัติ ช่องว่างหลักฐาน และข้อยกเว้น", "Conflicts, chapters awaiting approval, evidence gaps and exceptions"), experience: t("เฉพาะงานที่ต้องใช้คน: ตัดสิน อนุมัติ ส่งข้อมูล", "Only human work: decide, approve, supply data"), tests: all(), uses: ["ExplainThis"] },
  { route: "/outputs", tier: "primary", name: t("รายงานและผลลัพธ์", "Reports & outputs"), capability: t("รายงาน ชุดยื่น ดัชนีหลักฐาน ชุดตรวจสอบ", "Report, bundle, evidence index, audit package"), experience: t("ผลลัพธ์แต่ละชิ้นบอกว่าคืออะไร สถานะ และขั้นถัดไป", "Each output says what it is, its status and the next step"), tests: all(), uses: ["ResultInterpreter", "ExplainThis"] },
  { route: "/agi", tier: "primary", name: t("ศูนย์ควบคุม AGI", "AGI Mission Control"), capability: t("เครื่องยนต์ภารกิจเดียว: 108 ภารกิจ 7 ภารกิจหลัก Single/Team/Swarm 3 ระดับอิสระ จุดอนุมัติ งบ และบันทึกแบบห่วงโซ่แฮช", "One mission engine: 108 missions, 7 flagships, Single/Team/Swarm, 3 autonomy levels, gates, budget and a hash-chained audit"), experience: t("เลือกผลลัพธ์ที่ต้องการ ดูตัวอย่างภารกิจ กดเริ่ม แล้วทำเฉพาะสิ่งที่ต้องเป็นคน", "Pick the outcome, see the preview, start, then do only what needs a person"), tests: all({ thirty: P, terminology: P }), uses: ["ExplainThis"], note: t("หน้าจอสำหรับโหมด AGI ผู้ใช้ทั่วไปเข้าผ่าน Copilot “ทำให้ฉัน”", "The AGI-mode screen; normal users arrive via the Copilot's “Do it for me”") },
  { route: "/ingest", tier: "module", name: t("เตรียมข้อมูล", "Data preparation"), capability: t("อ่าน จัดหมวด สกัด ตรวจสอบ และส่งคำขอเอกสาร", "Read, classify, extract, validate and request documents"), experience: t("วางไฟล์ครั้งเดียว หรือส่งต่อให้ AI · ตรวจเฉพาะสิ่งที่ AI ทำเครื่องหมาย", "Drop files once or hand off to the AI · review only what it flags"), tests: all(), uses: ["AdvancedSettings", "ExplainThis"] },
  { route: "/start", tier: "module", name: t("เริ่มต้นใช้งาน", "Easy Start"), capability: t("Applicability ข้ามทุกโดเมน", "Applicability across every domain"), experience: t("ตอบคำถามสั้น ๆ แล้วรู้ว่าอะไรบังคับใช้", "Answer a few questions and see what applies"), tests: all(), uses: ["ExplainThis"] },
  { route: "/evidence", tier: "module", name: t("ศูนย์ควบคุมเอกสาร", "Document Control"), capability: t("หลักฐาน 3 ชั้นและคำขอที่ AI ร่าง", "3-layer evidence and AI-drafted requests"), experience: t("อนุมัติคำขอที่ร่างไว้แล้ว ไม่ต้องเขียนเอง", "Approve requests already drafted for you"), tests: all(), uses: ["ExplainThis", "ResultInterpreter"] },
  { route: "/factory", tier: "primary", name: t("สร้างรายงานอัตโนมัติ", "Report Factory"), capability: t("ประกอบร่างรายงานตามแม่แบบของหน่วยงานกำกับ", "Assemble a draft to the regulator's template"), experience: t("กดสร้าง ส่วนที่ขาดถูกทำเครื่องหมาย ไม่ถูกแต่ง", "Generate; gaps are marked, never invented"), tests: all(), uses: ["ExplainThis"] },
  { route: "/calendar", tier: "module", name: t("ปฏิทินการปฏิบัติตาม", "Compliance Calendar"), capability: t("ทุกกำหนดยื่นและการตรวจวัด", "Every filing and sampling date"), experience: t("ดูว่าอะไรใกล้กำหนดแล้วเริ่มภารกิจ", "See what's due and start the mission"), tests: all(), uses: ["ExplainThis"] },
  { route: "/gaps", tier: "module", name: t("ช่องว่างและการแก้ไข", "Gaps & Remediation"), capability: t("ช่องว่างที่คำนวณพร้อมผู้รับผิดชอบ", "Derived gaps with owner and fix"), experience: t("ผลถูกแปลเป็นภาษาธรรมดา เริ่มจากสาระสำคัญ", "Result translated into plain words; material first"), tests: all(), uses: ["ExplainThis", "ResultInterpreter"] },
  { route: "/studio", tier: "module", name: t("สตูดิโอรายงาน", "Report Studio"), capability: t("แก้ไขรายบทพร้อมข้อกำหนดและหลักฐาน", "Chapter editing with obligation and evidence"), experience: t("อ่านร่างของ AI แล้วอนุมัติ — Evidence Guard กันข้อความที่ไม่มีหลักฐาน", "Read the AI draft and approve — Evidence Guard blocks unsupported text"), tests: all({ thirty: P }), uses: ["ExplainThis"], note: t("หน้าจอทำงานแบบผู้เชี่ยวชาญ ใช้คำอธิบายบริบทแทนคำนำ", "An expert workspace; contextual explanations stand in for an intro") },
  { route: "/preflight", tier: "module", name: t("ตรวจก่อนยื่น", "Preflight"), capability: t("ตรวจ 9 ชั้นและประตูปล่อย 4 ขั้น", "9-layer check and 4-stage release gate"), experience: t("ผลแปลเป็น “พร้อมยื่นหรือยัง ทำไม และต้องทำอะไร”", "Translated into “ready to file? why? what next?”"), tests: all(), uses: ["ExplainThis", "ResultInterpreter"] },
  { route: "/report-quality", tier: "module", name: t("มาตรฐานคุณภาพรายงาน", "Report Quality"), capability: t("9 ประตูคุณภาพ บัญชีข้อความ การคำนวณ", "9 quality gates, claim ledger, calculations"), experience: t("ข้อความที่ไม่มีแหล่งถูกยกขึ้นมาให้ตัดสิน", "Unsourced claims are surfaced for a decision"), tests: all({ thirty: P, terminology: P }), uses: ["ExplainThis", "ResultInterpreter"], note: t("หน้าสำหรับผู้ตรวจสอบ ศัพท์ของมาตรฐานยังปรากฏ แต่อธิบายได้ทุกคำ", "An auditor's screen; the standard's terms remain but each is explainable") },
  { route: "/xray", tier: "module", name: t("เอกซเรย์รายงานเดิม", "Compliance X-Ray"), capability: t("ตรวจรายงานที่มีอยู่กับชุดกฎ", "Audit an existing report against the pack"), experience: t("อัปโหลดแล้วได้รายการแก้ไข", "Upload and get a fix list"), tests: all(), uses: ["ExplainThis"] },
  { route: "/portfolio", tier: "module", name: t("พอร์ตโฟลิโอ", "Portfolio"), capability: t("หลายหน่วยงานเรียงตามความเสี่ยง", "Many entities sorted by risk"), experience: t("เริ่มจากแถวบนสุด", "Start at the top row"), tests: all(), uses: ["ExplainThis"] },
  { route: "/universe", tier: "module", name: t("จักรวาลการปฏิบัติตาม", "Compliance Universe"), capability: t("13 โดเมน × ทุกหน่วยงาน", "13 domains × every entity"), experience: t("แผนที่เดียวว่าอะไรบังคับใช้ที่ไหน", "One map of what applies where"), tests: all(), uses: ["ExplainThis"] },
  { route: "/obligations", tier: "module", name: t("ทะเบียนข้อผูกพัน", "Obligation Register"), capability: t("หนึ่งแถวต่อหน่วยงาน × ข้อผูกพัน", "One row per entity × obligation"), experience: t("ทะเบียนสำหรับผู้เชี่ยวชาญ ผู้ใช้ทั่วไปได้คำตอบผ่าน Copilot", "A specialist register; normal users get answers through the Copilot"), tests: all({ thirty: P, outcome: P }), uses: ["ExplainThis"] },
  { route: "/corpus", tier: "module", name: t("คลังกฎหมาย", "Legal Corpus"), capability: t("แหล่งกฎหมาย กกพ. และดัชนีข้อ", "ERC sources and clause index"), experience: t("ใช้เป็นแหล่งอ้างอิงเบื้องหลัง ผู้ใช้ทั่วไปไม่ต้องเปิด", "A reference behind the scenes; normal users never need it"), tests: all({ thirty: P, outcome: P, exception: P }), uses: ["ExplainThis"] },
  { route: "/controls", tier: "module", name: t("ทดสอบการควบคุม", "Control Testing"), capability: t("ประสิทธิผลจากผลทดสอบ", "Effectiveness from tests"), experience: t("ผลถูกแปลเป็นภาษาธรรมดา", "Results translated into plain words"), tests: all(), uses: ["ExplainThis", "ResultInterpreter"] },
  { route: "/changes", tier: "module", name: t("ติดตามกฎที่เปลี่ยน", "Regulatory Change"), capability: t("ผลกระทบถึงข้อผูกพัน บท และหน่วยงาน", "Impact to obligations, chapters, entities"), experience: t("ตัดสินข้อเสนอที่ร่างไว้แล้ว", "Decide on proposals already drafted"), tests: all(), uses: ["ExplainThis"] },
  { route: "/audit", tier: "module", name: t("ร่องรอยการตรวจสอบ", "Audit Trail"), capability: t("ทุกการกระทำของ AI คน และระบบ", "Every AI, human and system action"), experience: t("บันทึกสำหรับผู้ตรวจสอบ ไม่ใช่งานประจำวัน", "A record for auditors, not daily work"), tests: all({ thirty: P, ai: P, outcome: P }), uses: ["ExplainThis"] },
  { route: "/packs", tier: "module", name: t("แพ็กและแอป 24", "Packs & 24 apps"), capability: t("ชุดกฎที่ติดตั้งและประสบการณ์ในแต่ละแอป", "Installed packs and the in-app experience"), experience: t("ดูว่า ESG24/TP24 ใช้ COP24 อย่างไร", "See how ESG24/TP24 run on COP24"), tests: all({ thirty: P, ai: P }), uses: ["ExplainThis"] },
  { route: "/engine", tier: "module", name: t("เครื่องยนต์หลัก COP24", "COP24 Core Engine"), capability: t("9 เครื่องยนต์และการไหลของข้อมูล", "The nine engines and data flow"), experience: t("หน้าสถาปัตยกรรมสำหรับผู้เชี่ยวชาญ", "An architecture view for specialists"), tests: all({ thirty: P, ai: P, outcome: P }), uses: ["ExplainThis"] },
  { route: "/feedback", tier: "module", name: t("ข้อเสนอแนะและการปรับปรุง", "Feedback & improvements"), capability: t("ข้อเสนอแนะที่ Paul จัดหมวด ผูกกับหน้าจอและการทดสอบ UX ส่งต่อเป็น GitHub issue ได้", "Feedback triaged by Paul, tied to screens and UX tests, optionally forwarded as GitHub issues"), experience: t("บอก Paul เป็นภาษาธรรมดา — ระบบเรียงเป็นรายการปรับปรุงตามผลกระทบ", "Tell Paul in plain words — it becomes a backlog ranked by impact"), tests: all({ ai: P }), uses: [] },
  { route: "/login", tier: "primary", name: t("เข้าสู่ระบบ", "Sign in"), capability: t("ประตูเข้าใช้ 4 บทบาท ลิงก์เดโมที่ลงนาม และรหัสผ่านพื้นที่ทำงาน", "Four-role gate, signed demo links and the workspace password"), experience: t("เลือกบทบาทแล้วเข้าใช้ ผู้เข้าชมเปิดลิงก์แล้วเข้าได้ทันที", "Pick a role and enter; a guest opens their link and is in"), tests: all({ ai: P }), uses: [] },
  { route: "/host-desk", tier: "module", name: t("โต๊ะผู้ดูแลเดโม", "Host desk"), capability: t("สร้าง ส่ง และเพิกถอนลิงก์เดโมที่หมดอายุเอง", "Mint, send and revoke self-expiring demo links"), experience: t("กรอกชื่อผู้เข้าชม เลือกบทบาทและจำนวนวัน แล้วส่ง", "Type the guest, pick roles and days, send"), tests: all({ ai: P }), uses: [] },
  { route: "/journey", tier: "primary", name: t("เส้นทางการใช้งาน", "App journey"), capability: t("เส้นทาง 8 ขั้นจากเมนูเริ่มต้นถึงเมนูสุดท้าย พร้อมเมนูช่วยของแต่ละขั้น", "The 8-stage path from the start menu to the finish menu, with each stage's helper menus"), experience: t("ดูว่าเริ่มที่ไหน ต่อไปไหน จบที่ไหน แล้วกดไปเมนูนั้น", "See where to start, what comes next and where it finishes, then jump to that menu"), tests: all({ ai: P }), uses: [] },
  { route: "/manual", tier: "module", name: t("คู่มือผู้ใช้", "User manual"), capability: t("คู่มือสองภาษาที่พิมพ์เป็น PDF ได้ เชื่อมกับโหมดเดโม", "A bilingual, printable manual linked to demo mode"), experience: t("อ่านทีละหัวข้อ หรือกด “ดูให้ฉันดู” ให้เดโมสาธิต", "Read a section, or press “Show me” and the demo demonstrates it"), tests: all({ ai: P }), uses: [] },
  { route: "/ux-standard", tier: "module", name: t("มาตรฐาน UX 24 Series", "24 UX Standard"), capability: t("ทะเบียนการทดสอบการยอมรับของทุกหน้าจอ", "The acceptance register for every screen"), experience: t("ดูว่าแต่ละหน้าผ่านการทดสอบ 7 ข้อหรือไม่ และทำไม", "See whether each screen passes the seven tests, and why"), tests: all({ ai: P }), uses: [] },
];

export interface ScreenResult { spec: ScreenSpec; yes: number; partial: number; no: number; complete: boolean }

/** §21: “If the answer to several of these is No, the feature is not UX-complete.” Here: at most one No. */
export function evaluate(spec: ScreenSpec): ScreenResult {
  const v = Object.values(spec.tests);
  const no = v.filter((x) => x === "no").length;
  return { spec, yes: v.filter((x) => x === "yes").length, partial: v.filter((x) => x === "partial").length, no, complete: no <= 1 };
}
