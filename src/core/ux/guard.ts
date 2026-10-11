import { t } from "../i18n-text";
import type { LText } from "../types";
import { MISSIONS, type UxMission } from "./catalog";

/**
 * §11 24 Complexity Guard — detects signs that a user is struggling and infers what they are
 * probably trying to do, so help can be offered in context. Pure: the shell records events,
 * this decides. Help is never a popup: the shell shows a dismissible inline strip.
 */

export type GuardEvent =
  | { kind: "visit"; route: string; at: number }
  | { kind: "advanced-toggle"; at: number }
  | { kind: "search-miss"; at: number }
  | { kind: "validation-error"; at: number }
  | { kind: "help"; at: number };

export type Signal = "backtracking" | "excessive-navigation" | "repeat-visits" | "inactivity" | "advanced-toggling" | "unsuccessful-search" | "validation-errors" | "repeated-help";

export const SIGNAL_LABEL: Record<Signal, LText> = {
  backtracking: t("กลับไปมาระหว่างหน้าเดิม", "going back and forth between the same screens"),
  "excessive-navigation": t("เปิดหลายหน้าในเวลาสั้น", "opening many screens in a short time"),
  "repeat-visits": t("กลับมาหน้าเดิมหลายครั้ง", "returning to the same screen repeatedly"),
  inactivity: t("หยุดอยู่ที่หน้าเดิมนาน", "a long pause on one screen"),
  "advanced-toggling": t("เปิดปิดการตั้งค่าขั้นสูงซ้ำ", "opening and closing advanced settings repeatedly"),
  "unsuccessful-search": t("ค้นหาแล้วไม่พบ", "searches that found nothing"),
  "validation-errors": t("ข้อมูลไม่ผ่านการตรวจซ้ำ", "repeated validation errors"),
  "repeated-help": t("ขอความช่วยเหลือซ้ำ", "repeated requests for help"),
};

export interface GuardResult { signals: Signal[]; show: boolean; mission?: UxMission; route?: string }

export const GUARD = {
  windowMs: 5 * 60_000,
  navBurst: { count: 7, ms: 2 * 60_000 },
  repeat: 3,
  idleMs: 2 * 60_000,
  toggles: 3,
  misses: 2,
  errors: 3,
  helps: 3,
};

export function detectStruggle(events: GuardEvent[], now: number, lastActivity: number): GuardResult {
  const recent = events.filter((e) => now - e.at <= GUARD.windowMs);
  const visits = recent.filter((e): e is Extract<GuardEvent, { kind: "visit" }> => e.kind === "visit");
  const signals: Signal[] = [];

  // Home and the hub screens are meant to be returned to — they never count as struggle
  const HUBS = new Set(["/", "/missions", "/my-work"]);
  // A → B → A → B: two or more returns to a screen just left (not via a hub)
  let bounces = 0;
  for (let i = 2; i < visits.length; i++) if (visits[i].route === visits[i - 2].route && visits[i].route !== visits[i - 1].route && !HUBS.has(visits[i].route) && !HUBS.has(visits[i - 1].route)) bounces++;
  if (bounces >= 2) signals.push("backtracking");

  const burst = visits.filter((v) => now - v.at <= GUARD.navBurst.ms);
  if (new Set(burst.map((v) => v.route)).size >= GUARD.navBurst.count) signals.push("excessive-navigation");

  const counts = new Map<string, number>();
  for (const v of visits) if (!HUBS.has(v.route)) counts.set(v.route, (counts.get(v.route) ?? 0) + 1);
  if ([...counts.values()].some((n) => n >= GUARD.repeat)) signals.push("repeat-visits");

  const current = visits[visits.length - 1]?.route;
  if (current && !HUBS.has(current) && now - lastActivity >= GUARD.idleMs) signals.push("inactivity");
  if (recent.filter((e) => e.kind === "advanced-toggle").length >= GUARD.toggles) signals.push("advanced-toggling");
  if (recent.filter((e) => e.kind === "search-miss").length >= GUARD.misses) signals.push("unsuccessful-search");
  if (recent.filter((e) => e.kind === "validation-error").length >= GUARD.errors) signals.push("validation-errors");
  if (recent.filter((e) => e.kind === "help").length >= GUARD.helps) signals.push("repeated-help");

  // the mission whose modules the user keeps touching is the likely goal
  let mission: UxMission | undefined;
  let best = 0;
  for (const m of MISSIONS) {
    if (m.id === "start" || m.id === "my-tasks") continue;
    const score = visits.filter((v) => m.modules.includes(v.route)).length;
    if (score > best) { best = score; mission = m; }
  }
  return { signals, show: signals.length > 0, mission, route: current };
}
