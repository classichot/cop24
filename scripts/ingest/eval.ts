/**
 * Real-document regression for the ingestion engine (COP24-DI-001 §9).
 *
 *   npm run ingest:eval
 *
 * Runs the classifier and extractor over the real ERC files already extracted into the legal
 * corpus (corpus/text/*.json, local only). Every one is a regulation, blank form, guideline or
 * checklist — none is project evidence — so the engine must classify them as reference material
 * and must NOT produce a single measurement from them (limits are not results).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { classify } from "../../src/core/ingest/classify";
import { extract } from "../../src/core/ingest/extract";
import type { ParsedDocument } from "../../src/core/ingest/types";

const ROOT = resolve(import.meta.dirname, "../..");
const DIR = join(ROOT, "corpus/text");
if (!existsSync(DIR)) { console.log("corpus/text not found — run npm run corpus:ingest first"); process.exit(0); }

const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
let reference = 0, measurementsInvented = 0, checked = 0;
const rows: string[] = [];
for (const f of files) {
  const j = JSON.parse(readFileSync(join(DIR, f), "utf8")) as { source: { id: string; role?: string; type: string }; clauses: { page?: number; text: string }[] };
  if (j.source.role === "example") continue; // real project report: allowed to contain measurements
  const byPage = new Map<number, string[]>();
  for (const c of j.clauses) byPage.set(c.page ?? 1, [...(byPage.get(c.page ?? 1) ?? []), c.text]);
  const pages = [...byPage.entries()].sort((a, b) => a[0] - b[0]).map(([page, t]) => ({ page, text: t.join("\n") }));
  const doc: ParsedDocument = { fileName: `${j.source.id}.pdf`, path: j.source.id, mime: "application/pdf", size: 0, sha256: j.source.id.padEnd(64, "0"), pages, tables: [], parseErrors: [], sourceConnectionId: "eval" };
  const { labels } = classify(doc);
  const r = extract(doc, { documentId: `DOC-${j.source.id}`, versionId: "v1" }, labels.map((l) => l.category), 2026);
  const isRef = labels[0].category === "regulation";
  checked++;
  if (isRef) reference++;
  measurementsInvented += r.measurements.length;
  rows.push(`${r.measurements.length ? "✖" : "✔"} ${j.source.id.padEnd(40)} ${labels.slice(0, 2).map((l) => l.category).join(",").padEnd(32)} measurements=${r.measurements.length}${labels[0].signals.some((s) => s.startsWith("blank form")) ? " [template]" : ""}`);
}
console.log(rows.join("\n"));
console.log(`\n${checked} real ERC documents · ${reference} classified as regulation or blank form · ${measurementsInvented} measurement(s) extracted from limits/forms (must be 0)`);
process.exit(measurementsInvented ? 1 : 0);
