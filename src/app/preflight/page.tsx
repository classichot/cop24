"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/state/AppState";
import { Mark, PageHead, Tag } from "@/components/ui";

export default function PreflightPage() {
  const { L, tx, snap } = useApp();
  const [open, setOpen] = useState<string>("doc");
  const pf = snap.preflight;
  const gates = [tx("ร่างโดย AI แล้ว", "AI drafted"), tx("หลักฐานครบ", "Evidence complete"), tx("พร้อมรับรอง", "Ready to certify"), tx("อนุมัติให้ยื่น", "Approved to file")];

  return (
    <div className="page page-mid">
      <PageHead kicker={tx("ตรวจก่อนยื่น / PREFLIGHT VALIDATOR", "Preflight Validator")} title={tx("ผลตรวจ 9 ชั้น", "Nine-layer check")} lead={tx("ผ่านการตรวจอัตโนมัติไม่เท่ากับได้รับความเห็นชอบจากหน่วยงานกำกับ — ผลนี้บอกได้แค่ว่ารายงานไม่มีข้อบกพร่องที่ตรวจพบได้ด้วยเครื่อง", "Passing automated checks is not regulatory approval — it only says the report has no defect a machine can detect.")} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 0, border: "2px solid var(--color-divider)", marginTop: 22 }}>
        <div className="cell" style={{ flex: "1 1 220px", padding: 20 }}>
          <div className="label">{tx("สถานะร่างปัจจุบัน", "Current draft status")}</div>
          <div className="heading" style={{ fontSize: 26, lineHeight: 1.2, marginTop: 4 }}>{L(pf.gateLabel)}</div>
          <div className="small muted-7" style={{ marginTop: 6, lineHeight: 1.55 }}>{pf.gate === 1 ? tx("ยังยกระดับเป็น “พร้อมให้ผู้มีคุณวุฒิรับรอง” ไม่ได้", "Cannot yet move to \"ready for qualified certification\"") : ""} · {pf.blockers} {tx("ชั้นไม่ผ่าน", "failing")} · {pf.observations} {tx("ข้อสังเกต", "observations")}</div>
        </div>
        <div className="cell" style={{ flex: "2 1 380px", padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>{tx("เกณฑ์การปล่อยผ่าน", "Release gate")}</div>
          <div className="gate">
            {gates.map((g, i) => {
              const n = i + 1;
              const cls = n <= pf.gate ? "gate-on" : n === pf.gate + 1 ? "gate-next" : "gate-off";
              return <div key={i} className={cls}><div style={{ fontSize: 10, opacity: .85 }}>{tx("ขั้นที่", "Stage")} {n}</div><div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{g}</div></div>;
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, borderTop: "2px solid var(--color-divider)" }}>
        {pf.layers.map((l, i) => (
          <div key={l.id} style={{ borderBottom: "1px solid var(--color-divider)" }}>
            <button onClick={() => setOpen(open === l.id ? "" : l.id)} style={{ width: "100%", display: "flex", gap: 14, alignItems: "center", background: "transparent", border: 0, padding: "15px 4px", cursor: "pointer", textAlign: "left", color: "inherit" }}>
              <Mark k={l.status} size="lg" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{i + 1}. {L(l.name)}</span>
                <span className="muted small" style={{ display: "block", marginTop: 2, lineHeight: 1.5 }}>{L(l.what)}</span>
              </span>
              <Tag k={l.status}>{L(l.statusLabel)}</Tag>
            </button>
            {open === l.id && (
              <div style={{ background: "var(--color-surface)", borderLeft: "3px solid var(--color-accent)", padding: "16px 18px", margin: "0 0 14px" }}>
                <div style={{ fontSize: 13, lineHeight: 1.75 }}>{L(l.detail)}</div>
                <div className="muted tiny" style={{ marginTop: 8 }}>{tx("อ้างอิง", "Reference")}: {L(l.ref)}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="row" style={{ marginTop: 24 }}>
        <Link href="/gaps" className="btn btn-primary">{tx("ไปปิดประเด็นที่ค้าง →", "Go close the open issues →")}</Link>
        <button className="btn btn-secondary">{tx("ส่งออกชุดเอกสารสำหรับยื่น", "Export submission bundle")}</button>
        <button className="btn btn-secondary">{tx("พิมพ์รายงานผลตรวจ", "Print preflight report")}</button>
      </div>
    </div>
  );
}
