import type { LText } from "./types";

/**
 * Legal Corpus — the authoritative texts behind every rule pack.
 *
 * The corpus is the ground truth the Regulation / Obligation Engine cites.
 * `corpus/manifest.json` lists the sources (metadata, curated by hand);
 * `scripts/corpus/ingest.ts` extracts and chunks their text into
 * `corpus/text/<sourceId>.json` and summarises everything in `corpus/index.json`.
 * Obligations point at sources (and, when known, clauses) through `citations`.
 */

export type SourceType = "act" | "decree" | "regulation" | "notification" | "guideline" | "standard" | "form" | "other";
export type SourceStatus = "pending" | "ingested" | "needs-ocr" | "superseded";

export interface LegalSource {
  id: string;
  title: LText;
  shortTitle: LText;
  authority: LText;
  type: SourceType;
  domain: string;
  year: number; // CE
  effectiveFrom?: string;
  officialUrl?: string;
  /** File name expected in corpus/inbox (from the Google Drive "cop24 regulation" folder). */
  file?: string;
  packIds: string[];
  status: SourceStatus;
  /** false when the issuing authority marks the instrument repealed (ยกเลิก). */
  inForce?: boolean;
  /** Direct public file URL (official site); altUrls hold other formats (DOCX, XLSX). */
  downloadUrl?: string;
  altUrls?: string[];
  /** The listing page the file was found on. */
  sourcePage?: string;
  sizeBytes?: number;
  /** Plant technology a CoP checklist applies to (matches EntityProfile.plantTech). */
  tech?: string;
  /** ERC catalogue group id on erc.or.th (e.g. 2528 = CoP & CoP Monitor, in force). */
  ercGroup?: string;
  /** "law" (default) or "example" — a real report kept as a drafting reference, not a legal source. */
  role?: "law" | "example";
  notes?: LText;
}

export interface Clause {
  id: string; // `${sourceId}#${label}`
  sourceId: string;
  label: string; // "มาตรา 37", "ข้อ 12", "¶ 4"
  text: string;
  page?: number;
}

export interface CorpusIndexEntry {
  sourceId: string;
  file: string;
  ingestedAt: string;
  pages: number;
  chars: number;
  clauses: number;
  emptyPages: number; // pages with no extractable text → OCR needed
  /** Share of Thai base consonants followed by a tone/vowel mark; very low means the PDF font dropped marks. */
  thaiMarkRatio?: number;
  sha256: string;
}

export interface CorpusIndex {
  generatedAt: string;
  sources: Record<string, CorpusIndexEntry>;
}

export interface Citation {
  sourceId: string;
  clause?: string;
}

export interface CorpusManifest {
  version: number;
  inbox: string;
  sources: LegalSource[];
}

/** Coverage: which packs have every cited source ingested. */
export function packCoverage(manifest: CorpusManifest, index: CorpusIndex) {
  const byPack = new Map<string, { total: number; ingested: number; sources: LegalSource[] }>();
  for (const s of manifest.sources) {
    for (const p of s.packIds) {
      const row = byPack.get(p) ?? { total: 0, ingested: 0, sources: [] };
      row.total++;
      if (index.sources[s.id]) row.ingested++;
      row.sources.push(s);
      byPack.set(p, row);
    }
  }
  return byPack;
}

export function corpusStats(manifest: CorpusManifest, index: CorpusIndex) {
  const laws = manifest.sources.filter((s) => s.role !== "example");
  const total = laws.length;
  const ingested = laws.filter((s) => index.sources[s.id]).length;
  const needsOcr = Object.values(index.sources).filter((e) => e.emptyPages > 0).length;
  const clauses = Object.values(index.sources).reduce((n, e) => n + e.clauses, 0);
  const inForce = laws.filter((s) => s.inForce !== false).length;
  const examples = manifest.sources.length - laws.length;
  return { total, ingested, pending: total - ingested, needsOcr, clauses, inForce, superseded: total - inForce, examples };
}
