import { t } from "@/core/i18n-text";
import type { LText, Status } from "@/core/types";
import type { Role } from "@/state/AppState";

export interface AttentionItem {
  kind: LText;
  k: Status;
  title: LText;
  note: LText;
  cta: LText;
  href: string;
}

export const ATTENTION_BY_ROLE: Record<Role, AttentionItem[]> = {
  owner: [
    { kind: t("ขาดหลักฐาน", "Missing evidence"), k: "bad", title: t("ผลวิเคราะห์คุณภาพน้ำใต้ดินของรอบนี้ยังไม่เข้าระบบ", "This period's groundwater result is not in the system"), note: t("กั้นไม่ให้บทที่ 3 และ 5 ปิดได้ · ส่งคำขอไปที่ไซต์แล้ว 3 วัน", "Blocks chapters 3 and 5 · request sent to site 3 days ago"), cta: t("ติดตาม", "Follow up"), href: "/evidence" },
    { kind: t("ข้อมูลขัดแย้ง", "Conflict"), k: "bad", title: t("กำลังผลิตติดตั้ง 48 MW กับ 45 MW ไม่ตรงกัน", "Installed capacity 48 MW vs 45 MW disagree"), note: t("ใบอนุญาตระบุ 48.0 MW แต่ตารางในบทที่ 5 ระบุ 45.0 MW", "Licence says 48.0 MW; Chapter 5 table says 45.0 MW"), cta: t("ตัดสิน", "Decide"), href: "/preflight" },
    { kind: t("เอกสารหมดอายุ", "Expired"), k: "warn", title: t("หนังสือรับรองห้องปฏิบัติการหมดอายุ 31 ส.ค. 2569", "Laboratory accreditation expired 31 Aug 2026"), note: t("ทำให้ผลวิเคราะห์ 3 ฉบับที่อ้างถึงใช้ไม่ได้", "Invalidates 3 cited analyses"), cta: t("ขอใหม่", "Request new"), href: "/evidence" },
    { kind: t("รออนุมัติ", "Approval"), k: "cond", title: t("บทที่ 3 รอคุณตรวจร่างจาก AI", "Chapter 3 awaits your review of the AI draft"), note: t("11 แหล่งอ้างอิง · 1 ช่องยังไม่ยุติ", "11 sources · 1 unresolved slot"), cta: t("เปิดบท", "Open chapter"), href: "/studio" },
  ],
  consultant: [
    { kind: t("ขาดหลักฐาน", "Missing evidence"), k: "bad", title: t("ลพบุรี 2 ยังไม่ได้รับแบบผังบริเวณฉบับล่าสุดจากลูกค้า", "Lopburi 2 still lacks the client's latest site layout"), note: t("ค้างมา 9 วัน · กระทบกำหนดส่งงาน 30 พ.ย.", "9 days outstanding · threatens the 30 Nov deadline"), cta: t("ทวงงาน", "Chase"), href: "/evidence" },
    { kind: t("ความเสี่ยง", "Risk"), k: "bad", title: t("3 รายงานในคิวมีโอกาสถูกหน่วยงานกำกับตีกลับสูง", "3 queued reports are likely to be rejected"), note: t("สาเหตุเดียวกันทั้งสามฉบับ: ข้อความอ้างผลตรวจวัดโดยไม่มีเอกสารแนบ", "Same cause in all three: measurements cited without attachments"), cta: t("ดูรายละเอียด", "Details"), href: "/portfolio" },
    { kind: t("รอรับรอง", "Certification"), k: "warn", title: t("7 รายงานรอผู้มีคุณวุฒิลงนาม", "7 reports await a qualified signatory"), note: t("5 ฉบับผ่านการตรวจ 9 ชั้นครบแล้ว", "5 have passed the 9-layer preflight"), cta: t("เปิดคิว", "Open queue"), href: "/preflight" },
    { kind: t("กฎเปลี่ยน", "Rule change"), k: "cond", title: t("มีการแก้ไขระเบียบที่กระทบลูกค้า 4 ราย", "A regulatory change affects 4 clients"), note: t("COP24 ระบุบทที่ต้องแก้และร่างข้อความเปลี่ยนแปลงไว้แล้ว", "COP24 has flagged the chapters and drafted the changes"), cta: t("ดูผลกระทบ", "See impact"), href: "/changes" },
  ],
  contributor: [
    { kind: t("ส่งเอกสาร", "Upload"), k: "bad", title: t("ส่งผลวิเคราะห์คุณภาพน้ำใต้ดินรอบนี้", "Upload this period's groundwater analysis"), note: t("ขอโดยฝ่ายกำกับดูแลกิจการ · ครบกำหนด 18 ต.ค.", "Requested by Regulatory Affairs · due 18 Oct"), cta: t("อัปโหลด", "Upload"), href: "/ingest" },
    { kind: t("ยืนยันข้อมูล", "Confirm"), k: "warn", title: t("ยืนยันกำลังผลิตติดตั้งตามแบบผังล่าสุด", "Confirm the installed capacity on the latest layout"), note: t("ใบอนุญาต 48.0 MW แต่แบบผัง 45.0 MW", "Licence 48.0 MW, layout 45.0 MW"), cta: t("ยืนยัน", "Confirm"), href: "/my-work" },
    { kind: t("ส่งเอกสาร", "Upload"), k: "warn", title: t("ส่งหนังสือรับรองห้องปฏิบัติการฉบับใหม่", "Send the renewed laboratory accreditation"), note: t("ฉบับเดิมหมดอายุ 31 ส.ค. 2569", "The current one expired 31 Aug 2026"), cta: t("อัปโหลด", "Upload"), href: "/ingest" },
    { kind: t("อนุมัติ", "Approve"), k: "cond", title: t("อนุมัติข้อมูลผู้รับกำจัดของเสียไตรมาส 3", "Approve the Q3 waste contractor data"), note: t("AI กรอกจากใบกำกับการขนส่งแล้ว รอคุณยืนยัน", "AI filled it from the manifests; awaiting your confirmation"), cta: t("ตรวจ", "Review"), href: "/my-work" },
  ],
  exec: [
    { kind: t("ความเสี่ยง", "Risk"), k: "bad", title: t("3 หน่วยงานมีความเสี่ยงยื่นไม่ทันหรือถูกตีกลับ", "3 entities risk missing a deadline or rejection"), note: t("2 รายการโยงกับใบอนุญาตผลิตไฟฟ้า 1 รายการโยงกับ PDPA", "2 tied to generation licences, 1 to PDPA"), cta: t("ดูพอร์ต", "See portfolio"), href: "/portfolio" },
    { kind: t("รออนุมัติ", "Approval"), k: "warn", title: t("7 รายงานรอลายมือชื่อของคุณ", "7 reports await your signature"), note: t("ทุกฉบับผ่านการตรวจอัตโนมัติและมีสรุปสิ่งที่เปลี่ยนให้อ่านก่อน", "All passed automated checks and carry a change summary"), cta: t("เปิดคิว", "Open queue"), href: "/preflight" },
    { kind: t("กำหนดเวลา", "Deadline"), k: "cond", title: t("5 กำหนดยื่นภายใน 60 วัน ข้ามโดเมน", "5 deadlines within 60 days across domains"), note: t("ภาษี · CoP · PDPA · แรงงาน", "Tax · CoP · PDPA · labour"), cta: t("ดูปฏิทิน", "See calendar"), href: "/calendar" },
    { kind: t("กฎเปลี่ยน", "Rule change"), k: "cond", title: t("ก.ล.ต. เพิ่ม Scope 3 — กระทบ 56-1 ปี 2570", "SEC adds Scope 3 — affects 56-1 FY2027"), note: t("ยังไม่ต้องตัดสินใจในสัปดาห์นี้ แต่ควรรับทราบ", "No decision needed this week, but be aware"), cta: t("อ่านสรุป", "Read summary"), href: "/changes" },
  ],
};
