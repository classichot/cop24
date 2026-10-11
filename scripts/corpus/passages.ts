/**
 * Build the committed passage index Paul searches for legal answers.
 *
 *   npm run corpus:passages
 *
 * Reads the locally extracted corpus (corpus/text/*.json, git-ignored), keeps in-force legal
 * sources only (no example reports), collapses whitespace, splits clauses into ~900-character
 * passages on line boundaries and de-duplicates passages that repeat across technology
 * checklists. Thai statutes, regulations and official notifications are not copyright works
 * (Copyright Act B.E. 2537 s.7), so the official text can be bundled.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const TEXT = join(ROOT, "corpus/text");
const OUT = join(ROOT, "corpus/passages.json");
const MAX = 900;

interface Manifest { sources: { id: string; title: { th: string; en: string }; shortTitle?: { th: string; en: string }; type: string; year?: number; inForce?: boolean; officialUrl?: string; role?: string }[] }
const manifest = JSON.parse(readFileSync(join(ROOT, "corpus/manifest.json"), "utf8")) as Manifest;
const meta = new Map(manifest.sources.map((s) => [s.id, s]));

if (!existsSync(TEXT)) { console.error("corpus/text not found — run npm run corpus:ingest first"); process.exit(1); }

const clean = (s: string) => s.replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{2,}/g, "\n").trim();

function chunk(text: string): string[] {
  const lines = text.split("\n");
  const out: string[] = [];
  let cur = "";
  for (const line of lines) {
    if (line.length > MAX) {
      if (cur) { out.push(cur); cur = ""; }
      for (let i = 0; i < line.length; i += MAX) out.push(line.slice(i, i + MAX));
      continue;
    }
    if ((cur + "\n" + line).length > MAX && cur) { out.push(cur); cur = line; }
    else cur = cur ? cur + "\n" + line : line;
  }
  if (cur) out.push(cur);
  return out.filter((p) => p.replace(/\s/g, "").length >= 40);
}

const seen = new Map<string, { s: string[] }>();
const passages: { id: string; s: string[]; l: string; p?: number; t: string }[] = [];
const sources: Record<string, { th: string; en: string; short: { th: string; en: string }; type: string; year?: number; url?: string }> = {};

for (const f of readdirSync(TEXT).filter((x) => x.endsWith(".json")).sort()) {
  const j = JSON.parse(readFileSync(join(TEXT, f), "utf8")) as { source: { id: string; role?: string }; clauses: { label: string; text: string; page?: number }[] };
  const m = meta.get(j.source.id);
  if (!m || m.inForce === false || j.source.role === "example") continue;
  sources[m.id] = { th: m.title.th, en: m.title.en, short: m.shortTitle ?? m.title, type: m.type, year: m.year, url: m.officialUrl };
  let n = 0;
  for (const c of j.clauses) {
    for (const t of chunk(clean(c.text))) {
      const key = createHash("sha1").update(t.replace(/\s/g, "")).digest("hex");
      const dup = seen.get(key);
      if (dup) { if (!dup.s.includes(m.id)) dup.s.push(m.id); continue; }
      const p = { id: `${m.id}#${++n}`, s: [m.id], l: c.label, p: c.page, t };
      seen.set(key, p);
      passages.push(p);
    }
  }
}

writeFileSync(OUT, JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), sources, passages }));
const chars = passages.reduce((a, p) => a + p.t.length, 0);
console.log(`${Object.keys(sources).length} sources · ${passages.length} passages · ${chars.toLocaleString()} chars → corpus/passages.json`);
