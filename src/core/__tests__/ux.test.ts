/**
 * 24 Series Universal UX Standard — applied to COP24.
 * Goal → AI understands → Mission → Guided execution → Review → Outcome, plus the §21 register.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createSnapshot, type TenantData } from "../engine";
import { ALL_PACKS } from "../../packs";
import { ENTITIES, EVIDENCE, CONTROLS, CONTROL_TESTS, REG_CHANGES, REPORT_DRAFT, REPORT_CONFLICTS, REPORT_FACTS, EXTRA_EVENTS, MANUAL_GAPS } from "../../data/tenant";
import { uxContext, type UxRole } from "../ux/context";
import { MISSIONS, STAGES, journey, missionById, missionsForRole, viewMission } from "../ux/catalog";
import { understand, type EntityRef } from "../ux/intent";
import { GLOSSARY_IDS, explain, interpret, nextStepFor, recommendedActions } from "../ux/guidance";
import { detectStruggle, type GuardEvent } from "../ux/guard";
import { SCREENS, UX_TESTS, evaluate } from "../ux/acceptance";

const ROOT = resolve(import.meta.dirname, "../../..");
const APP = join(ROOT, "src/app");
const data: TenantData = { entities: ENTITIES, packs: ALL_PACKS, evidence: EVIDENCE, controls: CONTROLS, tests: CONTROL_TESTS, changes: REG_CHANGES, report: REPORT_DRAFT, conflicts: REPORT_CONFLICTS, facts: REPORT_FACTS, extraEvents: EXTRA_EVENTS, manualGaps: MANUAL_GAPS };
const snap = createSnapshot(data);
const ctxFor = (role: UxRole = "owner", entityId = "lopburi-1") => uxContext(snap, data, entityId, role);
const ROLES: UxRole[] = ["owner", "consultant", "exec", "contributor"];
const refs: EntityRef[] = ENTITIES.map((e) => ({ id: e.id, names: [e.name.th, e.name.en, e.name.th.replace(/^โซลาร์ฟาร์ม\s*/u, ""), e.name.en.replace(/^Solar Farm\s*/i, "")] }));

/** every route that exists in the app: "/" plus each folder with a page.tsx */
const routes = ["/", ...readdirSync(APP, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(APP, d.name, "page.tsx"))).map((d) => `/${d.name}`)];
const pageSource = (route: string) => readFileSync(join(APP, route === "/" ? "" : route.slice(1), "page.tsx"), "utf8");

/* ───────────── §21 / §22 acceptance register ───────────── */

test("§22 every screen is registered with a capability layer and an experience layer", () => {
  const registered = SCREENS.map((s) => s.route).sort();
  assert.deepEqual(registered, [...routes].sort(), "a route exists without an entry in SCREENS (or an entry has no route)");
  for (const s of SCREENS) {
    for (const f of [s.capability, s.experience, s.name]) assert.ok(f.th.trim() && f.en.trim(), `${s.route} is missing Thai or English text`);
    assert.deepEqual(Object.keys(s.tests).sort(), [...UX_TESTS].sort(), `${s.route} must record all seven tests`);
  }
});

test("§21 every screen is UX-complete (no more than one ‘No’)", () => {
  const failing = SCREENS.map(evaluate).filter((r) => !r.complete).map((r) => r.spec.route);
  assert.deepEqual(failing, []);
});

test("§21 claims are backed by the page source — a screen cannot claim a component it does not use", () => {
  for (const s of SCREENS) {
    const src = pageSource(s.route);
    for (const c of s.uses) {
      const ok = c === "ExplainThis" ? /<ExplainThis|explain=\{\[/.test(src) : c === "ResultInterpreter" ? /<ResultInterpreter|interpret="/.test(src) : src.includes(`<${c}`);
      assert.ok(ok, `${s.route} claims ${c} but its page does not use it`);
    }
    if (s.tests.terminology === "yes" && !["/ux-standard", "/my-work", "/feedback", "/login", "/host-desk"].includes(s.route)) assert.ok(/<ExplainThis|explain=\{\[/.test(src), `${s.route} claims the terminology test without Explain This`);
  }
});

test("§16 §18 the shell gives every screen the Copilot, a next step and the Complexity Guard; navigation is intent-first", () => {
  const shell = readFileSync(join(ROOT, "src/components/AppShell.tsx"), "utf8");
  for (const c of ["<CopilotProvider", "<NextStepBar", "<ComplexityGuard", "<CopilotButton"]) assert.ok(shell.includes(c), `shell is missing ${c}`);
  const primary = shell.slice(shell.indexOf("const NAV_PRIMARY"), shell.indexOf("const NAV_WORK"));
  for (const label of ["Home", "Ask 24", "My missions", "My work", "Reports & outputs"]) assert.ok(primary.includes(label), `primary nav is missing ${label}`);
  for (const role of ROLES) for (const r of routes) {
    const n = nextStepFor(r, ctxFor(role));
    assert.ok(n.title.th && n.title.en && n.href.startsWith("/"), `no next step for ${r} as ${role}`);
  }
});

/* ───────────── §3 §4 Copilot: goal → intent → mission ───────────── */

test("§3 Copilot understands Thai and English goals and routes them to the right mission", () => {
  const ctx = ctxFor();
  const cases: [string, string][] = [
    ["เตรียมรายงาน CoP ขั้นต้น ปี 2569 ของลพบุรี 1", "prelim-cop"],
    ["I need to prepare ESG information for our annual report.", "esg-561"],
    ["บอกหน่อยว่าผมยังขาดเอกสารอะไร", "close-evidence"],
    ["what evidence am I missing?", "close-evidence"],
    ["กฎหมายอะไรบ้างที่บังคับใช้กับกลุ่มเรา", "applicability"],
    ["which regulations apply to us", "applicability"],
    ["ตรวจรายงานที่ที่ปรึกษาทำไว้", "xray"],
    ["when is our next deadline", "deadlines"],
    ["upload all my documents", "import-evidence"],
    ["มีกฎใหม่ออกมา กระทบเราไหม", "reg-change"],
    ["I need to benchmark this transaction for transfer pricing", "tp-local-file"],
    ["ฉันต้องทำอะไรบ้าง", "my-tasks"],
  ];
  for (const [goal, id] of cases) {
    const u = understand(goal, ctx, refs);
    assert.equal(u.missions[0]?.view.mission.id, id, `"${goal}" → ${u.missions[0]?.view.mission.id}`);
    assert.ok(u.missions[0].cues.length > 0, "every recommendation names the words that triggered it");
  }
  const u = understand("เตรียมรายงาน CoP ขั้นต้น ปี 2569 ของ ลพบุรี 2", ctx, refs);
  assert.equal(u.year, 2026);
  assert.equal(u.report, "preliminary");
  assert.equal(u.entityId, "lopburi-2");
});

test("§2 “I don't know where to start” is always available and wins over task words", () => {
  const u = understand("ไม่รู้ว่าต้องเริ่มรายงานตรงไหน", ctxFor(), refs);
  assert.equal(u.missions[0].view.mission.id, "start");
  assert.equal(u.dontKnow, true);
});

test("§3 a vague goal is not guessed — Copilot asks instead", () => {
  const u = understand("สวัสดีครับ", ctxFor(), refs);
  assert.equal(u.missions.length, 0);
  assert.ok(u.clarify, "asks a clarifying question");
  assert.equal(u.confidence, "low");
});

/* ───────────── §5 §15 missions and journeys are derived, not hand-written ───────────── */

test("§15 mission card values are derived from the plan and the live context", () => {
  const ctx = ctxFor();
  const v = viewMission(missionById("prelim-cop")!, ctx);
  const ai = v.plan.filter((p) => p.by === "ai").length;
  assert.equal(v.aiShare, Math.round((ai / v.plan.length) * 100));
  // the demo tenant has open evidence gaps and a capacity conflict, so the mission waits on a person
  assert.ok(ctx.evidenceGaps > 0 && ctx.conflicts > 0);
  assert.equal(v.status, "waiting-for-me");
  assert.ok(v.userMinutes > 0);
  // closing every gap would change the derived status — nothing is hard-coded
  const done = viewMission(missionById("prelim-cop")!, { ...ctx, evidenceGaps: 0, conflicts: 0, chaptersApproved: ctx.chaptersTotal, chaptersReview: 0, chaptersDrafting: 0, blockers: 0, gate: 4 });
  assert.equal(done.status, "completed");
});

test("report figures belong to the entity that owns the draft — another plant never borrows them", () => {
  const lb2 = ctxFor("owner", "lopburi-2");
  assert.equal(lb2.hasReport, false);
  assert.equal(lb2.chaptersTotal, 0);
  assert.equal(lb2.conflicts, 0);
  const v = viewMission(missionById("prelim-cop")!, lb2);
  assert.equal(v.plan.find((p) => p.label.en.startsWith("Draft every chapter"))!.done, false, "no draft means drafting is not done");
  assert.notEqual(v.status, "completed");
  assert.ok(v.requires.some((r) => r.label.en.startsWith("No draft yet")));
});

test("§5 journeys use the standard stage order and always say where you are and what is next", () => {
  for (const role of ROLES) {
    const ctx = ctxFor(role);
    for (const m of MISSIONS) {
      const v = viewMission(m, ctx);
      const j = journey(v, ctx);
      const order = j.stages.map((s) => STAGES.indexOf(s.stage));
      assert.deepEqual(order, [...order].sort((a, b) => a - b), `${m.id} stages out of order`);
      assert.ok(j.totalSteps >= 1 && j.totalSteps <= 7);
      assert.equal(j.stages.filter((s) => s.status === "current").length, v.status === "completed" ? 0 : 1, `${m.id} must have exactly one current stage`);
      if (v.status !== "completed") assert.ok(j.next, `${m.id} must say what happens next`);
    }
  }
});

test("§20 every mission can explain why AI chose it, and alternatives point at real missions", () => {
  const ctx = ctxFor();
  for (const m of MISSIONS) {
    const w = m.why(ctx);
    assert.ok(w.reasoning.th && w.reasoning.en, `${m.id} has no reasoning`);
    for (const a of w.alternatives) assert.ok(missionById(a.missionId), `${m.id} → unknown alternative ${a.missionId}`);
    assert.ok(routes.includes(m.module), `${m.id} module ${m.module} is not a route`);
    for (const r of m.modules) assert.ok(routes.includes(r), `${m.id} touches unknown route ${r}`);
  }
});

/* ───────────── §8 §12 explanations and interpreted results ───────────── */

test("§8 Explain This answers what / why / for us / what to do, from live data", () => {
  const ctx = ctxFor();
  for (const id of GLOSSARY_IDS) {
    const x = explain(id, ctx);
    for (const part of [x.term, x.what, x.why, x.forYou, x.todo]) assert.ok(part.th.trim() && part.en.trim(), `${id} is missing a part`);
  }
  assert.ok(explain("readiness", ctx).forYou.en.includes(`${ctx.readiness}%`), "explanations use the company's own numbers");
});

test("§12 every headline result is translated: what happened, meaning, verdict, comparison, cause, next, fix", () => {
  const ctx = ctxFor();
  for (const k of ["readiness", "gate", "gaps", "controls", "facts"] as const) {
    const r = interpret(k, ctx);
    for (const part of [r.headline, r.happened, r.meaning, r.compare, r.why, r.next, r.fix.label]) assert.ok(part.th && part.en, `${k} is missing a part`);
    assert.ok(["ok", "warn", "bad"].includes(r.verdict));
    assert.ok(r.fix.href.startsWith("/"));
  }
});

/* ───────────── §9 roles ───────────── */

test("§9 the experience adapts to the role; contributors only see what they need to do", () => {
  const contributor = missionsForRole(ctxFor("contributor"));
  assert.ok(contributor.length > 0);
  assert.ok(contributor.every((v) => v.mission.roles.includes("contributor")));
  assert.ok(!contributor.some((v) => v.mission.id === "group-status"), "management missions are not shown to contributors");
  const cActions = recommendedActions(ctxFor("contributor"), snap.nba).map((a) => a.href);
  assert.ok(cActions.includes("/ingest") && cActions.includes("/my-work"));
  assert.ok(recommendedActions(ctxFor("exec"), snap.nba).some((a) => a.href === "/portfolio"));
  for (const role of ROLES) {
    const n = recommendedActions(ctxFor(role), snap.nba).length;
    assert.ok(n >= 3 && n <= 6, `${role} gets ${n} recommended actions — the standard asks for 3–6`);
  }
});

/* ───────────── §11 Complexity Guard ───────────── */

test("§11 Complexity Guard spots struggle, infers the goal, and stays quiet otherwise", () => {
  const t0 = 1_000_000;
  const visit = (route: string, s: number): GuardEvent => ({ kind: "visit", route, at: t0 + s * 1000 });
  const calm = detectStruggle([visit("/", 0), visit("/factory", 30)], t0 + 40_000, t0 + 40_000);
  assert.equal(calm.show, false);
  // returning to Home between tasks is normal hub navigation, not struggle
  const hub = detectStruggle([visit("/", 0), visit("/evidence", 10), visit("/", 20), visit("/studio", 30), visit("/", 40), visit("/gaps", 50), visit("/", 60)], t0 + 61_000, t0 + 61_000);
  assert.equal(hub.show, false);
  const bounce = detectStruggle([visit("/factory", 0), visit("/studio", 10), visit("/factory", 20), visit("/studio", 30), visit("/preflight", 40)], t0 + 45_000, t0 + 45_000);
  assert.ok(bounce.signals.includes("backtracking"));
  assert.equal(bounce.mission?.id, "prelim-cop", "the modules touched point at the preliminary CoP mission");
  const idle = detectStruggle([visit("/preflight", 0)], t0 + 3 * 60_000, t0);
  assert.ok(idle.signals.includes("inactivity"));
  const toggles = detectStruggle([visit("/ingest", 0), ...[1, 2, 3].map((s) => ({ kind: "advanced-toggle", at: t0 + s * 1000 }) as GuardEvent)], t0 + 5000, t0 + 5000);
  assert.ok(toggles.signals.includes("advanced-toggling"));
});
