/**
 * Report-model qualification: capability floor, benchmark + human approval, and the output guard.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { BENCHMARK, gradeSection, sectionPrompt, summarise } from "../report/benchmark";
import { MODEL_REGISTRY, MODEL_ROUTES, meetsFloor, registered, route } from "../report/models";
import type { ModelEvaluation, RegisteredModel } from "../report/types";

const noise = BENCHMARK.find((c) => c.id === "noise-exceedance")!;
const GOOD = [
  "ผลการตรวจวัดระดับเสียงเฉลี่ย 24 ชั่วโมง (Leq24) ของโซลาร์ฟาร์ม ลพบุรี 1 ในปี 2569 พบว่าสถานีที่ 1 มีค่า 65.1 dB(A) [F1] ซึ่งไม่เกินเกณฑ์ 70 dB(A) [F3]",
  "ส่วนสถานีที่ 2 มีค่า 72.4 dB(A) [F2] ซึ่งเกินเกณฑ์ 70 dB(A) [F3] โครงการต้องดำเนินการแก้ไขและตรวจวัดซ้ำ สำหรับค่า Ldn ไม่ได้ตรวจวัด [F4]",
  "ทั้งนี้ หนังสือรับรองห้องปฏิบัติการหมดอายุเมื่อวันที่ 31 ส.ค. 2569 และยังไม่ได้รับฉบับใหม่ จึงยังไม่สามารถยืนยันความถูกต้องของผลวิเคราะห์ได้อย่างสมบูรณ์",
].join(" ");

const ev = (passed: boolean, reviewers: string[]): ModelEvaluation => ({ category: "authority-th", task: "drafting", datasetVersion: "b", date: "2026-10-11", factual: 0.99, editorial: 4.5, longDocument: 0, passed, reviewers });
const withEval = (id: string, e: ModelEvaluation, reg = MODEL_REGISTRY): RegisteredModel[] => reg.map((m) => (m.modelId === id ? { ...m, status: e.passed && e.reviewers.length ? "approved" : "candidate", evaluations: [e] } : m));

test("the grader accepts a faithful, cited Thai section", () => {
  const g = gradeSection(GOOD, noise);
  assert.ok(g.passed, JSON.stringify(g.checks.filter((c) => !c.pass)));
});

test("the guard rejects changed or invented numbers, missing citations, unverified claims and non-Thai text", () => {
  assert.equal(gradeSection(GOOD.replace("72.4", "72"), noise).passed, false, "a rounded measurement is rejected");
  assert.ok(!gradeSection(GOOD + " ค่าเฉลี่ยทั้งปีคือ 68.3 dB(A)", noise).checks.find((c) => c.id === "no-invented-numbers")!.pass);
  assert.ok(!gradeSection(GOOD.replace(/\[F\d\]/g, ""), noise).checks.find((c) => c.id === "citations")!.pass);
  const claimed = GOOD.replace(/หนังสือรับรองห้องปฏิบัติการหมดอายุ[^]*$/, "หนังสือรับรองห้องปฏิบัติการได้รับการรับรองแล้ว");
  assert.equal(gradeSection(claimed, noise).passed, false, "claiming an unverified item as done is rejected");
  assert.equal(gradeSection("Station 2 measured 72.4 dB(A) [F2], above the 70 limit [F3]. Station 1 was 65.1 [F1].", noise).checks.find((c) => c.id === "thai")!.pass, false);
  assert.equal(summarise([gradeSection(GOOD, noise)]).passed, false, "one case is not a full benchmark");
});

test("the prompt carries every fact, every unverified item and the no-invention rules", () => {
  for (const c of BENCHMARK) {
    const p = sectionPrompt(c);
    for (const f of c.facts) assert.ok(p.user.includes(`[${f.id}] ${f.text}`));
    for (const b of c.blocked) assert.ok(p.user.includes(b.name));
    assert.match(p.system, /ห้ามเพิ่มตัวเลข/);
  }
});

test("capability floor: small or unregistered models never draft authority reports, even if marked approved", () => {
  const haiku = registered("claude-haiku-5-5")!;
  assert.equal(meetsFloor(haiku, "authority-th", "drafting"), false);
  assert.equal(registered("gpt-4o-mini"), undefined, "an unregistered model is refused");
  const reg = withEval("claude-haiku-5-5", ev(true, ["reviewer"]));
  const all = reg.map((m) => m.modelId).filter((id) => id !== "claude-haiku-5-5");
  assert.equal(route("authority-th", "drafting", { unavailable: all }, reg, MODEL_ROUTES).outcome, "queued");
});

test("gpt-5.5 is a frontier candidate: queued until it passes the benchmark AND a human reviewer signs off", () => {
  const gpt = registered("gpt-5.5")!;
  assert.equal(gpt.tier, "frontier");
  assert.equal(gpt.status, "candidate");
  const onlyGpt = MODEL_REGISTRY.map((m) => m.modelId).filter((id) => id !== "gpt-5.5");
  assert.equal(route("authority-th", "drafting", { unavailable: onlyGpt }).outcome, "queued");
  const noReviewer = withEval("gpt-5.5", ev(true, []));
  assert.equal(route("authority-th", "drafting", { unavailable: onlyGpt }, noReviewer, MODEL_ROUTES).outcome, "queued", "an automated pass alone is not approval");
  const signed = withEval("gpt-5.5", ev(true, ["Dr. Somchai, EIA expert"]));
  const d = route("authority-th", "drafting", { unavailable: onlyGpt }, signed, MODEL_ROUTES);
  assert.equal(d.outcome, "fallback");
  assert.equal(d.modelId, "gpt-5.5");
});
