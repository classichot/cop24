import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluatePack } from "../applicability";
import { scoreEvidence, evidenceGuard } from "../evidence";
import { createSnapshot } from "../engine";
import { ALL_PACKS } from "../../packs";
import { ENTITIES, EVIDENCE, CONTROLS, CONTROL_TESTS, REG_CHANGES, REPORT_DRAFT, REPORT_CONFLICTS, REPORT_FACTS, EXTRA_EVENTS, MANUAL_GAPS } from "../../data/tenant";

const snapshot = () =>
  createSnapshot({
    entities: ENTITIES,
    packs: ALL_PACKS,
    evidence: EVIDENCE,
    controls: CONTROLS,
    tests: CONTROL_TESTS,
    changes: REG_CHANGES,
    report: REPORT_DRAFT,
    conflicts: REPORT_CONFLICTS,
    facts: REPORT_FACTS,
    extraEvents: EXTRA_EVENTS,
    manualGaps: MANUAL_GAPS,
  });

test("ERC CoP applies to the ground-mounted solar plant and not to the listed parent", () => {
  const pack = ALL_PACKS.find((p) => p.id === "ERC-CoP-SOLAR-GROUND")!;
  const plant = evaluatePack(ENTITIES.find((e) => e.id === "lopburi-1")!, pack);
  const parent = evaluatePack(ENTITIES.find((e) => e.id === "lgp-pcl")!, pack);
  assert.equal(plant.applicable, true);
  assert.equal(plant.assumptions.length, 1);
  assert.equal(parent.applicable, false);
});

test("Pillar Two is monitored but not applicable below the EUR 750m threshold", () => {
  const pack = ALL_PACKS.find((p) => p.id === "TH-PILLAR-TWO")!;
  const r = evaluatePack(ENTITIES.find((e) => e.id === "lgp-pcl")!, pack);
  assert.equal(r.applicable, false);
  assert.equal(r.failed[0].id, "c1");
});

test("three-layer evidence score never counts a missing or invalid file as proof", () => {
  const items = EVIDENCE.filter((e) => e.entityId === "lopburi-1");
  const s = scoreEvidence(items);
  assert.ok(s.exists > s.valid || s.valid >= s.proves);
  assert.ok(s.proves <= s.valid && s.valid <= s.exists);
  assert.equal(evidenceGuard(items).pass, false);
});

test("snapshot wires register → gaps → preflight → next best action", () => {
  const s = snapshot();
  assert.ok(s.instances.length > 20);
  assert.ok(s.gaps.some((g) => g.source === "evidence" && g.severity === "material"));
  assert.equal(s.preflight.layers.length, 9);
  assert.equal(s.preflight.gate, 1);
  assert.equal(s.nba.route, "/evidence");
  const esgImpact = s.impacts.find((i) => i.change.id === "RC-2026-019")!;
  assert.equal(esgImpact.severity, "material");
  assert.deepEqual(esgImpact.entities, ["lgp-pcl"]);
});
