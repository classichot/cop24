/**
 * COP24 Core Engine — shared types.
 *
 * Everything in `src/core` is domain-agnostic. Domain knowledge (ERC CoP, SET/SEC,
 * PDPA, transfer pricing, Pillar Two …) lives in `src/packs` as RulePacks that the
 * engines consume. Vertical products (ESG24, TP24, GMT24, TRADE24, ACC24) are
 * "apps" that skin the same engines with their own UI, calculations and missions.
 */

export type Lang = "th" | "en";
export type LText = { th: string; en: string };

/** Compliance domains COP24 covers. One horizontal universe, many packs. */
export type DomainId =
  | "corporate"
  | "tax"
  | "labour"
  | "privacy"
  | "environmental"
  | "licensing"
  | "governance"
  | "industry"
  | "cyber"
  | "trade"
  | "financial"
  | "esg"
  | "policy";

/** The 24-series applications that run on top of the COP24 engine. */
export type AppId = "cop24" | "esg24" | "tp24" | "gmt24" | "trade24" | "acc24";

/** Visual status vocabulary used across every engine output. */
export type Status = "ok" | "warn" | "bad" | "cond" | "info";

export type Frequency =
  | "once"
  | "continuous"
  | "event"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual";

export type Severity = "material" | "major" | "minor";

export interface Domain {
  id: DomainId;
  name: LText;
  short: LText;
}

/* ───────────────────────── Entity / applicability ───────────────────────── */

export type PlantTech =
  | "solar-ground"
  | "solar-roof"
  | "solar-float"
  | "wind"
  | "biomass"
  | "biogas";

export interface EntityProfile {
  id: string;
  name: LText;
  type: "group" | "company" | "plant";
  parentId?: string;
  country: "TH";
  sector: LText;
  listed: boolean;
  employees: number;
  revenueTHB: number;
  groupRevenueEUR: number;
  processesPersonalData: boolean;
  hasPowerPlant: boolean;
  plantTech?: PlantTech;
  plantMW?: number;
  plantPhase?: "pre-construction" | "construction" | "operating";
  publicHearingDone?: boolean;
  eiaRequired?: boolean;
  intercompanyTransactions: boolean;
  relatedPartyTHB: number;
  exportsGoods: boolean;
  criticalInfrastructure: boolean;
  fiscalYearEnd: string; // MM-DD
}

export type CriterionOp = "eq" | "neq" | "gte" | "lte" | "in" | "truthy" | "falsy";

export interface ApplicabilityCriterion {
  id: string;
  field: keyof EntityProfile;
  op: CriterionOp;
  value?: unknown;
  label: LText;
}

export interface ApplicabilityResult {
  packId: string;
  entityId: string;
  applicable: boolean;
  matched: ApplicabilityCriterion[];
  failed: ApplicabilityCriterion[];
  excludedBy: ApplicabilityCriterion[];
  confidence: number; // 0–1, lowered by assumptions
  assumptions: LText[];
}

/* ───────────────────────── Rule packs / obligations ───────────────────────── */

export interface Obligation {
  id: string;
  title: LText;
  summary: LText;
  frequency: Frequency;
  dueRule: LText;
  evidenceRequired: LText[];
  ownerRole: LText;
  severity: Severity;
  reportDest?: LText;
  controlIds?: string[];
}

export interface ChapterTemplate {
  id: string;
  num: string;
  title: LText;
  obligationIds: string[];
  locked: boolean; // mandatory heading from the authority's template
}

export interface ReportTemplate {
  id: string;
  name: LText;
  purpose: LText;
  chapters: ChapterTemplate[];
}

export interface RulePack {
  id: string;
  app: AppId;
  domain: DomainId;
  name: LText;
  authority: LText;
  source: LText;
  version: string;
  effectiveFrom: string;
  criteria: ApplicabilityCriterion[];
  exclusions?: ApplicabilityCriterion[];
  assumptions?: LText[];
  obligations: Obligation[];
  obligationCount: number; // size of the full pack; demo lists a subset
  reports: ReportTemplate[];
}

/* ───────────────────────── Evidence ───────────────────────── */

/** 1 = passes, 0 = unknown / needs review, -1 = fails */
export type LayerMark = 1 | 0 | -1;

export interface EvidenceItem {
  id: string;
  entityId: string;
  name: LText;
  meta: LText;
  purpose: LText;
  obligationIds: string[];
  /** [exists, valid, proves] */
  layers: [LayerMark, LayerMark, LayerMark];
  status: Status;
  statusLabel: LText;
  source: LText; // file / connector / page
  requestedOn?: string;
}

export interface EvidenceScore {
  required: number;
  exists: number;
  valid: number;
  proves: number;
  readiness: number; // 0–100
}

/* ───────────────────────── Controls ───────────────────────── */

export interface Control {
  id: string;
  name: LText;
  obligationIds: string[];
  owner: LText;
  frequency: Frequency;
  type: "preventive" | "detective" | "corrective";
  automated: boolean;
}

export interface ControlTest {
  id: string;
  controlId: string;
  date: string;
  result: "effective" | "exception" | "failed" | "not-tested";
  note: LText;
  tester: LText;
}

/* ───────────────────────── Register / gaps / calendar ───────────────────────── */

export interface ObligationInstance {
  key: string; // `${entityId}:${obligationId}`
  entityId: string;
  packId: string;
  app: AppId;
  domain: DomainId;
  obligation: Obligation;
  nextDue: string | null;
  evidence: EvidenceItem[];
  status: Status;
  statusLabel: LText;
}

export interface Gap {
  id: string;
  key: string;
  entityId: string;
  obligationId: string;
  packId: string;
  domain: DomainId;
  severity: Severity;
  source: "evidence" | "control" | "change" | "preflight";
  cause: LText;
  remediation: LText;
  owner: LText;
  due: string;
  status: "open" | "in-progress" | "closed";
}

export interface CalendarEvent {
  id: string;
  date: string;
  entityId: string;
  packId: string;
  domain: DomainId;
  obligationId?: string;
  kind: "submission" | "sampling" | "test" | "review" | "hearing" | "meeting";
  label: LText;
  status: Status;
}

/* ───────────────────────── Regulatory change ───────────────────────── */

export interface RegChange {
  id: string;
  packId: string;
  title: LText;
  authority: LText;
  publishedOn: string;
  effectiveOn: string;
  summary: LText;
  affectedObligationIds: string[];
  newObligations?: Obligation[];
  status: "new" | "assessed" | "applied";
}

export interface ChangeImpact {
  change: RegChange;
  obligations: ObligationInstance[];
  entities: string[];
  chapters: { reportId: string; chapterId: string }[];
  severity: Severity;
}

/* ───────────────────────── Reporting / preflight ───────────────────────── */

export type ChapterState = "todo" | "drafting" | "review" | "approved";

export interface ReportDraft {
  id: string;
  entityId: string;
  packId: string;
  templateId: string;
  version: string;
  rulepackVersion: string;
  chapters: ChapterDraft[];
}

export interface ChapterDraft {
  id: string;
  num: string;
  title: LText;
  state: ChapterState;
  meta: LText;
  paras: LText[];
  evidenceIds: string[];
  unresolved: LText[];
  obligationIds: string[];
}

export type GateStage = 1 | 2 | 3 | 4; // AI drafted → evidence complete → ready to certify → approved to file

export interface PreflightLayer {
  id: string;
  name: LText;
  what: LText;
  status: Status;
  statusLabel: LText;
  detail: LText;
  ref: LText;
}

export interface PreflightResult {
  layers: PreflightLayer[];
  gate: GateStage;
  gateLabel: LText;
  blockers: number;
  observations: number;
}

/* ───────────────────────── Agents / missions ───────────────────────── */

export interface AgentDef {
  id: string;
  name: LText;
  engine: string; // which core engine the agent is bound to
  job: LText;
  logs: LText[]; // stage 0..3
  guardrails: LText[];
}

export interface MissionTemplate {
  id: string;
  app: AppId;
  title: LText;
  desc: LText;
  route: string;
}

/* ───────────────────────── Audit trail ───────────────────────── */

export interface AuditEvent {
  id: string;
  at: string;
  actor: LText;
  kind: "ai" | "human" | "system";
  action: LText;
  object: LText;
  detail: LText;
  engine: string;
}

/* ───────────────────────── Engine description (for /engine) ───────────────────────── */

export interface EngineDef {
  id: string;
  name: LText;
  role: LText;
  capability: LText; // the shared capability it powers in every 24 app
  inputs: LText;
  outputs: LText;
}
