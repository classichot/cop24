/**
 * COP24 Legal Corpus — fetch official files listed in corpus/manifest.json.
 *
 *   npm run corpus:fetch                      in-force sources with a downloadUrl, ≤ 10 MB
 *   npm run corpus:fetch -- --all             include superseded sources
 *   npm run corpus:fetch -- --max-mb 50       raise the size cap
 *   npm run corpus:fetch -- --only a,b,c      only these source ids
 *   npm run corpus:fetch -- --dry             list what would be fetched
 *
 * Files land in corpus/inbox as `<sourceId>.<ext>` so the ingest step matches them by id.
 * Existing files are skipped. Only public URLs written in the manifest are fetched.
 */
import { existsSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import type { CorpusManifest, LegalSource } from "../../src/core/corpus";

const ROOT = resolve(import.meta.dirname, "../..");
const manifest = JSON.parse(readFileSync(join(ROOT, "corpus/manifest.json"), "utf8")) as CorpusManifest;
const inbox = join(ROOT, manifest.inbox);
const REFERENCE = join(ROOT, "corpus/reference");
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const ALL = args.includes("--all");
const maxMbArg = args.indexOf("--max-mb");
const MAX = (maxMbArg >= 0 ? Number(args[maxMbArg + 1]) : 10) * 1024 * 1024;
const onlyArg = args.indexOf("--only");
const ONLY = onlyArg >= 0 ? new Set(args[onlyArg + 1].split(",")) : null;

const want = (s: LegalSource) => !!s.downloadUrl && (ONLY ? ONLY.has(s.id) : ALL || s.inForce !== false);

async function main() {
  const list = manifest.sources.filter(want);
  let fetched = 0, skipped = 0, failed = 0, bytes = 0;
  for (const s of list) {
    const ext = extname(new URL(s.downloadUrl!).pathname).toLowerCase() || ".pdf";
    const dest = join(inbox, `${s.id}${ext}`);
    const inReference = existsSync(REFERENCE) && readdirSync(REFERENCE).some((f) => f === s.file || f.toLowerCase().startsWith(s.id.toLowerCase()));
    if (existsSync(dest) || inReference) { console.log(`= ${s.id}  (already on disk)`); skipped++; continue; }
    if (s.sizeBytes && s.sizeBytes > MAX) { console.log(`- ${s.id}  skipped: ${(s.sizeBytes / 1048576).toFixed(1)} MB > cap (use --max-mb)`); skipped++; continue; }
    if (DRY) { console.log(`~ ${s.id}  ${s.downloadUrl}`); continue; }
    try {
      const res = await fetch(s.downloadUrl!, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX) throw new Error(`${(buf.length / 1048576).toFixed(1)} MB exceeds cap`);
      writeFileSync(dest, buf);
      bytes += buf.length;
      fetched++;
      console.log(`+ ${s.id}  ${(buf.length / 1024).toFixed(0)} KB`);
    } catch (e) {
      failed++;
      console.error(`! ${s.id}  ${(e as Error).message}`);
    }
  }
  console.log(`\n${DRY ? "[dry run] " : ""}${list.length} candidate(s): ${fetched} fetched (${(bytes / 1048576).toFixed(1)} MB), ${skipped} skipped, ${failed} failed`);
}

main().catch((e) => { console.error(e); process.exit(1); });
