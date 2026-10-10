"use client";

import Link from "next/link";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, Stat, Tag, readinessColor } from "@/components/ui";
import { PORTFOLIO } from "@/data/tenant";
import { daysUntil } from "@/core/dates";

export default function PortfolioPage() {
  const { L, tx, fd } = useApp();
  const due60 = PORTFOLIO.filter((p) => daysUntil(p.due) <= 60).length;
  const risky = PORTFOLIO.filter((p) => p.k === "bad").length;

  return (
    <div className="page page-wide">
      <PageHead kicker={tx("พอร์ตโฟลิโอ / PORTFOLIO & ADVISOR CENTER", "Portfolio & Advisor Center")} title={tx("หลายหน่วยงาน หลายลูกค้า หน้าจอเดียว", "Many entities, many clients, one screen")} lead={tx("สำหรับที่ปรึกษาและเจ้าของพอร์ต: เรียงตามความเสี่ยงที่จะยื่นไม่ทันหรือยื่นแล้วถูกตีกลับ ไม่ใช่เรียงตามตัวอักษร — และใช้ได้กับทุกโดเมนที่ COP24 ดูแล", "For advisors and portfolio owners: sorted by the risk of missing a deadline or being rejected, not alphabetically — across every domain COP24 covers.")} />

      <Cells min={170} style={{ marginTop: 22 }}>
        <Stat label={tx("หน่วยงานในพอร์ต", "Entities in portfolio")} value={14} size="md" />
        <Stat label={tx("ครบกำหนดใน 60 วัน", "Due within 60 days")} value={due60} size="md" />
        <Stat label={tx("มีความเสี่ยงถูกตีกลับ", "At risk of rejection")} value={risky} size="md" color="var(--st-bad)" />
        <Stat label={tx("รอคุณรับรอง", "Awaiting your certification")} value={7} size="md" />
      </Cells>

      <div className="table-wrap" style={{ marginTop: 20 }}>
        <table className="table" style={{ minWidth: 880 }}>
          <thead><tr><th style={{ width: "24%" }}>{tx("หน่วยงาน", "Entity")}</th><th style={{ width: "13%" }}>{tx("เทคโนโลยี", "Technology")}</th><th style={{ width: "17%" }}>{tx("รายงานที่ต้องยื่น", "Report due")}</th><th style={{ width: "18%" }}>{tx("ความพร้อม", "Readiness")}</th><th style={{ width: "13%" }}>{tx("กำหนดยื่น", "Deadline")}</th><th style={{ width: 130 }}>{tx("ความเสี่ยง", "Risk")}</th></tr></thead>
          <tbody>
            {PORTFOLIO.map((p) => (
              <tr key={p.name.en}>
                <td style={{ verticalAlign: "top" }}><div style={{ fontWeight: 600, lineHeight: 1.4 }}>{L(p.name)}</div><div className="muted tiny">{L(p.client)}</div></td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(p.tech)}</td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(p.report)}</td>
                <td style={{ verticalAlign: "top" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="bar" style={{ flex: 1, minWidth: 60 }}><div style={{ width: `${p.n}%`, background: readinessColor(p.n) }} /></div><span style={{ fontSize: 12, fontWeight: 600, minWidth: 34 }}>{p.n}%</span></div></td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{fd(p.due)}</td>
                <td style={{ verticalAlign: "top" }}><Tag k={p.k}>{L(p.risk)}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ marginTop: 22 }}>
        <Link href="/factory" className="btn btn-primary">{tx("สร้างร่างชุดให้ทุกหน่วยงานที่ครบกำหนด →", "Batch-draft every entity that is due →")}</Link>
        <button className="btn btn-secondary">{tx("เปิดพอร์ทัลลูกค้า", "Open client portal")}</button>
        <button className="btn btn-secondary">{tx("ส่งออกสรุปสถานะให้ผู้บริหาร", "Export executive summary")}</button>
      </div>
    </div>
  );
}
