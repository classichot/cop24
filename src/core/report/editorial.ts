import { t } from "../i18n-text";
import type { LText } from "../types";
import type { EditorialAssessment, EditorialScore } from "./types";

/**
 * §2 Human Editorial Quality — a writing-quality score assessed against a human rubric.
 * It is not a probability that a human wrote the text, and an AI-detector result is never
 * the acceptance gate. Until the rubric is calibrated, the product shows "editorial review
 * pending" instead of a percentage. Automated scores are provisional and labelled as such.
 */
export const RUBRIC: { dimension: EditorialScore["dimension"]; weight: number; label: LText }[] = [
  { dimension: "natural-language", weight: 0.25, label: t("ภาษาวิชาชีพที่เป็นธรรมชาติ", "Natural professional language") },
  { dimension: "data-explanation", weight: 0.25, label: t("ความชัดเจนในการอธิบายข้อมูล", "Clarity of data explanations") },
  { dimension: "flow", weight: 0.2, label: t("ลำดับเหตุผลและความต่อเนื่อง", "Logical flow and coherence") },
  { dimension: "specificity", weight: 0.15, label: t("ความเจาะจงและกระชับ", "Specificity and concision") },
  { dimension: "audience-fit", weight: 0.15, label: t("ความเหมาะสมกับผู้อ่าน น้ำเสียง และศัพท์", "Audience, tone and terminology fit") },
];

export const EDITORIAL_TARGET = 98;

export const weighted = (scores: EditorialScore[]) =>
  Math.round(RUBRIC.reduce((n, r) => n + (scores.find((s) => s.dimension === r.dimension)?.score ?? 0) * r.weight, 0) * 10) / 10;

export interface EditorialStatus {
  state: "review-pending" | "below-target" | "meets-target";
  score?: number;
  provisional?: number; // automated, labelled provisional
  label: LText;
}

/**
 * Final status needs an authorised human editor's assessment AND a calibrated rubric.
 * Two independent human scores are kept; disagreements are resolved by an editor (§2).
 */
export function editorialStatus(assessments: EditorialAssessment[], rubricCalibrated: boolean): EditorialStatus {
  const human = assessments.filter((a) => a.kind === "human");
  const auto = assessments.find((a) => a.kind === "automated");
  const provisional = auto ? weighted(auto.scores) : undefined;
  if (!rubricCalibrated || human.length === 0) {
    return { state: "review-pending", provisional, label: t("รอการตรวจทานโดยบรรณาธิการ", "Editorial review pending") };
  }
  const score = Math.min(...human.map((a) => weighted(a.scores)));
  return score > EDITORIAL_TARGET
    ? { state: "meets-target", score, provisional, label: t(`ผ่านเกณฑ์ ${score}/100`, `Meets target ${score}/100`) }
    : { state: "below-target", score, provisional, label: t(`ต่ำกว่าเกณฑ์ ${score}/100 (ต้องมากกว่า ${EDITORIAL_TARGET})`, `Below target ${score}/100 (must exceed ${EDITORIAL_TARGET})`) };
}

/** Filler and unsupported-certainty phrases the editor removes (§2). Used as provisional hints only. */
export const FILLER = [/\bworld[- ]class\b/i, /\bcutting[- ]edge\b/i, /\bin today'?s (fast[- ]paced )?world\b/i, /\bit is important to note\b/i, /\bseamless(ly)?\b/i, /อย่างไรก็ตาม อย่างไรก็ตาม/u, /ล้ำสมัย/u, /ระดับโลก/u, /ไร้ที่ติ/u, /อย่างแน่นอน 100%/u];
export const fillerHits = (s: string) => FILLER.filter((r) => r.test(s)).length;
