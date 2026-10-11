import type { LText, Severity } from "../types";
import type { AgentId } from "./agents";
import type { RegulatoryProfile } from "./regulatory";

/** REQ-DATA-002 system-wide evidence statuses. Missing is never a pass. */
export type EvidenceStatus = "verified" | "needs-review" | "missing" | "conflicting" | "not-applicable";

/** An approved measure from the project's controlling register (REQ-DATA-003). */
export interface SiteMeasure {
  id: string;
  title: LText;
  topic: "noise" | "air" | "water" | "waste" | "community" | "safety" | "general";
  mandatory: boolean;
  applies: boolean;
  /** where the obligation comes from: the regulation clause, licence condition or approved CoP */
  source: string;
}

export interface SiteEvidence {
  id: string;
  measureId: string;
  title: LText;
  status: EvidenceStatus;
  /** file + page/cell, so every statement can be traced */
  source?: string;
  note?: LText;
}

export interface SiteMeasurement {
  id: string;
  param: string;
  station: string;
  period: string; // reporting year, CE
  value: number | null;
  state: "value" | "not-detected" | "not-measured" | "not-provided";
  unit: string;
  /** applicable limit; absent when no limit applies — never a universal obligation */
  limit?: { max?: number; min?: number; standard: string; verified: boolean };
  labId?: string;
  source: string;
}

export interface SiteLab { id: string; name: string; accreditationNo?: string; validUntil?: string }

/** Everything one plant workstream may see. A swarm gives each workstream only its own site. */
export interface SiteInput {
  id: string;
  name: LText;
  profile: RegulatoryProfile;
  year: number;
  measures: SiteMeasure[];
  evidence: SiteEvidence[];
  measurements: SiteMeasurement[];
  labs: SiteLab[];
  capacityClaims: { source: string; valueMW: number }[];
  /** reporting years for which monitoring data exist */
  historyYears: number[];
}

export type FindingKind = "route" | "missing-evidence" | "conflict" | "lab-unverified" | "exceedance" | "unverified-measure" | "history-gap" | "permit-change" | "qa" | "budget";
export interface Finding { id: string; site: string; kind: FindingKind; severity: Severity; text: LText; source?: string; measureId?: string }

/** REQ-EXEC-002 — who can do a piece of work. */
export type WorkType = "ai-digital" | "human" | "licensed-professional" | "third-party-lab" | "formal-approval";
export interface HumanTask {
  id: string; site: string; title: LText; work: WorkType; owner: LText; findingId?: string;
  status: "open" | "awaiting-verification" | "done";
  /** corrective work closes only after an independent verifier checks the evidence (REQ-EXEC-003) */
  verify?: boolean;
  doneBy?: string; evidence?: string; verifiedBy?: string;
}

export type MeasureResult = "compliant" | "potentially-noncompliant" | "unverified" | "not-applicable";

export interface ReportSection { id: string; title: LText; text: LText; sources: string[]; status: "supported" | "blocked" }
export interface Deliverable { id: string; site: string; kind: "assessment" | "report" | "register" | "package" | "capa" | "dashboard" | "plan" | "queue"; title: LText; version: number; sections?: ReportSection[]; rows?: Record<string, string | number>[]; hash?: string }

export interface TaskOutput {
  summary: LText;
  findings?: Omit<Finding, "id" | "site">[];
  humanTasks?: Omit<HumanTask, "id" | "site" | "status">[];
  deliverable?: Omit<Deliverable, "site" | "version">;
  /** stops the whole mission for this site, e.g. the project is under EIA, not CoP */
  block?: LText;
  data?: Record<string, unknown>;
}

export interface RunnerCtx { autonomy: "draft" | "supervised" | "autopilot"; today: string; agent: AgentId; prior: Record<string, TaskOutput> }
