"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, Tag } from "@/components/ui";
import { DOMAINS } from "@/packs";

export default function EasyStartPage() {
  const { L, tx, snap, data, entityId, setEntityId } = useApp();
  const [why, setWhy] = useState(false);
  const entity = data.entities.find((e) => e.id === entityId)!;
  const results = snap.applicability.filter((a) => a.entityId === entityId);
  const applicable = results.filter((r) => r.applicable);
  const ruledOut = results.filter((r) => !r.applicable);
  const packOf = (id: string) => data.packs.find((p) => p.id === id)!;
  const totalObligations = applicable.reduce((n, r) => n + packOf(r.packId).obligationCount, 0);
  const assumptions = applicable.flatMap((r) => r.assumptions);
  const domainOf = (id: string) => DOMAINS.find((d) => d.id === packOf(id).domain)!;

  return (
    <div className="page page-narrow">
      <PageHead explain={["applicability"]} kicker={tx("เริ่มต้นใช้งาน / EASY START", "Getting started / EASY START")} title={tx("เล่าเรื่ององค์กรให้ฟัง แล้วเราจะบอกว่ากฎหมายอะไรบังคับใช้", "Tell us about the organisation and we'll say which rules bind")} lead={tx("คุณไม่ต้องรู้ว่าเข้าข่าย CoP, 56-1, PDPA, ราคาโอน หรือ Pillar Two — ตอบไม่กี่ข้อหรืออัปโหลดใบอนุญาต Applicability Engine จะวินิจฉัยทุกโดเมนพร้อมกันและอธิบายเหตุผล", "You don't need to know whether CoP, 56-1, PDPA, transfer pricing or Pillar Two applies — answer a few questions or upload a licence and the Applicability Engine diagnoses every domain at once, with reasons.")} />
      <hr className="hr" style={{ margin: "26px 0" }} />

      <div className="stack">
        <div className="step">
          <div className="step-num step-done">✓</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="heading" style={{ fontSize: 18 }}>1 · {tx("บอกเราเกี่ยวกับหน่วยงาน", "Tell us about the entity")}</div>
            <div className="row row-center" style={{ marginTop: 8 }}>
              <select className="input" value={entityId} onChange={(e) => setEntityId(e.target.value)} style={{ maxWidth: 360 }}>
                {data.entities.map((e) => <option key={e.id} value={e.id}>{L(e.name)}</option>)}
              </select>
            </div>
            <Cells min={150} thin style={{ marginTop: 12 }}>
              <div className="cell cell-bg cell-tight"><div className="label-9">{tx("ประเภท", "Type")}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{L(entity.sector)}</div></div>
              <div className="cell cell-bg cell-tight"><div className="label-9">{tx("จดทะเบียนในตลาด", "Listed")}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{entity.listed ? tx("ใช่ · SET", "Yes · SET") : tx("ไม่", "No")}</div></div>
              <div className="cell cell-bg cell-tight"><div className="label-9">{tx("พนักงาน", "Employees")}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{entity.employees.toLocaleString()}</div></div>
              <div className="cell cell-bg cell-tight"><div className="label-9">{tx("รายได้", "Revenue")}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{entity.revenueTHB ? `฿${(entity.revenueTHB / 1e6).toLocaleString()}M` : "—"}</div></div>
              {entity.hasPowerPlant && <div className="cell cell-bg cell-tight"><div className="label-9">{tx("โรงไฟฟ้า", "Plant")}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{entity.plantTech} · {entity.plantMW} MW</div></div>}
              <div className="cell cell-bg cell-tight"><div className="label-9">{tx("ข้อมูลส่วนบุคคล", "Personal data")}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{entity.processesPersonalData ? tx("ประมวลผล", "Processes") : tx("ไม่", "No")}</div></div>
            </Cells>
          </div>
        </div>

        <div className="step">
          <div className="step-num step-done">✓</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="heading" style={{ fontSize: 18 }}>2 · {tx("AI วินิจฉัยระเบียบที่บังคับใช้ — ทุกโดเมนพร้อมกัน", "AI diagnoses the applicable regimes — every domain at once")}</div>
            <div className="panel" style={{ marginTop: 10 }}>
              <div className="row row-center" style={{ gap: 10 }}>
                <Tag k="ok" style={{ fontWeight: 600 }}>{tx(`เข้าข่าย ${applicable.length} ชุดกฎ`, `${applicable.length} packs apply`)}</Tag>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{tx(`ไม่เข้าข่าย ${ruledOut.length} ชุดกฎ · รวม ${totalObligations} ข้อผูกพัน`, `${ruledOut.length} ruled out · ${totalObligations} obligations in total`)}</span>
              </div>
              <Cells min={210} thin style={{ marginTop: 14 }}>
                {applicable.map((r) => {
                  const p = packOf(r.packId);
                  return (
                    <div key={r.packId} className="cell cell-bg cell-tight">
                      <div className="label-9">{L(domainOf(r.packId).short)} · {p.app.toUpperCase()}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, lineHeight: 1.35 }}>{L(p.name)}</div>
                      <div className="muted tiny">{p.id} · v{p.version} · {p.obligationCount} {tx("ข้อผูกพัน", "obligations")}{r.assumptions.length ? ` · ${tx("ข้อสมมติ", "assumption")} ${r.assumptions.length}` : ""}</div>
                    </div>
                  );
                })}
              </Cells>
              <button className="btn btn-ghost" onClick={() => setWhy(!why)} style={{ marginTop: 12, fontSize: 13 }}>{tx("ทำไม AI จึงสรุปแบบนี้? ▾", "Why did the AI conclude this? ▾")}</button>
              {why && (
                <>
                  <div style={{ borderTop: "2px solid var(--color-divider)", marginTop: 12, paddingTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18 }}>
                    <div>
                      <div className="label" style={{ marginBottom: 5 }}>{tx("เกณฑ์ที่ตรง", "Criteria matched")}</div>
                      <div className="small muted-7" style={{ lineHeight: 1.6 }}>
                        {applicable.map((r) => <div key={r.packId}><strong>{r.packId}</strong>: {r.matched.map((c) => L(c.label)).join(" · ")}</div>)}
                      </div>
                    </div>
                    <div>
                      <div className="label" style={{ marginBottom: 5 }}>{tx("ข้อสมมติ", "Assumptions")}</div>
                      <div className="small muted-7" style={{ lineHeight: 1.6 }}>{assumptions.length ? assumptions.map((a, i) => <div key={i}>{L(a)}</div>) : tx("ไม่มี", "None")}</div>
                    </div>
                    <div>
                      <div className="label" style={{ marginBottom: 5 }}>{tx("ทางเลือกอื่นที่ตัดออก", "Alternatives ruled out")}</div>
                      <div className="small muted-7" style={{ lineHeight: 1.6 }}>
                        {ruledOut.map((r) => <div key={r.packId}><strong>{packOf(r.packId).id}</strong> — {r.excludedBy.length ? L(r.excludedBy[0].label) : r.failed.map((c) => L(c.label)).join(", ")}</div>)}
                      </div>
                    </div>
                  </div>
                  {assumptions.length > 0 && <div className="note note-warn" style={{ marginTop: 14 }}>{tx("ข้อสมมติเป็นสาระสำคัญ โปรดยืนยันก่อนรับรองรายงาน COP24 จะไม่ถือว่าเรื่องนี้ได้รับการพิสูจน์แล้ว", "Assumptions are material — confirm them before certifying. COP24 will not treat them as proven.")}</div>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="step">
          <div className="step-num step-cur">3</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="heading" style={{ fontSize: 18 }}>3 · {tx("ยกเอกสารทั้งกองเข้ามาครั้งเดียว", "Bring the whole pile of documents in at once")}</div>
            <div className="small muted-7" style={{ marginTop: 4, lineHeight: 1.6 }}>{tx("ลากโฟลเดอร์ทั้งหมดเข้ามา — PDF, Word, Excel, รูปถ่าย, ZIP หรือเชื่อม Google Drive / SharePoint / ERP ก็ได้ Evidence Engine จะจัดหมวดหมู่ ตั้งชื่อ และผูกเข้ากับข้อผูกพันของทุกโดเมนเอง", "Drag the whole folder in — PDF, Word, Excel, photos, ZIP, or connect Google Drive / SharePoint / ERP. The Evidence Engine classifies, names and binds each file to obligations across every domain.")}</div>
            <div className="dashed" style={{ marginTop: 12 }}>
              <div className="heading" style={{ fontSize: 17 }}>{tx("ลากไฟล์มาวางที่นี่", "Drop files here")}</div>
              <div className="muted small" style={{ marginTop: 4 }}>{tx("หรือเลือกช่องทางนำเข้า", "or choose a source")}</div>
              <div className="row" style={{ justifyContent: "center", marginTop: 14 }}>
                {[tx("เลือกไฟล์จากเครื่อง", "Choose files"), tx("เชื่อม Google Drive", "Connect Google Drive"), tx("เชื่อม SharePoint", "Connect SharePoint"), tx("เชื่อม ERP / HRIS", "Connect ERP / HRIS"), tx("นำเข้ารายงานเดิม", "Import a prior report")].map((l) => <Link key={l} href="/evidence" className="btn btn-secondary" style={{ background: "var(--color-bg)" }}>{l}</Link>)}
              </div>
            </div>
          </div>
        </div>

        <div className="step" style={{ opacity: .5, paddingBottom: 0 }}>
          <div className="step-num step-todo">4</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="heading" style={{ fontSize: 18 }}>4 · {tx("ตอบเฉพาะคำถามที่เอกสารตอบไม่ได้", "Answer only what the documents can't")}</div>
            <div className="small muted-7" style={{ marginTop: 4, lineHeight: 1.6 }}>{tx("โดยเฉลี่ยเหลือ 8–12 คำถาม จากข้อมูลที่ต้องใช้ทั้งหมดกว่า 400 รายการ", "Typically 8–12 questions remain out of 400+ data points.")}</div>
          </div>
        </div>
      </div>

      <hr className="hr" style={{ margin: "26px 0" }} />
      <div className="row">
        <Link href="/evidence" className="btn btn-primary">{tx("ไปที่ศูนย์ควบคุมเอกสาร →", "Go to Document Control →")}</Link>
        <Link href="/universe" className="btn btn-secondary">{tx("ดูจักรวาลการปฏิบัติตามทั้งกลุ่ม", "See the group's Compliance Universe")}</Link>
        <Link href="/factory" className="btn btn-secondary">{tx("ข้ามไปสร้างร่างเลย", "Skip to drafting")}</Link>
      </div>
    </div>
  );
}
