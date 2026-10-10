"use client";

import { useState } from "react";
import { useApp } from "@/state/AppState";
import { PageHead, Seg, Tag } from "@/components/ui";
import { AUDIT } from "@/data/tenant";
import type { AuditEvent } from "@/core/types";

export default function AuditPage() {
  const { L, tx } = useApp();
  const [kind, setKind] = useState<"all" | AuditEvent["kind"]>("all");
  const rows = AUDIT.filter((a) => kind === "all" || a.kind === kind);
  return (
    <div className="page page-mid">
      <PageHead kicker={tx("ร่องรอยการตรวจสอบ / AUDIT TRAIL", "Audit Trail")} title={tx("ทุกสิ่งที่ AI หรือคนทำ ถูกบันทึกพร้อมเครื่องยนต์ที่ทำ", "Everything AI or a person did, recorded with the engine that did it")} lead={tx("ร่องรอยนี้คือสิ่งที่ผู้ตรวจสอบภายนอกและหน่วยงานกำกับจะขอดู: ใครร่าง ใครอนุมัติ ชุดกฎเวอร์ชันใดที่ตรึงไว้ และ AI ปฏิเสธจะทำอะไรบ้าง — รูปแบบเดียวกันทุกแอป 24", "This is what an external auditor or regulator asks to see: who drafted, who approved, which rulepack version was pinned and what the AI refused to do — one format across every 24 app.")} />

      <div className="row row-center" style={{ marginTop: 22 }}>
        <Seg<"all" | AuditEvent["kind"]> name="kind" value={kind} onChange={setKind} options={[{ v: "all", label: tx("ทั้งหมด", "All") }, { v: "ai", label: tx("เอเจนต์ AI", "AI agents") }, { v: "human", label: tx("มนุษย์", "Humans") }, { v: "system", label: tx("ระบบ", "System") }]} />
        <button className="btn btn-secondary" style={{ marginLeft: "auto" }}>{tx("ส่งออกสำหรับผู้ตรวจสอบ (CSV / PDF)", "Export for auditors (CSV / PDF)")}</button>
      </div>

      <div style={{ marginTop: 16, borderTop: "2px solid var(--color-divider)" }}>
        {rows.map((a) => (
          <div key={a.id} className="list-item" style={{ gap: 16 }}>
            <div className="muted small" style={{ width: 120, flex: "none", lineHeight: 1.4 }}>{a.at}<div className="code tiny">{a.id}</div></div>
            <Tag k={a.kind === "ai" ? "warn" : a.kind === "human" ? "ok" : "info"}>{a.kind === "ai" ? "AI" : a.kind === "human" ? tx("มนุษย์", "Human") : tx("ระบบ", "System")}</Tag>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{L(a.actor)} · {L(a.action)}: {L(a.object)}</div>
              <div className="muted small" style={{ marginTop: 2, lineHeight: 1.5 }}>{L(a.detail)}</div>
            </div>
            <span className="app-chip" style={{ flex: "none" }}>{a.engine}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
