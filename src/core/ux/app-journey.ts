import { t } from "../i18n-text";
import type { LText } from "../types";

/**
 * The app journey — the one path through COP24 for a CoP report, from the start menu to the
 * finish menu. The journey page draws it, the left menu marks each item on it (START, 2, 3 … FINISH),
 * and every page on it shows where you are: the previous menu, this one, and the next.
 */
export type JourneyKind = "start" | "step" | "finish";
export interface JourneyStage {
  route: string;
  kind: JourneyKind;
  /** the stage's name on the journey */
  stage: LText;
  /** what you do on this menu */
  doHere: LText;
  /** how you know you can move on */
  doneWhen: LText;
  /** menus that help at this stage but are not on the main path */
  helpers?: string[];
}

export const APP_JOURNEY: JourneyStage[] = [
  {
    route: "/", kind: "start", stage: t("เริ่ม — บอกเป้าหมาย", "Start — say the goal"),
    doHere: t("เลือกโรงไฟฟ้า แล้วบอกเป้าหมายกับ Copilot เช่น “เตรียมรายงาน CoP ประจำรอบของลพบุรี 1”", "Pick the plant and tell the Copilot your goal, e.g. “prepare the periodic CoP report for Lopburi 1”"),
    doneWhen: t("Copilot เลือกภารกิจและบอกข้อมูลที่ยังขาด", "The Copilot has picked the mission and listed the missing data"),
    helpers: ["#ask", "/missions", "/start"],
  },
  {
    route: "/ingest", kind: "step", stage: t("นำเข้าเอกสาร", "Import the documents"),
    doHere: t("วางไฟล์ โฟลเดอร์ หรือ ZIP ทั้งหมดครั้งเดียว AI อ่าน จัดหมวด และสกัดค่า", "Drop every file, folder or ZIP once; the AI reads, sorts and extracts the values"),
    doneWhen: t("ความพร้อมของหลักฐานขึ้น และตรวจค่าที่ AI ไม่มั่นใจครบแล้ว", "Evidence readiness is shown and you have reviewed the values the AI was unsure of"),
  },
  {
    route: "/evidence", kind: "step", stage: t("ปิดช่องว่างหลักฐาน", "Close the evidence gaps"),
    doHere: t("อนุมัติคำขอเอกสารที่ AI ร่างไว้ และติดตามจนได้รับครบ", "Approve the evidence requests the AI drafted and follow them up until everything is in"),
    doneWhen: t("ไม่มีหลักฐานที่จำเป็นค้างอยู่", "No required evidence is outstanding"),
    helpers: ["/gaps", "/calendar"],
  },
  {
    route: "/factory", kind: "step", stage: t("สร้างร่างรายงาน", "Generate the draft"),
    doHere: t("เลือกโรงไฟฟ้าและรายงาน แล้วกด “สร้างรายงาน — คลิกเดียว”", "Pick the plant and the report and press “Generate report — one click”"),
    doneWhen: t("ร่างครบทุกบท บทที่ไม่มีหลักฐานถูกกั้นไว้อย่างเปิดเผย", "Every section is drafted; sections without evidence are openly blocked"),
    helpers: ["/agi"],
  },
  {
    route: "/my-work", kind: "step", stage: t("ตัดสินใจและอนุมัติ", "Decide and approve"),
    doHere: t("ตัดสินค่าที่ขัดแย้ง ตอบคำถามที่ AI ส่งมา และอนุมัติตามจุดอนุมัติ", "Settle conflicting values, answer what the AI asked and approve at each gate"),
    doneWhen: t("ไม่มีงานที่รอคุณ", "Nothing is waiting for you"),
  },
  {
    route: "/studio", kind: "step", stage: t("ตรวจทานรายบท", "Review chapter by chapter"),
    doHere: t("อ่านแต่ละบทกับหลักฐาน แก้ไขถ้าจำเป็น แล้วอนุมัติ", "Read each chapter against its evidence, edit if needed, approve it"),
    doneWhen: t("ทุกบทอนุมัติแล้ว", "Every chapter is approved"),
    helpers: ["/report-quality"],
  },
  {
    route: "/preflight", kind: "step", stage: t("ตรวจก่อนยื่น", "Preflight check"),
    doHere: t("ดูผลตรวจ 9 ชั้น และแก้สิ่งที่กั้นการยื่นทีละข้อ", "Read the 9-layer check and clear the filing blockers one by one"),
    doneWhen: t("ผลตรวจขึ้นว่า “พร้อมยื่น”", "Preflight says “ready to file”"),
  },
  {
    route: "/outputs", kind: "finish", stage: t("จบ — ลงนามและยื่น", "Finish — sign and file"),
    doHere: t("ส่งออกชุดยื่น ให้ผู้มีคุณวุฒิลงนาม แล้วยื่นผ่านช่องทางของ กกพ. ด้วยตัวเอง", "Export the filing package, have the qualified person sign it, and file it yourself through the ERC's channel"),
    doneWhen: t("ยื่นแล้วและเก็บหลักฐานการรับเรื่องจาก กกพ.", "Filed, with the ERC's acknowledgement kept on record"),
    helpers: ["/audit"],
  },
];

export const journeyIndex = (route: string) => APP_JOURNEY.findIndex((s) => s.route === route);
export const journeyStage = (route: string) => APP_JOURNEY[journeyIndex(route)];
/** the marker the left menu shows on a journey item: START, 2 … 7, FINISH */
export const journeyMarker = (route: string): string => {
  const i = journeyIndex(route);
  if (i < 0) return "";
  const s = APP_JOURNEY[i];
  return s.kind === "start" ? "START" : s.kind === "finish" ? "FINISH" : String(i + 1);
};
/** the stage a helper menu belongs to, so off-path pages can point back to the journey */
export const helperOf = (route: string) => APP_JOURNEY.find((s) => s.helpers?.includes(route));
