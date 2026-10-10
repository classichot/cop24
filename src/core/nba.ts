import { t } from "./i18n-text";
import type { Gap, LText, PreflightResult } from "./types";

/**
 * Next Best Action — the single thing that, if done now, moves the draft to the
 * next gate. Derived from gaps and preflight, never hand-written.
 */
export interface NextBestAction {
  title: LText;
  why: LText;
  route: string;
  cta: LText;
}

export function nextBestAction(gaps: Gap[], preflight: PreflightResult): NextBestAction {
  const materialEvidence = gaps.filter((g) => g.source === "evidence" && g.severity === "material" && g.status !== "closed");
  if (materialEvidence.length) {
    return {
      title: t(`ปิดหลักฐานที่เป็นสาระสำคัญ ${materialEvidence.length} รายการ แล้วร่างจะผ่านเกณฑ์ “หลักฐานครบ”`, `Close ${materialEvidence.length} material evidence gap(s) and the draft passes "evidence complete"`),
      why: t("เป็นสิ่งเดียวที่กั้นไม่ให้ร่างเลื่อนสถานะไปขั้น “พร้อมให้ผู้มีคุณวุฒิรับรอง”", "It is the only thing keeping the draft from moving to \"ready to certify\""),
      route: "/evidence",
      cta: t("ดูรายการหลักฐานที่ขาด →", "See missing evidence →"),
    };
  }
  const failing = preflight.layers.find((l) => l.status === "bad");
  if (failing) {
    return {
      title: t(`แก้ชั้นตรวจ “${failing.name.th}” ที่ยังไม่ผ่าน`, `Fix the failing "${failing.name.en}" check`),
      why: failing.detail,
      route: "/preflight",
      cta: t("เปิดผลตรวจก่อนยื่น →", "Open preflight →"),
    };
  }
  if (preflight.gate < 3) {
    return {
      title: t("ส่งร่างให้ผู้มีคุณวุฒิรับรอง", "Send the draft for qualified certification"),
      why: t("หลักฐานครบและผ่านการตรวจอัตโนมัติแล้ว", "Evidence is complete and automated checks pass"),
      route: "/studio",
      cta: t("เปิดสตูดิโอ →", "Open studio →"),
    };
  }
  return {
    title: t("อนุมัติให้ยื่นและส่งออกชุดเอกสาร", "Approve to file and export the submission bundle"),
    why: t("ทุกเกณฑ์ผ่านแล้ว", "Every gate has passed"),
    route: "/preflight",
    cta: t("ส่งออกชุดเอกสาร →", "Export bundle →"),
  };
}
