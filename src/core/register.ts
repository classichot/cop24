import { t } from "./i18n-text";
import { TODAY, addDays } from "./dates";
import { evaluateApplicability } from "./applicability";
import { layerPasses } from "./evidence";
import type { ApplicabilityResult, EntityProfile, EvidenceItem, Frequency, LText, ObligationInstance, RulePack, Status } from "./types";

/**
 * Regulation / Obligation Engine.
 * Turns "which packs apply" into a living Obligation Register: one row per
 * entity × obligation, with next due date, bound evidence and derived status.
 */

const FREQ_DAYS: Record<Frequency, number | null> = {
  once: null,
  continuous: null,
  event: null,
  monthly: 30,
  quarterly: 91,
  semiannual: 182,
  annual: 365,
};

/** Deterministic demo scheduling: spread next-due dates by frequency from the anchor. */
export function nextDueFor(frequency: Frequency, seed: number, anchor = TODAY): string | null {
  const period = FREQ_DAYS[frequency];
  if (period === null) return frequency === "once" ? addDays(anchor, 20 + (seed % 60)) : null;
  return addDays(anchor, 5 + ((seed * 37) % period));
}

export function statusFromEvidence(items: EvidenceItem[]): { status: Status; label: LText } {
  if (items.length === 0) return { status: "cond", label: t("ยังไม่ผูกหลักฐาน", "No evidence bound") };
  if (items.every((e) => e.layers.every(layerPasses))) return { status: "ok", label: t("หลักฐานครบ", "Evidence complete") };
  if (items.some((e) => e.layers[0] === -1)) return { status: "bad", label: t("ขาดหลักฐาน", "Evidence missing") };
  if (items.some((e) => e.layers.some((m) => m === -1))) return { status: "bad", label: t("หลักฐานใช้ไม่ได้", "Evidence invalid") };
  return { status: "warn", label: t("ต้องตรวจ", "Needs review") };
}

export interface RegisterBuild {
  applicability: ApplicabilityResult[];
  instances: ObligationInstance[];
}

export function buildRegister(entities: EntityProfile[], packs: RulePack[], evidence: EvidenceItem[]): RegisterBuild {
  const applicability: ApplicabilityResult[] = [];
  const instances: ObligationInstance[] = [];
  let seed = 1;
  for (const entity of entities) {
    const results = evaluateApplicability(entity, packs);
    applicability.push(...results);
    for (const r of results) {
      if (!r.applicable) continue;
      const pack = packs.find((p) => p.id === r.packId)!;
      for (const ob of pack.obligations) {
        const bound = evidence.filter((e) => e.entityId === entity.id && e.obligationIds.includes(ob.id));
        const st = statusFromEvidence(bound);
        instances.push({
          key: `${entity.id}:${ob.id}`,
          entityId: entity.id,
          packId: pack.id,
          app: pack.app,
          domain: pack.domain,
          obligation: ob,
          nextDue: nextDueFor(ob.frequency, seed++),
          evidence: bound,
          status: st.status,
          statusLabel: st.label,
        });
      }
    }
  }
  return { applicability, instances };
}
