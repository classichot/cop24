import type { ApplicabilityCriterion, ApplicabilityResult, EntityProfile, RulePack } from "./types";

/**
 * Applicability Engine.
 * Decides which rule packs bind which entity, and — crucially — explains why:
 * every matched/failed criterion is returned so the UI can show "why did the AI
 * conclude this?" with data used, assumptions and alternatives considered.
 */

export function testCriterion(profile: EntityProfile, c: ApplicabilityCriterion): boolean {
  const v = profile[c.field] as unknown;
  switch (c.op) {
    case "truthy":
      return Boolean(v);
    case "falsy":
      return !v;
    case "eq":
      return v === c.value;
    case "neq":
      return v !== c.value;
    case "gte":
      return typeof v === "number" && v >= (c.value as number);
    case "lte":
      return typeof v === "number" && v <= (c.value as number);
    case "in":
      return Array.isArray(c.value) && (c.value as unknown[]).includes(v);
    default:
      return false;
  }
}

export function evaluatePack(profile: EntityProfile, pack: RulePack): ApplicabilityResult {
  const matched: ApplicabilityCriterion[] = [];
  const failed: ApplicabilityCriterion[] = [];
  for (const c of pack.criteria) (testCriterion(profile, c) ? matched : failed).push(c);
  const excludedBy = (pack.exclusions ?? []).filter((c) => testCriterion(profile, c));
  const applicable = failed.length === 0 && excludedBy.length === 0;
  const assumptions = applicable ? pack.assumptions ?? [] : [];
  const confidence = applicable ? Math.max(0.5, 1 - assumptions.length * 0.12) : 1;
  return { packId: pack.id, entityId: profile.id, applicable, matched, failed, excludedBy, confidence, assumptions };
}

export function evaluateApplicability(profile: EntityProfile, packs: RulePack[]): ApplicabilityResult[] {
  return packs.map((p) => evaluatePack(profile, p));
}
