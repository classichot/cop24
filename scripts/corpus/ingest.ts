/**
 * COP24 Legal Corpus — ingest.
 *
 *   npm run corpus:ingest              ingest new or changed files in corpus/inbox and corpus/reference
 *   npm run corpus:ingest -- --force   re-ingest everything
 *   npm run corpus:check               dry run: show matches, write nothing
 *
 * Reads corpus/manifest.json, matches files to sources, extracts text (PDF text layer, DOCX,
 * TXT/MD), repairs known Thai PDF defects, chunks it into clauses and writes
 * corpus/text/<sourceId>.json plus corpus/index.json.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, extname, basename, resolve } from "node:path";
import type { CorpusIndex, CorpusIndexEntry, CorpusManifest, LegalSource } from "../../src/core/corpus";
import { chunkClauses, normalizeThai, thaiMarkRatio } from "../../src/core/corpus-text";

const ROOT = resolve(import.meta.dirname, "../..");
const MANIFEST = join(ROOT, "corpus/manifest.json");
const INDEX = join(ROOT, "corpus/index.json");
const TEXT_DIR = join(ROOT, "corpus/text");
const REFERENCE = join(ROOT, "corpus/reference");
const DRY = process.argv.includes("--dry");
const FORCE = process.argv.includes("--force");

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as CorpusManifest;
const inbox = join(ROOT, manifest.inbox);
const index: CorpusIndex = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, "utf8")) : { generatedAt: "", sources: {} };

type TextItem = { str: string; transform: number[] };
type PageData = { getTextContent: (o?: object) => Promise<{ items: TextItem[] }> };

async function extractPages(file: string): Promise<string[]> {
  const ext = extname(file).toLowerCase();
  const buf = readFileSync(file);
  if (ext === ".pdf") {
    // pdf-parse v1: import the lib entry directly to skip its debug self-test on load
    const mod = await import("pdf-parse/lib/pdf-parse.js");
    const pdf = (mod.default ?? mod) as (b: Buffer, o?: Record<string, unknown>) => Promise<{ numpages: number; text: string }>;
    const pages: string[] = [];
    // Rebuild line breaks from each text run's y-coordinate so headings start lines and paragraphs survive.
    const pagerender = async (pageData: PageData) => {
      const tc = await pageData.getTextContent({ normalizeWhitespace: true });
      let lastY: number | null = null;
      let t = "";
      for (const it of tc.items) {
        const y = it.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 2) t += Math.abs(y - lastY) > 18 ? "\n\n" : "\n";
        t += it.str;
        lastY = y;
      }
      pages.push(normalizeThai(t));
      return t;
    };
    await pdf(buf, { pagerender });
    return pages;
  }
  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ buffer: buf });
    return [normalizeThai(r.value)];
  }
  if (ext === ".txt" || ext === ".md") return [buf.toString("utf8")];
  throw new Error(`unsupported file type: ${ext}`);
}

function matchSource(fileName: string): LegalSource | undefined {
  const base = basename(fileName);
  return manifest.sources.find((s) => s.file === base) ?? manifest.sources.find((s) => base.toLowerCase().startsWith(s.id.toLowerCase()));
}

async function main() {
  if (!existsSync(inbox)) {
    console.error(`inbox not found: ${inbox}`);
    process.exit(1);
  }
  const list = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => !f.startsWith(".") && statSync(join(dir, f)).isFile()).map((f) => ({ f, dir })) : []);
  const files = [...list(inbox), ...list(REFERENCE)];
  console.log(`${DRY ? "[dry run] " : ""}${files.length} file(s) in ${manifest.inbox} + corpus/reference, ${manifest.sources.length} source(s) in manifest\n`);
  const unmatched: string[] = [];
  let ingested = 0;
  for (const { f, dir } of files) {
    const src = matchSource(f);
    if (!src) { unmatched.push(f); continue; }
    const path = join(dir, f);
    const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
    const prev = index.sources[src.id];
    if (prev && prev.sha256 === sha256 && !DRY && !FORCE) { console.log(`= ${src.id}  (unchanged)  ${f}`); continue; }
    try {
      const pages = await extractPages(path);
      const all = pages.join("");
      const emptyPages = pages.filter((p) => p.replace(/\s+/g, "").length < 20).length;
      const clauses = chunkClauses(src.id, src.type, pages);
      const ratio = thaiMarkRatio(all);
      const lowMarks = ratio !== undefined && ratio < 0.03;
      const structured = clauses.filter((c) => !c.label.startsWith("¶") && c.label !== "preamble").length;
      const entry: CorpusIndexEntry = { sourceId: src.id, file: f, ingestedAt: new Date().toISOString(), pages: pages.length, chars: all.length, clauses: clauses.length, emptyPages, thaiMarkRatio: ratio, sha256 };
      console.log(`${DRY ? "~" : "+"} ${src.id}  ${f}\n    pages ${entry.pages} · chars ${entry.chars} · clauses ${entry.clauses} (${structured} numbered)${emptyPages ? ` · ${emptyPages} empty page(s) → OCR needed` : ""}${lowMarks ? ` · text layer unusable (Thai mark ratio ${ratio}; font has no Unicode map) → OCR before quoting` : ""}`);
      if (!DRY) {
        writeFileSync(join(TEXT_DIR, `${src.id}.json`), JSON.stringify({ source: src, entry, clauses }, null, 2));
        index.sources[src.id] = entry;
        src.status = (emptyPages > 0 && emptyPages >= pages.length / 2) || lowMarks ? "needs-ocr" : "ingested";
        src.file = f;
        ingested++;
      }
    } catch (e) {
      console.error(`! ${src.id}  ${f}: ${(e as Error).message}`);
    }
  }
  if (unmatched.length) {
    console.log(`\nunmatched (add a "file" entry in corpus/manifest.json):`);
    for (const u of unmatched) console.log(`  ? ${u}`);
  }
  const pending = manifest.sources.filter((s) => !index.sources[s.id] && s.inForce !== false && s.role !== "example");
  if (pending.length) {
    console.log(`\nstill pending (${pending.length}):`);
    for (const s of pending) console.log(`  - ${s.id}  ${s.title.en}`);
  }
  if (!DRY) {
    index.generatedAt = new Date().toISOString();
    writeFileSync(INDEX, JSON.stringify(index, null, 2) + "\n");
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`\nwrote corpus/index.json (${ingested} ingested this run, ${Object.keys(index.sources).length} total)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
