/**
 * COP24-DI-001 acceptance criteria (§9) on the seeded, intentionally flawed Thai dataset.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { addSource, analyze, approveRequest, authorize, canSend, emptyState, findDates, ingest, parseValue, planMission, readiness, revoke, reviewField, runMission, toReportInput, trace, approveSnapshot, pause, resume, cancel, type MissionEnv } from "../ingest";
import { assessReport } from "../report/assess";
import { GOLD_CATEGORIES, GOLD_FIELDS, SAMPLE_DUPLICATE, SAMPLE_FILES, SAMPLE_RETURNED, SEEDED_DEFECTS } from "../../data/ingest-samples";
import { LB1_BRIEF } from "../../data/report-lb1";
import type { IngestionState } from "../ingest/types";

function setup(report: "preliminary" | "final" | "monitoring" = "preliminary", phase: "pre-construction" | "construction" | "operation" = "pre-construction", tech = "solar-ground") {
  const s = emptyState("lgp", "lopburi-1", { report, year: 2026, phase, tech });
  addSource(s, { id: "SRC-SAMPLE", kind: "folder", label: "Lopburi1 folder", authorizedBy: "nattawut", authorizedAt: "2026-10-11" });
  ingest(s, [...SAMPLE_FILES, SAMPLE_DUPLICATE], "nattawut", "SRC-SAMPLE");
  analyze(s);
  return s;
}
const docByFile = (s: IngestionState, file: string) => s.documents.find((d) => d.versions.some((v) => v.fileName === file))!;

test("first-time setup: an empty workspace analyses cleanly and lists every mandatory item as missing", () => {
  for (const report of ["preliminary", "final", "monitoring"] as const) {
    const s = analyze(emptyState("lgp", "lopburi-1", { report, year: 2026, phase: report === "monitoring" ? "operation" : "pre-construction", tech: "solar-ground" }));
    const mandatory = s.checklist.filter((c) => c.level === "mandatory");
    assert.ok(mandatory.length > 0);
    assert.ok(mandatory.every((c) => c.status === "missing"));
    assert.ok(s.missing.every((m) => m.collectionMethod !== "reuse-prior"));
  }
});

test("§9 one-click: bulk ingest without naming or tagging; duplicates are safe", () => {
  const s = setup();
  assert.equal(s.documents.length, SAMPLE_FILES.length); // duplicate not ingested twice
  assert.equal(s.jobs[0].status, "completed");
  assert.ok(s.audit.some((a) => a.action === "detect-duplicate"));
});

test("§9 extraction: ≥ 95% document classification on the gold set", () => {
  const s = setup();
  const entries = Object.entries(GOLD_CATEGORIES);
  const correct = entries.filter(([file, cat]) => docByFile(s, file).categories[0].category === cat).length;
  const acc = correct / entries.length;
  assert.ok(acc >= 0.95, `classification accuracy ${acc} — misses: ${entries.filter(([f, c]) => docByFile(s, f).categories[0].category !== c).map(([f]) => `${f}→${docByFile(s, f).categories[0].category}`).join(", ")}`);
});

test("§9 extraction: ≥ 98% critical-field accuracy; ND / not measured / not provided stay distinct", () => {
  const s = setup();
  const hits = GOLD_FIELDS.filter((g) => {
    const d = docByFile(s, g.file);
    return s.fields.some((f) => f.locator.documentId === d.id && f.key === g.key && (g.state ? f.state === g.state : String(f.normalized) === String(g.value)));
  });
  const acc = hits.length / GOLD_FIELDS.length;
  assert.ok(acc >= 0.98, `critical-field accuracy ${acc} — misses: ${GOLD_FIELDS.filter((g) => !hits.includes(g)).map((g) => `${g.file}:${g.key}`).join(", ")}`);
  assert.equal(parseValue("0").state, "zero");
  assert.equal(parseValue("ND").state, "not-detected");
  assert.equal(parseValue("ไม่ได้ตรวจวัด").state, "not-measured");
  assert.equal(parseValue("-").state, "not-provided");
  assert.equal(parseValue("ประมาณห้าสิบ").state, "unclear");
});

test("§9 Thai Buddhist Era dates normalise to CE", () => {
  assert.equal(findDates("12 มิถุนายน 2569")[0].iso, "2026-06-12");
  assert.equal(findDates("31 ส.ค. 69")[0].iso, "2026-08-31");
  assert.equal(findDates("12/06/2569")[0].iso, "2026-06-12");
});

test("§9 validation: every seeded critical defect is detected", () => {
  const s = setup();
  const codes = new Set(s.findings.map((f) => f.code));
  const missed = SEEDED_DEFECTS.filter((d) => !codes.has(d.code));
  assert.deepEqual(missed, []);
});

test("§9 validation: seeded missing mandatory evidence is detected", () => {
  const s = setup();
  const missing = s.missing.map((m) => m.evidenceTypeId);
  for (const id of ["ET-SOIL", "ET-LOCATION-CERT", "ET-MEASURES-TABLE"]) assert.ok(missing.includes(id) || s.checklist.find((c) => c.evidenceTypeId === id)!.status !== "verified", `${id} should be missing or unverified`);
  assert.ok(missing.includes("ET-SOIL"));
  assert.ok(missing.includes("ET-LOCATION-CERT"));
});

test("§9 checklists differ by plant type, report phase and regulation version", () => {
  const pre = setup("preliminary");
  const mon = setup("monitoring", "operation");
  const roof = setup("preliminary", "pre-construction", "solar-roof");
  const lvl = (s: IngestionState, id: string) => s.checklist.find((c) => c.evidenceTypeId === id)!.level;
  assert.equal(lvl(pre, "ET-NOISE-BASELINE"), "mandatory");
  assert.equal(lvl(roof, "ET-NOISE-BASELINE"), "not-applicable"); // rooftop form has no baseline part
  assert.equal(lvl(mon, "ET-WATER-OPS"), "mandatory");
  assert.equal(lvl(pre, "ET-WATER-OPS"), "not-applicable");
  assert.equal(lvl(mon, "ET-HEARING"), "not-applicable");
  const s2565 = setup("preliminary");
  analyze(s2565, "2565");
  assert.equal(lvl(s2565, "ET-LOCATION-CERT"), "optional");
  assert.equal(lvl(pre, "ET-LOCATION-CERT"), "mandatory");
  const wind = setup("preliminary", "pre-construction", "wind");
  assert.equal(lvl(wind, "ET-NOISE-BASELINE"), "conditional"); // no encoded rule → verify, never silently demand
});

test("§9 historical evidence is never represented as current-period evidence", () => {
  const s = setup("monitoring", "operation");
  const prior = docByFile(s, "รายงานผลการปฏิบัติตาม CoP ปี 2568.pdf");
  assert.ok(s.measurements.filter((m) => m.sourceDocumentId === prior.id).every((m) => m.periodLabel === "historical"));
  const hist = s.checklist.find((c) => c.evidenceTypeId === "ET-HISTORY")!;
  assert.ok(hist.documentIds.includes(prior.id));
  assert.ok(!s.checklist.find((c) => c.evidenceTypeId === "ET-MEASURES-TABLE")!.documentIds.includes(prior.id) || s.links.find((l) => l.documentId === prior.id && l.evidenceTypeId === "ET-MEASURES-TABLE")!.period === "standing");
});

test("§9 traceability: 100% of fields trace to a file, page or cell, with history", () => {
  const s = setup();
  for (const f of s.fields) {
    const tr = trace(s, f.id)!;
    assert.ok(tr.document && tr.version.sha256 === f.locator.sha256);
    assert.ok(f.locator.page || f.locator.cell || f.key.startsWith("photo."), `${f.id} has no page/cell`);
  }
  assert.equal(s.fields.find((f) => f.key === "photo.gps" && f.state === "not-provided")?.normalized, undefined); // never generated
});

test("§9 corrections keep the original value, editor, time and rationale", () => {
  const s = setup();
  const cap = s.fields.find((f) => f.key === "capacity.ac" && f.normalized === 45)!;
  assert.throws(() => reviewField(s, cap.id, "correct", "engineer", { value: 48 }));
  reviewField(s, cap.id, "correct", "engineer", { value: 48, rationale: "Layout rev.C typo; licence p.1 states 48.0 MW" });
  assert.equal(cap.raw.includes("45.0"), true);
  assert.equal(cap.corrections[0].from, 45);
  assert.equal(cap.corrections[0].by, "engineer");
});

test("§9 handoff: plan → authorise → execute; requests need approval; mission survives pause/resume", async () => {
  const s = setup();
  const m = planMission(s, "เตรียมข้อมูลรายงาน CoP ขั้นต้น ปี 2569 ของ ลพบุรี 1 ขอเอกสารที่ขาดจากทีม", "nattawut");
  assert.equal(m.target.report, "preliminary");
  assert.equal(m.target.year, 2026);
  let returned: typeof SAMPLE_FILES = [];
  const delivered: string[] = [];
  const env: MissionEnv = {
    collect: () => [],
    owners: (id) => (id === "ET-LOCATION-CERT" ? { name: "สมชาย", role: "regulatory", email: "somchai@lgp.example", external: false, language: "th" } : id === "ET-SOIL" ? { name: "ที่ปรึกษา", role: "consultant", email: "env@consult.example", external: true, language: "th" } : undefined),
    deliver: (rid) => { delivered.push(rid); return true; },
    returned: () => returned,
  };
  authorize(s, m.id, { sources: ["SRC-SAMPLE"], recipients: ["somchai@lgp.example", "env@consult.example"], externalActions: { sendRequests: "pre-approved-internal" }, spendLimitTHB: 500, grantedBy: "nattawut" });
  await runMission(s, m.id, env);
  // internal request pre-approved and sent; external held until approved
  const internal = s.requests.find((r) => r.recipient.email === "somchai@lgp.example")!;
  const external = s.requests.find((r) => r.recipient.email === "env@consult.example")!;
  assert.equal(internal.status, "sent");
  assert.notEqual(external.status, "sent");
  assert.ok(!delivered.includes(external.id));
  assert.equal(m.status, "waiting-for-responses");
  // the user closes the app; later a returned file arrives through the upload link and the mission resumes
  pause(s, m.id, "nattawut");
  resume(s, m.id, "nattawut");
  returned = [SAMPLE_RETURNED];
  await runMission(s, m.id, env);
  assert.equal(m.status, "completed");
  assert.equal(s.checklist.find((c) => c.evidenceTypeId === "ET-LOCATION-CERT")!.status === "missing", false);
  assert.ok(m.outcome);
});

test("§9 handoff without a mailer: approved requests wait for a person to send them; the mission does not report completion", async () => {
  const s = setup();
  const m = planMission(s, "เตรียมข้อมูลรายงาน CoP ขั้นต้น ปี 2569 ของ ลพบุรี 1 ขอเอกสารที่ขาดจากทีม", "nattawut");
  const env: MissionEnv = {
    collect: () => [],
    owners: (id) => (id === "ET-LOCATION-CERT" || id === "ET-ENG-DESIGN" ? { name: "สมชาย", role: "regulatory", email: "somchai@lgp.example", external: false, language: "th" } : undefined),
    returned: () => { const d = returned; returned = []; return d; },
  };
  let returned: typeof SAMPLE_FILES = [];
  authorize(s, m.id, { sources: ["SRC-SAMPLE"], recipients: ["somchai@lgp.example"], externalActions: { sendRequests: "pre-approved-internal" }, spendLimitTHB: 500, grantedBy: "nattawut" });
  await runMission(s, m.id, env);
  const req = s.requests.find((r) => r.missingId.includes("LOCATION"))!;
  assert.equal(req.status, "approved");
  assert.equal(req.deliveryPending, true);
  assert.equal(m.status, "waiting-for-responses");
  assert.ok(m.log.some((l) => /2 approved, awaiting manual send/.test(l.detail ?? "")));
  // one reply arrives: only the request it answers is closed; the mission keeps waiting for the other
  returned = [SAMPLE_RETURNED];
  await runMission(s, m.id, env);
  assert.equal(req.status, "responded");
  const design = s.requests.find((r) => r.missingId.includes("ENG-DESIGN"))!;
  assert.equal(design.status, "approved");
  assert.equal(m.status, "waiting-for-responses");
});


test("§9 security: no unapproved external message; revocation is enforced; no cross-tenant source", async () => {
  const s = setup();
  const m = planMission(s, "prepare 2026 preliminary report", "u");
  authorize(s, m.id, { sources: ["SRC-SAMPLE"], recipients: ["env@consult.example"], externalActions: { sendRequests: "each-approval" }, spendLimitTHB: 0, grantedBy: "u" });
  const req = { id: "R1", missingId: "x", recipient: { name: "c", role: "consultant", email: "env@consult.example", external: true }, language: "th" as const, subject: "", body: "", deadline: "", uploadLink: { token: "", scope: "", expiresAt: "" }, status: "awaiting-approval" as const };
  assert.equal(canSend(req, "each-approval", ["env@consult.example"]).ok, false);
  assert.equal(canSend({ ...req, recipient: { ...req.recipient, email: "other@x.example" }, status: "approved" }, "each-approval", ["env@consult.example"]).ok, false);
  s.requests.push({ ...req });
  approveRequest(s, "R1", "u");
  assert.equal(canSend(s.requests.find((r) => r.id === "R1")!, "each-approval", ["env@consult.example"]).ok, true);
  revoke(s, m.id, "u");
  assert.throws(() => resume(s, m.id, "u"));
  const before = s.documents.length;
  s.sources.push({ id: "SRC-OTHER", kind: "upload", label: "x", readOnly: true, authorizedBy: "x", authorizedAt: "x", tenantId: "other-tenant" });
  const job = ingest(s, [SAMPLE_RETURNED], "attacker", "SRC-OTHER");
  assert.equal(job.status, "failed");
  assert.equal(s.documents.length, before);
  cancel(s, m.id, "u");
});

test("§9 report integration: new ingestion never silently alters an approved snapshot", () => {
  const s = setup();
  for (const l of s.links.slice(0, 3)) l.status = "accepted";
  const snap = approveSnapshot(s, "approver");
  const frozen = JSON.stringify(snap);
  ingest(s, [SAMPLE_RETURNED], "u", "SRC-SAMPLE");
  analyze(s);
  assert.equal(JSON.stringify(s.approvedSnapshots[0]), frozen);
  assert.ok(Object.isFrozen(s.approvedSnapshots[0]));
});

test("§9 report integration: ReportCore consumes the ingested store; missing items stay gaps", () => {
  const s = setup();
  const input = toReportInput(s, { ...LB1_BRIEF, entityId: "lopburi-1" });
  const a = assessReport(input);
  assert.ok(a.claims.some((c) => c.type === "gap"));
  assert.equal(a.releasable, false);
  assert.ok(input.metrics.find((m) => m.key === "noise.baseline.days")!.value! < 5);
  const r = readiness(s);
  assert.ok(r.applicable > 0 && r.pct < 100);
});
