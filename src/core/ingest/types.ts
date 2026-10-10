/**
 * COP24-DI-001 — Smart Data Ingestion & AI Handoff Engine.
 * Entities follow the spec's §6 "Minimum Data Entities". Everything here is pure data so the
 * same records can live in IndexedDB (browser), a file store (local runner) or PostgreSQL.
 */
import type { LText } from "../types";

export type ReportKind = "preliminary" | "final" | "monitoring";
export type Phase = "pre-construction" | "construction" | "operation" | "decommissioning";

/* ───────── Parsed input (what a parser hands the engine) ───────── */

export interface ParsedPage {
  page: number;
  text: string;
  ocr?: boolean;
}

export interface ParsedTable {
  sheet: string;
  rows: (string | number | null)[][];
}

export interface ImageMeta {
  takenAt?: string; // ISO from EXIF; undefined = unknown (never generated)
  gps?: { lat: number; lon: number };
  width?: number;
  height?: number;
}

export interface ParsedDocument {
  fileName: string;
  path: string; // folder path inside an upload or ZIP
  mime: string;
  size: number;
  sha256: string;
  pages: ParsedPage[];
  tables: ParsedTable[];
  image?: ImageMeta;
  parseErrors: string[];
  sourceConnectionId: string;
}

/* ───────── §6 entities ───────── */

export interface SourceConnection {
  id: string;
  kind: "upload" | "zip" | "folder" | "google-drive" | "sharepoint" | "onedrive" | "email" | "upload-link" | "api";
  label: string;
  readOnly: true; // connectors are read-only by default (COP-DI-03)
  authorizedBy: string;
  authorizedAt: string;
  revokedAt?: string;
  tenantId: string;
}

export type DocCategory =
  | "licence"
  | "cop-report"
  | "site-plan"
  | "lab-report"
  | "measurement-air"
  | "measurement-water"
  | "measurement-noise"
  | "waste"
  | "ohs"
  | "maintenance"
  | "env-measures"
  | "community"
  | "photo"
  | "consultant-qualification"
  | "regulator-correspondence"
  | "regulation"
  | "other";

export interface Classification {
  category: DocCategory;
  score: number; // 0–1
  signals: string[]; // explainable: which cues fired
}

export interface Document {
  id: string; // permanent DOC- id
  tenantId: string;
  projectId: string;
  title: string;
  categories: Classification[]; // multi-label; [0] is primary
  copSubtype?: ReportKind; // when a COP report
  period?: { from?: string; to?: string; asOf?: string };
  issuer?: string;
  validUntil?: string;
  versions: DocumentVersion[];
  currentVersionId: string;
  supersededBy?: string;
  /** Three statuses that must stay distinguishable (COP-DI-13). */
  documentStatus: "active" | "superseded" | "duplicate" | "rejected" | "withdrawn";
  extractionStatus: "pending" | "extracted" | "partial" | "failed" | "needs-ocr";
  validationStatus: "unvalidated" | "valid" | "issues" | "invalid";
  ingestedBy: string;
  ingestedAt: string;
  /** First ~6,000 cleaned characters, for evidence mapping and checks (kept with the tenant data). */
  textSample?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  sha256: string;
  fileName: string;
  path: string;
  mime: string;
  size: number;
  pages: number;
  sourceConnectionId: string;
  receivedAt: string;
  ocr: boolean;
}

export type ValueState = "value" | "zero" | "not-detected" | "not-measured" | "not-provided" | "unclear";

export interface Locator {
  documentId: string;
  versionId: string;
  sha256: string;
  page?: number;
  line?: number;
  sheet?: string;
  cell?: string;
  excerpt: string;
}

export interface ExtractedField {
  id: string;
  key: string; // e.g. licence.number, capacity.ac, measurement.noise.leq24
  label: LText;
  raw: string; // exactly as read
  normalized?: string | number;
  unit?: string;
  state: ValueState;
  date?: string; // normalized ISO (CE)
  locator: Locator;
  method: string; // e.g. rule-extract@1, tesseract@7(tha+eng)+rule-extract@1
  confidence: Confidence;
  /** Correction history — original values are never overwritten (COP-DI-12). */
  corrections: Correction[];
}

export interface Correction {
  at: string;
  by: string;
  from: string | number | undefined;
  to: string | number | undefined;
  rationale: string;
}

/** COP-DI-12: separate indicators — confidence is not proof of compliance. */
export interface Confidence {
  extraction: number; // 0–1
  integrity: "ok" | "degraded" | "unknown"; // document integrity / reliability
  reconciliation: "consistent" | "conflict" | "single-source" | "unchecked";
  regulatory: "verified" | "unverified" | "failed";
  approval: "pending" | "approved" | "corrected" | "rejected" | "clarification";
}

export interface Measurement {
  id: string;
  fieldId: string;
  medium: "noise" | "air" | "water" | "soil" | "other";
  parameter: string; // canonical, e.g. Leq24, PM10, TSP, pH, BOD
  station?: string;
  date?: string;
  value: number | null;
  state: ValueState;
  unit?: string;
  detectionLimit?: number;
  method?: string;
  lab?: string;
  periodLabel: "current" | "historical";
  sourceDocumentId: string;
}

export interface EvidenceLink {
  id: string;
  evidenceTypeId: string; // checklist item type
  documentId: string;
  fieldIds: string[];
  obligationIds: string[];
  reportSections: string[];
  period: "current" | "historical" | "standing";
  status: "proposed" | "accepted" | "rejected";
  ruleVersion: string; // mapping is version-controlled
}

export type FindingLevel = "document" | "data" | "compliance";

export interface ValidationFinding {
  id: string;
  level: FindingLevel;
  code: string;
  severity: "critical" | "major" | "minor";
  title: LText;
  detail: LText;
  documentIds: string[];
  fieldIds: string[];
  evidenceTypeId?: string;
  status: "open" | "resolved" | "accepted-risk";
  /** AI may explain but never silently changes source data. */
  suggestedAction: LText;
}

/* ───────── Checklist & missing evidence (COP-DI-02, 09) ───────── */

export type ChecklistLevel = "mandatory" | "conditional" | "optional" | "not-applicable";
export type ItemStatus = "missing" | "received" | "needs-review" | "verified" | "historical-only" | "not-applicable";
export type NextAction = "ai-collect" | "request" | "verify" | "review" | "reuse" | "none";

export interface ChecklistItem {
  evidenceTypeId: string;
  label: LText;
  why: LText;
  clause: { sourceId: string; clause?: string };
  level: ChecklistLevel;
  naReason?: LText;
  status: ItemStatus;
  documentIds: string[];
  responsible: LText;
  period: { from: string; to: string } | "standing";
  nextAction: NextAction;
  reportSections: string[];
}

export interface MissingEvidence {
  id: string;
  evidenceTypeId: string;
  requirement: LText;
  reference: { sourceId: string; clause?: string };
  missing: LText;
  importance: "critical" | "high" | "medium";
  consequence: LText;
  owner: LText;
  deadline: string;
  collectionMethod: "reuse-prior" | "authorized-source" | "internal-request" | "supplier-request" | "declaration";
  recommendation: LText;
  status: "open" | "requested" | "received" | "resolved" | "unavailable";
  requestId?: string;
}

/* ───────── Requests & missions (COP-DI-10, 11) ───────── */

export interface DataRequest {
  id: string;
  missingId: string;
  recipient: { name: string; role: string; email?: string; external: boolean };
  language: "th" | "en";
  subject: string;
  body: string;
  deadline: string;
  uploadLink: { token: string; scope: string; expiresAt: string };
  status: "draft" | "awaiting-approval" | "approved" | "sent" | "responded" | "cancelled";
  approvedBy?: string;
  sentAt?: string;
  /** Approved and in scope, but no mailer delivered it yet — a person must send it (mailto) and mark it sent. */
  deliveryPending?: boolean;
}

export interface MissionAuthorization {
  sources: string[]; // SourceConnection ids
  recipients: string[]; // emails / role ids allowed
  externalActions: { sendRequests: "never" | "each-approval" | "pre-approved-internal" };
  spendLimitTHB: number;
  grantedBy: string;
  grantedAt: string;
  revokedAt?: string;
}

export type MissionStepKind =
  | "determine-report"
  | "discover-sources"
  | "plan-collection"
  | "identify-owners"
  | "collect-authorized"
  | "prepare-requests"
  | "send-approved-requests"
  | "track-responses"
  | "ingest-returned"
  | "validate"
  | "escalate"
  | "package";

export interface MissionStep {
  kind: MissionStepKind;
  title: LText;
  status: "pending" | "running" | "done" | "blocked" | "skipped" | "failed";
  detail?: LText;
  startedAt?: string;
  endedAt?: string;
  attempts: number;
}

export interface AgentMission {
  id: string;
  tenantId: string;
  projectId: string;
  instruction: string;
  target: { report: ReportKind; year: number; phase?: Phase };
  status: "planned" | "awaiting-authorization" | "running" | "paused" | "waiting-for-responses" | "completed" | "cancelled" | "failed";
  authorization?: MissionAuthorization;
  steps: MissionStep[];
  cursor: number; // checkpoint: next step index
  spentTHB: number;
  log: MissionLog[];
  createdAt: string;
  updatedAt: string;
  outcome?: LText;
}

export interface MissionLog {
  at: string;
  agent: string; // Discovery, Classification, Extraction, Validation, Collection, Exception, Report Handoff
  action: string;
  result: "ok" | "blocked" | "failed" | "info";
  detail?: string;
}

export interface Approval {
  id: string;
  subject: { kind: "field" | "request" | "mission" | "snapshot" | "na-item"; id: string };
  decision: "approve" | "reject" | "correct" | "clarify";
  by: string;
  at: string;
  rationale?: string;
}

/** Immutable, append-only (COP-DI-14). */
export interface AuditEvent {
  id: string;
  at: string;
  actor: string; // user id or agent name
  actorKind: "human" | "agent" | "system";
  action: string;
  object: string;
  detail?: string;
  result: "ok" | "rejected" | "failed";
}

/* ───────── Project master (COP-DI-01) ───────── */

export interface ProfileValue<T = string | number> {
  value?: T;
  status: "suggested" | "verified" | "conflict" | "unknown";
  sources: string[]; // field ids
  alternatives?: T[];
}

export interface ProjectMasterProfile {
  projectId: string;
  name: ProfileValue<string>;
  owner: ProfileValue<string>;
  location: ProfileValue<string>;
  coordinates: ProfileValue<string>;
  technology: ProfileValue<string>;
  capacityAcMW: ProfileValue<number>;
  capacityDcMWp: ProfileValue<number>;
  licenceNumber: ProfileValue<string>;
  licenceValidUntil: ProfileValue<string>;
  phase: ProfileValue<string>;
  framework: ProfileValue<string>;
  priorReports: { documentId: string; kind?: ReportKind; period?: string }[];
}

export interface IngestionJob {
  id: string;
  tenantId: string;
  projectId: string;
  sourceConnectionId: string;
  files: number;
  processed: number;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  endedAt?: string;
  checkpoint: string[]; // sha256s already processed (duplicate-safe resume)
  errors: string[];
}

/** Everything the engine knows about one project's data, for one reporting context. */
export interface IngestionState {
  tenantId: string;
  projectId: string;
  context: { report: ReportKind; year: number; phase: Phase; tech?: string; periodFrom: string; periodTo: string; dueDate: string };
  sources: SourceConnection[];
  documents: Document[];
  fields: ExtractedField[];
  measurements: Measurement[];
  links: EvidenceLink[];
  findings: ValidationFinding[];
  checklist: ChecklistItem[];
  missing: MissingEvidence[];
  requests: DataRequest[];
  missions: AgentMission[];
  approvals: Approval[];
  jobs: IngestionJob[];
  profile?: ProjectMasterProfile;
  audit: AuditEvent[];
  /** Approved report snapshots are immutable; new data creates proposed updates. */
  approvedSnapshots: { id: string; at: string; fieldIds: string[]; hash: string }[];
  proposedUpdates: { snapshotId: string; fieldIds: string[]; reason: string }[];
}
