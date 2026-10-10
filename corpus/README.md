# COP24 Legal Corpus

The corpus is the authoritative text behind every rule pack. Obligations cite sources here;
the Regulation / Obligation Engine and the Report Agent quote from it instead of from memory.

```
corpus/
  manifest.json     the curated list of sources (id, title, authority, type, packs, expected file)
  inbox/            drop the files from the Google Drive "cop24 regulation" folder here (git-ignored)
  text/             extracted + chunked text per source, written by the ingest script (git-ignored
                    by default — commit it only if the texts are redistributable)
  index.json        what has been ingested: pages, chars, clauses, empty pages (OCR needed), hash
```

## Fetch

```bash
npm run corpus:fetch                 # in-force sources with a downloadUrl, ≤ 10 MB each
npm run corpus:fetch -- --all        # include repealed instruments
npm run corpus:fetch -- --only a,b   # specific source ids
```

## Ingest

```bash
npm run corpus:ingest            # ingest everything in corpus/inbox
npm run corpus:ingest -- --dry   # show what would be matched without writing
```

Matching rules, in order:

1. `manifest.sources[].file` equals the file name in the inbox.
2. The file name starts with the source `id` (e.g. `pdpa-2562 (official).pdf`).
3. Otherwise the file is listed as **unmatched** — add a `file` entry to the manifest.

Supported: `.pdf` (text layer), `.docx`, `.txt`, `.md`. Scanned PDFs without a text layer are
ingested with `emptyPages > 0` and the source is marked `needs-ocr`.

Chunking: Acts split on `มาตรา N`, regulations and notifications on `ข้อ N`, ERC report forms on
`ส่วนที่ N`, across the whole document and anchored to line starts (Thai numerals supported);
anything else falls back to paragraphs. Extraction repairs Thai PUA tone-mark glyphs and split SARA AM,
and flags PDFs whose text layer is unusable (no Unicode map) for OCR. Each clause gets a stable id `sourceId#label`, which is what an obligation's
`citations` entry points at.

## Google Drive

Export or sync the Drive folder into `corpus/inbox`. When the Drive connector has read access
the assistant can pull the folder listing and files directly and run the ingest.
