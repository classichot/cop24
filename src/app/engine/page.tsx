"use client";

import Link from "next/link";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, Tag } from "@/components/ui";
import { ENGINES } from "@/core/engine";
import { APPS } from "@/packs";

const ROUTE_FOR: Record<string, string> = { regulation: "/obligations", applicability: "/start", workflow: "/calendar", evidence: "/evidence", document: "/evidence", control: "/controls", change: "/changes", reporting: "/factory", agent: "/missions" };

export default function EnginePage() {
  const { L, tx, snap, data } = useApp();
  const live: Record<string, string> = {
    regulation: `${snap.instances.length} ${tx("ข้อผูกพันที่มีผล", "obligations in force")}`,
    applicability: `${snap.applicability.filter((a) => a.applicable).length}/${snap.applicability.length} ${tx("การประเมินเข้าข่าย", "evaluations applicable")}`,
    workflow: `${snap.calendar.length} ${tx("เหตุการณ์ · เกตขั้นที่", "events · gate stage")} ${snap.preflight.gate}`,
    evidence: `${snap.evidenceScore.readiness}% ${tx("ความพร้อม", "readiness")} · ${data.evidence.length} ${tx("รายการ", "items")}`,
    document: `${data.evidence.filter((e) => e.requestedOn).length} ${tx("คำขอเปิดอยู่", "open requests")} · rulepack ${data.report.rulepackVersion} ${tx("ตรึงแล้ว", "pinned")}`,
    control: `${snap.controlStats.effectiveness}% ${tx("ประสิทธิผล", "effective")} · ${snap.preflight.layers.length} ${tx("ชั้นตรวจ", "preflight layers")}`,
    change: `${snap.impacts.length} ${tx("การเปลี่ยนแปลง", "changes")} · ${snap.impacts.reduce((n, i) => n + i.obligations.length, 0)} ${tx("ข้อผูกพันกระทบ", "obligations hit")}`,
    reporting: `${data.report.chapters.length} ${tx("บท", "chapters")} · ${data.facts.sourced}/${data.facts.total} ${tx("ข้อเท็จจริงมีแหล่ง", "facts sourced")}`,
    agent: `4 ${tx("เอเจนต์", "agents")} · ${tx("QA veto เปิดอยู่", "QA veto active")}`,
  };

  return (
    <div className="page page-wide">
      <PageHead kicker={tx("เครื่องยนต์หลัก / COP24 CORE ENGINE v1", "COP24 Core Engine v1")} title={tx("เก้าเครื่องยนต์ที่ทุกแอป 24 ใช้ร่วมกัน", "Nine engines every 24 app shares")} lead={tx("นี่คือชั้นโครงสร้างพื้นฐานของทั้ง 24 ecosystem สร้างเป็นโมดูล TypeScript ล้วน (src/core) ที่ไม่รู้จักโดเมนใดเลย — ความรู้เรื่อง CoP, 56-1, PDPA หรือราคาโอนอยู่ในแพ็ก (src/packs) ส่วนแอปแต่ละตัวนำ UI และการคำนวณของตัวเองมาวางทับ หยุดสร้างเครื่องจักรการปฏิบัติตามซ้ำทุกผลิตภัณฑ์", "This is the infrastructure layer of the whole 24 ecosystem: pure TypeScript modules (src/core) that know no domain. Knowledge of CoP, 56-1, PDPA or transfer pricing lives in packs (src/packs); each app layers its own UI and calculations on top. The compliance machinery is built once.")} />

      <div style={{ marginTop: 22, overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0, minWidth: 720 }}>
          <div className="cells" style={{ gridTemplateColumns: "repeat(6,1fr)" }}>
            {APPS.filter((a) => a.id !== "cop24").map((a) => (
              <div key={a.id} className="cell cell-bg" style={{ padding: 12, borderTop: `4px solid ${a.accent}` }}>
                <div className="heading" style={{ fontSize: 15 }}>{a.name}</div>
                <div className="muted tiny" style={{ lineHeight: 1.4 }}>{tx("UI · การคำนวณ · ภารกิจเฉพาะทาง", "UI · calculations · domain missions")}</div>
                <Tag k={a.status === "live" ? "ok" : "cond"} style={{ marginTop: 6 }}>{a.status === "live" ? tx("บน COP24", "on COP24") : tx("แผนงาน", "planned")}</Tag>
              </div>
            ))}
            <div className="cell" style={{ gridColumn: "1 / -1", padding: "8px 14px", textAlign: "center" }}><span className="label">{tx("▼ แพ็กความรู้เฉพาะโดเมน (src/packs) · ", "▼ domain knowledge packs (src/packs) · ")}{data.packs.length} {tx("ชุดกฎ", "packs")} ▼</span></div>
            <div className="cell" style={{ gridColumn: "1 / -1", padding: "8px 14px", textAlign: "center", background: "var(--color-accent-100)" }}><span className="label" style={{ color: "var(--color-accent-700)" }}>COP24 Core Engine (src/core) — {tx("เครื่องยนต์ 9 ตัวด้านล่าง", "the nine engines below")}</span></div>
          </div>
        </div>
      </div>

      <Cells min={300} style={{ marginTop: 0, borderTop: 0 }}>
        {ENGINES.map((e, i) => (
          <Link key={e.id} href={ROUTE_FOR[e.id]} className="tile" style={{ minHeight: 0, gap: 6, padding: 18 }}>
            <span className="tile-num">{String(i + 1).padStart(2, "0")} · {e.id}</span>
            <span className="heading" style={{ fontSize: 17, lineHeight: 1.25 }}>{L(e.name)}</span>
            <span className="small muted-7" style={{ lineHeight: 1.6 }}>{L(e.role)}</span>
            <span className="tiny" style={{ color: "var(--color-accent-700)", fontWeight: 600 }}>{tx("ขับเคลื่อน", "Powers")}: {L(e.capability)}</span>
            <span className="muted tiny" style={{ lineHeight: 1.5 }}>{tx("รับ", "In")}: {L(e.inputs)} → {tx("ให้", "Out")}: {L(e.outputs)}</span>
            <span className="code" style={{ borderTop: "1px solid var(--color-divider)", paddingTop: 6, marginTop: 2 }}>{live[e.id]}</span>
          </Link>
        ))}
      </Cells>

      <hr className="hr" style={{ margin: "30px 0 18px" }} />
      <h3 style={{ margin: "0 0 10px", fontSize: 21 }}>{tx("สายข้อมูลใน Snapshot เดียว", "The data flow of one snapshot")}</h3>
      <div className="panel" style={{ fontSize: 13, lineHeight: 1.9 }}>
        <div className="code">packs → <strong>evaluateApplicability</strong>(entity) → <strong>buildRegister</strong> → ObligationInstance[]</div>
        <div className="code">evidence → <strong>scoreEvidence</strong> (exists · valid · proves) → status per obligation → <strong>evidenceGuard</strong></div>
        <div className="code">controls + tests → <strong>buildControlViews</strong> → effectiveness</div>
        <div className="code">register + controls → <strong>deriveGaps</strong> → Gap[] (owner · due · remediation)</div>
        <div className="code">register + events → <strong>buildCalendar</strong> → CalendarEvent[]</div>
        <div className="code">RegChange → <strong>assessImpact</strong> → obligations · chapters · entities · proposed obligations</div>
        <div className="code">report + evidence + conflicts → <strong>runPreflight</strong> (9 layers) → gate stage 1–4</div>
        <div className="code">gaps + preflight → <strong>nextBestAction</strong> → {tx("สิ่งเดียวที่ควรทำต่อไป", "the one thing to do next")}</div>
        <div className="muted small" style={{ marginTop: 8 }}>{tx("ทดสอบด้วย `npm test` — ทุกเครื่องยนต์เป็นฟังก์ชันบริสุทธิ์ที่ไม่ขึ้นกับ UI", "Run `npm test` — every engine is a pure function with no UI dependency.")}</div>
      </div>
    </div>
  );
}
