import { t } from "@/core/i18n-text";
import type { LText } from "@/core/types";
import type { Role } from "@/lib/access";

/** The four COP24 workspaces offered at sign-in (ACC24's mode cards, mapped to COP24 roles). */
export interface LoginRole { id: Role; code: string; name: LText; tag: LText; desc: LText; includes: LText[]; persona: { initials: string; name: string; role: string; email: string } }

export const LOGIN_ROLES: LoginRole[] = [
  {
    id: "owner", code: "01", name: t("เจ้าของโครงการ", "Owner"), tag: t("โรงไฟฟ้าของคุณ", "Your plants"),
    desc: t("ผู้รับใบอนุญาตที่ต้องยื่นรายงาน CoP — บอกเป้าหมาย แล้วทีม AI เตรียมรายงานให้คุณอนุมัติ", "The licensee who files CoP reports — say the goal and the AI team prepares the report for your approval."),
    includes: [t("24 Copilot และภารกิจ AGI", "24 Copilot and AGI missions"), t("นำเข้าเอกสารครั้งเดียว", "One-click data preparation"), t("ตรวจก่อนยื่นและสตูดิโอรายงาน", "Preflight and Report Studio")],
    persona: { initials: "NS", name: "Nattawut S.", role: "Regulatory Affairs, Lopburi Green Power", email: "nattawut@lgp.example" },
  },
  {
    id: "consultant", code: "02", name: t("ที่ปรึกษา", "Advisor"), tag: t("หลายลูกค้า", "Many clients"),
    desc: t("ที่ปรึกษาสิ่งแวดล้อมที่ทำรายงานให้หลายโครงการ — คิวงาน เอกซเรย์รายงาน และการรับรอง", "An environmental consultant preparing reports for many projects — queue, report X-ray and certification."),
    includes: [t("พอร์ตโฟลิโอหลายโครงการ", "Multi-project portfolio"), t("เอกซเรย์รายงานของลูกค้า", "Client report X-ray"), t("คิวรับรองและลงนาม", "Certification queue")],
    persona: { initials: "PK", name: "Ploy K.", role: "Senior consultant, EnviroConsult", email: "ploy@enviroconsult.example" },
  },
  {
    id: "exec", code: "03", name: t("ผู้บริหาร", "Executive"), tag: t("ภาพรวมกลุ่ม", "Group view"),
    desc: t("ผู้บริหารที่ต้องรู้ว่าพร้อมยื่นหรือยัง มีความเสี่ยงอะไร และต้องอนุมัติอะไร", "An executive who needs to know: are we ready to file, what is at risk, what needs my approval."),
    includes: [t("สถานะทั้งกลุ่ม", "Group-wide status"), t("คิวอนุมัติ", "Approval queue"), t("ผลกระทบจากกฎที่เปลี่ยน", "Rule-change impact")],
    persona: { initials: "ST", name: "Somsak T.", role: "Chief Executive, Lopburi Green Power", email: "somsak@lgp.example" },
  },
  {
    id: "contributor", code: "04", name: t("ผู้ให้ข้อมูล", "Contributor"), tag: t("งานที่ถูกขอ", "Assigned tasks"),
    desc: t("เจ้าหน้าที่ไซต์หรือห้องปฏิบัติการที่ส่งเอกสารตามคำขอ — เห็นเฉพาะงานของตัวเอง", "Site or laboratory staff who send what is requested — sees only their own tasks."),
    includes: [t("สิ่งที่ต้องทำ", "Things you need to do"), t("อัปโหลดตามคำขอ", "Upload what was asked"), t("ยืนยันข้อมูล", "Confirm data")],
    persona: { initials: "RW", name: "Ratchanee W.", role: "Site environmental officer, Lopburi 1", email: "ratchanee@lgp.example" },
  },
];
