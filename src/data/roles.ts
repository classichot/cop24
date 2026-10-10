import { t } from "@/core/i18n-text";
import type { LText, Status } from "@/core/types";
import type { Role } from "@/state/AppState";

export interface MissionCard {
  title: LText;
  status: LText;
  k: Status;
  ai: string;
  data: string;
  time: LText;
  cta: LText;
  href: string;
  req: { k: Status; g: string; t: LText }[];
}

export interface AttentionItem {
  kind: LText;
  k: Status;
  title: LText;
  note: LText;
  cta: LText;
  href: string;
}

export const MISSIONS_BY_ROLE: Record<Role, MissionCard[]> = {
  owner: [
    { title: t("จัดทำรายงาน CoP ขั้นต้น", "Prepare the preliminary CoP report"), status: t("AI กำลังทำงาน", "AI working"), k: "ok", ai: "87%", data: "72%", time: t("10 นาที", "10 min"), cta: t("ดำเนินภารกิจต่อ →", "Continue →"), href: "/factory", req: [{ g: "✓", k: "ok", t: t("ใบอนุญาตและแบบผังโครงการ", "Licence and site layout") }, { g: "✓", k: "ok", t: t("ผลตรวจอากาศและเสียง", "Air and noise results") }, { g: "!", k: "bad", t: t("ผลคุณภาพน้ำใต้ดิน ยังไม่มี", "Groundwater result still missing") }] },
    { title: t("ปิดหลักฐานที่ยังขาด", "Close the missing evidence"), status: t("รอคุณ", "Waiting on you"), k: "warn", ai: "40%", data: "—", time: t("15 นาที", "15 min"), cta: t("ดูรายการ →", "See list →"), href: "/evidence", req: [{ g: "!", k: "bad", t: t("2 รายการเป็นสาระสำคัญ", "2 items are material") }, { g: "✓", k: "ok", t: t("AI ร่างคำขอไว้ให้แล้ว", "AI has drafted the requests") }, { g: "→", k: "info", t: t("ส่งถึงหน่วยสิ่งแวดล้อมประจำไซต์", "Addressed to the site environmental unit") }] },
    { title: t("ทบทวน ROPA ตาม PDPA ของบริษัทแม่", "Refresh the parent's PDPA ROPA"), status: t("เกินกำหนด", "Overdue"), k: "bad", ai: "70%", data: "55%", time: t("20 นาที", "20 min"), cta: t("เปิดช่องว่าง →", "Open gap →"), href: "/gaps", req: [{ g: "✕", k: "bad", t: t("ไม่ได้ทบทวนมากว่า 12 เดือน", "Not reviewed for 12+ months") }, { g: "✓", k: "ok", t: t("AI สกัดระบบใหม่ 3 ระบบจาก IT asset list", "AI extracted 3 new systems from the IT asset list") }, { g: "→", k: "info", t: t("DPO ต้องยืนยันฐานทางกฎหมาย", "DPO must confirm legal bases") }] },
  ],
  consultant: [
    { title: t("ร่าง CoP ขั้นต้น 3 โครงการพร้อมกัน", "Draft 3 preliminary CoP reports at once"), status: t("AI กำลังทำงาน", "AI working"), k: "ok", ai: "82%", data: "69%", time: t("35 นาที", "35 min"), cta: t("เปิดคิวงาน →", "Open queue →"), href: "/portfolio", req: [{ g: "✓", k: "ok", t: t("ใช้เทมเพลตและสำนวนของสำนักงานคุณ", "Uses your firm's templates and voice") }, { g: "!", k: "warn", t: t("ลพบุรี 2 ขาดแบบผังล่าสุด", "Lopburi 2 lacks the latest layout") }, { g: "✓", k: "ok", t: t("ส่งออกแบรนด์ของบริษัทที่ปรึกษา", "Exports under your firm's brand") }] },
    { title: t("ตรวจรายงานที่ลูกค้าส่งมา", "X-ray a client's report"), status: t("พร้อมเริ่ม", "Ready"), k: "cond", ai: "90%", data: "—", time: t("8 นาที", "8 min"), cta: t("อัปโหลดและตรวจ →", "Upload & check →"), href: "/xray", req: [{ g: "✓", k: "ok", t: t("เทียบกับชุดกฎที่บังคับใช้จริง", "Against the pack that actually binds") }, { g: "✓", k: "ok", t: t("ได้รายงานช่องว่างรายบท", "Chapter-by-chapter gap report") }, { g: "→", k: "info", t: t("ใช้เป็นข้อเสนองานได้ทันที", "Doubles as a proposal") }] },
    { title: t("รับรองและปล่อยผ่าน 7 รายงาน", "Certify and release 7 reports"), status: t("รอคุณ", "Waiting on you"), k: "warn", ai: "—", data: "100%", time: t("20 นาที", "20 min"), cta: t("เปิดคิวรับรอง →", "Open certification queue →"), href: "/preflight", req: [{ g: "✓", k: "ok", t: t("ผ่านการตรวจ 9 ชั้นแล้ว 5 ฉบับ", "5 passed the 9-layer preflight") }, { g: "!", k: "bad", t: t("2 ฉบับยังมีหลักฐานไม่ครบ", "2 still have incomplete evidence") }, { g: "→", k: "info", t: t("ต้องลงนามโดยผู้มีคุณวุฒิ", "Needs a qualified signatory") }] },
  ],
  exec: [
    { title: t("สถานะการปฏิบัติตามของทั้งกลุ่ม", "Group-wide compliance status"), status: t("อัปเดตแล้ว", "Updated"), k: "ok", ai: "100%", data: "94%", time: t("3 นาที", "3 min"), cta: t("ดูภาพรวม →", "See overview →"), href: "/universe", req: [{ g: "✓", k: "ok", t: t("13 โดเมน · 8 ชุดกฎบังคับใช้", "13 domains · 8 packs in force") }, { g: "!", k: "bad", t: t("3 ช่องว่างเป็นสาระสำคัญ", "3 material gaps") }, { g: "→", k: "info", t: t("สรุปส่งบอร์ดได้ในคลิกเดียว", "Board summary in one click") }] },
    { title: t("อนุมัติรายงานที่รอลงนาม", "Approve reports awaiting signature"), status: t("รอคุณ", "Waiting on you"), k: "warn", ai: "—", data: "100%", time: t("10 นาที", "10 min"), cta: t("เปิดคิวอนุมัติ →", "Open approval queue →"), href: "/preflight", req: [{ g: "✓", k: "ok", t: t("ทุกฉบับผ่านการตรวจอัตโนมัติ", "All passed automated checks") }, { g: "→", k: "info", t: t("มีสรุปสิ่งที่เปลี่ยนจากฉบับก่อน", "Change summary vs prior version") }, { g: "→", k: "info", t: t("7 ฉบับรอลายมือชื่อ", "7 awaiting signature") }] },
    { title: t("ประเมินผลกระทบจากการแก้กฎใหม่", "Assess new regulatory changes"), status: t("AI กำลังทำงาน", "AI working"), k: "ok", ai: "95%", data: "88%", time: t("5 นาที", "5 min"), cta: t("ดูผลประเมิน →", "See assessment →"), href: "/changes", req: [{ g: "✓", k: "ok", t: t("ติดตามการแก้ไขระเบียบอัตโนมัติ", "Automatic change monitoring") }, { g: "!", k: "warn", t: t("Scope 3 ของ ก.ล.ต. กระทบปี 2570", "SEC Scope 3 rule hits FY2027") }, { g: "→", k: "info", t: t("มีข้อเสนอการแก้ไขรายบท", "Chapter-level change proposals ready") }] },
  ],
};

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
  exec: [
    { kind: t("ความเสี่ยง", "Risk"), k: "bad", title: t("3 หน่วยงานมีความเสี่ยงยื่นไม่ทันหรือถูกตีกลับ", "3 entities risk missing a deadline or rejection"), note: t("2 รายการโยงกับใบอนุญาตผลิตไฟฟ้า 1 รายการโยงกับ PDPA", "2 tied to generation licences, 1 to PDPA"), cta: t("ดูพอร์ต", "See portfolio"), href: "/portfolio" },
    { kind: t("รออนุมัติ", "Approval"), k: "warn", title: t("7 รายงานรอลายมือชื่อของคุณ", "7 reports await your signature"), note: t("ทุกฉบับผ่านการตรวจอัตโนมัติและมีสรุปสิ่งที่เปลี่ยนให้อ่านก่อน", "All passed automated checks and carry a change summary"), cta: t("เปิดคิว", "Open queue"), href: "/preflight" },
    { kind: t("กำหนดเวลา", "Deadline"), k: "cond", title: t("5 กำหนดยื่นภายใน 60 วัน ข้ามโดเมน", "5 deadlines within 60 days across domains"), note: t("ภาษี · CoP · PDPA · แรงงาน", "Tax · CoP · PDPA · labour"), cta: t("ดูปฏิทิน", "See calendar"), href: "/calendar" },
    { kind: t("กฎเปลี่ยน", "Rule change"), k: "cond", title: t("ก.ล.ต. เพิ่ม Scope 3 — กระทบ 56-1 ปี 2570", "SEC adds Scope 3 — affects 56-1 FY2027"), note: t("ยังไม่ต้องตัดสินใจในสัปดาห์นี้ แต่ควรรับทราบ", "No decision needed this week, but be aware"), cta: t("อ่านสรุป", "Read summary"), href: "/changes" },
  ],
};
