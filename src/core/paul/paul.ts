import { SCREENS, type UxTest } from "../ux/acceptance";
import { MISSIONS, viewMission } from "../ux/catalog";
import type { UxContext } from "../ux/context";
import { GLOSSARY_IDS, explain } from "../ux/guidance";
import { understand } from "../ux/intent";
import { navNumber } from "../ux/nav";
import type { Hit } from "./retrieve";

/**
 * Paul — the COP24 chat assistant. Three jobs:
 *   help      — how to use COP24 (grounded in the screen register, missions and glossary)
 *   legal     — a legal consultant for CoP projects (grounded in the ERC corpus, always cited)
 *   feedback  — takes feedback, triages it and turns it into an improvement item
 * Everything here is deterministic. A language model, when connected, writes the reply from the
 * same grounding; without one Paul still answers from these functions.
 */

export type PaulMode = "help" | "legal" | "feedback";
export type Lang = "th" | "en";
export interface ChatMessage { role: "user" | "assistant"; content: string }
export interface PaulAction { label: string; href: string }

const LEGAL = /กฎหมาย|ระเบียบ|ประกาศ|ข้อ\s*\d|มาตรา|กกพ|ใบอนุญาต|ต้อง(ยื่น|มี|ทำ)|บังคับ|ผิด|โทษ|ค่าธรรมเนียม|รับฟังความคิดเห็น|มาตรการ|ขั้นต้น|ขั้นสุดท้าย|เสียง|ฝุ่น|ของเสีย|law|legal|regulat|requir|licen[cs]e|permit|obligat|comply|complian|penalt|\bfee|hearing|clause|section|deadline|must|erc\b|code of practice|noise|baseline|waste|exempt/iu;
const FEEDBACK = /feedback|ข้อเสนอแนะ|ติชม|แนะนำว่า|อยากให้|ควรจะ|น่าจะมี|ไม่ทำงาน|ใช้ไม่ได้|ใช้ยาก|งง|สับสน|ช้า|error|bug|broken|doesn.?t work|not working|confus|hard to|slow|suggest|wish|would be nice|please add|feature request|love|great|ชอบ/iu;
const HELP = /วิธี|ยังไง|อย่างไร|ตรงไหน|หน้าไหน|เมนู|ปุ่ม|ใช้งาน|how (do|can|to)|where (is|do|can)|which (page|screen|menu)|button|menu|navigate|use (this|the app|cop24)|tutorial|guide me/iu;

const HOW_Q = /วิธี|ยังไง|อย่างไร|ตรงไหน|how (do|can|to)|where (is|do|can)|\?\s*$/iu;

/** Which of Paul's jobs a message is for, unless the user picked one. */
export function detectMode(text: string, picked?: PaulMode): PaulMode {
  if (picked) return picked;
  // complaints and ideas are feedback even when they mention a button or menu — unless phrased as a how-to question
  if (FEEDBACK.test(text) && !HOW_Q.test(text)) return "feedback";
  if (HELP.test(text) && !/(กฎหมาย|ระเบียบ|law|regulat|legal)/iu.test(text)) return "help";
  if (LEGAL.test(text)) return "legal";
  return "help";
}

/* ───────────── feedback → improvement item ───────────── */

export type FeedbackCategory = "bug" | "confusing" | "idea" | "content" | "praise";
export interface Triage { category: FeedbackCategory; severity: "high" | "medium" | "low"; route: string; screen: string; uxTest?: UxTest; summary: string }

const CAT: [RegExp, FeedbackCategory][] = [
  [/ไม่ทำงาน|ใช้ไม่ได้|ค้าง|พัง|error|bug|broken|crash|doesn.?t work|not working|fails?|wrong (number|value)|ผิดพลาด/iu, "bug"],
  [/กฎหมาย|ระเบียบ|ข้อกำหนด|อ้างอิงผิด|ไม่ตรงกับ|outdated|regulation|clause|legal|citation|ผิดข้อ/iu, "content"],
  [/งง|สับสน|ใช้ยาก|หาไม่เจอ|ไม่เข้าใจ|ศัพท์|confus|hard to|can.?t find|unclear|don.?t understand|jargon|too many/iu, "confusing"],
  [/ชอบ|ดีมาก|เยี่ยม|ขอบคุณ|love|great|awesome|thank|helpful/iu, "praise"],
];
const UX_FOR: Partial<Record<FeedbackCategory, UxTest>> = { confusing: "terminology", idea: "outcome" };

export function triageFeedback(text: string, route: string): Triage {
  const category = CAT.find(([re]) => re.test(text))?.[1] ?? "idea";
  const severity = category === "bug" && /ข้อมูลหาย|ยื่นผิด|ส่งผิด|data loss|lost|wrong (number|value)|security|ความปลอดภัย|ผิดกฎหมาย/iu.test(text) ? "high"
    : category === "bug" || category === "content" ? "medium" : "low";
  // a screen named in the text wins over the screen the user is on
  const named = SCREENS.find((s) => s.route !== "/" && (text.toLowerCase().includes(s.name.en.toLowerCase()) || text.includes(s.name.th)));
  const screen = named ?? SCREENS.find((s) => s.route === route) ?? SCREENS[0];
  const uxTest = category === "confusing" && /ต่อไป|ทำอะไรต่อ|next/iu.test(text) ? "nextStep" : UX_FOR[category];
  const summary = text.replace(/\s+/g, " ").trim().slice(0, 140);
  return { category, severity, route: screen.route, screen: screen.name.en, uxTest, summary };
}

/* ───────────── app help, grounded in the screen register and missions ───────────── */

export function appHelp(question: string, ctx: UxContext, lang: Lang): { text: string; actions: PaulAction[] } {
  const L = (x: { th: string; en: string }) => x[lang];
  const u = understand(question, ctx);
  const actions: PaulAction[] = [];
  const lines: string[] = [];
  const m = u.missions[0]?.view;
  if (m && u.confidence !== "low") {
    lines.push(lang === "th" ? `ทำได้แบบนี้ครับ — **${L(m.title)}**` : `Here's how — **${L(m.title)}**`);
    m.plan.forEach((p, i) => lines.push(`${i + 1}. ${p.by === "ai" ? "AI" : lang === "th" ? "คุณ" : "You"}: ${L(p.label)}${p.done ? " ✓" : ""}`));
    lines.push(lang === "th" ? "เลือกได้ว่าจะทำเอง ให้แนะนำทีละขั้น หรือให้ AI ทำให้" : "You can do it yourself, be guided step by step, or let the AI do it.");
    actions.push({ label: lang === "th" ? "เปิดภารกิจนี้" : "Open this mission", href: `/missions?m=${m.mission.id}&assist=guide` });
    actions.push({ label: lang === "th" ? "ไปที่เครื่องมือโดยตรง" : "Go straight to the tool", href: m.mission.module });
  }
  const q = question.toLowerCase();
  const term = GLOSSARY_IDS.map((id) => explain(id, ctx)).find((x) => q.includes(x.term.en.toLowerCase().split(" — ")[0].toLowerCase()) || question.includes(x.term.th.split(" — ")[0].split(" (")[0]));
  if (term) {
    lines.push("", `**${L(term.term)}** — ${L(term.what)} ${L(term.forYou)}`);
    if (term.href) actions.push({ label: L(term.todo), href: term.href });
  }
  const screen = SCREENS.find((s) => s.route !== "/" && (q.includes(s.name.en.toLowerCase()) || question.includes(s.name.th)));
  if (screen) {
    lines.push("", `**${L(screen.name)}** — ${L(screen.experience)}`);
    actions.push({ label: L(screen.name), href: screen.route });
  }
  if (!lines.length) {
    lines.push(lang === "th"
      ? "บอกผมได้เลยว่าอยากทำอะไรให้สำเร็จ เช่น “เตรียมรายงาน CoP ขั้นต้น” “ขาดเอกสารอะไร” หรือ “กำหนดยื่นครั้งถัดไปเมื่อไร” — หรือกด 24 Copilot (Ctrl+K) เพื่อให้วางแผนให้ทั้งภารกิจ"
      : "Tell me what you want to get done — e.g. “prepare the preliminary CoP report”, “what am I missing?” or “when is the next deadline?” — or press 24 Copilot (Ctrl+K) to have the whole mission planned.");
    actions.push({ label: "24 Copilot", href: "/" }, { label: lang === "th" ? "งานของฉัน" : "My work", href: "/my-work" });
  }
  return { text: lines.join("\n"), actions: dedupe(actions).slice(0, 4) };
}

const dedupe = (a: PaulAction[]) => a.filter((x, i) => a.findIndex((y) => y.href === x.href) === i);

/** The app, described compactly for a language model. */
export function appKnowledge(ctx: UxContext, lang: Lang): string {
  const L = (x: { th: string; en: string }) => x[lang];
  // numbered exactly as the left menu shows them
  const screens = SCREENS.filter((s) => navNumber(s.route)).map((s) => `${navNumber(s.route)} ${L(s.name)} (${s.route}) — ${L(s.experience)}`).sort().join("\n");
  const missions = MISSIONS.map((m) => { const v = viewMission(m, ctx); return `- ${L(v.title)} [${m.id}] → ${m.module}; status ${v.status}; next: ${v.nextStep ? L(v.nextStep.label) : "done"}`; }).join("\n");
  return [
    `Active entity: ${L(ctx.entityName)} · role: ${ctx.role} · evidence readiness ${ctx.readiness}% (${ctx.evidenceProven}/${ctx.evidenceRequired}) · open gaps ${ctx.openGaps} (${ctx.materialGaps} material) · release gate ${ctx.gate}/4 ${L(ctx.gateLabel)} · conflicts ${ctx.conflicts}${ctx.nextDeadline ? ` · next deadline ${L(ctx.nextDeadline.label)} in ${ctx.nextDeadline.days} days` : ""}`,
    "Global: 24 Copilot button in the header and Ctrl+K plans any goal; a “Next” strip on every screen says what to do next; ⓘ buttons explain terms; header switches role (Owner/Advisor/Executive/Contributor), mode (Easy/Pro/AGI), language and light/dark theme. Easy mode hides expert modules under “All modules ▾”.",
    `Screens:\n${screens}`,
    `Missions:\n${missions}`,
  ].join("\n\n");
}

/* ───────────── legal, grounded in the corpus ───────────── */

export function citation(h: Hit, lang: Lang): string {
  return `${h.source.short[lang]} · ${h.passage.l}${h.passage.p ? ` · ${lang === "th" ? "หน้า" : "p."} ${h.passage.p}` : ""}`;
}

/** Without a language model: the most relevant clauses, quoted and cited, never paraphrased into advice. */
export function legalOffline(question: string, hits: Hit[], lang: Lang): string {
  if (!hits.length) return lang === "th"
    ? "ผมไม่พบข้อความในคลังกฎหมาย กกพ. ที่ตรงกับคำถามนี้ ลองระบุประเภทโรงไฟฟ้า ชนิดรายงาน หรือหัวข้อ (เช่น เสียง การรับฟังความคิดเห็น ระยะเวลายื่น)"
    : "I couldn't find text in the ERC corpus that matches this question. Try naming the plant type, report type or topic (e.g. noise, public hearing, filing deadline).";
  const head = lang === "th" ? `ข้อความที่เกี่ยวข้องที่สุดในคลังกฎหมาย กกพ. (${hits.length} ตอน):` : `The most relevant passages in the ERC corpus (${hits.length}):`;
  const body = hits.map((h, i) => `${i + 1}. **${citation(h, lang)}**\n> ${h.passage.t.replace(/\s+/g, " ").slice(0, 320)}${h.passage.t.length > 320 ? "…" : ""}`).join("\n\n");
  const tail = lang === "th"
    ? "_โหมดออฟไลน์: ยังไม่ได้เชื่อมต่อ AI จึงแสดงตัวบทที่เกี่ยวข้องแทนการสรุป · ไม่ใช่คำปรึกษาทางกฎหมาย โปรดตรวจกับฉบับทางการ_"
    : "_Offline mode: no AI is connected, so these are the relevant clauses rather than a summary · not legal advice — check the official text._";
  return [head, body, tail].join("\n\n");
}

/* ───────────── system prompt ───────────── */

export function systemPrompt(mode: PaulMode, ctx: UxContext, lang: Lang, hits: Hit[], triage?: Triage): string {
  const language = lang === "th" ? "Reply in Thai unless the user writes in English." : "Reply in English unless the user writes in Thai.";
  const persona = `You are Paul, the assistant inside COP24 — a Thai compliance platform that prepares Energy Regulatory Commission (ERC) Code of Practice (CoP) reports for power plants. ${language} Be concise and practical: short paragraphs or numbered steps, no filler.`;
  if (mode === "help") return [persona,
    "Job: help the user use COP24. Answer only from the app description below. Name screens by their menu number and name (e.g. “06 Data preparation”) and mention the 24 Copilot when a goal spans several screens. If something does not exist in the app, say so plainly rather than inventing a feature.",
    appKnowledge(ctx, lang)].join("\n\n");
  if (mode === "legal") return [persona,
    "Job: act as a legal consultant for CoP projects, grounded strictly in the ERC passages below. Rules:",
    "1. Base every legal statement on the passages and cite them in square brackets with the source and clause, e.g. [ERC CoP & CoP Monitor Regulation 2565 · ข้อ 15].",
    "2. If the passages do not answer the question, say that clearly, say what document would, and do not fill the gap from memory.",
    "3. Separate what the rule says from how it applies to the user's project; state assumptions (plant type, capacity, report stage).",
    "4. Quote Thai legal wording when precision matters. Never invent clause numbers, deadlines, limits or fees.",
    "5. End with one line: this is guidance, not formal legal advice; confirm with the official text or a qualified advisor for decisions with legal consequences.",
    `Project context: ${ctx.entityName.en} · evidence readiness ${ctx.readiness}% · release gate ${ctx.gate}/4.`,
    "ERC passages:",
    hits.map((h, i) => `[${i + 1}] ${citation(h, "th")} (${h.source.en})\n${h.passage.t}`).join("\n\n") || "(no matching passages found)"].join("\n\n");
  return [persona,
    "Job: receive feedback that will be used to improve COP24. Thank the user in one sentence, restate the problem or idea precisely, and ask at most one question that would make it actionable (steps to reproduce, which screen, what they expected). Then propose one concrete improvement. Do not promise a release date or claim the change is already made.",
    triage ? `Triage already recorded: category ${triage.category}, severity ${triage.severity}, screen ${triage.screen} (${triage.route})${triage.uxTest ? `, relates to the UX “${triage.uxTest}” test` : ""}.` : "",
    `Screens for reference:\n${SCREENS.map((s) => `${s.route} ${s.name.en}`).join("; ")}`].join("\n\n");
}

export function feedbackOffline(t: Triage, lang: Lang): string {
  const cat = { bug: ["ปัญหาการทำงาน", "a bug"], confusing: ["จุดที่ใช้ยาก", "something confusing"], idea: ["ข้อเสนอ", "an idea"], content: ["เนื้อหากฎหมาย", "legal content"], praise: ["คำชม", "praise"] }[t.category];
  return lang === "th"
    ? `ขอบคุณครับ บันทึกเป็น **${cat[0]}** (ความสำคัญ: ${t.severity}) ของหน้า **${t.screen}** แล้ว\n\nถ้าเล่าเพิ่มได้ว่ากดอะไร คาดว่าจะเกิดอะไร และเกิดอะไรขึ้นจริง จะช่วยให้แก้ได้เร็วขึ้นครับ ดูรายการทั้งหมดได้ที่หน้า “ข้อเสนอแนะและการปรับปรุง”`
    : `Thank you — logged as **${cat[1]}** (severity: ${t.severity}) on **${t.screen}**.\n\nIf you can add what you clicked, what you expected and what happened instead, it can be fixed faster. Everything is listed on the “Feedback & improvements” screen.`;
}
