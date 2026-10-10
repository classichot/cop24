import { t } from "../i18n-text";
import type { ReportInput } from "../report/assess";
import type { Claim, ContractField, Metric, ReportBrief, ReportEvidence, SourceRecord } from "../report/types";
import { ERC_COP_SOLAR_FARM_PACK } from "../../packs/report/erc-cop-report-pack";
import type { IngestionState } from "./types";

/**
 * COP-DI-15 — feed 24ReportCore. One-Click Report and Report Studio both read this single
 * structured evidence store. Missing evidence becomes a disclosed gap claim, never prose that
 * describes work as done.
 */
export function toReportInput(s: IngestionState, brief: ReportBrief): ReportInput {
  const pack = ERC_COP_SOLAR_FARM_PACK;
  const docs = s.documents.filter((d) => d.documentStatus === "active");

  const sources: SourceRecord[] = docs.map((d) => {
    const v = d.versions.find((x) => x.id === d.currentVersionId)!;
    const standing = d.categories.some((c) => ["licence", "site-plan", "consultant-qualification", "regulation"].includes(c.category));
    return {
      id: d.id, title: { th: d.title, en: d.title }, owner: { th: d.issuer ?? "—", en: d.issuer ?? "—" }, kind: v.mime.includes("sheet") || v.mime.includes("csv") ? "spreadsheet" : "pdf",
      location: `ingest://${s.tenantId}/${s.projectId}/${v.path}`, version: v.sha256.slice(0, 16), retrievedAt: v.receivedAt, entityId: s.projectId,
      period: standing ? undefined : d.period?.to?.slice(0, 4), tenantId: s.tenantId, access: "tenant",
      reviewStatus: d.validationStatus === "invalid" ? "rejected" : d.validationStatus === "valid" ? "reviewed" : "pending",
      snapshot: { retained: true, ref: `object-store/${v.sha256}` },
      extractionIssues: v.ocr ? [t("ข้อความมาจาก OCR — ต้องตรวจกับต้นฉบับ", "Text came from OCR — check against the original")] : undefined,
    };
  });

  const fields = s.fields.filter((f) => docs.some((d) => d.id === f.locator.documentId));
  const evidence: ReportEvidence[] = fields.map((f) => ({
    id: f.id, excerpt: f.locator.excerpt, extractionMethod: f.method.startsWith("tesseract") ? "ocr" : f.locator.cell ? "structured" : "text-layer",
    reviewResult: f.confidence.approval === "approved" || f.confidence.approval === "corrected" ? "accepted" : f.confidence.approval === "rejected" ? "rejected" : "pending",
    locator: { sourceId: f.locator.documentId, sourceVersion: f.locator.sha256.slice(0, 16), page: f.locator.page, sheet: f.locator.sheet, cell: f.locator.cell, passage: f.raw },
  }));

  const metrics: Metric[] = [];
  const cap = fields.find((f) => f.key === "capacity.ac" && f.state === "value");
  if (cap) metrics.push({ id: `M-${cap.id}`, label: t("กำลังผลิตติดตั้ง", "Installed capacity"), value: Number(cap.normalized), valueState: "value", unit: "MW", period: String(s.context.year), boundary: s.projectId, method: { id: "sum", version: "1" }, inputs: [cap.id], precision: 1 });
  const dc = fields.find((f) => f.key === "capacity.dc" && f.state === "value");
  metrics.push({ id: "M-CAP-DC", key: "capacity.dc", label: t("กำลังผลิตแผงรวม", "Total panel capacity"), value: dc ? Number(dc.normalized) : null, valueState: dc ? "value" : "unknown", unit: "MWp", period: String(s.context.year), boundary: s.projectId, method: { id: "sum", version: "1" }, inputs: dc ? [dc.id] : [], precision: 3 });
  const noiseDocs = s.links.filter((l) => l.evidenceTypeId === "ET-NOISE-BASELINE" && l.period !== "historical").map((l) => l.documentId);
  const noise = s.measurements.filter((m) => noiseDocs.includes(m.sourceDocumentId) && m.medium === "noise");
  metrics.push({ id: "M-NOISE-DAYS", key: "noise.baseline.days", label: t("จำนวนวันตรวจวัดเสียง", "Noise-monitoring days"), value: noise.length ? new Set(noise.map((m) => m.date).filter(Boolean)).size : null, valueState: noise.length ? "value" : "unknown", unit: "วัน", period: String(s.context.year), boundary: s.projectId, method: { id: "sum", version: "1" }, inputs: noise.map((m) => m.fieldId), precision: 0 });
  metrics.push({ id: "M-NOISE-STATIONS", key: "noise.baseline.stations", label: t("จำนวนสถานีตรวจวัดเสียง", "Noise stations"), value: noise.length ? new Set(noise.map((m) => m.station).filter(Boolean)).size : null, valueState: noise.length ? "value" : "unknown", unit: "สถานี", period: String(s.context.year), boundary: s.projectId, method: { id: "sum", version: "1" }, inputs: noise.map((m) => m.fieldId), precision: 0 });

  // claims: one per checklist item — sourced fact when evidence exists, disclosed gap when not
  const claims: Claim[] = s.checklist.filter((c) => c.level === "mandatory" || c.level === "conditional").map((c, i) => {
    const linked = s.links.filter((l) => l.evidenceTypeId === c.evidenceTypeId && l.period !== "historical");
    const ev = linked.flatMap((l) => l.fieldIds).slice(0, 3);
    if (!ev.length) return { id: `CL-${c.evidenceTypeId}`, revision: 1, sectionId: c.reportSections[0] ?? "body", paragraph: i + 1, text: t(`ยังไม่มีหลักฐาน: ${c.label.th}`, `No evidence yet: ${c.label.en}`), type: "gap", evidenceIds: [], metricIds: [], supportStatus: "pending" } as Claim;
    return { id: `CL-${c.evidenceTypeId}`, revision: 1, sectionId: c.reportSections[0] ?? "body", paragraph: i + 1, text: t(`มีหลักฐาน: ${c.label.th}`, `Evidence held: ${c.label.en}`), type: "sourced-fact", evidenceIds: ev, metricIds: [], supportStatus: "pending" } as Claim;
  });

  const contractFields: ContractField[] = fields.map((f) => ({
    key: f.id, label: f.label, category: "company-record", entityId: s.projectId, tenantId: s.tenantId, period: f.date ?? String(s.context.year),
    valueState: f.state === "value" ? "value" : f.state === "zero" ? "zero" : f.state === "not-provided" ? "unavailable" : "unknown",
    value: typeof f.normalized === "number" || typeof f.normalized === "string" ? f.normalized : undefined, unit: f.unit, sourceRef: f.locator.documentId, sourceVersion: f.locator.sha256.slice(0, 16),
    validation: f.confidence.approval === "approved" || f.confidence.approval === "corrected" ? "validated" : f.confidence.approval === "rejected" ? "failed" : "pending", approvedUse: [pack.id],
  }));

  const links = pack.requirements.map((r) => ({
    requirementId: r.id,
    claimIds: claims.filter((c) => r.source.clause && s.checklist.find((x) => `CL-${x.evidenceTypeId}` === c.id)?.clause.clause === r.source.clause).map((c) => c.id),
    evidenceIds: [],
  }));

  return {
    brief, pack, tech: s.context.tech ?? (s.profile?.technology.value as string | undefined),
    scope: { tenantId: s.tenantId, entityId: s.projectId, periodFrom: s.context.periodFrom, periodTo: s.context.periodTo, packId: pack.id, estimatesPermitted: false, demoMode: false },
    fields: contractFields, sources, evidence, metrics,
    conflictPairs: [], claims, links, rules: [], sections: s.checklist.map((c) => ({ id: c.evidenceTypeId, text: c.status })),
    editorial: [], rubricCalibrated: false, approvals: [], exportCheck: { checked: false, passed: false, issues: [] }, owners: {},
  };
}
