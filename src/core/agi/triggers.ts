import { t } from "../i18n-text";
import type { LText } from "../types";
import type { Autonomy, MissionRun } from "./engine";
import { monitoringPeriods } from "./regulatory";
import { measureTopic } from "./runners";
import type { SiteInput } from "./types";

/**
 * REQ-AGI-007 mission triggers. A trigger proposes a mission; what happens next depends on the
 * autonomy level — Draft suggests, Supervised queues for approval, Autopilot starts the internal
 * analysis only. External actions always wait for a person.
 */
export type TriggerKind = "deadline" | "new-evidence" | "exception" | "regulator-letter" | "condition-change" | "overdue-corrective" | "amendment";

export interface Trigger { kind: TriggerKind; site: string; mission: string; reason: LText; behaviour: LText }

const behaviour = (a: Autonomy): LText =>
  a === "draft" ? t("แนะนำให้ผู้ใช้เริ่มเอง", "Suggested — the user starts it")
    : a === "supervised" ? t("เข้าคิวรออนุมัติ", "Queued for approval")
      : t("เริ่มการวิเคราะห์ภายในอัตโนมัติ การกระทำภายนอกรออนุมัติ", "Internal analysis starts automatically; external actions wait for approval");

const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

export function evaluateTriggers(sites: SiteInput[], today: string, autonomy: Autonomy, opts: { newEvidence?: string[]; regulatorLetters?: string[]; runs?: MissionRun[]; rulesetEffective?: string; lastReportApproved?: string } = {}): Trigger[] {
  const out: Trigger[] = [];
  const b = behaviour(autonomy);
  for (const s of sites) {
    const { periods } = monitoringPeriods(s.profile, s.year);
    for (const p of periods) {
      const d = days(today, p.due);
      if (d >= 0 && d <= 120) out.push({ kind: "deadline", site: s.id, mission: "F01", reason: t(`${s.name.th}: ครบกำหนดส่งรายงานผลการปฏิบัติตามในอีก ${d} วัน (${p.due})`, `${s.name.en}: monitoring report due in ${d} days (${p.due})`), behaviour: b });
    }
    const ex = s.measurements.filter((m) => m.period === String(s.year) && m.state === "value" && m.value !== null && m.limit?.max !== undefined && m.value > m.limit.max);
    if (ex.length) out.push({ kind: "exception", site: s.id, mission: "F04", reason: t(`${s.name.th}: ค่า${ex.map((m) => measureTopic(m.param)).join(", ")}เกินเกณฑ์ ${ex.length} ค่า`, `${s.name.en}: ${ex.length} ${ex.map((m) => measureTopic(m.param)).join(", ")} exceedance(s)`), behaviour: b });
    for (const c of s.profile.permitConditions ?? []) if (days(c.effective, today) <= 90 && days(c.effective, today) >= -30) out.push({ kind: "condition-change", site: s.id, mission: "F03", reason: t(`${s.name.th}: เงื่อนไขใหม่ ${c.id} มีผล ${c.effective}`, `${s.name.en}: new condition ${c.id} effective ${c.effective}`), behaviour: b });
    if (opts.newEvidence?.includes(s.id)) out.push({ kind: "new-evidence", site: s.id, mission: "F03", reason: t(`${s.name.th}: มีหลักฐานใหม่ที่ยืนยันแล้ว`, `${s.name.en}: new verified evidence`), behaviour: b });
    if (opts.regulatorLetters?.includes(s.id)) out.push({ kind: "regulator-letter", site: s.id, mission: "F05", reason: t(`${s.name.th}: ได้รับหนังสือจาก กกพ. ผ่านช่องทางที่อนุญาต`, `${s.name.en}: an ERC letter arrived through an authorised source`), behaviour: b });
  }
  for (const r of opts.runs ?? []) for (const h of r.humanTasks.filter((x) => x.verify && x.status !== "done")) {
    if (days(r.createdAt.slice(0, 10), today) > 30) out.push({ kind: "overdue-corrective", site: h.site, mission: "F04", reason: t(`งานแก้ไขค้างเกิน 30 วัน: ${h.title.th}`, `Corrective task overdue (30+ days): ${h.title.en}`), behaviour: b });
  }
  if (opts.rulesetEffective && opts.lastReportApproved && opts.rulesetEffective > opts.lastReportApproved) {
    for (const s of sites) out.push({ kind: "amendment", site: s.id, mission: "F03", reason: t(`${s.name.th}: มีการแก้ไขกฎหลังรายงานที่อนุมัติล่าสุด — รายงานเดิมไม่ถูกแก้ย้อนหลัง`, `${s.name.en}: rules amended after the last approved report — the approved report is not rewritten`), behaviour: b });
  }
  return out;
}
