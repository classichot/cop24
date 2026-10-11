import { t } from "../i18n-text";
import type { LText, Status } from "../types";
import type { UxContext, UxRole } from "./context";

/**
 * §4 Goal-to-Mission engine — the Mission Catalog is the bridge between a plain-language goal
 * and the modules underneath. Each mission declares the cues that identify it, the roles it
 * suits, its execution plan (AI and human steps grouped into the §5 journey stages), the data
 * it needs and why the AI would choose it (§20). Plans and requirements are computed from the
 * live context, so readiness, AI share and "waiting for you" are never hand-written.
 */

export type Stage = "assess" | "collect" | "analyze" | "recommend" | "execute" | "review" | "complete";
export const STAGES: Stage[] = ["assess", "collect", "analyze", "recommend", "execute", "review", "complete"];
export const STAGE_LABEL: Record<Stage, LText> = {
  assess: t("ประเมิน", "Assess"),
  collect: t("รวบรวม", "Collect"),
  analyze: t("วิเคราะห์", "Analyze"),
  recommend: t("เสนอแนะ", "Recommend"),
  execute: t("ดำเนินการ", "Execute"),
  review: t("ตรวจทาน", "Review"),
  complete: t("เสร็จสิ้น", "Complete"),
};

export type AppId = "cop24" | "esg24" | "tp24";

export interface PlanStep {
  stage: Stage;
  label: LText;
  by: "ai" | "human";
  done: boolean;
  /** where a person does this step themselves */
  href?: string;
  /** count shown with the step, e.g. 3 missing items */
  count?: number;
}

export interface Requirement { label: LText; k: Status }

export interface WhyAI {
  reasoning: LText;
  data: LText[];
  assumptions: LText[];
  sources: LText[];
  alternatives: { label: LText; missionId: string }[];
}

export interface Cue { re: RegExp; w: number }

export interface UxMission {
  id: string;
  app: AppId;
  title: (ctx: UxContext) => LText;
  outcome: LText;
  cues: Cue[];
  roles: UxRole[];
  /** the module a person uses to do it themselves (Do It Myself) */
  module: string;
  /** every module route this mission touches — lets the Complexity Guard infer the goal */
  modules: string[];
  /** Do It For Me hands off here (an AI-runnable flow); defaults to the mission journey */
  forMe?: string;
  plan: (ctx: UxContext) => PlanStep[];
  requires: (ctx: UxContext) => Requirement[];
  why: (ctx: UxContext) => WhyAI;
}

const C = (re: RegExp, w = 2): Cue => ({ re, w });
const n = (x: number, th: string, en: string) => t(`${x} ${th}`, `${x} ${en}`);
const ok = (b: boolean): Status => (b ? "ok" : "bad");

export const MISSIONS: UxMission[] = [
  {
    id: "prelim-cop",
    app: "cop24",
    title: (c) => t(`จัดทำรายงาน CoP ขั้นต้นของ${c.entityName.th}`, `Prepare the preliminary CoP report for ${c.entityName.en}`),
    outcome: t("รายงาน CoP ขั้นต้นที่พร้อมยื่น กกพ.", "A preliminary CoP report ready to file with the ERC"),
    cues: [C(/รายงาน\s*cop|ประมวลหลักการ|code of practice|\bcop\b/iu, 3), C(/ขั้นต้น|preliminary/iu, 3), C(/จัดทำรายงาน|เตรียมรายงาน|prepare (the |a )?report|draft (the |a )?report/iu, 2)],
    roles: ["owner", "consultant"],
    module: "/factory",
    modules: ["/factory", "/studio", "/preflight", "/evidence", "/ingest"],
    forMe: "/ingest",
    plan: (c) => {
      const todo = c.chaptersTotal - c.chaptersApproved - c.chaptersReview - c.chaptersDrafting;
      return [
        { stage: "assess", label: t("ระบุข้อกำหนด กกพ. ที่บังคับใช้กับโครงการ", "Identify the ERC rules that bind the project"), by: "ai", done: true, href: "/obligations" },
        { stage: "collect", label: t("อ่านและจัดหมวดเอกสารโครงการที่มีอยู่", "Read and classify the project documents you have"), by: "ai", done: true, href: "/ingest" },
        { stage: "collect", label: t("ส่งหลักฐานที่ยังขาด", "Supply the evidence that is still missing"), by: "human", done: c.evidenceGaps === 0, href: "/evidence", count: c.evidenceGaps },
        { stage: "analyze", label: t("ร่างทุกบทจากหลักฐาน", "Draft every chapter from the evidence"), by: "ai", done: c.hasReport && todo === 0 && c.chaptersDrafting === 0, href: "/studio" },
        { stage: "analyze", label: t("ตัดสินค่าที่ขัดแย้งกัน", "Decide between conflicting values"), by: "human", done: c.conflicts === 0, href: "/preflight", count: c.conflicts },
        { stage: "review", label: t("ตรวจและอนุมัติบทที่ AI ร่าง", "Review and approve the AI-drafted chapters"), by: "human", done: c.hasReport && c.chaptersApproved === c.chaptersTotal, href: "/studio", count: c.chaptersTotal - c.chaptersApproved },
        { stage: "review", label: t("ตรวจก่อนยื่น 9 ชั้น", "Run the 9-layer preflight"), by: "ai", done: c.hasReport && c.blockers === 0, href: "/preflight", count: c.blockers },
        { stage: "complete", label: t("ผู้มีคุณวุฒิรับรอง และคุณอนุมัติให้ยื่น", "Qualified signatory certifies; you approve to file"), by: "human", done: c.gate >= 4, href: "/preflight" },
      ];
    },
    requires: (c) => [
      { label: t("ใบอนุญาตและแบบผังโครงการ", "Licence and site layout"), k: "ok" },
      { label: t(`หลักฐานพิสูจน์แล้ว ${c.evidenceProven}/${c.evidenceRequired} รายการ`, `Evidence proven ${c.evidenceProven}/${c.evidenceRequired}`), k: c.readiness >= 80 ? "ok" : c.readiness >= 50 ? "warn" : "bad" },
      { label: c.conflicts ? n(c.conflicts, "ค่าที่ขัดแย้งรอตัดสิน", "conflicting value(s) to decide") : t("ไม่มีค่าที่ขัดแย้ง", "No conflicting values"), k: ok(c.conflicts === 0) },
      ...(c.hasReport ? [] : [{ label: t("ยังไม่มีร่างรายงาน — AI จะร่างจากหลักฐาน", "No draft yet — the AI drafts it from the evidence"), k: "info" as Status }]),
    ],
    why: (c) => ({
      reasoning: t(`${c.entityName.th} เป็นโรงไฟฟ้าที่ต้องยื่นรายงาน CoP ขั้นต้นตามระเบียบ กกพ. และเป็นงานที่ใกล้กำหนดที่สุดของคุณ`, `${c.entityName.en} is a power plant that must file a preliminary CoP report under ERC rules, and it is your nearest deadline.`),
      data: [t("ทะเบียนข้อผูกพันของหน่วยงาน", "The entity's obligation register"), t(`หลักฐาน ${c.evidenceRequired} รายการที่บังคับ`, `${c.evidenceRequired} mandatory evidence items`), t("ร่างรายงานฉบับปัจจุบัน", "The current report draft")],
      assumptions: [t("ใช้ระเบียบ CoP ฉบับ 2565 แก้ไข 2567", "CoP rules 2565 as amended 2567 apply"), t("เทคโนโลยีเป็นโซลาร์ภาคพื้นดิน", "Technology is ground-mounted solar")],
      sources: [t("ระเบียบ กกพ. ว่าด้วยประมวลหลักการปฏิบัติ", "ERC Code of Practice regulation"), t("แบบฟอร์ม CoP Solar Farm V1.0/2565", "ERC CoP Solar Farm form V1.0/2565")],
      alternatives: [{ label: t("ตรวจรายงานที่ที่ปรึกษาทำไว้แทน", "Check a report your consultant already wrote"), missionId: "xray" }, { label: t("เริ่มจากนำเข้าเอกสารก่อน", "Start by importing documents"), missionId: "import-evidence" }],
    }),
  },
  {
    id: "import-evidence",
    app: "cop24",
    title: () => t("นำเข้าเอกสารทั้งหมด แล้วบอกว่ายังขาดอะไร", "Import all my documents and tell me what's missing"),
    outcome: t("เอกสารทั้งกองถูกจัดหมวด สกัดค่า และจับคู่กับข้อกำหนด", "Every document classified, extracted and matched to requirements"),
    cues: [C(/อัปโหลด|นำเข้า|upload|import|โหลดไฟล์|ลากไฟล์/iu, 4), C(/ไฟล์|เอกสารทั้งหมด|โฟลเดอร์|folder|zip|files|documents i have/iu, 2)],
    roles: ["owner", "consultant", "contributor"],
    module: "/ingest",
    modules: ["/ingest"],
    forMe: "/ingest",
    plan: () => [
      { stage: "collect", label: t("วางไฟล์ โฟลเดอร์ หรือ ZIP ครั้งเดียว", "Drop files, a folder or a ZIP once"), by: "human", done: false, href: "/ingest" },
      { stage: "analyze", label: t("จัดหมวด สกัดค่า และตรวจความถูกต้อง", "Classify, extract and validate"), by: "ai", done: false },
      { stage: "recommend", label: t("ร่างคำขอเอกสารที่ขาด", "Draft requests for what is missing"), by: "ai", done: false },
      { stage: "review", label: t("ยืนยันเฉพาะค่าที่ AI ไม่มั่นใจ", "Confirm only the values the AI is unsure of"), by: "human", done: false, href: "/ingest" },
    ],
    requires: () => [{ label: t("ไฟล์ที่คุณมีอยู่ ไม่ต้องตั้งชื่อหรือแยกหมวด", "Whatever files you have — no naming or sorting"), k: "info" }],
    why: () => ({
      reasoning: t("คุณพูดถึงการส่งหรืออัปโหลดเอกสาร งานนี้เริ่มได้ทันทีโดยไม่ต้องรู้โครงสร้างระบบ", "You mentioned uploading or handing over documents; this starts immediately without knowing the system."),
      data: [t("ไฟล์ที่คุณวาง อ่านในเบราว์เซอร์เท่านั้น", "The files you drop, read in your browser only")],
      assumptions: [t("ไฟล์เป็นของหน่วยงานที่เปิดอยู่", "The files belong to the active entity")],
      sources: [t("รายการหลักฐานตามระเบียบ กกพ. 18 ประเภท", "18 ERC evidence types")],
      alternatives: [{ label: t("ดูรายการที่ยังขาดก่อน", "See what is missing first"), missionId: "close-evidence" }],
    }),
  },
  {
    id: "close-evidence",
    app: "cop24",
    title: () => t("ปิดหลักฐานที่ยังขาด", "Close the missing evidence"),
    outcome: t("ทุกข้อผูกพันที่บังคับมีหลักฐานพิสูจน์", "Every mandatory obligation has proving evidence"),
    cues: [C(/ขาด(อะไร)?|ยังไม่มี|missing|lack|ยังไม่ครบ/iu, 4), C(/ทวง|ตามเอกสาร|ขอเอกสาร|chase|request|follow up/iu, 3), C(/หลักฐาน|evidence/iu, 2)],
    roles: ["owner", "consultant", "contributor"],
    module: "/evidence",
    modules: ["/evidence", "/gaps", "/ingest"],
    plan: (c) => [
      { stage: "assess", label: t("หาข้อผูกพันที่ยังไม่มีหลักฐาน", "Find obligations without evidence"), by: "ai", done: true, href: "/evidence" },
      { stage: "recommend", label: t("ร่างคำขอถึงผู้รับผิดชอบ", "Draft requests to the owners"), by: "ai", done: true },
      { stage: "execute", label: t("อนุมัติและส่งคำขอ", "Approve and send the requests"), by: "human", done: c.evidenceGaps === 0, href: "/evidence", count: c.evidenceGaps },
      { stage: "execute", label: t("รับไฟล์ที่ส่งกลับมาและจับคู่กับคำขอ", "Receive the returned files and match them to requests"), by: "ai", done: c.evidenceGaps === 0, href: "/ingest" },
      { stage: "review", label: t("ตรวจซ้ำว่าหลักฐานพิสูจน์ได้", "Re-check that the evidence proves the claim"), by: "ai", done: c.evidenceGaps === 0 },
    ],
    requires: (c) => [{ label: n(c.evidenceGaps, "รายการหลักฐานที่ขาด", "evidence gap(s)"), k: c.evidenceGaps ? "bad" : "ok" }, { label: n(c.materialGaps, "รายการเป็นสาระสำคัญ", "material"), k: c.materialGaps ? "bad" : "ok" }],
    why: (c) => ({
      reasoning: t(`ยังมีหลักฐานที่ขาด ${c.evidenceGaps} รายการ ซึ่งกั้นไม่ให้ร่างผ่านเกณฑ์ “หลักฐานครบ”`, `${c.evidenceGaps} evidence gap(s) keep the draft from passing "evidence complete".`),
      data: [t("ช่องว่างที่ระบบคำนวณจากทะเบียนข้อผูกพัน", "Gaps derived from the obligation register")],
      assumptions: [t("ผู้รับผิดชอบตามทะเบียนยังถูกต้อง", "Owners in the register are still correct")],
      sources: [t("Evidence Engine 3 ชั้น: มีอยู่ · ใช้ได้ · พิสูจน์ได้", "3-layer Evidence Engine: exists · valid · proves")],
      alternatives: [{ label: t("ให้ AI นำเข้าเอกสารที่มีอยู่ก่อน", "Let AI import what you already have"), missionId: "import-evidence" }],
    }),
  },
  {
    id: "xray",
    app: "cop24",
    title: () => t("ตรวจรายงานที่มีอยู่", "Check an existing report"),
    outcome: t("รายงานช่องว่างรายบท ข้อความที่ไม่มีหลักฐาน และเอกสารที่ขาด", "Chapter gaps, unsupported statements and missing documents"),
    cues: [C(/x-?ray|เอกซเรย์/iu, 5), C(/ตรวจ(สอบ)?รายงาน|review (my|the|a|our) report|check (my|the|a|our) report/iu, 4), C(/ที่ปรึกษา(ทำ|เขียน)|consultant (wrote|made)|รายงานเดิม|existing report/iu, 3)],
    roles: ["owner", "consultant"],
    module: "/xray",
    modules: ["/xray"],
    plan: () => [
      { stage: "collect", label: t("อัปโหลดรายงาน", "Upload the report"), by: "human", done: false, href: "/xray" },
      { stage: "analyze", label: t("เทียบกับชุดกฎที่บังคับใช้จริง", "Compare against the binding rule pack"), by: "ai", done: false },
      { stage: "recommend", label: t("สรุปช่องว่างและข้อแก้ไข", "Summarise gaps and fixes"), by: "ai", done: false },
      { stage: "review", label: t("อ่านผลและตัดสินว่าจะแก้อะไร", "Read the result and decide what to fix"), by: "human", done: false, href: "/xray" },
    ],
    requires: () => [{ label: t("ไฟล์รายงาน PDF หรือ Word", "The report as PDF or Word"), k: "info" }],
    why: () => ({
      reasoning: t("คุณต้องการรู้ว่ารายงานที่มีอยู่แล้วครบตามข้อกำหนดหรือไม่", "You want to know whether an existing report meets the requirements."),
      data: [t("รายงานที่คุณอัปโหลด", "The report you upload"), t("ชุดกฎที่บังคับใช้กับหน่วยงาน", "The rule pack that binds the entity")],
      assumptions: [t("รายงานเป็นของหน่วยงานที่เปิดอยู่", "The report is for the active entity")],
      sources: [t("ทะเบียนข้อผูกพัน", "Obligation register")],
      alternatives: [{ label: t("ให้ AI ร่างรายงานใหม่ทั้งฉบับ", "Have AI draft a new report"), missionId: "prelim-cop" }],
    }),
  },
  {
    id: "applicability",
    app: "cop24",
    title: (c) => t(`กฎหมายอะไรบ้างที่บังคับใช้กับ${c.entityName.th}`, `Which laws apply to ${c.entityName.en}`),
    outcome: t("รายการข้อผูกพันพร้อมเหตุผลว่าทำไมบังคับใช้", "The obligations that apply, with the reason each one applies"),
    cues: [C(/กฎหมาย(อะไร)?|ระเบียบ(อะไร)?|ข้อบังคับ|laws?|regulations?|rules?/iu, 2), C(/บังคับใช้|ต้องปฏิบัติ|apply|applies|applicab|bind|obligat|ข้อผูกพัน/iu, 3)],
    roles: ["owner", "consultant", "exec"],
    module: "/universe",
    modules: ["/universe", "/start", "/obligations", "/corpus"],
    plan: (c) => [
      { stage: "assess", label: t("อ่านโปรไฟล์หน่วยงาน", "Read the entity profile"), by: "ai", done: true, href: "/start" },
      { stage: "analyze", label: t("ประเมินว่ากฎใดบังคับใช้ พร้อมเหตุผล", "Decide which rules apply, with reasons"), by: "ai", done: true, href: "/universe" },
      { stage: "review", label: t("ยืนยันข้อสมมติของโปรไฟล์", "Confirm the profile assumptions"), by: "human", done: c.openGaps === 0, href: "/start" },
    ],
    requires: () => [{ label: t("โปรไฟล์หน่วยงาน (มีแล้ว)", "Entity profile (on file)"), k: "ok" }],
    why: () => ({
      reasoning: t("คุณถามว่ากฎใดบังคับใช้ Applicability Engine ตอบได้พร้อมเหตุผลรายข้อ", "You asked which rules apply; the Applicability Engine answers with a reason per rule."),
      data: [t("ประเภทธุรกิจ กำลังผลิต และที่ตั้ง", "Business type, capacity and location")],
      assumptions: [t("ข้อมูลโปรไฟล์เป็นปัจจุบัน", "The profile is current")],
      sources: [t("คลังกฎหมาย กกพ. 52 แหล่ง", "ERC legal corpus, 52 sources")],
      alternatives: [{ label: t("ดูกำหนดยื่นที่ใกล้ถึง", "See upcoming deadlines"), missionId: "deadlines" }],
    }),
  },
  {
    id: "reg-change",
    app: "cop24",
    title: () => t("ประเมินผลกระทบจากกฎที่เปลี่ยน", "Assess what a rule change means for us"),
    outcome: t("ข้อผูกพัน บทรายงาน และหน่วยงานที่กระทบ พร้อมร่างการแก้ไข", "Affected obligations, chapters and entities, with draft changes"),
    cues: [C(/กฎ(ใหม่|ที่เปลี่ยน)|ระเบียบใหม่|แก้ไขระเบียบ|เปลี่ยนแปลง|new (rule|regulation)|rule change|amendment|changed/iu, 4)],
    roles: ["owner", "consultant", "exec"],
    module: "/changes",
    modules: ["/changes"],
    plan: (c) => [
      { stage: "assess", label: t("ติดตามการแก้ไขระเบียบ", "Monitor rule changes"), by: "ai", done: true },
      { stage: "analyze", label: t("โยงผลกระทบไปยังข้อผูกพันและบท", "Trace the impact to obligations and chapters"), by: "ai", done: true, href: "/changes" },
      { stage: "review", label: t("ตัดสินว่าจะนำข้อเสนอไปใช้หรือไม่", "Decide whether to adopt the proposals"), by: "human", done: c.changesPending === 0, href: "/changes", count: c.changesPending },
    ],
    requires: (c) => [{ label: n(c.changesPending, "การเปลี่ยนแปลงที่กระทบ", "change(s) with impact"), k: c.changesPending ? "warn" : "ok" }],
    why: (c) => ({
      reasoning: t(`มีการเปลี่ยนแปลง ${c.changesPending} รายการที่กระทบหน่วยงานของคุณ`, `${c.changesPending} change(s) affect your entities.`),
      data: [t("ทะเบียนการเปลี่ยนแปลงระเบียบ", "Regulatory change register")],
      assumptions: [t("วันที่มีผลตามประกาศ", "Effective dates as gazetted")],
      sources: [t("ราชกิจจานุเบกษาและประกาศ กกพ.", "Royal Gazette and ERC notices")],
      alternatives: [{ label: t("ดูว่ากฎใดบังคับใช้ตอนนี้", "See which rules apply now"), missionId: "applicability" }],
    }),
  },
  {
    id: "file-submit",
    app: "cop24",
    title: () => t("อนุมัติและจัดชุดเอกสารสำหรับยื่น", "Approve and assemble the submission"),
    outcome: t("ชุดเอกสารพร้อมยื่น: รายงาน แบบฟอร์ม ดัชนีหลักฐาน", "A submission bundle: report, forms and evidence index"),
    cues: [C(/ยื่น|submit|submission|file (it|the report|with)/iu, 4), C(/อนุมัติ|approve|ลงนาม|sign|certif|รับรอง/iu, 3), C(/ชุดเอกสาร|bundle/iu, 3)],
    roles: ["owner", "consultant", "exec"],
    module: "/preflight",
    modules: ["/preflight", "/report-quality"],
    plan: (c) => [
      { stage: "review", label: t("ตรวจก่อนยื่น 9 ชั้น", "Run the 9-layer preflight"), by: "ai", done: c.hasReport && c.blockers === 0, href: "/preflight", count: c.blockers },
      { stage: "review", label: t("ตรวจมาตรฐานคุณภาพรายงาน 9 ประตู", "Check the 9 report-quality gates"), by: "ai", done: c.hasReport && c.blockers === 0, href: "/report-quality" },
      { stage: "execute", label: t("แก้สิ่งที่กั้นการยื่น", "Fix what blocks filing"), by: "human", done: c.hasReport && c.blockers === 0, href: "/preflight", count: c.blockers },
      { stage: "complete", label: t("ผู้มีคุณวุฒิรับรองและคุณอนุมัติ", "Signatory certifies; you approve"), by: "human", done: c.gate >= 4, href: "/preflight" },
    ],
    requires: (c) => [{ label: t(`ประตูปัจจุบัน: ${c.gateLabel.th}`, `Current gate: ${c.gateLabel.en}`), k: c.gate >= 3 ? "ok" : "warn" }, { label: n(c.blockers, "สิ่งที่กั้นการยื่น", "blocker(s)"), k: c.blockers ? "bad" : "ok" }],
    why: (c) => ({
      reasoning: t(`ร่างอยู่ที่ประตู ${c.gate}/4 — ${c.gateLabel.th}`, `The draft is at gate ${c.gate}/4 — ${c.gateLabel.en}.`),
      data: [t("ผลตรวจก่อนยื่น 9 ชั้น", "9-layer preflight results")],
      assumptions: [t("ยังไม่มีการลงนามรับรอง", "No certification signature yet")],
      sources: [t("มาตรฐานการสร้างรายงาน 24 Series v1.0", "24 Series Report Generation Quality Standard v1.0")],
      alternatives: [{ label: t("ปิดหลักฐานที่ขาดก่อน", "Close missing evidence first"), missionId: "close-evidence" }],
    }),
  },
  {
    id: "deadlines",
    app: "cop24",
    title: () => t("มีอะไรต้องยื่นเมื่อไร", "What is due, and when"),
    outcome: t("ปฏิทินเดียวของทุกกำหนดยื่นและการตรวจวัด", "One calendar of every filing and sampling date"),
    cues: [C(/กำหนด(ส่ง|ยื่น)?|deadline|due|ปฏิทิน|calendar|เมื่อไร|when (is|are|do)|ครบกำหนด/iu, 4)],
    roles: ["owner", "consultant", "exec", "contributor"],
    module: "/calendar",
    modules: ["/calendar"],
    plan: (c) => [
      { stage: "assess", label: t("สร้างปฏิทินจากข้อผูกพันทุกโดเมน", "Build the calendar from every domain's obligations"), by: "ai", done: true, href: "/calendar" },
      { stage: "recommend", label: t("เรียงงานตามความเร่งด่วน", "Order the work by urgency"), by: "ai", done: true },
      { stage: "execute", label: t("เริ่มงานที่ใกล้กำหนดที่สุด", "Start the nearest deadline"), by: "human", done: false, href: "/calendar", count: c.deadlines60 },
    ],
    requires: (c) => [{ label: n(c.deadlines60, "กำหนดภายใน 60 วัน", "deadline(s) within 60 days"), k: c.deadlines60 ? "warn" : "ok" }],
    why: (c) => ({
      reasoning: c.nextDeadline ? t(`กำหนดถัดไปคือ “${c.nextDeadline.label.th}” ในอีก ${c.nextDeadline.days} วัน`, `The next deadline is "${c.nextDeadline.label.en}" in ${c.nextDeadline.days} days.`) : t("ไม่มีกำหนดที่ใกล้ถึง", "No upcoming deadline."),
      data: [t("ปฏิทินที่คำนวณจากข้อผูกพัน", "Calendar derived from obligations")],
      assumptions: [t("ใช้วันที่ตามระเบียบ ไม่รวมการขยายเวลา", "Statutory dates, no extensions")],
      sources: [t("ทะเบียนข้อผูกพัน", "Obligation register")],
      alternatives: [{ label: t("ดูงานที่รอคุณ", "See what is waiting for you"), missionId: "my-tasks" }],
    }),
  },
  {
    id: "monitoring",
    app: "cop24",
    title: (c) => t(`จัดทำรายงานผลการปฏิบัติตาม CoP รายปีของ${c.entityName.th}`, `Prepare the annual CoP monitoring report for ${c.entityName.en}`),
    outcome: t("รายงานติดตามผลรอบปี ยกยอดข้อมูลเดิมและเติมรอบใหม่", "The annual monitoring report, carried forward with the new period added"),
    cues: [C(/ติดตามผล|monitoring|รายปี|รอบปี|ประจำปี|annual (cop|monitoring)/iu, 4), C(/รายงาน|report/iu, 1)],
    roles: ["owner", "consultant"],
    module: "/factory",
    modules: ["/factory", "/calendar", "/ingest"],
    forMe: "/ingest",
    plan: () => [
      { stage: "assess", label: t("ยกยอดข้อมูลจากรายงานรอบก่อน", "Carry forward last period's report"), by: "ai", done: true },
      { stage: "collect", label: t("ส่งผลตรวจวัดของรอบนี้", "Supply this period's monitoring results"), by: "human", done: false, href: "/ingest" },
      { stage: "analyze", label: t("เทียบกับมาตรฐานและรอบก่อน", "Compare with standards and last period"), by: "ai", done: false },
      { stage: "review", label: t("ตรวจและอนุมัติ", "Review and approve"), by: "human", done: false, href: "/studio" },
    ],
    requires: () => [{ label: t("ผลตรวจวัดรอบปีนี้", "This year's monitoring results"), k: "warn" }, { label: t("รายงานรอบก่อน", "Last period's report"), k: "ok" }],
    why: () => ({
      reasoning: t("รายงานติดตามผลต้องยื่นทุกปี ภายใน 31 ม.ค. ของปีถัดไป", "The monitoring report is due every year by 31 January of the following year."),
      data: [t("รายงานรอบก่อน", "Last period's report"), t("ผลตรวจวัดของรอบนี้", "This period's results")],
      assumptions: [t("สถานีตรวจวัดเดิม", "Same monitoring stations as before")],
      sources: [t("ระเบียบ CoP — รายงานผลการปฏิบัติตาม", "CoP rules — compliance monitoring report")],
      alternatives: [{ label: t("รายงานขั้นต้นแทน", "The preliminary report instead"), missionId: "prelim-cop" }],
    }),
  },
  {
    id: "fix-gaps",
    app: "cop24",
    title: () => t("แก้ช่องว่างและความเสี่ยงที่เปิดอยู่", "Fix the open gaps and risks"),
    outcome: t("ช่องว่างที่เป็นสาระสำคัญถูกปิดพร้อมหลักฐาน", "Material gaps closed with evidence"),
    cues: [C(/ช่องว่าง|gaps?|ความเสี่ยง|risks?|แก้ไข|remediat|fix/iu, 3)],
    roles: ["owner", "consultant", "exec"],
    module: "/gaps",
    modules: ["/gaps", "/controls"],
    plan: (c) => [
      { stage: "assess", label: t("คำนวณช่องว่างจากข้อผูกพัน การควบคุม และกฎที่เปลี่ยน", "Derive gaps from obligations, controls and changes"), by: "ai", done: true, href: "/gaps" },
      { stage: "recommend", label: t("เสนอวิธีแก้และผู้รับผิดชอบ", "Propose the fix and the owner"), by: "ai", done: true },
      { stage: "execute", label: t("ดำเนินการแก้ช่องว่างที่เป็นสาระสำคัญ", "Act on the material gaps"), by: "human", done: c.materialGaps === 0, href: "/gaps", count: c.materialGaps },
    ],
    requires: (c) => [{ label: n(c.openGaps, "ช่องว่างเปิดอยู่", "open gap(s)"), k: c.openGaps ? "warn" : "ok" }, { label: n(c.failedControls, "การควบคุมที่ไม่ผ่าน", "failed control(s)"), k: c.failedControls ? "bad" : "ok" }],
    why: (c) => ({
      reasoning: t(`มีช่องว่าง ${c.openGaps} รายการ เป็นสาระสำคัญ ${c.materialGaps}`, `${c.openGaps} open gap(s), ${c.materialGaps} material.`),
      data: [t("ช่องว่างที่ระบบคำนวณ ไม่ได้พิมพ์เอง", "Gaps are derived, never typed")],
      assumptions: [t("ผลทดสอบการควบคุมล่าสุดยังใช้ได้", "The latest control tests still hold")],
      sources: [t("Gap & Remediation Engine", "Gap & Remediation Engine")],
      alternatives: [{ label: t("ปิดหลักฐานที่ขาด", "Close missing evidence"), missionId: "close-evidence" }],
    }),
  },
  {
    id: "quality",
    app: "cop24",
    title: () => t("ตรวจคุณภาพรายงานก่อนปล่อย", "Check report quality before release"),
    outcome: t("ทุกข้อความมีแหล่งอ้างอิง ทุกตัวเลขคำนวณซ้ำได้", "Every claim sourced, every number reproducible"),
    cues: [C(/คุณภาพ|quality|ถูกต้อง|accura|แหล่งอ้างอิง|sources?|hallucinat|ตรวจทาน|proofread/iu, 3)],
    roles: ["owner", "consultant"],
    module: "/report-quality",
    modules: ["/report-quality", "/studio"],
    plan: (c) => [
      { stage: "analyze", label: t("ตรวจทุกข้อความกับแหล่งอ้างอิง", "Check every claim against its source"), by: "ai", done: true, href: "/report-quality" },
      { stage: "review", label: t("ตัดสินข้อความที่ยังไม่มีแหล่ง", "Decide the claims without a source"), by: "human", done: c.hasReport && c.factsSourced === c.factsTotal, href: "/report-quality", count: c.factsTotal - c.factsSourced },
    ],
    requires: (c) => [{ label: t(`มีแหล่งอ้างอิง ${c.factsSourced}/${c.factsTotal} ข้อความ`, `${c.factsSourced}/${c.factsTotal} claims sourced`), k: c.factsSourced === c.factsTotal ? "ok" : "warn" }],
    why: (c) => ({
      reasoning: t(`ยังมี ${c.factsTotal - c.factsSourced} ข้อความที่ไม่มีแหล่งอ้างอิง`, `${c.factsTotal - c.factsSourced} claim(s) still lack a source.`),
      data: [t("บัญชีข้อความ (claim ledger)", "The claim ledger")],
      assumptions: [t("เกณฑ์คะแนนยังไม่ได้สอบเทียบ จึงไม่แสดงเป็นเปอร์เซ็นต์", "The rubric is uncalibrated, so no percentage is shown")],
      sources: [t("มาตรฐานการสร้างรายงาน 24 Series v1.0", "24 Series Report Generation Quality Standard v1.0")],
      alternatives: [{ label: t("ตรวจก่อนยื่น", "Run the preflight"), missionId: "file-submit" }],
    }),
  },
  {
    id: "group-status",
    app: "cop24",
    title: () => t("สถานะการปฏิบัติตามของทั้งกลุ่ม", "Group-wide compliance status"),
    outcome: t("ภาพเดียวของทุกหน่วยงาน เรียงตามความเสี่ยง", "One view of every entity, sorted by risk"),
    cues: [C(/ภาพรวม|overview|สถานะ|status|ทั้งกลุ่ม|group|portfolio|บอร์ด|board|ผู้บริหาร|executive|dashboard/iu, 3)],
    roles: ["exec", "consultant"],
    module: "/portfolio",
    modules: ["/portfolio", "/universe"],
    plan: () => [
      { stage: "assess", label: t("รวมสถานะทุกหน่วยงาน", "Combine every entity's status"), by: "ai", done: true, href: "/portfolio" },
      { stage: "recommend", label: t("เรียงตามความเสี่ยงและกำหนด", "Rank by risk and deadline"), by: "ai", done: true },
      { stage: "review", label: t("ตัดสินเรื่องที่ต้องการผู้บริหาร", "Decide what needs management"), by: "human", done: false, href: "/portfolio" },
    ],
    requires: (c) => [{ label: n(c.entitiesTotal, "หน่วยงานในกลุ่ม", "entities in the group"), k: "ok" }],
    why: () => ({
      reasoning: t("คุณต้องการภาพรวม ไม่ใช่รายละเอียดรายข้อ", "You want the overview, not item-level detail."),
      data: [t("สแนปช็อตเดียวของทุกหน่วยงาน", "One snapshot across every entity")],
      assumptions: [t("ความเสี่ยงคำนวณจากช่องว่างที่เป็นสาระสำคัญและกำหนด", "Risk = material gaps and deadlines")],
      sources: [t("Portfolio & Advisor Center", "Portfolio & Advisor Center")],
      alternatives: [{ label: t("อนุมัติรายงานที่รอ", "Approve waiting reports"), missionId: "file-submit" }],
    }),
  },
  {
    id: "my-tasks",
    app: "cop24",
    title: () => t("ฉันต้องทำอะไรบ้าง", "What do I need to do?"),
    outcome: t("รายการสิ่งที่ต้องทำ เฉพาะของคุณ", "Only the things you need to do"),
    cues: [C(/ต้องทำ(อะไร)?|งานของฉัน|my (tasks|work|to-?dos?)|to-?do|assigned|รอฉัน|waiting (for|on) me/iu, 5)],
    roles: ["contributor", "owner", "consultant", "exec"],
    module: "/my-work",
    modules: ["/my-work"],
    plan: () => [
      { stage: "assess", label: t("รวบรวมสิ่งที่รอคุณจากทุกภารกิจ", "Collect what waits for you across missions"), by: "ai", done: true, href: "/my-work" },
      { stage: "execute", label: t("ทำทีละรายการ", "Work through them one by one"), by: "human", done: false, href: "/my-work" },
    ],
    requires: () => [],
    why: () => ({
      reasoning: t("คุณถามว่าต้องทำอะไร จึงแสดงเฉพาะงานที่ต้องใช้คน", "You asked what to do, so only human work is shown."),
      data: [t("ทุกภารกิจที่เปิดอยู่", "Every open mission")],
      assumptions: [],
      sources: [],
      alternatives: [],
    }),
  },
  {
    id: "esg-561",
    app: "esg24",
    title: () => t("ESG24 · เตรียมข้อมูล ESG สำหรับรายงานประจำปี (56-1)", "ESG24 · Prepare ESG information for the annual report (56-1)"),
    outcome: t("ส่วนความยั่งยืนของแบบ 56-1 One Report", "The sustainability section of the 56-1 One Report"),
    cues: [C(/\besg\b|ความยั่งยืน|sustainab/iu, 4), C(/56-?1|one report|รายงานประจำปี|annual report/iu, 4), C(/ghg|ก๊าซเรือนกระจก|scope\s*[123]/iu, 3)],
    roles: ["owner", "consultant", "exec"],
    module: "/factory",
    modules: ["/factory", "/changes"],
    plan: () => [
      { stage: "assess", label: t("ระบุข้อกำหนด ก.ล.ต. ที่ใช้", "Identify the SEC requirements"), by: "ai", done: true },
      { stage: "collect", label: t("ส่งข้อมูลพลังงานและบุคลากร", "Supply energy and people data"), by: "human", done: false, href: "/ingest" },
      { stage: "analyze", label: t("คำนวณ GHG และร่างการเปิดเผย", "Calculate GHG and draft the disclosure"), by: "ai", done: false },
      { stage: "review", label: t("ตรวจและอนุมัติ", "Review and approve"), by: "human", done: false, href: "/studio" },
    ],
    requires: () => [{ label: t("ข้อมูล ESG24", "ESG24 data"), k: "ok" }, { label: t("รายงานปีก่อน", "Last year's report"), k: "ok" }, { label: t("ค่าไฟฟ้ารายเดือนบางเดือน", "Some monthly electricity bills"), k: "warn" }],
    why: () => ({
      reasoning: t("ภารกิจนี้ทำใน ESG24 ซึ่งใช้ COP24 Core ชุดเดียวกัน", "This runs in ESG24, on the same COP24 Core."),
      data: [t("หลักฐานใน ESG24", "Evidence in ESG24")],
      assumptions: [t("ใช้แบบ 56-1 ฉบับปัจจุบันของ ก.ล.ต.", "Current SEC 56-1 form")],
      sources: [t("ประกาศ ก.ล.ต. แบบ 56-1 One Report", "SEC 56-1 One Report notification")],
      alternatives: [],
    }),
  },
  {
    id: "tp-local-file",
    app: "tp24",
    title: () => t("TP24 · ปิด Local File และวิเคราะห์เทียบเคียง", "TP24 · Finish the local file and benchmark"),
    outcome: t("เอกสารราคาโอนพร้อมการวิเคราะห์เทียบเคียง", "Transfer-pricing documentation with a benchmark"),
    cues: [C(/transfer pricing|ราคาโอน|local file|\btp\b|benchmark|tnmm/iu, 4)],
    roles: ["owner", "consultant"],
    module: "/gaps",
    modules: ["/gaps"],
    plan: () => [
      { stage: "assess", label: t("ระบุรายการระหว่างกัน", "Identify related-party transactions"), by: "ai", done: true },
      { stage: "analyze", label: t("ตั้งค่าการเทียบเคียงที่แนะนำ (TNMM)", "Configure the recommended benchmark (TNMM)"), by: "ai", done: false },
      { stage: "review", label: t("ยืนยันวิธีการและผล", "Confirm the method and results"), by: "human", done: false, href: "/gaps" },
    ],
    requires: () => [{ label: t("สัญญาระหว่างกัน", "Intercompany agreements"), k: "warn" }],
    why: () => ({
      reasoning: t("ภารกิจนี้ทำใน TP24 ซึ่งใช้ COP24 Core ชุดเดียวกัน", "This runs in TP24, on the same COP24 Core."),
      data: [t("งบการเงินและสัญญาระหว่างกัน", "Financials and intercompany agreements")],
      assumptions: [t("TNMM เป็นวิธีที่เหมาะที่สุด", "TNMM is the most appropriate method")],
      sources: [t("ประมวลรัษฎากร มาตรา 71 ทวิ", "Revenue Code s.71 bis")],
      alternatives: [],
    }),
  },
  {
    id: "pdpa-ropa",
    app: "cop24",
    title: () => t("ทบทวน ROPA ตาม PDPA", "Refresh the PDPA record of processing"),
    outcome: t("บันทึกกิจกรรมการประมวลผลข้อมูลส่วนบุคคลที่เป็นปัจจุบัน", "A current record of personal-data processing"),
    cues: [C(/pdpa|ropa|ข้อมูลส่วนบุคคล|personal data|privacy/iu, 5)],
    roles: ["owner", "consultant"],
    module: "/gaps",
    modules: ["/gaps", "/obligations"],
    plan: () => [
      { stage: "collect", label: t("ดึงระบบใหม่จากรายการทรัพย์สินไอที", "Pull new systems from the IT asset list"), by: "ai", done: true },
      { stage: "review", label: t("DPO ยืนยันฐานทางกฎหมาย", "DPO confirms the legal bases"), by: "human", done: false, href: "/gaps" },
    ],
    requires: () => [{ label: t("รายการทรัพย์สินไอที", "IT asset list"), k: "ok" }],
    why: () => ({
      reasoning: t("ROPA ไม่ได้ทบทวนมากว่า 12 เดือน", "The ROPA has not been reviewed for over 12 months."),
      data: [t("ROPA ฉบับล่าสุด", "The latest ROPA")],
      assumptions: [],
      sources: [t("พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล มาตรา 39", "PDPA s.39")],
      alternatives: [],
    }),
  },
  {
    id: "start",
    app: "cop24",
    title: () => t("ฉันไม่รู้ว่าต้องเริ่มตรงไหน", "I don't know where to start"),
    outcome: t("COP24 ถามคำถามสั้น ๆ แล้วบอกว่าต้องทำอะไรบ้าง", "COP24 asks a few short questions and tells you what applies"),
    cues: [C(/ไม่รู้|ไม่แน่ใจ|เริ่ม(ตรง|จาก)?ไหน|ช่วยด้วย|don.?t know|not sure|where (do i|to) start|help me|new here|getting started/iu, 6)],
    roles: ["owner", "consultant", "exec", "contributor"],
    module: "/start",
    modules: ["/start"],
    plan: () => [
      { stage: "assess", label: t("ตอบคำถามสั้น ๆ เกี่ยวกับธุรกิจ", "Answer a few questions about the business"), by: "human", done: false, href: "/start" },
      { stage: "analyze", label: t("ระบุข้อกำหนดทุกโดเมนพร้อมกัน", "Find the requirements across every domain"), by: "ai", done: false },
      { stage: "recommend", label: t("เสนอภารกิจแรกที่ควรทำ", "Recommend the first mission"), by: "ai", done: false },
    ],
    requires: () => [],
    why: () => ({
      reasoning: t("คุณบอกว่าไม่แน่ใจว่าจะเริ่มอย่างไร จึงเริ่มจากคำถามง่าย ๆ", "You said you're not sure where to begin, so it starts with simple questions."),
      data: [],
      assumptions: [],
      sources: [],
      alternatives: [{ label: t("ดูว่ากฎใดบังคับใช้", "See which rules apply"), missionId: "applicability" }],
    }),
  },
];

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);

/* ───────────── derived mission metrics (§15 Mission Card) ───────────── */

export type MissionStatus = "ready" | "in-progress" | "waiting-for-me" | "ai-working" | "completed";
export const STATUS_LABEL: Record<MissionStatus, LText> = {
  ready: t("พร้อมเริ่ม", "Ready to start"),
  "in-progress": t("กำลังดำเนินการ", "In progress"),
  "waiting-for-me": t("รอคุณ", "Waiting for you"),
  "ai-working": t("AI กำลังทำงาน", "AI working"),
  completed: t("เสร็จแล้ว", "Completed"),
};
export const STATUS_TONE: Record<MissionStatus, Status> = { ready: "cond", "in-progress": "info", "waiting-for-me": "warn", "ai-working": "ok", completed: "ok" };

export interface MissionView {
  mission: UxMission;
  title: LText;
  status: MissionStatus;
  /** share of plan steps the AI performs, 0–100 */
  aiShare: number;
  /** share of required data that is in hand, 0–100 */
  dataReadiness: number;
  /** minutes of human work still to do (5 min per open human step, 3 per counted item) */
  userMinutes: number;
  involvement: LText;
  plan: PlanStep[];
  requires: Requirement[];
  nextStep?: PlanStep;
}

export function viewMission(m: UxMission, ctx: UxContext): MissionView {
  const plan = m.plan(ctx);
  const requires = m.requires(ctx);
  const ai = plan.filter((s) => s.by === "ai").length;
  const aiShare = plan.length ? Math.round((ai / plan.length) * 100) : 0;
  const scored = requires.filter((r) => r.k !== "info");
  const dataReadiness = scored.length ? Math.round((scored.filter((r) => r.k === "ok").length / scored.length) * 100) : 100;
  const openHuman = plan.filter((s) => s.by === "human" && !s.done);
  const userMinutes = openHuman.reduce((sum, s) => sum + 5 + Math.min(s.count ?? 0, 10) * 3, 0);
  const nextStep = plan.find((s) => !s.done);
  const done = plan.filter((s) => s.done).length;
  const status: MissionStatus = !nextStep ? "completed" : done === 0 ? "ready" : nextStep.by === "human" ? "waiting-for-me" : "ai-working";
  const involvement = openHuman.length <= 1 ? t("ต่ำ", "Low") : openHuman.length <= 3 ? t("ปานกลาง", "Medium") : t("สูง", "High");
  return { mission: m, title: m.title(ctx), status, aiShare, dataReadiness, userMinutes, involvement, plan, requires, nextStep };
}

/** Missions recommended for a role, most urgent first (waiting for you, then AI working, then ready). */
export function missionsForRole(ctx: UxContext, limit = 6): MissionView[] {
  const order: Record<MissionStatus, number> = { "waiting-for-me": 0, "in-progress": 1, "ai-working": 2, ready: 3, completed: 4 };
  return MISSIONS.filter((m) => m.roles.includes(ctx.role) && m.id !== "start" && m.id !== "my-tasks")
    .map((m) => viewMission(m, ctx))
    .sort((a, b) => order[a.status] - order[b.status])
    .slice(0, limit);
}

/* ───────────── §5 Guided Journey ───────────── */

export interface JourneyStage { stage: Stage; label: LText; status: "done" | "current" | "todo"; steps: PlanStep[] }
export interface Journey {
  stages: JourneyStage[];
  stepIndex: number; // 1-based index of the current stage
  totalSteps: number;
  current?: JourneyStage;
  readiness: number;
  aiCompleted: number;
  waitingForYou: number;
  missingData: number;
  next?: PlanStep;
}

export function journey(view: MissionView, ctx: UxContext): Journey {
  const used = STAGES.filter((st) => view.plan.some((p) => p.stage === st));
  let currentFound = false;
  const stages: JourneyStage[] = used.map((st) => {
    const steps = view.plan.filter((p) => p.stage === st);
    // a finished stage always shows as done; the first unfinished one is where you are
    let status: JourneyStage["status"] = "todo";
    if (steps.every((s) => s.done)) status = "done";
    else if (!currentFound) { status = "current"; currentFound = true; }
    return { stage: st, label: STAGE_LABEL[st], status, steps };
  });
  const current = stages.find((s) => s.status === "current");
  const reportMission = view.mission.id === "prelim-cop" || view.mission.id === "file-submit" || view.mission.id === "close-evidence";
  return {
    stages,
    stepIndex: current ? stages.indexOf(current) + 1 : stages.length,
    totalSteps: stages.length,
    current,
    readiness: reportMission ? ctx.readiness : view.dataReadiness,
    aiCompleted: view.plan.filter((s) => s.by === "ai" && s.done).length,
    waitingForYou: view.plan.filter((s) => s.by === "human" && !s.done).length,
    missingData: view.requires.filter((r) => r.k === "bad" || r.k === "warn").length,
    next: view.nextStep,
  };
}
