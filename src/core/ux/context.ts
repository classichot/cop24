import { daysUntil, TODAY } from "../dates";
import { layerPasses } from "../evidence";
import { t } from "../i18n-text";
import type { Snapshot, TenantData } from "../engine";
import type { GateStage, LText } from "../types";

/**
 * 24 Series Universal UX Standard — the experience layer's view of the tenant.
 * Everything the Copilot, journeys, explanations and next steps say is derived from this
 * object, which is derived from the engine snapshot. Nothing in the UX layer is hand-written
 * status: if the engine changes, the experience changes with it.
 */

/** §9 role-based experience. Contributor = data owner who only needs "things you need to do". */
export type UxRole = "owner" | "consultant" | "exec" | "contributor";

export interface UxContext {
  role: UxRole;
  today: string;
  entityId: string;
  entityName: LText;
  hasPowerPlant: boolean;
  /** true when the active entity owns the report draft in progress; report figures are zero otherwise */
  hasReport: boolean;
  /** open gaps for the active entity */
  openGaps: number;
  materialGaps: number;
  evidenceGaps: number;
  /** evidence readiness of the report in progress, 0–100 */
  readiness: number;
  evidenceRequired: number;
  evidenceProven: number;
  gate: GateStage;
  gateLabel: LText;
  blockers: number;
  observations: number;
  conflicts: number;
  factsTotal: number;
  factsSourced: number;
  chaptersTotal: number;
  chaptersApproved: number;
  chaptersReview: number;
  chaptersDrafting: number;
  nextDeadline?: { label: LText; date: string; days: number };
  deadlines60: number;
  changesPending: number;
  failedControls: number;
  controlsTotal: number;
  entitiesTotal: number;
}

export function uxContext(snap: Snapshot, data: TenantData, entityId: string, role: UxRole, today = TODAY): UxContext {
  const entity = data.entities.find((e) => e.id === entityId) ?? data.entities[0];
  const gaps = snap.gaps.filter((g) => g.entityId === entity.id && g.status !== "closed");
  const upcoming = snap.calendar
    .filter((e) => (e.entityId === entity.id || e.entityId === data.report.entityId) && daysUntil(e.date, today) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0];
  // Report-level figures belong to the entity that owns the draft. For any other entity they
  // are not borrowed: readiness comes from that entity's own obligations and evidence.
  const hasReport = entity.id === data.report.entityId;
  const ch = hasReport ? data.report.chapters : [];
  const own = snap.instances.filter((i) => i.entityId === entity.id);
  const ownProven = own.filter((i) => i.evidence.length > 0 && i.evidence.every((e) => e.layers.every(layerPasses))).length;
  return {
    role,
    today,
    entityId: entity.id,
    entityName: entity.name,
    hasPowerPlant: Boolean((entity as { hasPowerPlant?: boolean }).hasPowerPlant),
    hasReport,
    openGaps: gaps.length,
    materialGaps: gaps.filter((g) => g.severity === "material").length,
    evidenceGaps: gaps.filter((g) => g.source === "evidence").length,
    readiness: hasReport ? snap.evidenceScore.readiness : own.length ? Math.round((ownProven / own.length) * 100) : 0,
    evidenceRequired: hasReport ? snap.evidenceScore.required : own.length,
    evidenceProven: hasReport ? snap.evidenceScore.proves : ownProven,
    gate: hasReport ? snap.preflight.gate : 1,
    gateLabel: hasReport ? snap.preflight.gateLabel : t("ยังไม่มีร่างรายงาน", "No report draft yet"),
    blockers: hasReport ? snap.preflight.blockers : 0,
    observations: hasReport ? snap.preflight.observations : 0,
    conflicts: hasReport ? data.conflicts.length : 0,
    factsTotal: hasReport ? data.facts.total : 0,
    factsSourced: hasReport ? data.facts.sourced : 0,
    chaptersTotal: ch.length,
    chaptersApproved: ch.filter((c) => c.state === "approved").length,
    chaptersReview: ch.filter((c) => c.state === "review").length,
    chaptersDrafting: ch.filter((c) => c.state === "drafting").length,
    nextDeadline: next ? { label: next.label, date: next.date, days: daysUntil(next.date, today) } : undefined,
    deadlines60: upcoming.filter((e) => daysUntil(e.date, today) <= 60).length,
    changesPending: snap.impacts.filter((i) => i.entities.length > 0).length,
    failedControls: snap.controlStats.failed,
    controlsTotal: snap.controlStats.total,
    entitiesTotal: data.entities.length,
  };
}
