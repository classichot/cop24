import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
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

test("the Legal Corpus screen lists COP24's sources only — other 24 apps' rules stay in those apps", () => {
  const manifest = JSON.parse(readFileSync(join(resolve(import.meta.dirname, "../../.."), "corpus/manifest.json"), "utf8")) as { sources: { id: string; packIds: string[] }[] };
  const appOf = (pid: string) => ALL_PACKS.find((p) => p.id === pid)?.app;
  const mine = manifest.sources.filter((s) => s.packIds.length === 0 || s.packIds.some((p) => appOf(p) === "cop24"));
  const others = manifest.sources.filter((s) => !mine.includes(s));
  assert.ok(others.length > 0 && others.every((s) => s.packIds.every((p) => appOf(p) !== "cop24")));
  assert.ok(!mine.some((s) => s.id.startsWith("sec-") || s.id === "tfrs-s1-s2" || s.id === "tgo-cfo-guideline"), "ESG24 sources are not COP24's");
  const page = readFileSync(join(resolve(import.meta.dirname, "../../.."), "src/app/corpus/page.tsx"), "utf8");
  assert.match(page, /const APP = "cop24";/);
  assert.match(page, /fullManifest\.sources\.filter\(isMine\)/, "the table, counts and coverage come from COP24's sources");
  assert.match(page, /myPacks\.map\(/, "pack coverage shows COP24 packs only");
});
