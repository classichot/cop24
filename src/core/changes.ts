import type { ChangeImpact, ObligationInstance, RegChange, RulePack, Severity } from "./types";

/**
 * Regulatory Change Engine.
 * A change is published against a pack; impact is propagated to every entity
 * instance of the affected obligations and to every report chapter that cites them.
 */
export function assessImpact(change: RegChange, instances: ObligationInstance[], packs: RulePack[]): ChangeImpact {
  const affected = new Set([...change.affectedObligationIds, ...(change.newObligations ?? []).map((o) => o.id)]);
  const obligations = instances.filter((i) => i.packId === change.packId && affected.has(i.obligation.id));
  const entities = Array.from(new Set(obligations.map((o) => o.entityId)));
  const pack = packs.find((p) => p.id === change.packId);
  const chapters: ChangeImpact["chapters"] = [];
  for (const r of pack?.reports ?? []) {
    for (const ch of r.chapters) {
      if (ch.obligationIds.some((id) => affected.has(id))) chapters.push({ reportId: r.id, chapterId: ch.id });
    }
  }
  const severity: Severity = obligations.some((o) => o.obligation.severity === "material") || (change.newObligations?.length ?? 0) > 0 ? "material" : obligations.length ? "major" : "minor";
  return { change, obligations, entities, chapters, severity };
}

export const assessAll = (changes: RegChange[], instances: ObligationInstance[], packs: RulePack[]) =>
  changes.map((c) => assessImpact(c, instances, packs));
