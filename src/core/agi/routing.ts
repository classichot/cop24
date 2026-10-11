import { t } from "../i18n-text";
import type { LText } from "../types";
import type { Tier } from "./flagship";

/**
 * REQ-AGI-006 intelligent model routing and the Mission Cost Governor.
 * Critical work routes on accuracy, not price; calculations and thresholds never go to a model.
 * Prices are configurable planning estimates in THB, not quotes.
 */

export interface RouteRule { task: LText; tier: Tier; strategy: LText }

export const ROUTING: RouteRule[] = [
  { task: t("OCR และสกัดข้อมูลอย่างง่าย", "OCR and simple extraction"), tier: "economy", strategy: t("โมเดลประหยัดและเครื่องมือสกัดเฉพาะทาง (tesseract tha+eng, pdf.js)", "Economical models and specialised extraction tools (tesseract tha+eng, pdf.js)") },
  { task: t("จัดหมวดและติดแท็ก", "Classification and tagging"), tier: "deterministic", strategy: t("กฎที่อธิบายได้ (classify-rules@1) — โมเดลเสริมเมื่อผ่านเกณฑ์ทดสอบ", "Explainable rules (classify-rules@1) — a model only once it passes the benchmark") },
  { task: t("วิเคราะห์กฎระเบียบที่ซับซ้อน", "Complex regulatory analysis"), tier: "frontier", strategy: t("โมเดลให้เหตุผลความสามารถสูง อ้างอิงคลังกฎหมาย", "High-capability reasoning model, grounded in the legal corpus") },
  { task: t("ตีความข้อมูลสิ่งแวดล้อม", "Environmental interpretation"), tier: "frontier", strategy: t("โมเดลความสามารถสูง + เครื่องมือข้อมูลที่ตรวจแล้ว", "High-capability model with validated data tools") },
  { task: t("เขียนรายงานภาษาไทย", "Thai report generation"), tier: "frontier", strategy: t("โมเดลที่ผ่านเกณฑ์คุณภาพรายงาน (Report Quality Standard)", "Best model on the report-quality benchmark") },
  { task: t("ตรวจข้อเท็จจริงอิสระ", "Independent factual review"), tier: "standard", strategy: t("รอบตรวจแยกต่างหาก ใช้โมเดลต่างค่ายเมื่อเหมาะสม", "A separate verification pass, model-diverse when justified") },
  { task: t("คำนวณและเทียบเกณฑ์", "Calculations and thresholds"), tier: "deterministic", strategy: t("คำนวณแบบกำหนดแน่นอน ไม่ใช้โมเดลประมาณ", "Deterministic computation, never model estimation") },
];

/** Planning assumptions per task call: tokens and THB per 1k tokens. */
export const TIER_COST: Record<Tier, { tokens: number; thbPer1k: number; minutes: number }> = {
  deterministic: { tokens: 0, thbPer1k: 0, minutes: 0.1 },
  economy: { tokens: 8000, thbPer1k: 0.02, minutes: 0.5 },
  standard: { tokens: 30000, thbPer1k: 0.12, minutes: 1 },
  frontier: { tokens: 60000, thbPer1k: 0.6, minutes: 2 },
};

export const taskCost = (tier: Tier) => Math.round(((TIER_COST[tier].tokens / 1000) * TIER_COST[tier].thbPer1k) * 100) / 100;
