import { t } from "./i18n-text";
import type { Control, ControlTest, LText, Status } from "./types";

/**
 * Control / Test Engine.
 * Controls are the recurring activities that keep an obligation met; tests are
 * the evidence that the control actually operated. Effectiveness is derived
 * from the latest test, never asserted by hand.
 */
export interface ControlView {
  control: Control;
  lastTest: ControlTest | null;
  status: Status;
  label: LText;
}

export function latestTest(control: Control, tests: ControlTest[]): ControlTest | null {
  const own = tests.filter((x) => x.controlId === control.id).sort((a, b) => b.date.localeCompare(a.date));
  return own[0] ?? null;
}

export function controlStatus(test: ControlTest | null): { status: Status; label: LText } {
  if (!test || test.result === "not-tested") return { status: "cond", label: t("ยังไม่ทดสอบ", "Not tested") };
  if (test.result === "effective") return { status: "ok", label: t("มีประสิทธิผล", "Effective") };
  if (test.result === "exception") return { status: "warn", label: t("พบข้อยกเว้น", "Exception") };
  return { status: "bad", label: t("ไม่มีประสิทธิผล", "Failed") };
}

export function buildControlViews(controls: Control[], tests: ControlTest[]): ControlView[] {
  return controls.map((c) => {
    const lastTest = latestTest(c, tests);
    const s = controlStatus(lastTest);
    return { control: c, lastTest, status: s.status, label: s.label };
  });
}

export function controlSummary(views: ControlView[]) {
  const total = views.length;
  const effective = views.filter((v) => v.status === "ok").length;
  const exceptions = views.filter((v) => v.status === "warn").length;
  const failed = views.filter((v) => v.status === "bad").length;
  const untested = views.filter((v) => v.status === "cond").length;
  const automated = views.filter((v) => v.control.automated).length;
  return { total, effective, exceptions, failed, untested, automated, effectiveness: total ? Math.round((effective / total) * 100) : 0 };
}
