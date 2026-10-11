import { t } from "../i18n-text";
import type { LText, Status } from "../types";
import type { UxContext } from "./context";

/* ═══════════════ §16 Universal Next Best Action — one answer per screen ═══════════════ */

export interface NextStep { title: LText; why: LText; href: string; cta: LText }

/**
 * "What should I do next?" for any route, from the live context and the user's role.
 * Every major screen gets an answer; unknown routes fall back to the highest-impact action.
 */
export function nextStepFor(route: string, c: UxContext): NextStep {
  const base = "/" + (route.split("/")[1] ?? "");
  const evidence: NextStep = {
    title: t(`ปิดหลักฐานที่ขาด ${c.evidenceGaps} รายการ`, `Close ${c.evidenceGaps} missing evidence item(s)`),
    why: t("เป็นสิ่งที่กั้นร่างไม่ให้ผ่านเกณฑ์ “หลักฐานครบ”", "It is what keeps the draft from \"evidence complete\""),
    href: "/evidence", cta: t("ดูรายการ →", "See the list →"),
  };
  const conflict: NextStep = {
    title: t(`ตัดสินค่าที่ขัดแย้ง ${c.conflicts} รายการ`, `Decide ${c.conflicts} conflicting value(s)`),
    why: t("ค่าที่ไม่ตรงกันจะทำให้รายงานถูกตีกลับ", "Values that disagree get a report sent back"),
    href: "/preflight", cta: t("ตัดสิน →", "Decide →"),
  };
  const review: NextStep = {
    title: t(`ตรวจบทที่ AI ร่าง ${c.chaptersReview || c.chaptersDrafting} บท`, `Review ${c.chaptersReview || c.chaptersDrafting} AI-drafted chapter(s)`),
    why: t("บทจะปิดได้เมื่อคุณอนุมัติเท่านั้น", "A chapter only closes when you approve it"),
    href: "/studio", cta: t("เปิดสตูดิโอ →", "Open the studio →"),
  };
  const fallback = c.evidenceGaps ? evidence : c.conflicts ? conflict : review;

  if (c.role === "contributor" && base !== "/ingest") {
    return { title: t("ส่งเอกสารที่ได้รับมอบหมาย", "Send the documents assigned to you"), why: t("ผู้ให้ข้อมูลทำเฉพาะงานที่ถูกขอ ไม่ต้องรู้ทั้งระบบ", "Contributors only do what was asked — no need to learn the system"), href: "/my-work", cta: t("ดูงานของฉัน →", "See my work →") };
  }
  switch (base) {
    case "/ingest":
      return { title: t("วางไฟล์ทั้งหมดที่มี แล้วตรวจเฉพาะที่ AI ทำเครื่องหมาย", "Drop every file you have, then review only what the AI flags"), why: t("AI จัดหมวด สกัดค่า และบอกเฉพาะสิ่งที่ขาดหรือขัดแย้ง", "The AI classifies, extracts and reports only what is missing or conflicting"), href: "/ingest", cta: t("เริ่มนำเข้า", "Start import") };
    case "/evidence":
      return c.evidenceGaps ? { ...evidence, title: t(`อนุมัติคำขอเอกสารที่ AI ร่างไว้ ${c.evidenceGaps} รายการ`, `Approve the ${c.evidenceGaps} request(s) the AI drafted`), href: "/evidence", cta: t("ไปที่คำขอ ↓", "Go to requests ↓") } : review;
    case "/studio":
      return c.conflicts ? conflict : review;
    case "/preflight":
    case "/report-quality":
      return c.blockers ? { title: t(`แก้สิ่งที่กั้นการยื่น ${c.blockers} รายการ`, `Fix ${c.blockers} filing blocker(s)`), why: t(`ร่างอยู่ที่ประตู ${c.gate}/4 — ${c.gateLabel.th}`, `The draft is at gate ${c.gate}/4 — ${c.gateLabel.en}`), href: c.evidenceGaps ? "/evidence" : "/studio", cta: t("แก้สิ่งแรก →", "Fix the first one →") } : { title: t("ส่งให้ผู้มีคุณวุฒิรับรอง", "Send for qualified certification"), why: t("ทุกการตรวจผ่านแล้ว", "Every check passes"), href: "/studio", cta: t("ส่งรับรอง →", "Send →") };
    case "/factory":
      return { title: t("ให้ AI ร่างรายงานจากหลักฐานที่มี", "Let the AI draft the report from your evidence"), why: t(`หลักฐานพร้อม ${c.readiness}% — ส่วนที่ขาดจะถูกทำเครื่องหมายเป็นช่องว่าง ไม่ถูกแต่งขึ้น`, `Evidence is ${c.readiness}% ready — missing parts are marked as gaps, never invented`), href: "/factory", cta: t("สร้างร่าง ↓", "Generate ↓") };
    case "/calendar":
      return c.nextDeadline ? { title: t(`เตรียม “${c.nextDeadline.label.th}”`, `Prepare "${c.nextDeadline.label.en}"`), why: t(`ครบกำหนดในอีก ${c.nextDeadline.days} วัน`, `Due in ${c.nextDeadline.days} days`), href: "/missions?m=prelim-cop", cta: t("เริ่มภารกิจ →", "Start mission →") } : fallback;
    case "/gaps":
    case "/controls":
      return c.materialGaps ? { title: t(`แก้ช่องว่างที่เป็นสาระสำคัญ ${c.materialGaps} รายการก่อน`, `Fix the ${c.materialGaps} material gap(s) first`), why: t("ช่องว่างที่เป็นสาระสำคัญอาจทำให้รายงานถูกตีกลับหรือเสียใบอนุญาต", "Material gaps can get a report rejected or put a licence at risk"), href: "/gaps", cta: t("ดูช่องว่าง ↓", "See gaps ↓") } : fallback;
    case "/changes":
      return c.changesPending ? { title: t(`ตัดสินข้อเสนอจากกฎที่เปลี่ยน ${c.changesPending} รายการ`, `Decide on ${c.changesPending} rule-change proposal(s)`), why: t("COP24 ร่างการแก้ไขรายบทไว้แล้ว", "COP24 has drafted chapter-level changes"), href: "/changes", cta: t("ดูผลกระทบ ↓", "See impact ↓") } : fallback;
    case "/universe":
    case "/obligations":
    case "/start":
    case "/corpus":
      return { title: t("เริ่มภารกิจที่ใกล้กำหนดที่สุด", "Start the mission with the nearest deadline"), why: c.nextDeadline ? t(`“${c.nextDeadline.label.th}” ในอีก ${c.nextDeadline.days} วัน`, `"${c.nextDeadline.label.en}" in ${c.nextDeadline.days} days`) : t("ข้อผูกพันถูกระบุครบแล้ว", "Obligations are identified"), href: "/missions?m=prelim-cop", cta: t("เริ่ม →", "Start →") };
    case "/portfolio":
      return { title: t("ตัดสินเรื่องของหน่วยงานที่เสี่ยงที่สุด", "Decide on the highest-risk entity"), why: t("พอร์ตเรียงตามความเสี่ยงแล้ว เริ่มจากแถวบนสุด", "The portfolio is sorted by risk — start at the top"), href: "/portfolio", cta: t("ดูแถวบนสุด ↓", "See the top row ↓") };
    case "/agi":
      return { title: t("เริ่ม F01 รายงานผลการปฏิบัติตามประจำรอบ", "Start F01 — the periodic CoP monitoring report"), why: c.nextDeadline ? t(`กำหนดถัดไปในอีก ${c.nextDeadline.days} วัน`, `The next deadline is in ${c.nextDeadline.days} days`) : t("ภารกิจหลักที่ใช้บ่อยที่สุด", "The most used flagship"), href: "/agi?f=F01", cta: t("ดูตัวอย่าง ↓", "Preview ↓") };
    case "/my-work":
    case "/outputs":
    case "/missions":
    default:
      return fallback;
  }
}

/* ═══════════════ §8 Explain This — contextual, not a dictionary ═══════════════ */

export interface Explanation { term: LText; what: LText; why: LText; forYou: LText; todo: LText; href?: string }

export const GLOSSARY_IDS = ["cop", "applicability", "obligation", "evidence-layers", "readiness", "preflight", "gate", "material-gap", "rulepack", "evidence-guard", "control-test", "reg-change", "noise-baseline", "lab-accreditation", "mission-authorisation", "claim-ledger"] as const;
export type GlossaryId = (typeof GLOSSARY_IDS)[number];

export function explain(id: GlossaryId, c: UxContext): Explanation {
  const e = c.entityName;
  switch (id) {
    case "cop": return { term: t("CoP — ประมวลหลักการปฏิบัติ", "CoP — Code of Practice"), what: t("ชุดมาตรการสิ่งแวดล้อม ความปลอดภัย และชุมชน ที่ กกพ. กำหนดให้โรงไฟฟ้าทำและรายงาน", "The environmental, safety and community measures the ERC requires a power plant to carry out and report on."), why: t("ถ้าไม่ยื่นหรือยื่นไม่ครบ อาจถูกตีกลับหรือกระทบใบอนุญาต", "Missing or incomplete reports can be sent back or put the licence at risk."), forYou: t(`${e.th} ต้องยื่นรายงาน CoP — ตอนนี้หลักฐานพร้อม ${c.readiness}%`, `${e.en} must file CoP reports — evidence is ${c.readiness}% ready.`), todo: t("ให้ AI ร่างรายงานและบอกเฉพาะสิ่งที่ขาด", "Let the AI draft the report and tell you only what's missing."), href: "/missions?m=prelim-cop" };
    case "applicability": return { term: t("การบังคับใช้ (Applicability)", "Applicability"), what: t("การตัดสินว่ากฎข้อไหนใช้กับธุรกิจคุณจริง ๆ จากประเภท ขนาด และที่ตั้ง", "Deciding which rules actually apply to your business, from its type, size and location."), why: t("ทำงานเฉพาะสิ่งที่ต้องทำ ไม่เสียเวลากับกฎที่ไม่เกี่ยว", "You only work on what applies, not on rules that don't."), forYou: t(`COP24 ประเมิน${e.th}แล้ว — แต่ละข้อมีเหตุผลว่าทำไมใช้หรือไม่ใช้`, `COP24 has assessed ${e.en} — each rule shows why it does or doesn't apply.`), todo: t("ตรวจข้อสมมติของโปรไฟล์ให้ถูกต้อง", "Check the profile assumptions are right."), href: "/start" };
    case "obligation": return { term: t("ข้อผูกพัน (Obligation)", "Obligation"), what: t("สิ่งที่กฎหมายกำหนดให้ทำ เช่น ยื่นรายงาน ตรวจวัด หรือเก็บเอกสาร พร้อมกำหนดเวลา", "Something a rule requires you to do — file, measure or keep a record — with a due date."), why: t("ทุกข้อผูกพันต้องมีหลักฐานว่าทำแล้ว", "Every obligation needs evidence that it was done."), forYou: t(`มีช่องว่างเปิดอยู่ ${c.openGaps} รายการในข้อผูกพันของ${e.th}`, `${c.openGaps} open gap(s) across ${e.en}'s obligations.`), todo: t("เริ่มจากรายการที่เป็นสาระสำคัญ", "Start with the material ones."), href: "/gaps" };
    case "evidence-layers": return { term: t("หลักฐาน 3 ชั้น", "3-layer evidence"), what: t("หลักฐานต้อง (1) มีอยู่ (2) ยังใช้ได้ ไม่หมดอายุ และ (3) พิสูจน์สิ่งที่รายงานอ้างได้จริง", "Evidence must (1) exist, (2) still be valid, and (3) actually prove what the report claims."), why: t("เอกสารที่มีแต่หมดอายุหรือไม่ตรงประเด็น ถือว่าไม่มี", "A document that is expired or off-point counts as missing."), forYou: t(`พิสูจน์ได้ครบ ${c.evidenceProven} จาก ${c.evidenceRequired} รายการ`, `${c.evidenceProven} of ${c.evidenceRequired} items fully prove their claim.`), todo: t("ดูรายการที่ตกชั้น 2 หรือ 3", "See items failing layer 2 or 3."), href: "/evidence" };
    case "readiness": return { term: t("ความพร้อมหลักฐาน", "Evidence readiness"), what: t("สัดส่วนหลักฐานที่บังคับซึ่งพิสูจน์ได้ครบทั้ง 3 ชั้น", "The share of mandatory evidence that passes all three layers."), why: t("รายงานยื่นได้เมื่อหลักฐานที่บังคับครบ 100%", "A report can be filed when mandatory evidence reaches 100%."), forYou: t(`ตอนนี้ ${c.readiness}% — ขาดอีก ${c.evidenceRequired - c.evidenceProven} รายการ`, `Now ${c.readiness}% — ${c.evidenceRequired - c.evidenceProven} item(s) to go.`), todo: t("ให้ AI ร่างคำขอเอกสารที่ขาด", "Let the AI draft requests for the missing items."), href: "/evidence" };
    case "preflight": return { term: t("ตรวจก่อนยื่น 9 ชั้น", "9-layer preflight"), what: t("การตรวจอัตโนมัติ 9 ด้านก่อนยื่น เช่น หลักฐาน ค่าที่ขัดแย้ง แหล่งอ้างอิง และลายมือชื่อ", "Nine automated checks before filing — evidence, conflicting values, sources, signatures and more."), why: t("จับสิ่งที่หน่วยงานกำกับจะตีกลับ ก่อนที่จะยื่น", "Catches what the regulator would send back, before you file."), forYou: t(`มีสิ่งที่กั้นการยื่น ${c.blockers} รายการ และข้อสังเกต ${c.observations}`, `${c.blockers} blocker(s) and ${c.observations} observation(s).`), todo: t("แก้สิ่งที่กั้นการยื่นก่อน", "Fix the blockers first."), href: "/preflight" };
    case "gate": return { term: t("ประตูการปล่อยรายงาน", "Release gate"), what: t("4 ขั้น: AI ร่างแล้ว → หลักฐานครบ → พร้อมรับรอง → อนุมัติให้ยื่น", "Four stages: AI drafted → evidence complete → ready to certify → approved to file."), why: t("รายงานเลื่อนขั้นได้เมื่อผ่านเกณฑ์จริงเท่านั้น ไม่ใช่เพราะมีคนกด", "A report only moves up when it truly meets the bar, not because someone clicked."), forYou: t(`ร่างของคุณอยู่ที่ขั้น ${c.gate}/4 — ${c.gateLabel.th}`, `Your draft is at stage ${c.gate}/4 — ${c.gateLabel.en}.`), todo: t("ทำสิ่งที่กั้นขั้นถัดไป", "Do what blocks the next stage."), href: "/preflight" };
    case "material-gap": return { term: t("ช่องว่างที่เป็นสาระสำคัญ", "Material gap"), what: t("ช่องว่างที่ร้ายแรงพอจะทำให้รายงานถูกตีกลับหรือกระทบใบอนุญาต", "A gap serious enough to get a report rejected or affect a licence."), why: t("ต้องแก้ก่อนช่องว่างอื่น", "Fix these before anything else."), forYou: t(`${e.th}มีช่องว่างที่เป็นสาระสำคัญ ${c.materialGaps} รายการ`, `${e.en} has ${c.materialGaps} material gap(s).`), todo: t("เปิดรายการและมอบผู้รับผิดชอบ", "Open the list and assign owners."), href: "/gaps" };
    case "rulepack": return { term: t("ชุดกฎ (Rule pack)", "Rule pack"), what: t("ชุดข้อกำหนดของกฎหมายหนึ่งฉบับ ที่ COP24 แปลงเป็นข้อผูกพันพร้อมเวอร์ชัน", "One regulation's requirements, turned into versioned obligations."), why: t("ทุกผลลัพธ์อ้างอิงเวอร์ชันของชุดกฎได้ ตรวจย้อนหลังได้", "Every output cites the rule-pack version, so it can be audited later."), forYou: t("COP24, ESG24 และ TP24 ใช้ชุดกฎร่วมกัน", "COP24, ESG24 and TP24 share the same packs."), todo: t("ไม่ต้องทำอะไร — ระบบอัปเดตเมื่อกฎเปลี่ยน", "Nothing — packs update when rules change."), href: "/packs" };
    case "evidence-guard": return { term: t("Evidence Guard", "Evidence Guard"), what: t("ตัวกั้นที่ไม่ให้ปิดบทรายงาน ถ้าหลักฐานที่อ้างยังพิสูจน์ไม่ได้", "A guard that stops a chapter closing while its cited evidence does not prove the claim."), why: t("ป้องกันการยื่นข้อความที่ไม่มีหลักฐานรองรับ", "Prevents filing statements with no evidence behind them."), forYou: t("เปิดอยู่ — บทที่หลักฐานไม่ครบจะปิดไม่ได้", "It's on — chapters with incomplete evidence can't close."), todo: t("ปิดหลักฐานที่ขาด แล้วบทจะปิดได้", "Close the missing evidence and the chapter can close."), href: "/evidence" };
    case "control-test": return { term: t("การทดสอบการควบคุม", "Control test"), what: t("การตรวจว่ามาตรการที่ตั้งไว้ทำงานจริง ไม่ใช่แค่มีบนกระดาษ", "Checking that a safeguard actually works, not just exists on paper."), why: t("การควบคุมที่ไม่ผ่านจะเปิดช่องว่างอัตโนมัติ", "A failed control opens a gap automatically."), forYou: t(`ไม่ผ่าน ${c.failedControls} จาก ${c.controlsTotal} การควบคุม`, `${c.failedControls} of ${c.controlsTotal} controls failed.`), todo: t("แก้การควบคุมที่ไม่ผ่านแล้วทดสอบซ้ำ", "Fix the failed controls and retest."), href: "/controls" };
    case "reg-change": return { term: t("การเปลี่ยนแปลงกฎ", "Regulatory change"), what: t("กฎใหม่หรือแก้ไขที่ COP24 ติดตามและโยงผลกระทบให้", "A new or amended rule that COP24 tracks and traces to its impact."), why: t("รู้ล่วงหน้าว่าต้องแก้รายงานบทไหน", "You know in advance which chapters must change."), forYou: t(`มี ${c.changesPending} การเปลี่ยนแปลงที่กระทบหน่วยงานของคุณ`, `${c.changesPending} change(s) affect your entities.`), todo: t("อ่านข้อเสนอและตัดสินใจ", "Read the proposals and decide."), href: "/changes" };
    case "noise-baseline": return { term: t("ระดับเสียงพื้นฐาน", "Noise baseline"), what: t("ระดับเสียงก่อนมีโครงการ วัดอย่างน้อย 2 สถานี 5 วัน", "Noise before the project exists — at least 2 stations over 5 days."), why: t("ใช้เปรียบเทียบว่าโครงการทำให้เสียงดังขึ้นหรือไม่", "It is the baseline for judging whether the project adds noise."), forYou: t("โซลาร์ภาคพื้นดินต้องมี โซลาร์บนหลังคาไม่ต้อง", "Required for ground-mounted solar; not for rooftop."), todo: t("ตรวจว่ามีครบ 2 สถานี 5 วัน", "Check you have 2 stations and 5 days."), href: "/ingest" };
    case "lab-accreditation": return { term: t("การขึ้นทะเบียนห้องปฏิบัติการ", "Laboratory accreditation"), what: t("ห้องแล็บที่วิเคราะห์ตัวอย่างต้องขึ้นทะเบียนและยังไม่หมดอายุ ณ วันที่วิเคราะห์", "The lab that analysed a sample must be registered and in date on the analysis day."), why: t("ผลจากแล็บที่หมดอายุใช้อ้างในรายงานไม่ได้", "Results from an expired lab cannot be cited."), forYou: t("ตรวจวันที่หมดอายุทุกครั้งที่นำเข้าผลแล็บ", "Expiry is checked every time a lab result is imported."), todo: t("ขอหนังสือรับรองฉบับใหม่ถ้าหมดอายุ", "Request a new certificate if expired."), href: "/evidence" };
    case "mission-authorisation": return { term: t("การอนุญาตภารกิจ", "Mission authorisation"), what: t("ก่อน AI เริ่ม คุณกำหนดแหล่งข้อมูล ผู้รับ การส่งออกภายนอก และวงเงิน", "Before the AI starts, you set its sources, recipients, external sends and spend limit."), why: t("AI ทำงานแทนได้โดยไม่ทำเกินที่อนุญาต", "The AI can act for you without going beyond what you allowed."), forYou: t("ข้อความถึงบุคคลภายนอกต้องได้รับอนุมัติทุกครั้ง", "Messages to outside parties always need your approval."), todo: t("ตรวจขอบเขตก่อนกดเริ่ม", "Check the scope before you start."), href: "/ingest" };
    case "claim-ledger": return { term: t("บัญชีข้อความ (Claim ledger)", "Claim ledger"), what: t("ทุกประโยคที่เป็นข้อเท็จจริงในรายงาน พร้อมแหล่งที่มา", "Every factual sentence in the report, with its source."), why: t("คลิกดูแหล่งได้ทุกประโยค ตรวจย้อนได้", "Every sentence clicks through to its source."), forYou: t(`มีแหล่งอ้างอิง ${c.factsSourced} จาก ${c.factsTotal} ข้อความ`, `${c.factsSourced} of ${c.factsTotal} claims are sourced.`), todo: t("ตัดสินข้อความที่ยังไม่มีแหล่ง", "Decide the claims without a source."), href: "/report-quality" };
  }
}

/* ═══════════════ §12 AI translates results ═══════════════ */

export type ResultKind = "readiness" | "gate" | "gaps" | "controls" | "facts";

export interface Interpretation {
  headline: LText;
  happened: LText;
  meaning: LText;
  verdict: Status;
  verdictLabel: LText;
  compare: LText;
  why: LText;
  next: LText;
  fix: { label: LText; href: string };
}

const verdict = (k: Status): LText => (k === "ok" ? t("ดี", "Good") : k === "warn" ? t("ต้องติดตาม", "Needs attention") : t("ยังไม่พร้อม", "Not ready"));

export function interpret(kind: ResultKind, c: UxContext): Interpretation {
  switch (kind) {
    case "readiness": {
      const k: Status = c.readiness >= 90 ? "ok" : c.readiness >= 60 ? "warn" : "bad";
      return { headline: t(`ความพร้อมหลักฐาน ${c.readiness}%`, `Evidence readiness ${c.readiness}%`), happened: t(`หลักฐาน ${c.evidenceProven} จาก ${c.evidenceRequired} รายการที่บังคับพิสูจน์ได้ครบ`, `${c.evidenceProven} of ${c.evidenceRequired} mandatory items fully prove their claim.`), meaning: t("ยังยื่นไม่ได้จนกว่าจะครบ 100%", "The report cannot be filed until this reaches 100%."), verdict: k, verdictLabel: verdict(k), compare: t("เกณฑ์ยื่น: 100% · เกณฑ์ “พร้อมรับรอง”: ไม่มีหลักฐานที่เป็นสาระสำคัญขาด", "Filing needs 100% · \"Ready to certify\" needs no material evidence gap."), why: t(`หลักฐานขาด ${c.evidenceGaps} รายการ เป็นสาระสำคัญ ${c.materialGaps}`, `${c.evidenceGaps} evidence gap(s), ${c.materialGaps} material.`), next: t("ให้ AI ร่างคำขอเอกสารที่ขาดถึงผู้รับผิดชอบ คุณแค่อนุมัติ", "Let the AI draft requests to the owners; you only approve."), fix: { label: t("ปิดหลักฐานที่ขาด →", "Close missing evidence →"), href: "/missions?m=close-evidence&assist=for-me" } };
    }
    case "gate": {
      const k: Status = c.gate >= 4 ? "ok" : c.gate >= 3 ? "warn" : "bad";
      return { headline: t(`ขั้น ${c.gate}/4 — ${c.gateLabel.th}`, `Stage ${c.gate}/4 — ${c.gateLabel.en}`), happened: t(`การตรวจ 9 ชั้นพบสิ่งที่กั้นการยื่น ${c.blockers} รายการ`, `The 9-layer check found ${c.blockers} blocker(s).`), meaning: c.gate >= 4 ? t("พร้อมยื่น", "Ready to file.") : t("ยังยื่นไม่ได้", "Not yet fileable."), verdict: k, verdictLabel: verdict(k), compare: t("ขั้น 4 = อนุมัติให้ยื่น", "Stage 4 = approved to file."), why: c.evidenceGaps ? t("หลักฐานยังไม่ครบ", "Evidence is incomplete.") : c.conflicts ? t("มีค่าที่ขัดแย้ง", "There are conflicting values.") : t("ยังไม่ได้รับรอง", "Not yet certified."), next: t("แก้สิ่งที่กั้นทีละรายการ เริ่มจากหลักฐาน", "Fix the blockers one by one, evidence first."), fix: { label: t("ให้ AI ช่วยแก้ →", "Let AI help →"), href: "/missions?m=file-submit&assist=guide" } };
    }
    case "gaps": {
      const k: Status = c.materialGaps === 0 ? (c.openGaps ? "warn" : "ok") : "bad";
      return { headline: t(`${c.entityName.th}: ช่องว่างเปิดอยู่ ${c.openGaps} รายการ`, `${c.entityName.en}: ${c.openGaps} open gap(s)`), happened: t(`เป็นสาระสำคัญ ${c.materialGaps} รายการ`, `${c.materialGaps} are material.`), meaning: c.materialGaps ? t("มีเรื่องที่อาจทำให้รายงานถูกตีกลับ", "Some could get a report rejected.") : t("ไม่มีเรื่องร้ายแรง", "Nothing serious."), verdict: k, verdictLabel: verdict(k), compare: t("เป้าหมาย: ไม่มีช่องว่างที่เป็นสาระสำคัญ", "Target: no material gaps."), why: t("ช่องว่างคำนวณจากหลักฐาน การควบคุม และกฎที่เปลี่ยน", "Gaps come from evidence, controls and rule changes."), next: t("แก้ช่องว่างที่เป็นสาระสำคัญก่อน", "Fix the material gaps first."), fix: { label: t("เริ่มแก้ →", "Start fixing →"), href: "/missions?m=fix-gaps&assist=guide" } };
    }
    case "controls": {
      const k: Status = c.failedControls === 0 ? "ok" : "bad";
      return { headline: t(`การควบคุมไม่ผ่าน ${c.failedControls}/${c.controlsTotal}`, `${c.failedControls}/${c.controlsTotal} controls failed`), happened: t("ผลทดสอบล่าสุดของแต่ละการควบคุม", "The latest test of each control."), meaning: c.failedControls ? t("มาตรการบางอย่างไม่ได้ทำงานจริง", "Some safeguards are not actually working.") : t("ทุกมาตรการทำงาน", "Every safeguard works."), verdict: k, verdictLabel: verdict(k), compare: t("เป้าหมาย: ไม่มีการควบคุมที่ไม่ผ่าน", "Target: no failed controls."), why: t("การควบคุมที่ไม่ผ่านเปิดช่องว่างอัตโนมัติ", "Failed controls open gaps automatically."), next: t("แก้และทดสอบซ้ำ", "Fix and retest."), fix: { label: t("ดูการควบคุมที่ไม่ผ่าน →", "See failed controls →"), href: "/controls" } };
    }
    case "facts": {
      const missing = c.factsTotal - c.factsSourced;
      const k: Status = missing === 0 ? "ok" : missing <= 10 ? "warn" : "bad";
      return { headline: t(`ข้อความมีแหล่งอ้างอิง ${c.factsSourced}/${c.factsTotal}`, `${c.factsSourced}/${c.factsTotal} claims sourced`), happened: t(`${missing} ข้อความยังไม่มีแหล่งอ้างอิง`, `${missing} claim(s) have no source.`), meaning: t("ข้อความที่ไม่มีแหล่งจะไม่ถูกปล่อยออกไป", "Unsourced claims will not be released."), verdict: k, verdictLabel: verdict(k), compare: t("เกณฑ์: ทุกข้อความต้องมีแหล่ง", "Bar: every claim has a source."), why: t("ข้อความเหล่านี้มาจากการร่างที่ยังไม่มีหลักฐาน", "These came from drafting before evidence arrived."), next: t("ตัดสินว่าจะหาแหล่ง แก้ หรือลบ", "Decide: source it, change it or remove it."), fix: { label: t("ตรวจข้อความ →", "Review claims →"), href: "/report-quality" } };
    }
  }
}

/* ═══════════════ §14 Section B — recommended actions (3–6, context-sensitive) ═══════════════ */

export function recommendedActions(c: UxContext, nba: { title: LText; why: LText; route: string; cta: LText }): NextStep[] {
  const out: NextStep[] = [{ title: nba.title, why: nba.why, href: nba.route, cta: nba.cta }];
  if (c.role === "contributor") {
    out.push({ title: t("ส่งเอกสารที่ถูกขอ", "Send the documents you were asked for"), why: t("วางไฟล์ครั้งเดียว AI จับคู่กับคำขอให้เอง", "Drop the files once — the AI matches them to the requests"), href: "/ingest", cta: t("อัปโหลด →", "Upload →") });
    out.push({ title: t("ดูสิ่งที่ต้องทำทั้งหมด", "See everything you need to do"), why: t("เฉพาะงานของคุณ ไม่ต้องรู้ทั้งระบบ", "Only your tasks — no need to learn the system"), href: "/my-work", cta: t("งานของฉัน →", "My work →") });
    return out;
  }
  if (c.conflicts) out.push({ title: t(`ตัดสินค่าที่ขัดแย้ง ${c.conflicts} รายการ`, `Decide ${c.conflicts} conflicting value(s)`), why: t("AI ไม่เลือกค่าแทนคุณ — เป็นการตัดสินใจที่มีผลต่อรายงาน", "The AI won't pick a value for you — it changes what the report says"), href: "/preflight", cta: t("ตัดสิน →", "Decide →") });
  if (c.nextDeadline && c.nextDeadline.days <= 60) out.push({ title: t(`เตรียม “${c.nextDeadline.label.th}”`, `Prepare "${c.nextDeadline.label.en}"`), why: t(`ครบกำหนดในอีก ${c.nextDeadline.days} วัน`, `Due in ${c.nextDeadline.days} days`), href: "/calendar", cta: t("ดูปฏิทิน →", "See calendar →") });
  if (c.role === "exec") out.push({ title: t("ดูสถานะทั้งกลุ่ม", "See the group-wide status"), why: t(`${c.entitiesTotal} หน่วยงาน เรียงตามความเสี่ยง`, `${c.entitiesTotal} entities, sorted by risk`), href: "/portfolio", cta: t("ดูพอร์ต →", "See portfolio →") });
  else out.push({ title: t("นำเข้าเอกสารที่มีทั้งหมด", "Import every document you have"), why: t("ไม่ต้องตั้งชื่อหรือแยกหมวด AI บอกเฉพาะสิ่งที่ขาด", "No naming or sorting; the AI reports only what's missing"), href: "/ingest", cta: t("นำเข้า →", "Import →") });
  if (c.changesPending) out.push({ title: t(`ทบทวนกฎที่เปลี่ยน ${c.changesPending} รายการ`, `Review ${c.changesPending} rule change(s)`), why: t("COP24 ร่างการแก้ไขรายบทไว้แล้ว", "COP24 has drafted the chapter changes"), href: "/changes", cta: t("ดูผลกระทบ →", "See impact →") });
  return out.slice(0, 5);
}
