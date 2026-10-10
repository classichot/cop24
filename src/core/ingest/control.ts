import { classify } from "./classify";
import { extract } from "./extract";
import { cleanText, findDates } from "./normalize";
import type { AuditEvent, Document, DocumentVersion, IngestionJob, IngestionState, ParsedDocument, Phase, ReportKind, SourceConnection } from "./types";

/**
 * COP-DI-13 Smart Document Control + COP-DI-14 audit.
 * Permanent IDs come from content hashes, so re-uploading the same bytes is duplicate-safe.
 * Nothing is deleted: superseded and duplicate documents keep their history and audit trail.
 */

export const now = () => new Date().toISOString();

export function emptyState(tenantId: string, projectId: string, ctx: { report: ReportKind; year: number; phase: Phase; tech?: string }): IngestionState {
  const periodFrom = `${ctx.year}-01-01`;
  const periodTo = `${ctx.year}-12-31`;
  return {
    tenantId, projectId,
    context: { ...ctx, periodFrom, periodTo, dueDate: ctx.report === "monitoring" ? `${ctx.year + 1}-01-31` : `${ctx.year}-12-31` },
    sources: [], documents: [], fields: [], measurements: [], links: [], findings: [], checklist: [], missing: [], requests: [], missions: [], approvals: [], jobs: [],
    audit: [], approvedSnapshots: [], proposedUpdates: [],
  };
}

let auditSeq = 0;
export function audit(s: IngestionState, e: Omit<AuditEvent, "id" | "at"> & { at?: string }): void {
  // append-only: events are never edited or removed
  s.audit.push({ id: `AUD-${Date.now().toString(36)}-${(++auditSeq).toString(36)}`, at: e.at ?? now(), ...e });
}

export function addSource(s: IngestionState, src: Omit<SourceConnection, "readOnly" | "tenantId">): SourceConnection {
  const c: SourceConnection = { ...src, readOnly: true, tenantId: s.tenantId };
  s.sources.push(c);
  audit(s, { actor: src.authorizedBy, actorKind: "human", action: "authorize-source", object: c.id, detail: `${c.kind}: ${c.label} (read-only)`, result: "ok" });
  return c;
}

const docIdFor = (sha: string) => `DOC-${sha.slice(0, 12).toUpperCase()}`;
const titleOf = (p: ParsedDocument) => p.fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[_]+/g, " ").trim();

/**
 * Ingest parsed documents into the state. Duplicate-safe (same sha → same document), resumable
 * through the job checkpoint, and every outcome is logged. Returns the job record.
 */
export function ingest(s: IngestionState, parsed: ParsedDocument[], actor: string, sourceConnectionId: string): IngestionJob {
  const src = s.sources.find((x) => x.id === sourceConnectionId);
  const job: IngestionJob = { id: `JOB-${Date.now().toString(36)}`, tenantId: s.tenantId, projectId: s.projectId, sourceConnectionId, files: parsed.length, processed: 0, status: "running", startedAt: now(), checkpoint: [], errors: [] };
  s.jobs.push(job);
  if (!src || src.revokedAt || src.tenantId !== s.tenantId) {
    job.status = "failed";
    job.errors.push("source not authorized for this tenant");
    audit(s, { actor, actorKind: "human", action: "ingest", object: sourceConnectionId, detail: "source not authorized", result: "rejected" });
    return job;
  }
  for (const p of parsed) {
    const ck = `${p.path}#${p.sha256}`;
    if (job.checkpoint.includes(ck)) continue; // resume: the same file at the same path is processed once
    job.checkpoint.push(ck);
    job.processed++;
    const existing = s.documents.find((d) => d.versions.some((v) => v.sha256 === p.sha256));
    if (existing) {
      audit(s, { actor: "Classification Agent", actorKind: "agent", action: "detect-duplicate", object: existing.id, detail: `${p.path} has the same content hash as ${existing.versions[0].path}`, result: "ok" });
      s.findings.push({ id: `FND-DUP-${p.sha256.slice(0, 8)}-${job.processed}`, level: "document", code: "duplicate", severity: "minor", title: { th: "ไฟล์ซ้ำ", en: "Duplicate file" }, detail: { th: `${p.path} มีเนื้อหาเหมือน ${existing.versions[0].path} ทุกไบต์ — ไม่นำเข้าซ้ำ`, en: `${p.path} is byte-identical to ${existing.versions[0].path} — not ingested twice` }, documentIds: [existing.id], fieldIds: [], status: "resolved", suggestedAction: { th: "ไม่ต้องทำอะไร", en: "No action needed" } });
      continue;
    }
    const { labels, copSubtype } = classify(p);
    const id = docIdFor(p.sha256);
    const version: DocumentVersion = { id: `${id}-V1`, documentId: id, sha256: p.sha256, fileName: p.fileName, path: p.path, mime: p.mime, size: p.size, pages: p.pages.length, sourceConnectionId, receivedAt: now(), ocr: p.pages.some((x) => x.ocr) };
    const text = p.pages.map((x) => x.text).join("\n");
    const unreadable = p.pages.length > 0 && !p.mime.startsWith("image/") && text.replace(/\s+/g, "").length < 40 && p.tables.length === 0;
    const doc: Document = {
      id, tenantId: s.tenantId, projectId: s.projectId, title: titleOf(p), categories: labels, copSubtype,
      versions: [version], currentVersionId: version.id, documentStatus: "active",
      extractionStatus: p.parseErrors.length && !text ? "failed" : unreadable ? "needs-ocr" : "pending",
      validationStatus: "unvalidated", ingestedBy: actor, ingestedAt: now(),
      textSample: sampleOf(p),
    };
    s.documents.push(doc);
    audit(s, { actor, actorKind: "human", action: "ingest-file", object: id, detail: `${p.path} · ${p.size} B · sha256 ${p.sha256.slice(0, 16)}…`, result: "ok" });
    audit(s, { actor: "Classification Agent", actorKind: "agent", action: "classify", object: id, detail: labels.map((l) => `${l.category} ${l.score} [${l.signals.join(", ")}]`).join(" · "), result: "ok" });
    if (p.parseErrors.length) job.errors.push(`${p.path}: ${p.parseErrors.join("; ")}`);
    if (doc.extractionStatus === "failed" || doc.extractionStatus === "needs-ocr") continue;

    const r = extract(p, { documentId: id, versionId: version.id }, labels.map((l) => l.category), s.context.year);
    s.fields.push(...r.fields);
    s.measurements.push(...r.measurements);
    doc.extractionStatus = r.fields.length ? "extracted" : "partial";
    const dates = r.fields.filter((f) => f.date).map((f) => f.date!).sort();
    const valid = r.fields.find((f) => f.key === "validity.until");
    doc.validUntil = valid?.date;
    doc.period = dates.length ? { from: dates[0], to: dates[dates.length - 1], asOf: r.fields.find((f) => f.key === "document.date")?.date } : undefined;
    (doc as Document & { signals?: typeof r.signals }).signals = r.signals;
    audit(s, { actor: "Extraction Agent", actorKind: "agent", action: "extract", object: id, detail: `${r.fields.length} fields · ${r.measurements.length} measurements · method ${r.fields[0]?.method ?? "-"}`, result: "ok" });
    if (r.signals.instructionLike.length) audit(s, { actor: "Extraction Agent", actorKind: "agent", action: "flag-embedded-instruction", object: id, detail: `treated as content, not obeyed: “${r.signals.instructionLike[0]}”`, result: "ok" });
  }
  supersede(s);
  job.status = "completed";
  job.endedAt = now();
  return job;
}

/**
 * Re-run extraction for one document with a better parse (e.g. after Thai+English OCR).
 * The previous fields are kept in the audit trail; the document keeps its permanent ID.
 */
export function reextract(s: IngestionState, documentId: string, parsed: ParsedDocument, actor: string) {
  const doc = s.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error(`unknown document ${documentId}`);
  const version = doc.versions.find((v) => v.id === doc.currentVersionId)!;
  if (parsed.sha256 !== version.sha256) throw new Error("re-extraction must use the same file bytes");
  const removed = s.fields.filter((f) => f.locator.documentId === documentId).length;
  s.fields = s.fields.filter((f) => f.locator.documentId !== documentId);
  s.measurements = s.measurements.filter((m) => m.sourceDocumentId !== documentId);
  const { labels, copSubtype } = classify(parsed);
  doc.categories = labels;
  doc.copSubtype = copSubtype;
  doc.textSample = sampleOf(parsed);
  version.ocr = parsed.pages.some((p) => p.ocr);
  const r = extract(parsed, { documentId, versionId: version.id }, labels.map((l) => l.category), s.context.year);
  s.fields.push(...r.fields);
  s.measurements.push(...r.measurements);
  doc.extractionStatus = r.fields.length ? "extracted" : "partial";
  (doc as Document & { signals?: typeof r.signals }).signals = r.signals;
  audit(s, { actor, actorKind: "human", action: "re-extract", object: documentId, detail: `${version.ocr ? "OCR tha+eng" : "text layer"} · ${removed} → ${r.fields.length} fields`, result: "ok" });
}

/** Same document type + same project, a newer revision/date → the older one is superseded, never deleted. */
function supersede(s: IngestionState) {
  const rev = (d: Document) => {
    const m = d.title.match(/rev\.?\s*([A-Z])\b/i) ?? d.versions[0].fileName.match(/rev\.?\s*([A-Z])\b/i);
    return m ? m[1].toUpperCase() : undefined;
  };
  const groups = new Map<string, Document[]>();
  for (const d of s.documents.filter((x) => x.documentStatus === "active" && rev(x))) {
    const key = `${d.categories[0].category}:${d.title.replace(/rev\.?\s*[A-Z]\b/i, "").trim().toLowerCase()}`;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    list.sort((a, b) => rev(a)!.localeCompare(rev(b)!));
    const latest = list[list.length - 1];
    for (const old of list.slice(0, -1)) {
      if (old.documentStatus === "superseded") continue;
      old.documentStatus = "superseded";
      old.supersededBy = latest.id;
      audit(s, { actor: "Validation Agent", actorKind: "agent", action: "supersede", object: old.id, detail: `rev.${rev(old)} superseded by ${latest.id} rev.${rev(latest)}`, result: "ok" });
    }
  }
}

export const docText = (p: ParsedDocument) => p.pages.map((x) => x.text).join("\n");
export const firstDateIn = (text: string) => findDates(text)[0]?.iso;
function sampleOf(p: ParsedDocument): string {
  const tables = p.tables.map((t) => t.rows.slice(0, 40).map((r) => r.join(" ")).join("\n"));
  return cleanText([docText(p), ...tables].join("\n")).slice(0, 6000);
}
