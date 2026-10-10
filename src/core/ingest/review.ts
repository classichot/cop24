import { hashOf } from "../report/hash";
import { audit, now } from "./control";
import type { IngestionState } from "./types";

/**
 * COP-DI-12 review decisions and COP-DI-14 lineage.
 * Corrections keep the original extracted value, editor, timestamp and rationale.
 */
export function reviewField(s: IngestionState, fieldId: string, decision: "approve" | "correct" | "reject" | "clarify", by: string, opts: { value?: string | number; rationale?: string } = {}) {
  const f = s.fields.find((x) => x.id === fieldId);
  if (!f) throw new Error(`unknown field ${fieldId}`);
  if (decision === "correct") {
    if (!opts.rationale) throw new Error("a correction needs a rationale");
    f.corrections.push({ at: now(), by, from: f.normalized, to: opts.value, rationale: opts.rationale });
    f.normalized = opts.value; // raw stays untouched
    f.confidence.approval = "corrected";
  } else f.confidence.approval = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "clarification";
  if (decision === "approve" || decision === "correct") f.confidence.regulatory = f.confidence.regulatory === "failed" ? "failed" : "verified";
  s.approvals.push({ id: `APR-${s.approvals.length + 1}`, subject: { kind: "field", id: fieldId }, decision, by, at: now(), rationale: opts.rationale });
  audit(s, { actor: by, actorKind: "human", action: `field-${decision}`, object: fieldId, detail: opts.rationale, result: "ok" });
}

export function acceptLink(s: IngestionState, linkId: string, by: string, accept = true) {
  const l = s.links.find((x) => x.id === linkId);
  if (!l) throw new Error(`unknown link ${linkId}`);
  l.status = accept ? "accepted" : "rejected";
  audit(s, { actor: by, actorKind: "human", action: accept ? "accept-evidence" : "reject-evidence", object: linkId, result: "ok" });
}

/** Approved report snapshots are immutable; later ingestion only creates proposed updates. */
export function approveSnapshot(s: IngestionState, by: string) {
  const fieldIds = s.fields.filter((f) => s.links.some((l) => l.status === "accepted" && l.fieldIds.includes(f.id))).map((f) => f.id);
  const snap = { id: `SNP-${s.approvedSnapshots.length + 1}`, at: now(), fieldIds, hash: hashOf(fieldIds.map((id) => [id, s.fields.find((f) => f.id === id)!.normalized])) };
  s.approvedSnapshots.push(Object.freeze(snap) as typeof snap);
  audit(s, { actor: by, actorKind: "human", action: "approve-snapshot", object: snap.id, detail: `${fieldIds.length} fields · #${snap.hash}`, result: "ok" });
  return snap;
}

/** Report statement → field → evidence → file/page/cell → source and history. */
export function trace(s: IngestionState, fieldId: string) {
  const f = s.fields.find((x) => x.id === fieldId);
  if (!f) return undefined;
  const doc = s.documents.find((d) => d.id === f.locator.documentId)!;
  const version = doc.versions.find((v) => v.id === f.locator.versionId)!;
  const source = s.sources.find((x) => x.id === version.sourceConnectionId);
  const links = s.links.filter((l) => l.fieldIds.includes(fieldId));
  const history = s.audit.filter((a) => a.object === fieldId || a.object === doc.id);
  return { field: f, evidence: links, document: doc, version, location: f.locator, source, history };
}
