/**
 * 24 Series Report Generation Quality Standard — Draft v1.0 (10 Oct 2026), implemented as
 * the shared COP24 Report Engine. Section numbers in comments refer to that standard
 * (docs/standards/24-series-report-generation-quality-standard-v1.0.md).
 *
 * Every 24 app (ESG24, TP24, GMT24, CFO24, ACC24, MAR24, COP24) uses these records; a
 * report pack adds content and checks but cannot remove the shared controls (§1, §9).
 */
import type { AppId, Lang, LText } from "../types";

/* ───────────── §3 Report brief and pack ───────────── */

export type ReportStage = "preliminary" | "final" | "monitoring";

export interface ReportBrief {
  id: string;
  version: number;
  app: AppId;
  packId: string;
  packVersion: string;
  reportType: string;
  stage?: ReportStage;
  purpose: LText;
  audience: LText; // authority or reader
  jurisdiction: string;
  entityId: string;
  boundary: LText; // entity / consolidation boundary
  period: { from: string; to: string; cutoff: string };
  language: Lang;
  languages: Lang[];
  currency?: string;
  units: Record<string, string>; // e.g. capacityDc: "MWp", capacityAc: "kVA"
  materiality: LText;
  acceptableSources: string[]; // source ids or classes
  estimatesPermitted: boolean;
  template: string;
  citationStyle: string;
  preparers: Person[];
  reviewers: Person[];
  approvers: Person[];
}

export interface Person {
  name: LText;
  role: LText;
  qualification?: LText;
}

export type RequirementKind = "content" | "evidence" | "signature" | "table" | "form";

/** One row of the requirement matrix (§3). */
export interface Requirement {
  id: string; // e.g. "CoP-2.3-SLD"
  part: string; // e.g. "ส่วนที่ 2"
  section: string; // e.g. "2.3"
  title: LText;
  kind: RequirementKind;
  annex?: string; // e.g. "2-10"
  stages: ReportStage[]; // which report stages require it
  appliesTo?: string[]; // plant technologies, when restricted
  evidence: LText[]; // required evidence
  source: { sourceId: string; clause?: string };
  qualifiedSignatory?: LText; // e.g. licensed control engineer
  /** Minimum/maximum values the form demands, checked from metrics by key — users cannot remove them (§10, §16). */
  thresholds?: { key: string; min?: number; max?: number; unit: string; label: LText }[];
  /** Units / precision the authority's form demands, e.g. MWp to 3 decimals. */
  precision?: { metric: string; unit: string; decimals: number }[];
}

export interface RequirementStatus {
  requirementId: string;
  state: "fulfilled" | "partial" | "missing" | "not-applicable";
  rationale?: LText; // mandatory for not-applicable (§3)
  naApprovedBy?: LText;
  claimIds: string[];
  evidenceIds: string[];
  reviewer?: LText;
}

export interface ReportPack {
  id: string;
  version: string;
  app: AppId;
  reportType: LText;
  authority: LText;
  primarySources: string[];
  /** §3: a domain owner must approve the pack before it is called ready for authority reporting. */
  domainOwnerApproval: { approved: boolean; by?: LText; on?: string };
  languages: Lang[];
  defaultLanguage: Lang;
  requirements: Requirement[];
  approvalPolicy: { role: LText; qualification?: LText; required: boolean }[];
  /** Per-method numeric tolerances (§7) — no universal tolerance. */
  tolerances: Record<string, number>;
  reportCategory: ReportCategory;
}

/* ───────────── §4 Approved data boundary ───────────── */

export type ValueState = "value" | "zero" | "null" | "unknown" | "unavailable" | "not-applicable";
export type DataCategory =
  | "company-record"
  | "external-reference"
  | "calculated"
  | "management-statement"
  | "estimate"
  | "demo"
  | "diagnostic";

export interface ContractField {
  key: string;
  label: LText;
  category: DataCategory;
  entityId: string;
  tenantId: string;
  period: string; // ISO date or "YYYY" or "YYYY-MM"
  valueState: ValueState;
  value?: number | string;
  unit?: string;
  sourceRef?: string; // SourceRecord id
  sourceVersion?: string;
  validation: "validated" | "pending" | "failed";
  approvedUse: string[]; // report pack ids
  responsible?: LText; // for management statements
}

export interface ContractDecision {
  key: string;
  admitted: boolean;
  reasons: LText[];
  /** Text that looks like an instruction is kept as content but flagged (§4, §16). */
  containsInstruction: boolean;
}

/* ───────────── §5 Source registry ───────────── */

export type SourceKind = "pdf" | "docx" | "spreadsheet" | "database" | "api" | "web" | "assertion";

export interface SourceRecord {
  id: string;
  title: LText;
  owner: LText;
  kind: SourceKind;
  location: string; // URL or system reference
  version: string; // file hash or record version
  effectiveDate?: string;
  retrievedAt: string;
  entityId?: string; // undefined = applies generally (law)
  period?: string; // reporting-period data; omit for standing documents (licences, permits)
  validUntil?: string; // standing documents: expiry, if any
  tenantId: string; // "public" for published law
  access: "public" | "tenant" | "restricted";
  reviewStatus: "reviewed" | "pending" | "rejected";
  snapshot: { retained: boolean; ref?: string };
  /** Extraction quality notes, e.g. text layer unusable → OCR needed. */
  extractionIssues?: LText[];
}

export interface SourceLocator {
  sourceId: string;
  sourceVersion: string;
  page?: number;
  clause?: string; // "ข้อ 6", "ส่วนที่ 2"
  passage?: string; // exact quoted passage
  sheet?: string;
  cell?: string;
  field?: string;
}

/** §15 EvidenceItem — an extracted passage or field with its original locator. */
export interface ReportEvidence {
  id: string;
  locator: SourceLocator;
  excerpt: string;
  extractionMethod: "text-layer" | "ocr" | "manual" | "structured";
  reviewResult: "accepted" | "pending" | "rejected";
}

/* ───────────── §7 Numerical integrity ───────────── */

export interface Metric {
  id: string;
  /** Semantic key a pack rule can reference, e.g. "noise.baseline.days". */
  key?: string;
  label: LText;
  value: number | null; // canonical unrounded value; null = not available (never a default)
  valueState: ValueState;
  unit: string;
  period: string;
  boundary: string; // entity id or boundary label
  method: { id: string; version: string };
  inputs: string[]; // metric or evidence ids
  precision: number; // display decimals
  assumptions?: LText[];
}

/* ───────────── §6 Claims ───────────── */

export type ClaimType = "sourced-fact" | "derived-calculation" | "analysis" | "estimate" | "recommendation" | "gap";
export type SupportStatus = "supported" | "unsupported" | "partial" | "conflict" | "unresolved" | "pending";

export interface Claim {
  id: string;
  revision: number;
  sectionId: string;
  paragraph: number;
  text: LText;
  type: ClaimType;
  evidenceIds: string[];
  metricIds: string[];
  /** For analysis / estimates / recommendations: the claims or assumptions they rest on. */
  basis?: string[];
  /** Value asserted in the text, checked against evidence/metric. */
  asserted?: { value: number; unit: string; period?: string; entityId?: string };
  causal?: boolean; // text asserts a cause
  supportStatus: SupportStatus;
  reviewerDecision?: "accepted" | "rejected" | "pending";
}

/* ───────────── §10 Review findings and rewrites ───────────── */

export type FindingCategory =
  | "factual-support"
  | "source-reliability"
  | "numerical-consistency"
  | "requirement-coverage"
  | "analytical-reasoning"
  | "editorial-quality"
  | "translation-consistency"
  | "confidentiality"
  | "export-presentation";

export type Severity = "critical" | "major" | "minor";

export interface ReviewFinding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  sectionId: string;
  passage?: string;
  requirementId?: string;
  issue: LText;
  evidence?: string[];
  remedy: LText;
  owner: LText;
  status: "open" | "accepted" | "fixed" | "waived";
}

export interface RewriteContract {
  sectionId: string;
  outcome: "clarity" | "analysis" | "shorten" | "expand" | "tone";
  requirementIds: string[];
  allowedSources: string[];
  approvedFacts: string[]; // claim ids that must survive unchanged
  lockedWording: string[]; // exact strings that must remain
  maxLength?: number;
  tone?: LText;
}

export type SemanticChangeKind =
  | "number"
  | "date"
  | "unit"
  | "entity"
  | "modality" // may → will, อาจ → จะ
  | "status" // proposed → completed
  | "negation"
  | "causal"
  | "obligation" // should → must
  | "locked-wording"
  | "fact-removed";

export interface SemanticChange {
  kind: SemanticChangeKind;
  before: string;
  after: string;
  material: boolean;
}

export interface RewriteRevision {
  id: string;
  sectionId: string;
  before: string;
  after: string;
  request: RewriteContract;
  changes: SemanticChange[];
  validation: { passed: boolean; reasons: LText[] };
  acceptedBy?: LText;
  invalidatesApproval: boolean;
}

/* ───────────── §2 Editorial quality ───────────── */

export interface EditorialScore {
  dimension: "natural-language" | "data-explanation" | "flow" | "specificity" | "audience-fit";
  score: number; // 0–100
}

export interface EditorialAssessment {
  reviewer: LText;
  kind: "human" | "automated";
  scores: EditorialScore[];
  date: string;
}

/* ───────────── §9 Models ───────────── */

export type ModelTask = "drafting" | "analysis" | "editorial-rewrite" | "evidence-review";
export type ReportCategory = "authority-th" | "authority-en" | "management-th" | "management-en";

export interface ModelEvaluation {
  category: ReportCategory;
  task: ModelTask;
  datasetVersion: string;
  date: string;
  factual: number;
  editorial: number;
  longDocument: number;
  passed: boolean;
  reviewers: string[];
}

export interface RegisteredModel {
  provider: string;
  modelId: string;
  /** capability class — a floor, never a qualification: authority drafting needs "frontier" AND a passed benchmark */
  tier: "frontier" | "standard" | "small";
  contextTokens: number;
  maxOutputTokens: number;
  versionPinned: boolean; // provider guarantees fixed version for this id
  status: "candidate" | "approved" | "suspended" | "retired";
  evaluations: ModelEvaluation[];
  notes?: LText;
}

export interface ModelRoute {
  category: ReportCategory;
  task: ModelTask;
  preferred: string;
  fallbacks: string[];
  settings: { effort: "low" | "medium" | "high" | "xhigh" | "max"; maxOutputTokens: number };
  promptTemplateVersion: string;
}

export interface RoutingDecision {
  task: ModelTask;
  category: ReportCategory;
  outcome: "run" | "fallback" | "queued";
  modelId?: string;
  substitutedFrom?: string;
  reason: LText;
}

/* ───────────── §11–§12 Gates, approval, release ───────────── */

export type GateId = "data-boundary" | "evidence" | "numbers" | "references" | "requirements" | "writing" | "review-findings" | "approval" | "export";
export type GateResult = "pass" | "fail" | "unknown";

export interface Gate {
  id: GateId;
  title: LText;
  condition: LText;
  result: GateResult; // unknown fails closed (§11)
  detail: LText;
  numerator?: number;
  denominator?: number;
}

export interface ReportStatuses {
  dataReadiness: "ready" | "incomplete" | "blocked";
  evidenceCoverage: { covered: number; total: number };
  requirementCompleteness: { fulfilled: number; applicable: number; notApplicable: number };
  editorialReview: "review-pending" | "below-target" | "meets-target";
  approval: "not-requested" | "pending" | "approved" | "invalidated";
  submission: "not-submitted" | "submitted";
  lifecycle: "draft" | "generated" | "ready-for-review" | "approved" | "submitted";
}

export interface ApprovalRecord {
  approver: LText;
  role: LText;
  at: string;
  reportRevision: number;
  contentHash: string;
  evidenceSnapshotHash: string;
  packVersion: string;
  exportArtifactHash?: string;
}

export interface ReleaseRecord {
  reportId: string;
  revision: number;
  contentHash: string;
  evidenceManifest: string[];
  gates: Gate[];
  approvals: ApprovalRecord[];
  at?: string;
  supersedes?: string;
  final: boolean;
}
