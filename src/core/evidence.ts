import type { EvidenceItem, EvidenceScore, LayerMark } from "./types";

/**
 * Evidence Engine — the three-layer evidence model.
 *
 *   1. exists   — is there a document at all?
 *   2. valid    — signed, unexpired, right period, right entity?
 *   3. proves   — does its content actually support the obligation it is cited for?
 *
 * COP24 never treats an uploaded file as acceptable evidence automatically.
 * Readiness is the share of required items that pass all three layers.
 */

export const layerPasses = (m: LayerMark) => m === 1;

export function scoreEvidence(items: EvidenceItem[], required = items.length): EvidenceScore {
  const exists = items.filter((e) => layerPasses(e.layers[0])).length;
  const valid = items.filter((e) => layerPasses(e.layers[0]) && layerPasses(e.layers[1])).length;
  const proves = items.filter((e) => e.layers.every(layerPasses)).length;
  const readiness = required === 0 ? 0 : Math.round((proves / required) * 100);
  return { required, exists, valid, proves, readiness };
}

/** Evidence Guard: a chapter may only be closed when every cited item proves its claim. */
export function evidenceGuard(items: EvidenceItem[]): { pass: boolean; blocking: EvidenceItem[] } {
  const blocking = items.filter((e) => !e.layers.every(layerPasses));
  return { pass: blocking.length === 0, blocking };
}
