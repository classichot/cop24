"use client";

import { useApp } from "@/state/AppState";
import { PageHead } from "@/components/ui";
import { HostDesk } from "@/components/auth/HostDesk";

/** Host desk as a page inside the app (also opens as a drawer from the login page). */
export default function HostDeskPage() {
  const { tx } = useApp();
  return (
    <div className="page page-mid">
      <PageHead kicker={tx("โต๊ะผู้ดูแลเดโม / HOST DESK", "Host desk")} title={tx("ให้ผู้เข้าชมทดลอง COP24 ด้วยลิงก์ที่หมดอายุเอง", "Let guests try COP24 with links that expire on their own")} lead={tx("สร้างลิงก์เดโมตามบทบาท ส่งทางอีเมลหรือ LINE และเพิกถอนได้ทุกเมื่อ ลิงก์สูงสุด 45 วัน", "Mint role-scoped demo links, send them by email or LINE and revoke them at any time. Links last at most 45 days.")} />
      <div style={{ marginTop: 18 }}><HostDesk variant="page" /></div>
    </div>
  );
}
