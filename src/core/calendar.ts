import { t } from "./i18n-text";
import { TODAY, daysUntil } from "./dates";
import type { CalendarEvent, ObligationInstance } from "./types";

/**
 * Compliance Calendar — Workflow & Execution Engine output.
 * Every obligation with a due date becomes a dated event; packs may add
 * extra events (sampling rounds, hearings, meetings) through the tenant data.
 */
export function buildCalendar(instances: ObligationInstance[], extra: CalendarEvent[] = []): CalendarEvent[] {
  const fromRegister: CalendarEvent[] = instances
    .filter((i) => i.nextDue)
    .map((i) => ({
      id: `cal:${i.key}`,
      date: i.nextDue!,
      entityId: i.entityId,
      packId: i.packId,
      domain: i.domain,
      obligationId: i.obligation.id,
      kind: i.obligation.frequency === "once" ? "review" : "submission",
      label: i.obligation.title,
      status: i.status,
    }));
  return [...fromRegister, ...extra].sort((a, b) => a.date.localeCompare(b.date));
}

export const upcoming = (events: CalendarEvent[], days: number, today = TODAY) =>
  events.filter((e) => {
    const d = daysUntil(e.date, today);
    return d >= 0 && d <= days;
  });

export const overdue = (events: CalendarEvent[], today = TODAY) => events.filter((e) => daysUntil(e.date, today) < 0);

export const describeKind = (kind: CalendarEvent["kind"]) =>
  ({
    submission: t("ยื่นรายงาน", "Submission"),
    sampling: t("เก็บตัวอย่าง", "Sampling"),
    test: t("ทดสอบการควบคุม", "Control test"),
    review: t("ทบทวน", "Review"),
    hearing: t("รับฟังความคิดเห็น", "Hearing"),
    meeting: t("ประชุม", "Meeting"),
  })[kind];
