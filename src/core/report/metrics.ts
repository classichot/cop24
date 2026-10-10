import { t } from "../i18n-text";
import type { LText } from "../types";
import type { Metric } from "./types";

/**
 * §7 Numerical integrity — the deterministic calculation layer.
 * The language model may explain these results; it is never the authoritative calculator.
 * Every result records method/version, inputs, unit, boundary and precision, and keeps the
 * unrounded canonical value.
 */
export const METHODS = {
  sum: "sum@1",
  pctChange: "pct-change@1",
  ratio: "ratio@1",
  convert: "unit-convert@1",
  range: "range@1",
} as const;

export type CalcResult = { ok: true; metric: Metric } | { ok: false; reason: LText };

const base = (id: string, label: LText, unit: string, period: string, boundary: string, inputs: Metric[], method: string, precision: number) => ({
  id, label, unit, period, boundary, inputs: inputs.map((m) => m.id), method: { id: method.split("@")[0], version: method.split("@")[1] }, precision,
});

function sameBoundary(inputs: Metric[]): LText | null {
  const b = new Set(inputs.map((m) => m.boundary));
  if (b.size > 1) return t("อินพุตต่างขอบเขต — ห้ามรวม", "Inputs have different boundaries — cannot combine");
  const missing = inputs.find((m) => m.value === null || m.valueState !== "value" && m.valueState !== "zero");
  if (missing) return t(`อินพุต ${missing.id} ไม่มีค่า — ห้ามเติมเอง`, `Input ${missing.id} has no value — never filled in`);
  return null;
}

export function sum(id: string, label: LText, inputs: Metric[], precision = 2): CalcResult {
  const err = sameBoundary(inputs);
  if (err) return { ok: false, reason: err };
  const units = new Set(inputs.map((m) => m.unit));
  if (units.size > 1) return { ok: false, reason: t("หน่วยไม่ตรงกัน — แปลงหน่วยก่อน", "Mixed units — convert first") };
  const periods = new Set(inputs.map((m) => m.period));
  const value = inputs.reduce((n, m) => n + (m.value as number), 0);
  return { ok: true, metric: { ...base(id, label, inputs[0].unit, periods.size === 1 ? inputs[0].period : "multi", inputs[0].boundary, inputs, METHODS.sum, precision), value, valueState: value === 0 ? "zero" : "value" } };
}

export function pctChange(id: string, label: LText, from: Metric, to: Metric, precision = 1): CalcResult {
  const err = sameBoundary([from, to]);
  if (err) return { ok: false, reason: err };
  if (from.unit !== to.unit) return { ok: false, reason: t("หน่วยไม่ตรงกัน", "Unit mismatch") };
  if (from.value === 0) return { ok: false, reason: t("ตัวหารเป็นศูนย์ — ไม่คำนวณร้อยละ", "Zero denominator — percentage not computed") };
  const value = (((to.value as number) - (from.value as number)) / Math.abs(from.value as number)) * 100;
  return { ok: true, metric: { ...base(id, label, "%", `${from.period}→${to.period}`, from.boundary, [from, to], METHODS.pctChange, precision), value, valueState: "value" } };
}

export function ratio(id: string, label: LText, num: Metric, den: Metric, unit: string, precision = 2): CalcResult {
  const err = sameBoundary([num, den]);
  if (err) return { ok: false, reason: err };
  if (den.value === 0) return { ok: false, reason: t("ตัวหารเป็นศูนย์", "Zero denominator") };
  const value = (num.value as number) / (den.value as number);
  return { ok: true, metric: { ...base(id, label, unit, num.period, num.boundary, [num, den], METHODS.ratio, precision), value, valueState: "value" } };
}

const FACTORS: Record<string, Record<string, number>> = {
  kWp: { MWp: 0.001 },
  MWp: { kWp: 1000 },
  kW: { MW: 0.001 },
  MW: { kW: 1000 },
  "ไร่": { "m²": 1600, ha: 0.16 },
  "m²": { "ไร่": 1 / 1600 },
};

export function convert(id: string, m: Metric, toUnit: string, precision = m.precision): CalcResult {
  if (m.unit === toUnit) return { ok: true, metric: m };
  const f = FACTORS[m.unit]?.[toUnit];
  if (f === undefined) return { ok: false, reason: t(`ไม่มีวิธีแปลง ${m.unit} → ${toUnit} ที่อนุมัติ`, `No approved conversion ${m.unit} → ${toUnit}`) };
  if (m.value === null) return { ok: false, reason: t("ไม่มีค่าให้แปลง", "No value to convert") };
  return { ok: true, metric: { ...base(id, m.label, toUnit, m.period, m.boundary, [m], METHODS.convert, precision), value: m.value * f, valueState: m.valueState } };
}

/** Display value derived consistently from the canonical value (§7). */
export const display = (m: Metric, decimals = m.precision) =>
  m.value === null ? "—" : m.value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * Reconcile a number asserted in prose against its canonical metric. Tolerance is set per
 * method by the report pack; there is no universal tolerance.
 */
export function reconcile(asserted: { value: number; unit: string }, m: Metric, tolerance: number): { ok: boolean; reason?: LText } {
  if (m.value === null) return { ok: false, reason: t("ตัวชี้วัดไม่มีค่า", "Metric has no value") };
  if (asserted.unit !== m.unit) return { ok: false, reason: t(`หน่วยในข้อความ (${asserted.unit}) ไม่ตรงกับตัวชี้วัด (${m.unit})`, `Asserted unit ${asserted.unit} differs from metric unit ${m.unit}`) };
  const diff = Math.abs(asserted.value - m.value);
  if (diff > tolerance) return { ok: false, reason: t(`ข้อความระบุ ${asserted.value} แต่ค่าที่คำนวณได้คือ ${display(m)}`, `Text says ${asserted.value} but the calculated value is ${display(m)}`) };
  return { ok: true };
}

/** Two sources disagree on a material number: show the conflict; never pick or average (§16). */
export function detectConflict(a: Metric, b: Metric, tolerance: number): { conflict: boolean; detail?: LText } {
  if (a.value === null || b.value === null || a.unit !== b.unit) return { conflict: false };
  if (Math.abs(a.value - b.value) <= tolerance) return { conflict: false };
  return { conflict: true, detail: t(`${a.label.th}: ${display(a)} ${a.unit} (${a.id}) ≠ ${display(b)} ${b.unit} (${b.id}) — ไม่เลือกค่าใดค่าหนึ่งให้เอง`, `${a.label.en}: ${display(a)} ${a.unit} (${a.id}) ≠ ${display(b)} ${b.unit} (${b.id}) — no silent selection or averaging`) };
}

/** §7, §16: if a source value changes, every dependent metric becomes stale. */
export function dependents(metricId: string, all: Metric[]): string[] {
  const out = new Set<string>();
  const visit = (id: string) => { for (const m of all) if (m.inputs.includes(id) && !out.has(m.id)) { out.add(m.id); visit(m.id); } };
  visit(metricId);
  return [...out];
}
