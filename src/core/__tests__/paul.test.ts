/**
 * Paul — the COP24 chat assistant: app help, CoP legal consultant, feedback.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSnapshot, type TenantData } from "../engine";
import { ALL_PACKS } from "../../packs";
import { ENTITIES, EVIDENCE, CONTROLS, CONTROL_TESTS, REG_CHANGES, REPORT_DRAFT, REPORT_CONFLICTS, REPORT_FACTS, EXTRA_EVENTS, MANUAL_GAPS } from "../../data/tenant";
import { uxContext } from "../ux/context";
import { appHelp, detectMode, legalOffline, systemPrompt, triageFeedback } from "../paul/paul";
import { preferredSources, queryTerms, searchPassages, type PassageIndex } from "../paul/retrieve";

const ROOT = resolve(import.meta.dirname, "../../..");
const idx = JSON.parse(readFileSync(resolve(ROOT, "corpus/passages.json"), "utf8")) as PassageIndex;
const data: TenantData = { entities: ENTITIES, packs: ALL_PACKS, evidence: EVIDENCE, controls: CONTROLS, tests: CONTROL_TESTS, changes: REG_CHANGES, report: REPORT_DRAFT, conflicts: REPORT_CONFLICTS, facts: REPORT_FACTS, extraEvents: EXTRA_EVENTS, manualGaps: MANUAL_GAPS };
const ctx = uxContext(createSnapshot(data), data, "lopburi-1", "owner");

test("Paul routes each message to the right job", () => {
  assert.equal(detectMode("จะนำเข้าเอกสารทั้งโฟลเดอร์ทำอย่างไร"), "help");
  assert.equal(detectMode("How do I switch to dark mode?"), "help");
  assert.equal(detectMode("ต้องยื่นรายงาน CoP ขั้นต้นภายในกี่วันตามระเบียบ กกพ."), "legal");
  assert.equal(detectMode("What are the public hearing requirements for a solar project?"), "legal");
  assert.equal(detectMode("หน้าเตรียมข้อมูลใช้ยากมาก งงตรงปุ่มอนุญาต"), "feedback");
  assert.equal(detectMode("Bug: the OCR button is not working"), "feedback");
  assert.equal(detectMode("anything", "legal"), "legal", "a topic the user picked always wins");
});

test("legal: the committed ERC index covers the in-force sources and has no example reports", () => {
  assert.ok(Object.keys(idx.sources).length >= 25);
  assert.ok(idx.passages.length > 1000);
  assert.ok(!Object.keys(idx.sources).some((id) => id.startsWith("example-")), "example project reports are not law");
  for (const id of ["erc-cop-reg-2565", "erc-public-hearing-reg-2565", "erc-cop-checklist-solar-farm", "erc-fee-reg-2551"]) assert.ok(idx.sources[id], `${id} missing`);
});

test("legal: Thai and English questions retrieve the governing regulation", () => {
  const top = (q: string) => searchPassages(idx, q, 4, preferredSources("solar-ground")).map((h) => h.passage.s[0]);
  assert.ok(top("ต้องยื่นรายงาน CoP ขั้นต้นภายในกี่วัน").includes("erc-cop-reg-2565"));
  assert.ok(top("public hearing requirements for a solar project").some((s) => s === "erc-public-hearing-reg-2565" || s === "erc-cop-reg-2565"));
  assert.ok(top("noise baseline measurement for solar farm").includes("erc-cop-checklist-solar-farm"));
  assert.ok(top("ค่าธรรมเนียมใบอนุญาต").includes("erc-fee-reg-2551"));
  assert.ok(top("rooftop solar exempt from licence").includes("erc-pv-exempt-notification-2557"));
  assert.ok(queryTerms("noise").some((t) => /[฀-๿]/.test(t)), "English questions are expanded into the Thai terms the corpus uses");
});

test("legal: answers are always cited, never invented, and say they are not legal advice", () => {
  const hits = searchPassages(idx, "การรับฟังความคิดเห็น", 3);
  const offline = legalOffline("การรับฟังความคิดเห็น", hits, "th");
  for (const h of hits) assert.ok(offline.includes(h.passage.l), "every passage is cited with its clause");
  assert.match(offline, /ไม่ใช่คำปรึกษาทางกฎหมาย/);
  assert.match(legalOffline("xyz", [], "en"), /couldn't find/);
  const sys = systemPrompt("legal", ctx, "en", hits);
  assert.match(sys, /cite/i);
  assert.match(sys, /do not fill the gap from memory/);
  assert.match(sys, /Never invent clause numbers/);
  assert.ok(hits.every((h) => sys.includes(h.passage.t.slice(0, 40))), "the model sees the exact passages it must cite");
});

test("help: Paul answers from the app itself and links to the right screen", () => {
  const a = appHelp("upload all my documents", ctx, "en");
  assert.ok(a.actions.some((x) => x.href.startsWith("/ingest") || x.href.includes("import-evidence")));
  const b = appHelp("เตรียมรายงาน CoP ขั้นต้น ต้องเริ่มตรงไหน", ctx, "th");
  assert.ok(b.actions.some((x) => x.href.includes("prelim-cop")));
  const c = appHelp("what is the release gate?", ctx, "en");
  assert.match(c.text, /stage/i);
  const sys = systemPrompt("help", ctx, "en", []);
  assert.match(sys, /Data preparation/);
  assert.match(sys, /do not exist|does not exist|say so plainly/i, "Paul must not invent features");
  assert.match(sys, /App journey \(start → finish\): 01 /, "Paul knows the start-to-finish path");
  const j = appHelp("where do I start and which menu is the finish?", ctx, "en");
  assert.match(j.text, /\*\*START\*\* 01[\s\S]*\*\*FINISH\*\* 05/);
  assert.ok(j.actions.some((x) => x.href === "/journey"));
  assert.ok(appHelp("is there a demo or a manual?", ctx, "en").actions.some((x) => x.href === "/manual"));
});

test("feedback: triaged into category, severity, screen and the related UX test", () => {
  const bug = triageFeedback("Bug: the OCR button is not working and I lost data", "/ingest");
  assert.equal(bug.category, "bug");
  assert.equal(bug.severity, "high");
  assert.equal(bug.route, "/ingest");
  const conf = triageFeedback("หน้าตรวจก่อนยื่นใช้ยาก งงศัพท์", "/preflight");
  assert.equal(conf.category, "confusing");
  assert.equal(conf.uxTest, "terminology");
  const named = triageFeedback("The Report Studio is confusing", "/");
  assert.equal(named.route, "/studio", "a screen named in the feedback wins over the current page");
  assert.equal(triageFeedback("ระเบียบที่อ้างอิงผิดข้อ", "/corpus").category, "content");
  assert.equal(triageFeedback("I wish it could export to Word", "/outputs").category, "idea");
});
