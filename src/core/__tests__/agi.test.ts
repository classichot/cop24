/**
 * COP24 — AGI Mode & Mission Catalog (Developer Requirements v1.0) · §14 acceptance tests and
 * engine guarantees.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { CATALOG, CATEGORIES, catalogById, isAvailable } from "../agi/catalog";
import { AGENTS } from "../agi/agents";
import { FLAGSHIPS, flagshipById } from "../agi/flagship";
import { approve, createRun, preview, resolveHumanTask, runMission, startRun, submit, trace, verifyAudit, verifyHumanTask, type Env, type MissionRun } from "../agi/engine";
import { determineRoute, monitoringPeriods } from "../agi/regulatory";
import { evaluateTriggers } from "../agi/triggers";
import type { SiteInput } from "../agi/types";
import { checkRewrite } from "../report/semantic";
import { AGI_SITES } from "../../data/agi-sites";

const APP = resolve(import.meta.dirname, "../../app");
const site = (id: string): SiteInput => structuredClone(AGI_SITES.find((s) => s.id === id)!);
let clock = 0;
const env = (...sites: SiteInput[]): Env => ({ sites: Object.fromEntries(sites.map((s) => [s.id, s])), actor: "nattawut", now: () => `2026-10-11T10:00:${String(clock++ % 60).padStart(2, "0")}Z`, today: "2026-10-11" });
const go = (fid: string, sites: SiteInput[], opts: Parameters<typeof createRun>[2] = {}) => {
  const run = createRun(fid, sites, opts, "nattawut", "2026-10-11T10:00:00Z");
  startRun(run, "nattawut", "2026-10-11T10:00:00Z");
  return runMission(run, env(...sites));
};
const passGates = (run: MissionRun, sites: SiteInput[]) => {
  for (let i = 0; i < 6; i++) {
    for (const tr of run.tasks.filter((x) => x.status === "awaiting")) {
      const role = tr.taskId === "certify" ? "qualified" : "owner";
      approve(run, tr.key.startsWith("budget") ? tr.key : tr.key, role === "qualified" ? "dr-somchai" : "nattawut", role, "2026-10-11T11:00:00Z", tr.taskId === "consultation" ? "minutes-2026-11.pdf" : undefined);
    }
    runMission(run, env(...sites));
  }
  return run;
};

/* ───────────── §4 catalog and §3 agents ───────────── */

test("§4 the catalog has 108 missions in 12 categories of 9, with stable ids", () => {
  assert.equal(CATALOG.length, 108);
  assert.equal(CATEGORIES.length, 12);
  for (const c of CATEGORIES) assert.equal(CATALOG.filter((m) => m.category === c.id).length, 9, `category ${c.id}`);
  CATALOG.forEach((m, i) => assert.equal(m.id, `COP-${String(i + 1).padStart(3, "0")}`));
  for (const m of CATALOG) assert.ok(m.title.th && m.title.en);
});

test("§13 only implemented missions are executable; every route exists; planned missions never pose as working", () => {
  const routes = new Set(["/agi", "/ingest", "/corpus", "/obligations", "/calendar", "/changes", "/factory", "/preflight", "/report-quality", "/controls", "/my-work", "/studio", "/portfolio"]);
  for (const m of CATALOG.filter(isAvailable)) {
    assert.ok(routes.has(m.route!), `${m.id} → ${m.route}`);
    assert.ok(existsSync(join(APP, m.route!.slice(1), "page.tsx")), `${m.route} page missing`);
  }
  const planned = CATALOG.filter((m) => !isAvailable(m));
  assert.ok(planned.length > 0 && planned.every((m) => m.route === null));
  // a flagship may only compose available building blocks or blocks it implements itself
  for (const f of FLAGSHIPS) for (const task of f.tasks) for (const b of task.blocks) assert.ok(catalogById(b), `${f.id}/${task.id} uses unknown block ${b}`);
});

test("REQ-AGI-003 the 15-agent library and REQ-AGI-004 every flagship defines all required fields", () => {
  assert.equal(AGENTS.length, 15);
  assert.equal(FLAGSHIPS.length, 7);
  for (const f of FLAGSHIPS) {
    for (const k of ["goal", "completion", "applicability"] as const) assert.ok(f[k].th && f[k].en, `${f.id}.${k}`);
    assert.ok(f.tasks.length && f.deliverables.length && f.validations.length && f.costCapTHB > 0);
    for (const task of f.tasks) for (const d of task.deps) assert.ok(f.tasks.some((x) => x.id === d), `${f.id}: ${task.id} depends on unknown ${d}`);
  }
});

/* ───────────── §2 regulatory rules ───────────── */

test("§2 reporting cycles follow clause 21 and stay configurable", () => {
  const solar = monitoringPeriods({ technology: "solar-ground", capacityMW: 48, stage: "operation", scenario: "existing" }, 2026);
  assert.equal(solar.periods.length, 1);
  assert.equal(solar.periods[0].due, "2027-01-31");
  assert.equal(solar.cite.clause, "ข้อ 21");
  const bio = monitoringPeriods({ technology: "biomass", capacityMW: 8, stage: "operation", scenario: "existing" }, 2026);
  assert.deepEqual(bio.periods.map((p) => p.due), ["2026-07-31", "2027-01-31"]);
});

/* ───────────── §14 acceptance tests ───────────── */

test("§14 rooftop project → rooftop checklist and the 2567 amendment", () => {
  const d = determineRoute(site("demo-rooftop").profile);
  assert.equal(d.route, "cop");
  assert.equal(d.checklist, "erc-cop-checklist-solar-rooftop");
  assert.ok(d.cites.some((c) => c.sourceId === "erc-cop-reg-2567-no2"));
});

test("§14 a project requiring EIA → the alternative route is flagged and no CoP report is generated", () => {
  const s = site("demo-biomass");
  assert.equal(determineRoute(s.profile).route, "eia");
  assert.ok(preview("F01", [s]).warnings.some((w) => /EIA/.test(w.en)));
  const run = go("F01", [s]);
  assert.equal(run.state, "blocked");
  assert.ok(run.blockedSites[s.id]);
  assert.ok(!run.deliverables.some((d) => d.id === "report"), "no CoP report for an EIA project");
});

test("§14 conflicting capacities → detected, and a person must resolve them", () => {
  const run = go("F01", [site("lopburi-1")]);
  assert.ok(run.findings.some((f) => f.kind === "conflict" && /48/.test(f.text.en) && /45/.test(f.text.en)));
  assert.ok(run.humanTasks.some((h) => /capacity/.test(h.title.en)));
});

test("§14 a laboratory without credentials → flagged, its results never shown as validated", () => {
  const s = site("lopburi-2");
  s.labs = [{ id: "LAB-ENV2", name: "Central Environmental Lab" }];
  const run = go("F03", [s]);
  assert.ok(run.findings.some((f) => f.kind === "lab-unverified" && /accreditation/.test(f.text.en)));
  assert.ok(run.humanTasks.some((h) => h.work === "third-party-lab"));
  const lb1 = go("F03", [site("lopburi-1")]);
  assert.ok(lb1.findings.some((f) => f.kind === "lab-unverified" && /expired/.test(f.text.en)), "expired accreditation (31 Aug 2026) is caught");
});

test("§14 annual report with missing evidence → supported sections drafted, unsupported ones openly blocked, mission Needs Human Action", () => {
  const run = go("F01", [site("lopburi-1")], { autonomy: "supervised" });
  passGates(run, [site("lopburi-1")]);
  const report = run.deliverables.filter((d) => d.id === "report").at(-1)!;
  const blocked = report.sections!.filter((s) => s.status === "blocked");
  assert.ok(blocked.length > 0);
  assert.ok(blocked.every((s) => !/Implemented|ดำเนินการตามมาตรการแล้ว/.test(s.text.en + s.text.th)), "no compliance claim without evidence");
  assert.ok(report.sections!.filter((s) => s.status === "supported" && s.id.startsWith("m")).every((s) => s.sources.length > 0));
  assert.equal(run.state, "blocked");
  assert.equal(run.outcome?.status, "blocked");
  assert.ok(run.outcome!.unresolved.length > 0);
});

test("REQ-GOV-001 unreviewed evidence keeps the mission from completing until a person confirms it", () => {
  const s = site("lopburi-2"); // its safety report is unsigned (needs review)
  const run = passGates(go("F01", [s]), [s]);
  assert.equal(run.state, "blocked");
  const review = run.humanTasks.find((h) => /Review and confirm evidence: Safety reports/.test(h.title.en))!;
  assert.ok(review);
  resolveHumanTask(run, review.id, "safety-officer", "ohs-signed.pdf", "t");
  runMission(run, env(s));
  assert.equal(run.state, "completed", "with the evidence confirmed and every gate approved, the mission completes");
});

test("§14 trend with limited history → only available years, missing years explained", () => {
  const run = go("F01", [site("lopburi-1")]);
  const tr = run.tasks.find((x) => x.taskId === "trend")!;
  assert.deepEqual((tr.output!.data as { years: number[] }).years, [2025, 2026]);
  assert.ok(run.findings.some((f) => f.kind === "history-gap" && /2024/.test(f.text.en)));
});

test("§14 a new permit condition → affected obligations and report sections are identified", () => {
  const run = go("F03", [site("lopburi-2")]);
  const f = run.findings.find((x) => x.kind === "permit-change")!;
  assert.match(f.text.en, /COND-LB2-07/);
  assert.match(f.text.en, /Noise/);
  assert.ok(evaluateTriggers([site("lopburi-2")], "2026-10-11", "supervised").some((t) => t.kind === "condition-change"));
});

test("§14 multi-site swarm → one workstream per site, site data kept separate, per-site deliverables plus a group dashboard", () => {
  const sites = [site("lopburi-1"), site("lopburi-2")];
  assert.throws(() => createRun("F06", sites, { mode: "T" }, "n", "2026-10-11T10:00:00Z"), /Swarm/);
  const run = go("F06", sites);
  assert.equal(run.mode, "W");
  assert.deepEqual(run.workstreams.map((w) => w.site), ["lopburi-1", "lopburi-2"]);
  for (const s of sites) {
    const rep = run.deliverables.find((d) => d.id === "report" && d.site === s.id)!;
    const other = sites.find((x) => x.id !== s.id)!;
    assert.ok(rep.sections![0].text.en.includes(s.name.en) && !JSON.stringify(rep).includes(other.name.en), `${s.id} report contains only its own data`);
  }
  const dash = run.deliverables.find((d) => d.id === "dashboard")!;
  assert.equal(dash.site, "group");
  assert.equal(dash.rows!.length, 2);
});

test("§14 rewriting a verified monitoring section must preserve the approved data", () => {
  const before = "ผลตรวจวัดระดับเสียง Leq24 สถานีที่ 1 เท่ากับ 65.1 dB(A) ไม่เกินเกณฑ์ 70 dB(A)";
  const bad = "ผลตรวจวัดระดับเสียง Leq24 สถานีที่ 1 เท่ากับ 61.5 dB(A) ต่ำกว่าเกณฑ์อย่างมาก";
  const contract = { sectionId: "noise", outcome: "clarity" as const, requirementIds: [], allowedSources: [], approvedFacts: [], lockedWording: ["65.1 dB(A)"] };
  assert.equal(checkRewrite(before, bad, contract).passed, false);
  assert.equal(checkRewrite(before, "สถานีที่ 1 วัด Leq24 ได้ 65.1 dB(A) ซึ่งไม่เกินเกณฑ์ 70 dB(A)", contract).passed, true);
});

test("§14 submitting without authorisation or an authenticated channel is refused; packaging is not filing", () => {
  const s = site("lopburi-2");
  const run = go("F01", [s]);
  assert.equal(submit(run, "nattawut", "owner", { authenticated: true }, "t").ok, false, "an incomplete mission cannot be filed");
  run.state = "completed"; // pretend every gate passed, to test the filing rules in isolation
  assert.equal(submit(run, "bot", "contributor", { authenticated: true, acknowledgement: "X" }, "t").ok, false);
  assert.equal(submit(run, "nattawut", "owner", { authenticated: false }, "t").ok, false);
  assert.equal(run.submission.status, "not-filed");
  assert.equal(submit(run, "nattawut", "owner", { authenticated: true }, "t").ok, false);
  assert.equal(run.submission.status, "awaiting-confirmation", "success needs the regulator's acknowledgement");
  assert.equal(submit(run, "nattawut", "owner", { authenticated: true, acknowledgement: "ERC-2026-1188" }, "t").ok, true);
  assert.equal(run.submission.status, "filed");
});

test("§14 an interrupted mission resumes from checkpoints without repeating approved actions", () => {
  const s = site("lopburi-1");
  const run = go("F01", [s], { autonomy: "supervised" });
  const actionsBefore = run.actions.length;
  assert.ok(actionsBefore > 0, "supervised autonomy sent the internal requests");
  const restored = JSON.parse(JSON.stringify(run)) as MissionRun; // e.g. the tab closed
  runMission(restored, env(s));
  runMission(restored, env(s));
  assert.equal(restored.actions.length, actionsBefore);
  const done = restored.audit.filter((e) => e.action === "task-done").map((e) => e.object);
  assert.equal(new Set(done).size, done.length, "no task ran twice");
  const studio = restored.tasks.find((x) => x.taskId === "studio")!;
  assert.equal(approve(restored, studio.key, "nattawut", "owner", "t").ok, true);
  assert.equal(approve(restored, studio.key, "nattawut", "owner", "t").ok, false, "an approval is recorded once");
});

test("§14 audit history reconstructs a report: tasks, agents, sources, approvals — and tampering is detected", () => {
  const s = site("lopburi-2");
  const run = passGates(go("F01", [s]), [s]);
  const tr = trace(run, s.id, "report");
  assert.ok(tr.deliverable && tr.tasks.some((x) => x.key.endsWith(":draft")) && tr.tasks.some((x) => x.key.endsWith(":measures")));
  assert.ok(tr.sources.length > 0);
  assert.equal(verifyAudit(run).ok, true);
  run.audit[3].detail = "edited";
  assert.equal(verifyAudit(run).ok, false);
});

/* ───────────── engine guarantees ───────────── */

test("REQ-GOV-001 a measure without verified evidence is never compliant; a violation is kept apart from unverified", () => {
  const run = go("F03", [site("lopburi-1")]);
  const rows = run.deliverables.find((d) => d.id === "results-matrix")!.rows!;
  const noise = rows.find((r) => r.measure === "Noise control")!;
  assert.equal(noise.result, "potentially-noncompliant", "72.4 dB(A) > 70");
  assert.equal(rows.find((r) => r.measure === "Waste management" || r.measure === "Damaged panel and waste management")!.result, "unverified");
  assert.equal(rows.find((r) => r.measure === "Effluent quality")!.result, "not-applicable");
});

test("REQ-AGI-002 autonomy: Draft performs no outbound action; Supervised sends internal requests once", () => {
  const draft = go("F01", [site("lopburi-1")], { autonomy: "draft" });
  assert.equal(draft.actions.length, 0);
  assert.ok(draft.humanTasks.some((h) => h.id.endsWith(":USER")), "the user is asked to take the action");
  const sup = go("F01", [site("lopburi-1")], { autonomy: "supervised" });
  assert.equal(sup.actions.length, 1);
});

test("REQ-AGI-006 the cost governor pauses before exceeding the budget", () => {
  const run = go("F01", [site("lopburi-2")], { budgetTHB: 5 });
  assert.equal(run.state, "awaiting-approval");
  assert.ok(run.findings.some((f) => f.kind === "budget"));
  const gateKey = run.tasks.find((x) => x.status === "awaiting")!.key;
  assert.equal(approve(run, `budget:${gateKey}`, "clerk", "contributor", "t").ok, false, "only an owner or executive approves spending");
  assert.equal(approve(run, `budget:${gateKey}`, "nattawut", "owner", "t").ok, true);
  runMission(run, env(site("lopburi-2")));
  assert.ok(run.spentTHB > 5);
});

test("REQ-EXEC-003 corrective work closes only with evidence and an independent verifier", () => {
  const s = site("lopburi-1");
  const run = passGates(go("F04", [s]), [s]);
  const work = run.humanTasks.find((h) => h.verify)!;
  assert.ok(work);
  assert.equal(resolveHumanTask(run, work.id, "site-lead", "", "t").ok, false, "evidence required");
  assert.equal(resolveHumanTask(run, work.id, "site-lead", "barrier-photos.zip", "t").ok, true);
  assert.equal(verifyHumanTask(run, work.id, "site-lead", "t").ok, false, "the doer cannot verify their own work");
  assert.equal(verifyHumanTask(run, work.id, "env-manager", "t").ok, true);
});

test("§2 certification needs a qualified person; a consultation needs evidence it happened", () => {
  const s = site("lopburi-2");
  const run = go("F01", [s]);
  approve(run, run.tasks.find((x) => x.taskId === "studio")!.key, "nattawut", "owner", "t");
  runMission(run, env(s));
  const cert = run.tasks.find((x) => x.taskId === "certify")!;
  assert.equal(approve(run, cert.key, "nattawut", "owner", "t").ok, false);
  assert.equal(approve(run, cert.key, "dr-somchai", "qualified", "t").ok, true);
  const f2 = go("F02", [site("lopburi-2")]);
  const cons = f2.tasks.find((x) => x.taskId === "consultation")!;
  assert.equal(approve(f2, cons.key, "nattawut", "owner", "t").ok, false, "a consultation cannot be ticked off without evidence");
  assert.equal(approve(f2, cons.key, "nattawut", "owner", "t", "hearing-minutes.pdf").ok, true);
});

test("REQ-AGI-007 triggers respect autonomy", () => {
  const sites = [site("lopburi-1"), site("lopburi-2")];
  const sup = evaluateTriggers(sites, "2026-10-11", "supervised");
  assert.ok(sup.some((t) => t.kind === "exception" && t.mission === "F04"), "the 72.4 dB(A) exceedance proposes corrective work");
  assert.ok(sup.every((t) => /Queued/.test(t.behaviour.en)));
  assert.ok(evaluateTriggers(sites, "2026-12-15", "draft").some((t) => t.kind === "deadline"), "the January report deadline is within reach");
  assert.ok(evaluateTriggers(sites, "2026-10-11", "draft").every((t) => /Suggested/.test(t.behaviour.en)));
});

test("REQ-UX-002 the preview shows objective, scope, mode, autonomy, inputs, plan, deliverables, estimate and gates", () => {
  const p = preview("F01", [site("lopburi-1")]);
  assert.equal(p.mode, "T");
  assert.ok(p.objective.en && p.scope.length === 1 && p.available.length && p.missing.length && p.plan.length && p.deliverables.length && p.gates.length);
  assert.ok(p.estimate.costTHB > 0 && p.estimate.minutes > 0);
  assert.equal(preview("F06", [site("lopburi-1"), site("lopburi-2")]).recommended.mode, "W");
  assert.equal(flagshipById("F03")!.defaultMode, "S");
});

test("§4 grouping tags: every mission is tagged, every tag is used, and every grouping covers the whole catalog", async () => {
  const { TAGS, groupCatalog } = await import("../agi/catalog");
  assert.ok(CATALOG.every((m) => m.tags.length >= 1), "every mission has at least one tag");
  for (const tg of TAGS) assert.ok(CATALOG.some((m) => m.tags.includes(tg.id)), `tag ${tg.id} is unused`);
  const byCat = groupCatalog(CATALOG, "category");
  assert.equal(byCat.length, 12);
  assert.ok(byCat.every((g) => g.missions.length === 9));
  const byStatus = groupCatalog(CATALOG, "status");
  assert.deepEqual(byStatus.map((g) => g.missions.length), [CATALOG.filter(isAvailable).length, CATALOG.filter((m) => !isAvailable(m)).length]);
  assert.equal(groupCatalog(CATALOG, "mode").reduce((a, g) => a + g.missions.length, 0), 108);
  assert.equal(groupCatalog(CATALOG, "priority").reduce((a, g) => a + g.missions.length, 0), 108);
  const byTag = groupCatalog(CATALOG, "tag");
  const seen = new Set(byTag.flatMap((g) => g.missions.map((m) => m.id)));
  assert.equal(seen.size, 108, "grouping by tag still reaches every mission");
  assert.ok(byTag.find((g) => g.key === "monitoring")!.missions.some((m) => m.id === "COP-086"), "the one-click monitoring report sits under #CoP Monitoring");
  assert.ok(groupCatalog(CATALOG, "flagship").find((g) => g.key === "F01")!.missions.length > 10);
});
