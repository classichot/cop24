import { t } from "./i18n-text";
import { TODAY, addDays } from "./dates";
import type { ControlView } from "./controls";
import type { Gap, ObligationInstance, Severity } from "./types";

/**
 * Gap & Remediation.
 * Gaps are derived — from evidence that fails a layer, from controls that fail
 * their test, and from regulatory changes — and carry an owner, a due date and
 * a remediation. They never disappear on their own; a human closes them.
 */

const sevRank: Record<Severity, number> = { material: 0, major: 1, minor: 2 };

export function deriveGaps(instances: ObligationInstance[], controls: ControlView[], manual: Gap[] = []): Gap[] {
  const gaps: Gap[] = [...manual];
  let n = manual.length + 1;

  for (const i of instances) {
    for (const e of i.evidence) {
      const [exists, valid, proves] = e.layers;
      if (exists === 1 && valid === 1 && proves === 1) continue;
      const cause =
        exists === -1
          ? t(`ไม่พบ "${e.name.th}" ในระบบ`, `"${e.name.en}" not found in the system`)
          : valid === -1
            ? t(`"${e.name.th}" ใช้ไม่ได้: ${e.meta.th}`, `"${e.name.en}" is invalid: ${e.meta.en}`)
            : t(`"${e.name.th}" ยังต้องตรวจว่ารองรับข้อผูกพันจริง`, `"${e.name.en}" still needs review that it proves the obligation`);
      const remediation =
        exists === -1
          ? t("ส่งคำขอเอกสารที่ AI ร่างให้ไปยังผู้รับผิดชอบ และบันทึกเหตุผลหากยังไม่มี", "Send the AI-drafted evidence request to the owner; record the reason if it does not exist yet")
          : valid === -1
            ? t("ขอฉบับที่ลงนาม / ยังไม่หมดอายุ / ตรงรอบรายงาน", "Obtain a signed, unexpired, in-period version")
            : t("ให้ผู้มีคุณวุฒิยืนยันว่าเนื้อหาครอบคลุมข้อผูกพัน", "Have a qualified reviewer confirm the content covers the obligation");
      gaps.push({
        id: `G-${String(n++).padStart(3, "0")}`,
        key: i.key,
        entityId: i.entityId,
        obligationId: i.obligation.id,
        packId: i.packId,
        domain: i.domain,
        severity: exists === -1 || valid === -1 ? i.obligation.severity : "minor",
        source: "evidence",
        cause,
        remediation,
        owner: i.obligation.ownerRole,
        due: addDays(TODAY, exists === -1 ? 11 : 21),
        status: exists === -1 && e.requestedOn ? "in-progress" : "open",
      });
    }
  }

  for (const v of controls) {
    if (v.status !== "bad" && v.status !== "warn") continue;
    for (const obId of v.control.obligationIds) {
      const inst = instances.find((i) => i.obligation.id === obId);
      if (!inst) continue;
      gaps.push({
        id: `G-${String(n++).padStart(3, "0")}`,
        key: inst.key,
        entityId: inst.entityId,
        obligationId: obId,
        packId: inst.packId,
        domain: inst.domain,
        severity: v.status === "bad" ? "major" : "minor",
        source: "control",
        cause: t(`การควบคุม "${v.control.name.th}" ${v.lastTest?.note.th ?? ""}`, `Control "${v.control.name.en}" ${v.lastTest?.note.en ?? ""}`),
        remediation: t("แก้ไขการควบคุม ทดสอบซ้ำ และบันทึกผล", "Remediate the control, re-test and record the result"),
        owner: v.control.owner,
        due: addDays(TODAY, 30),
        status: "open",
      });
    }
  }

  return gaps.sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || a.due.localeCompare(b.due));
}
