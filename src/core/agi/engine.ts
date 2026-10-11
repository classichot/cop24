import { t } from "../i18n-text";
import type { LText } from "../types";
import { agentById, type AgentId } from "./agents";
import type { Mode } from "./catalog";
import { flagshipById, type FlagshipDef, type Gate, type Phase, type TaskDef } from "./flagship";
import { determineRoute, monitoringPeriods, RULESET_2567 } from "./regulatory";
import { taskCost, TIER_COST } from "./routing";
import { measureResults, RUNNERS } from "./runners";
import { sha256 } from "./sha256";
import type { Deliverable, Finding, HumanTask, SiteInput, TaskOutput } from "./types";

/**
 * REQ-AGI-004/005 — the Universal Mission Engine. Every mission (all seven flagships and any
 * composition of catalog blocks) runs through this one state machine:
 *
 *   created → scoped → gathering-evidence → ready | blocked → executing → verifying →
 *   awaiting-approval → completed → archived        (+ failed, cancelled, retrying)
 *
 * Execution is deterministic and checkpointed: a task that is done is never repeated, an
 * approval is recorded once, and an outbound action is performed once, so a run serialised to
 * JSON and resumed later continues exactly where it stopped.
 */

export type Autonomy = "draft" | "supervised" | "autopilot";
export type RunState = "created" | "scoped" | "gathering-evidence" | "ready" | "blocked" | "executing" | "verifying" | "awaiting-approval" | "completed" | "archived" | "failed" | "cancelled" | "retrying";
export type Role = "owner" | "consultant" | "exec" | "contributor" | "qualified";

export interface TaskRun { key: string; site: string; taskId: string; agent: AgentId; status: "pending" | "done" | "awaiting" | "skipped" | "failed"; attempts: number; costTHB: number; output?: TaskOutput }
export interface Workstream { id: string; site: string; team: AgentId[] }
export interface AuditEntry { seq: number; at: string; actor: string; agent?: AgentId; action: string; object: string; detail: string; prev: string; hash: string }
export interface Approval { by: string; role: Role; at: string; evidence?: string }

export interface MissionRun {
  id: string;
  flagship: string;
  mode: Mode;
  autonomy: Autonomy;
  budgetTHB: number;
  spentTHB: number;
  sites: string[];
  state: RunState;
  workstreams: Workstream[];
  tasks: TaskRun[];
  approvals: Record<string, Approval>;
  humanTasks: HumanTask[];
  findings: Finding[];
  deliverables: Deliverable[];
  actions: { key: string; at: string; detail: string }[];
  blockedSites: Record<string, LText>;
  audit: AuditEntry[];
  outcome?: { status: "completed" | "blocked" | "failed" | "cancelled"; unresolved: LText[] };
  submission: { status: "not-filed" | "awaiting-confirmation" | "filed"; reference?: string };
  rulesetVersion: string;
  createdAt: string;
}

export interface Env { sites: Record<string, SiteInput>; actor: string; now: () => string; today: string }

const PHASES: Phase[] = ["scope", "evidence", "execute", "verify", "approve"];
const STATE_FOR: Record<Phase, RunState> = { scope: "scoped", evidence: "gathering-evidence", execute: "executing", verify: "verifying", approve: "awaiting-approval" };

/* ───────────── mode recommendation (REQ-AGI-001) ───────────── */

export function recommendMode(f: FlagshipDef, siteCount: number): { mode: Mode; reason: LText } {
  if (siteCount > 1) return { mode: "W", reason: t(`${siteCount} ไซต์ — ใช้ Cooperative Swarm: ทีมต่อไซต์ทำงานขนานกันและตรวจไขว้`, `${siteCount} sites — Cooperative Swarm: one team per site in parallel, with cross-team verification`) };
  return f.defaultMode === "S"
    ? { mode: "S", reason: t("งานเดียวที่ชัดเจน — Single Bot ตรวจด้วยกฎก็พอ", "One focused task — a Single Bot with rule-based validation is enough") }
    : { mode: f.defaultMode, reason: t("ภารกิจซับซ้อนหลายด้าน — ทีม AI มีหัวหน้าและผู้เชี่ยวชาญตรวจทานกัน", "A complex multi-discipline mission — a Lead Agent with specialists who peer-review") };
}

export function checkMode(mode: Mode, siteCount: number): { ok: boolean; reason?: LText } {
  if (siteCount > 1 && mode !== "W") return { ok: false, reason: t("หลายไซต์ต้องใช้ Cooperative Swarm เพื่อแยกข้อมูลรายไซต์และตรวจไขว้ — ต้องอัปเกรดโหมด", "Several sites need Cooperative Swarm to keep site data separate and cross-check — upgrade required") };
  return { ok: true };
}

/** Which agents a workstream uses: one generalist (S), the specialists the plan names (T, W). */
export function teamFor(f: FlagshipDef, mode: Mode): AgentId[] {
  if (mode === "S") return ["lead"];
  return [...new Set<AgentId>(["lead", ...f.tasks.map((x) => x.agent), "qa", "cost"])];
}

/** Dependency levels — what can run in parallel (Team, Swarm). */
export function parallelGroups(f: FlagshipDef): string[][] {
  const level = new Map<string, number>();
  const depth = (id: string): number => {
    if (level.has(id)) return level.get(id)!;
    const task = f.tasks.find((x) => x.id === id)!;
    const d = task.deps.length ? 1 + Math.max(...task.deps.map(depth)) : 0;
    level.set(id, d);
    return d;
  };
  f.tasks.forEach((x) => depth(x.id));
  const groups: string[][] = [];
  for (const [id, d] of level) (groups[d] ??= []).push(id);
  return groups;
}

/* ───────────── REQ-UX-002 mission preview ───────────── */

export interface MissionPreview {
  flagship: FlagshipDef;
  objective: LText;
  scope: { site: string; name: LText; route: string; period: string }[];
  recommended: { mode: Mode; reason: LText };
  mode: Mode;
  modeCheck: { ok: boolean; reason?: LText };
  autonomy: Autonomy;
  available: LText[];
  missing: LText[];
  plan: { id: string; title: LText; agent: LText; phase: Phase; deps: string[]; work: string; gate?: Gate }[];
  parallel: string[][];
  deliverables: LText[];
  estimate: { minutes: number; costTHB: number; budgetTHB: number; overBudget: boolean };
  gates: LText[];
  warnings: LText[];
}

export function preview(fid: string, sites: SiteInput[], opts: { mode?: Mode; autonomy?: Autonomy; budgetTHB?: number } = {}): MissionPreview {
  const f = flagshipById(fid);
  if (!f) throw new Error(`unknown mission ${fid}`);
  const recommended = recommendMode(f, sites.length);
  const mode = opts.mode ?? recommended.mode;
  const autonomy = opts.autonomy ?? f.defaultAutonomy;
  const budgetTHB = opts.budgetTHB ?? f.costCapTHB;
  const warnings: LText[] = [];
  const scope = sites.map((s) => {
    const r = determineRoute(s.profile);
    if (r.route !== "cop") warnings.push(t(`${s.name.th}: เส้นทาง ${r.route.toUpperCase()} — ภารกิจ CoP จะหยุดที่ขั้นตรวจเส้นทาง`, `${s.name.en}: ${r.route.toUpperCase()} route — the CoP mission will stop at the route check`));
    const p = monitoringPeriods(s.profile, s.year).periods;
    return { site: s.id, name: s.name, route: r.route, period: p.map((x) => `${x.from}→${x.to} (due ${x.due})`).join("; ") };
  });
  const available: LText[] = [], missing: LText[] = [];
  for (const s of sites) {
    const v = s.evidence.filter((e) => e.status === "verified").length;
    available.push(t(`${s.name.th}: หลักฐานยืนยันแล้ว ${v} · ผลตรวจวัด ${s.measurements.length} ค่า · ห้องปฏิบัติการ ${s.labs.length}`, `${s.name.en}: ${v} verified evidence · ${s.measurements.length} measurements · ${s.labs.length} lab(s)`));
    for (const e of s.evidence.filter((x) => x.status !== "verified" && x.status !== "not-applicable")) missing.push(t(`${s.name.th}: ${e.title.th} (${e.status})`, `${s.name.en}: ${e.title.en} (${e.status})`));
  }
  const runnerCost = f.tasks.reduce((a, x) => a + taskCost(x.tier), 0) * sites.length;
  const minutes = Math.round(f.tasks.reduce((a, x) => a + TIER_COST[x.tier].minutes, 0) * (mode === "W" ? 1 : sites.length) * 10) / 10;
  const costTHB = Math.round(runnerCost * 100) / 100;
  if (costTHB > budgetTHB) warnings.push(t(`ประมาณการ ${costTHB} บาท เกินวงเงิน ${budgetTHB} บาท — จะหยุดขออนุมัติก่อนเกิน`, `Estimate ${costTHB} THB exceeds the ${budgetTHB} THB budget — the run pauses for approval before exceeding it`));
  const modeCheck = checkMode(mode, sites.length);
  if (!modeCheck.ok) warnings.push(modeCheck.reason!);
  const gates = f.tasks.filter((x) => x.gate).map((x) => x.title);
  if (autonomy === "draft") gates.unshift(t("โหมดร่าง: AI ไม่ส่งคำขอหรือมอบหมายงานเอง — ผู้ใช้ทำทุกการกระทำ", "Draft: the AI sends no requests and assigns no work — the user takes every action"));
  gates.push(t("การยื่นต่อ กกพ. ต้องทำโดยผู้มีอำนาจผ่านช่องทางที่ยืนยันตัวตน", "Filing with the ERC needs an authorised person and an authenticated channel"));
  return {
    flagship: f, objective: f.goal, scope, recommended, mode, modeCheck, autonomy, available, missing,
    plan: f.tasks.map((x) => ({ id: x.id, title: x.title, agent: agentById(mode === "S" ? "lead" : x.agent).name, phase: x.phase, deps: x.deps, work: x.work, gate: x.gate })),
    parallel: mode === "S" ? f.tasks.map((x) => [x.id]) : parallelGroups(f),
    deliverables: f.deliverables, estimate: { minutes, costTHB, budgetTHB, overBudget: costTHB > budgetTHB }, gates, warnings,
  };
}

/* ───────────── audit chain (REQ-GOV-004) ───────────── */

function log(run: MissionRun, at: string, actor: string, action: string, object: string, detail: string, agent?: AgentId) {
  const prev = run.audit[run.audit.length - 1]?.hash ?? "GENESIS";
  const seq = run.audit.length + 1;
  const hash = sha256([prev, seq, at, actor, agent ?? "", action, object, detail].join("|"));
  run.audit.push({ seq, at, actor, agent, action, object, detail, prev, hash });
}

export function verifyAudit(run: MissionRun): { ok: boolean; brokenAt?: number } {
  let prev = "GENESIS";
  for (const e of run.audit) {
    const h = sha256([prev, e.seq, e.at, e.actor, e.agent ?? "", e.action, e.object, e.detail].join("|"));
    if (e.prev !== prev || e.hash !== h) return { ok: false, brokenAt: e.seq };
    prev = e.hash;
  }
  return { ok: true };
}

/* ───────────── lifecycle ───────────── */

export function createRun(fid: string, sites: SiteInput[], opts: { mode?: Mode; autonomy?: Autonomy; budgetTHB?: number; id?: string }, actor: string, now: string): MissionRun {
  const p = preview(fid, sites, opts);
  if (!p.modeCheck.ok) throw new Error(p.modeCheck.reason!.en);
  const f = p.flagship;
  const team = teamFor(f, p.mode);
  const run: MissionRun = {
    id: opts.id ?? `RUN-${fid}-${sha256(now + actor + sites.map((s) => s.id).join()).slice(0, 8)}`,
    flagship: fid, mode: p.mode, autonomy: p.autonomy, budgetTHB: p.estimate.budgetTHB, spentTHB: 0,
    sites: sites.map((s) => s.id), state: "created",
    workstreams: sites.map((s) => ({ id: `WS-${s.id}`, site: s.id, team })),
    tasks: sites.flatMap((s) => f.tasks.map((x) => ({ key: `${s.id}:${x.id}`, site: s.id, taskId: x.id, agent: p.mode === "S" ? "lead" as AgentId : x.agent, status: "pending" as const, attempts: 0, costTHB: 0 }))),
    approvals: {}, humanTasks: [], findings: [], deliverables: [], actions: [], blockedSites: {}, audit: [],
    submission: { status: "not-filed" }, rulesetVersion: RULESET_2567.version, createdAt: now,
  };
  log(run, now, actor, "create", run.id, `${fid} · mode ${p.mode} · autonomy ${p.autonomy} · budget ${p.estimate.budgetTHB} THB · sites ${run.sites.join(",")} · ruleset ${run.rulesetVersion}`);
  return run;
}

/** User accepted the preview. */
export function startRun(run: MissionRun, actor: string, now: string) {
  if (run.state !== "created") return;
  run.state = "scoped";
  log(run, now, actor, "start", run.id, "preview accepted");
}

const def = (run: MissionRun, taskId: string) => flagshipById(run.flagship)!.tasks.find((x) => x.id === taskId)!;

function runnable(run: MissionRun, tr: TaskRun): boolean {
  if (tr.status !== "pending") return false;
  const d = def(run, tr.taskId);
  return d.deps.every((dep) => {
    const x = run.tasks.find((y) => y.key === `${tr.site}:${dep}`)!;
    return x.status === "done";
  });
}

/**
 * Advance the run as far as it can go. Stops at approval gates, budget limits or when nothing is
 * runnable. Safe to call repeatedly — finished work is never redone.
 */
export function runMission(run: MissionRun, env: Env): MissionRun {
  if (["completed", "archived", "cancelled", "failed", "created"].includes(run.state)) return run;
  if (run.state === "retrying") run.state = "executing";
  for (let guard = 0; guard < 2000; guard++) {
    const next = PHASES.flatMap((ph) => run.tasks.filter((x) => def(run, x.taskId).phase === ph)).find((x) => runnable(run, x));
    if (!next) break;
    const d = def(run, next.taskId);
    const site = env.sites[next.site];
    if (run.blockedSites[next.site]) { next.status = "skipped"; continue; }
    run.state = STATE_FOR[d.phase];

    if (d.gate) {
      if (run.approvals[next.key]) { next.status = "done"; log(run, env.now(), "engine", "gate-passed", next.key, `approved by ${run.approvals[next.key].by}`, d.agent); continue; }
      next.status = "awaiting";
      log(run, env.now(), "engine", "gate-waiting", next.key, d.title.en, d.agent);
      continue;
    }

    // Mission Cost Governor — never exceed the approved budget silently
    const cost = taskCost(d.tier);
    if (run.spentTHB + cost > run.budgetTHB) {
      const key = `budget:${next.key}`;
      if (!run.approvals[key]) {
        next.status = "awaiting";
        if (!run.findings.some((f) => f.id === key)) run.findings.push({ id: key, site: next.site, kind: "budget", severity: "minor", text: t(`งานถัดไปจะทำให้ค่าใช้จ่ายเกินวงเงิน ${run.budgetTHB} บาท`, `The next task would exceed the ${run.budgetTHB} THB budget`) });
        log(run, env.now(), "cost-governor", "budget-gate", next.key, `spent ${run.spentTHB} + ${cost} > ${run.budgetTHB}`, "cost");
        continue;
      }
    }

    const prior = Object.fromEntries(run.tasks.filter((x) => x.site === next.site && x.output).map((x) => [x.taskId, x.output!]));
    try {
      const out = RUNNERS[d.runner!](site, { autonomy: run.autonomy, today: env.today, agent: next.agent, prior });
      next.output = out;
      next.status = "done";
      next.costTHB = cost;
      run.spentTHB = Math.round((run.spentTHB + cost) * 100) / 100;
      absorb(run, next, d, out, env);
    } catch (err) {
      next.attempts++;
      log(run, env.now(), "engine", "task-error", next.key, String(err).slice(0, 120), d.agent);
      if (next.attempts >= 3) { next.status = "failed"; run.state = "failed"; run.outcome = { status: "failed", unresolved: [t(`งาน ${next.key} ล้มเหลว 3 ครั้ง`, `Task ${next.key} failed 3 times`)] }; return run; }
    }
  }
  if (run.mode === "W" && run.sites.length > 1) consolidate(run, env);
  settle(run, env);
  return run;
}

function absorb(run: MissionRun, tr: TaskRun, d: TaskDef, out: TaskOutput, env: Env) {
  log(run, env.now(), agentById(tr.agent).name.en, "task-done", tr.key, out.summary.en, tr.agent);
  (out.findings ?? []).forEach((f, i) => {
    const id = `${tr.key}:F${i + 1}`;
    if (!run.findings.some((x) => x.id === id)) run.findings.push({ ...f, id, site: tr.site });
  });
  (out.humanTasks ?? []).forEach((h, i) => {
    const id = `${tr.key}:H${i + 1}`;
    if (!run.humanTasks.some((x) => x.id === id)) run.humanTasks.push({ ...h, id, site: tr.site, status: "open" });
  });
  if (out.deliverable) {
    const prev = run.deliverables.filter((x) => x.id === out.deliverable!.id && x.site === tr.site);
    const dl: Deliverable = { ...out.deliverable, site: tr.site, version: prev.length + 1 };
    dl.hash = sha256(JSON.stringify(dl));
    run.deliverables.push(dl);
    log(run, env.now(), agentById(tr.agent).name.en, "deliverable", `${tr.site}:${dl.id}@v${dl.version}`, dl.hash, tr.agent);
  }
  // outbound actions happen once, and never under Draft autonomy
  if (d.action && run.autonomy !== "draft" && (out.data as { sent?: number } | undefined)?.sent) {
    const key = `action:${tr.key}`;
    if (!run.actions.some((a) => a.key === key)) { run.actions.push({ key, at: env.now(), detail: out.summary.en }); log(run, env.now(), "engine", "action", key, out.summary.en, tr.agent); }
  }
  if (d.action && run.autonomy === "draft") {
    const id = `${tr.key}:USER`;
    if (!run.humanTasks.some((x) => x.id === id)) run.humanTasks.push({ id, site: tr.site, title: t(`ดำเนินการเอง: ${d.title.th}`, `Take this action yourself: ${d.title.en}`), work: "human", owner: t("ผู้ใช้", "You"), status: "open" });
  }
  if (out.block) {
    run.blockedSites[tr.site] = out.block;
    // nothing else runs for a blocked site — its remaining work is skipped, not left pending
    run.tasks.filter((x) => x.site === tr.site && x.status === "pending").forEach((x) => { x.status = "skipped"; });
    log(run, env.now(), "engine", "site-blocked", tr.site, out.block.en, tr.agent);
  }
}

/** Swarm: central cross-team verification and a consolidated dashboard; reads results, never another site's raw data. */
function consolidate(run: MissionRun, env: Env) {
  if (run.tasks.some((x) => x.status === "pending")) return;
  if (run.deliverables.some((x) => x.id === "dashboard")) return;
  const rows = run.sites.map((s) => {
    const sf = run.findings.filter((f) => f.site === s);
    const matrix = run.deliverables.find((x) => x.site === s && x.id === "results-matrix");
    const res = (k: string) => (matrix?.rows ?? []).filter((r) => r.result === k).length;
    return { site: s, route: run.blockedSites[s] ? "blocked" : "cop", compliant: res("compliant"), unverified: res("unverified"), exceedances: sf.filter((f) => f.kind === "exceedance").length, openTasks: run.humanTasks.filter((h) => h.site === s && h.status !== "done").length };
  });
  // findings that recur across sites point at a systemic issue
  const kinds = [...new Set(run.findings.map((f) => f.kind))];
  for (const k of kinds) {
    const at = [...new Set(run.findings.filter((f) => f.kind === k).map((f) => f.site))];
    if (at.length > 1 && k !== "budget") {
      const id = `group:recurring:${k}`;
      if (!run.findings.some((f) => f.id === id)) run.findings.push({ id, site: "group", kind: k, severity: "major", text: t(`พบซ้ำใน ${at.length} ไซต์: ${k}`, `Recurs across ${at.length} sites: ${k}`) });
    }
  }
  const dl: Deliverable = { id: "dashboard", site: "group", kind: "dashboard", title: t("แดชบอร์ดการปฏิบัติตามของกลุ่ม", "Group compliance dashboard"), version: 1, rows };
  dl.hash = sha256(JSON.stringify(dl));
  run.deliverables.push(dl);
  log(run, env.now(), "Mission Lead Agent", "consolidate", "group:dashboard", `${rows.length} sites cross-checked`, "lead");
}

/** Decide the run's state once nothing more can run — Blocked/Needs Human Action is never shown as success. */
function settle(run: MissionRun, env: Env) {
  const waiting = run.tasks.filter((x) => x.status === "awaiting");
  if (waiting.length) { run.state = "awaiting-approval"; return; }
  if (run.tasks.some((x) => x.status === "pending")) return;
  const unresolved: LText[] = [
    ...Object.entries(run.blockedSites).map(([s, why]) => t(`${s}: ${why.th}`, `${s}: ${why.en}`)),
    ...run.humanTasks.filter((h) => h.status !== "done").map((h) => h.title),
    ...run.tasks.filter((x) => x.taskId === "qa" && (x.output?.data as { passed?: boolean } | undefined)?.passed === false).map(() => t("QA ไม่ผ่าน", "QA failed")),
  ];
  const status = unresolved.length ? "blocked" : "completed";
  const unchanged = run.outcome?.status === status && run.outcome.unresolved.length === unresolved.length;
  run.outcome = { status, unresolved };
  run.state = status === "completed" ? "completed" : "blocked";
  if (unchanged) return;
  log(run, env.now(), "engine", status === "completed" ? "completed" : "needs-human-action", run.id, `${unresolved.length} unresolved`);
}

/* ───────────── human control ───────────── */

const GATE_ROLES: Record<Gate, Role[]> = { approval: ["owner", "consultant", "exec", "qualified"], certification: ["qualified"], submission: ["owner", "exec"] };

/** Record a human approval once. Returns false if it was already approved or the role may not approve it. */
export function approve(run: MissionRun, key: string, by: string, role: Role, now: string, evidence?: string): { ok: boolean; reason?: string } {
  if (run.approvals[key]) return { ok: false, reason: "already approved" };
  const tr = run.tasks.find((x) => x.key === key);
  if (key.startsWith("budget:")) {
    if (role !== "owner" && role !== "exec") return { ok: false, reason: "only an owner or executive approves spending" };
  } else {
    if (!tr) return { ok: false, reason: "unknown gate" };
    const g = def(run, tr.taskId).gate!;
    if (!GATE_ROLES[g].includes(role)) return { ok: false, reason: `${g} needs ${GATE_ROLES[g].join(" or ")}` };
    if (def(run, tr.taskId).work !== "ai-digital" && def(run, tr.taskId).id === "consultation" && !evidence) return { ok: false, reason: "a real-world activity needs evidence that it happened" };
  }
  run.approvals[key] = { by, role, at: now, evidence };
  if (key.startsWith("budget:")) {
    const target = run.tasks.find((x) => x.key === key.slice(7));
    if (target) { target.status = "pending"; run.budgetTHB = Math.max(run.budgetTHB, run.spentTHB + taskCost(def(run, target.taskId).tier)); }
  } else if (tr) tr.status = "pending";
  log(run, now, by, "approve", key, `${role}${evidence ? ` · evidence ${evidence}` : ""}`);
  if (run.state === "awaiting-approval") run.state = "executing";
  return { ok: true };
}

/** A person finished real-world work. Corrective work also needs an independent verifier. */
export function resolveHumanTask(run: MissionRun, id: string, by: string, evidence: string, now: string): { ok: boolean; reason?: string } {
  const h = run.humanTasks.find((x) => x.id === id);
  if (!h) return { ok: false, reason: "unknown task" };
  if (!evidence.trim()) return { ok: false, reason: "evidence is required to close real-world work" };
  if (h.status === "done") return { ok: false, reason: "already done" };
  h.doneBy = by; h.evidence = evidence;
  h.status = h.verify ? "awaiting-verification" : "done";
  log(run, now, by, "human-task", id, `evidence ${evidence}${h.verify ? " · awaiting independent verification" : ""}`);
  if (run.state === "blocked") run.state = "executing";
  return { ok: true };
}

export function verifyHumanTask(run: MissionRun, id: string, verifier: string, now: string): { ok: boolean; reason?: string } {
  const h = run.humanTasks.find((x) => x.id === id);
  if (!h || h.status !== "awaiting-verification") return { ok: false, reason: "nothing to verify" };
  if (verifier === h.doneBy) return { ok: false, reason: "the verifier must be independent of the person who did the work" };
  h.status = "done"; h.verifiedBy = verifier;
  log(run, now, verifier, "verify", id, `closed after independent verification`);
  if (run.state === "blocked") run.state = "executing";
  return { ok: true };
}

/** REQ-GOV-005 — packaging is not filing. Filing succeeds only with authority, an authenticated channel and an acknowledgement. */
export function submit(run: MissionRun, by: string, role: Role, opts: { authenticated: boolean; acknowledgement?: string }, now: string): { ok: boolean; reason: string } {
  if (run.state !== "completed") return { ok: false, reason: "the mission is not complete — nothing is ready to file" };
  if (role !== "owner" && role !== "exec") return { ok: false, reason: "only an authorised representative can file" };
  if (!opts.authenticated) { log(run, now, by, "submit-refused", run.id, "no authenticated filing channel"); return { ok: false, reason: "no authenticated filing integration — file through the ERC channel and record the acknowledgement" }; }
  if (!opts.acknowledgement) { run.submission = { status: "awaiting-confirmation" }; log(run, now, by, "submitted", run.id, "awaiting acknowledgement"); return { ok: false, reason: "submitted, awaiting the regulator's acknowledgement" }; }
  run.submission = { status: "filed", reference: opts.acknowledgement };
  log(run, now, by, "filed", run.id, `acknowledgement ${opts.acknowledgement}`);
  return { ok: true, reason: "filed and acknowledged" };
}

export function cancel(run: MissionRun, by: string, now: string) { run.state = "cancelled"; run.outcome = { status: "cancelled", unresolved: [] }; log(run, now, by, "cancel", run.id, ""); }
export function retry(run: MissionRun, by: string, now: string) {
  if (run.state !== "failed") return;
  run.tasks.filter((x) => x.status === "failed").forEach((x) => { x.status = "pending"; x.attempts = 0; });
  run.state = "retrying"; run.outcome = undefined;
  log(run, now, by, "retry", run.id, "");
}
export function archive(run: MissionRun, by: string, now: string) { if (run.state === "completed" || run.state === "blocked") { run.state = "archived"; log(run, now, by, "archive", run.id, ""); } }

/** REQ-GOV-004 — how a deliverable was produced: the tasks behind it, their agents, sources and approvals. */
export function trace(run: MissionRun, site: string, deliverableId: string) {
  const dl = run.deliverables.filter((x) => x.site === site && x.id === deliverableId).at(-1);
  const producer = run.tasks.find((x) => x.site === site && x.output?.deliverable?.id === deliverableId);
  const f = flagshipById(run.flagship)!;
  const chain = new Set<string>();
  const walk = (id: string) => { if (chain.has(id)) return; chain.add(id); f.tasks.find((x) => x.id === id)?.deps.forEach(walk); };
  if (producer) walk(producer.taskId);
  const keys = [...chain].map((id) => `${site}:${id}`);
  return {
    deliverable: dl,
    tasks: run.tasks.filter((x) => keys.includes(x.key)).map((x) => ({ key: x.key, agent: x.agent, summary: x.output?.summary })),
    sources: dl?.sections?.flatMap((s) => s.sources) ?? [],
    events: run.audit.filter((e) => keys.includes(e.object) || e.object.startsWith(`${site}:${deliverableId}`) || Object.keys(run.approvals).includes(e.object)),
  };
}

export { measureResults };
