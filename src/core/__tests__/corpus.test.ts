import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_PACKS } from "../../packs";
import { corpusStats, packCoverage, type CorpusIndex, type CorpusManifest } from "../corpus";

const root = join(import.meta.dirname, "../../..");
const manifest = JSON.parse(readFileSync(join(root, "corpus/manifest.json"), "utf8")) as CorpusManifest;
const index = JSON.parse(readFileSync(join(root, "corpus/index.json"), "utf8")) as CorpusIndex;
const ids = new Set(manifest.sources.map((s) => s.id));

test("manifest source ids are unique", () => {
  assert.equal(ids.size, manifest.sources.length);
});

test("every obligation cites at least one source that exists in the manifest", () => {
  for (const p of ALL_PACKS) {
    for (const o of p.obligations) {
      assert.ok(o.citations?.length, `${o.id} has no citation`);
      for (const c of o.citations!) assert.ok(ids.has(c.sourceId), `${o.id} cites unknown source ${c.sourceId}`);
    }
  }
});

test("every installed pack is backed by at least one corpus source", () => {
  const cov = packCoverage(manifest, index);
  for (const p of ALL_PACKS) assert.ok(cov.get(p.id)?.total, `${p.id} has no corpus source`);
});

test("corpus stats add up", () => {
  const s = corpusStats(manifest, index);
  assert.equal(s.ingested + s.pending, s.total);
});
