"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/state/AppState";
import { ATTENTION_BY_ROLE } from "@/data/roles";
import { Cells, PageHead, SectionHead, Stat, Tag } from "@/components/ui";
import { ExplainThis } from "@/components/ux/parts";
import { useUx } from "@/components/ux/useUx";

/**
 * My Work — §13 exception-based human work and the §17 Notification / Exception Center.
 * Only what genuinely needs a person: decisions, approvals, missing data and exceptions.
 * Everything else is the AI's job and does not appear here.
 */
export default function MyWorkPage() {
  const { L, tx, fd, data, snap, entityId, role } = useApp();
  const ctx = useUx();
  const [decided, setDecided] = useState<Record<string, { pick: string; why: string }>>({});
  const [draft, setDraft] = useState<Record<string, { pick?: string; why: string }>>({});

  const gaps = snap.gaps.filter((g) => g.entityId === entityId && g.status !== "closed");
  const missing = gaps.filter((g) => g.source === "evidence");
  const exceptions = gaps.filter((g) => g.source !== "evidence" && g.severity !== "minor");
  const approvals = data.report.chapters.filter((c) => c.state === "review" || c.state === "drafting");
  const tasks = role === "contributor" ? ATTENTION_BY_ROLE.contributor : [];
  const decisions = data.conflicts.filter((c) => !decided[c.field.en]);

  return (
    <div className="page page-mid">
      <PageHead kicker={tx("งานของฉัน / MY WORK", "My work")} title={tx("เฉพาะงานที่ต้องใช้คน", "Only the work that needs a person")} lead={tx("AI นำเข้า จัดหมวด คำนวณ กระทบยอด และร่างให้แล้ว ที่เหลือในหน้านี้คือการตัดสินใจ การอนุมัติ ข้อมูลที่ขาด และข้อยกเว้น", "The AI has already ingested, classified, calculated, reconciled and drafted. What is left here is decisions, approvals, missing data and exceptions.")} />

      <Cells min={150} style={{ marginTop: 18 }}>
        <Stat label={tx("ตัดสินใจ", "Decisions")} value={decisions.length} sub={tx("ค่าที่ขัดแย้ง", "conflicting values")} />
        <Stat label={tx("อนุมัติ", "Approvals")} value={approvals.length} sub={tx("บทที่ AI ร่าง", "AI-drafted chapters")} />
        <Stat label={tx("ข้อมูลที่ขาด", "Missing data")} value={missing.length} sub={tx("คำขอที่ร่างไว้แล้ว", "requests already drafted")} />
        <Stat label={tx("ข้อยกเว้น", "Exceptions")} value={exceptions.length} sub={tx("ความเสี่ยงและการควบคุม", "risks and controls")} />
      </Cells>

      {tasks.length > 0 && (
        <>
          <hr className="hr hr-section" />
          <SectionHead title={tx("สิ่งที่ถูกขอจากคุณ", "What you've been asked for")} note={tx("ทำทีละรายการ — ไม่ต้องรู้จักส่วนอื่นของระบบ", "One at a time — you don't need the rest of the system.")} />
          <div className="worklist">
            {tasks.map((a) => (
              <div key={a.title.en} className="list-item">
                <Tag k={a.k}>{L(a.kind)}</Tag>
                <div style={{ flex: 1 }}><b>{L(a.title)}</b><div className="muted small">{L(a.note)}</div></div>
                <Link href={a.href} className="btn btn-primary btn-sm">{L(a.cta)}</Link>
              </div>
            ))}
          </div>
        </>
      )}

      <hr className="hr hr-section" />
      <SectionHead title={tx("การตัดสินใจที่ต้องเป็นคุณ", "Decisions that need you")} tag={tx("การอนุมัติโดยมนุษย์", "Human approval")} note={tx("AI ไม่เลือกค่าแทนคุณ เพราะเป็นการเปลี่ยนสิ่งที่รายงานบอกหน่วยงานกำกับ — เลือกค่าและให้เหตุผล ระบบจะเก็บไว้ในร่องรอยการตรวจสอบ", "The AI won't choose for you, because it changes what the report tells the regulator. Pick a value and give a reason; it is kept in the audit trail.")} />
      {decisions.length === 0 && <div className="note note-ok">{tx("ไม่มีการตัดสินใจค้าง", "No decisions pending")}</div>}
      {decisions.map((c) => {
        const d = draft[c.field.en] ?? { why: "" };
        return (
          <div key={c.field.en} className="panel" style={{ marginBottom: 12 }}>
            <div className="heading" style={{ fontSize: 16 }}>{L(c.field)}: {c.a} {tx("หรือ", "or")} {c.b}?</div>
            <div className="row" style={{ marginTop: 10 }}>
              {[{ v: c.a, where: c.whereA }, { v: c.b, where: c.whereB }].map((o) => (
                <button key={o.v} type="button" className={`choice${d.pick === o.v ? " on" : ""}`} onClick={() => setDraft({ ...draft, [c.field.en]: { ...d, pick: o.v } })}>
                  <b>{o.v}</b><span className="muted tiny">{L(o.where)}</span>
                </button>
              ))}
            </div>
            <input className="input" style={{ marginTop: 10 }} placeholder={tx("เหตุผล (จำเป็น) เช่น ตามแบบผังฉบับแก้ไขล่าสุด rev.C", "Reason (required), e.g. per the latest layout rev.C")} value={d.why} onChange={(e) => setDraft({ ...draft, [c.field.en]: { ...d, why: e.target.value } })} />
            <div className="row row-center" style={{ marginTop: 10 }}>
              <button type="button" className="btn btn-primary btn-sm" disabled={!d.pick || !d.why.trim()} onClick={() => setDecided({ ...decided, [c.field.en]: { pick: d.pick!, why: d.why } })}>{tx("ยืนยันการตัดสินใจ", "Confirm decision")}</button>
              <span className="muted tiny">{tx("ค่าที่ไม่ได้เลือกจะถูกเก็บไว้ ไม่ถูกลบ", "The other value is kept, not deleted")}</span>
            </div>
          </div>
        );
      })}
      {Object.entries(decided).map(([k, v]) => <div key={k} className="note note-ok" style={{ marginBottom: 8 }}>✓ {k}: {v.pick} — {v.why} <span className="muted">({tx("บันทึกในเบราว์เซอร์นี้สำหรับต้นแบบ", "kept in this browser for the prototype")})</span></div>)}

      <hr className="hr hr-section" />
      <SectionHead title={tx("รออนุมัติ", "Awaiting your approval")} note={tx("บทที่ AI ร่างจากหลักฐาน — อ่าน แก้ และอนุมัติในสตูดิโอ", "Chapters the AI drafted from evidence — read, edit and approve in the studio.")} />
      <div className="worklist">
        {approvals.map((c) => (
          <div key={c.id} className="list-item">
            <Tag k={c.state === "review" ? "warn" : "cond"}>{c.state === "review" ? tx("รอตรวจ", "Review") : tx("กำลังร่าง", "Drafting")}</Tag>
            <div style={{ flex: 1 }}><b>{tx("บทที่", "Chapter")} {c.num} · {L(c.title)}</b><div className="muted small">{L(c.meta)}{c.unresolved.length ? ` · ${c.unresolved.length} ${tx("ช่องยังไม่ยุติ", "unresolved")}` : ""}</div></div>
            <Link href="/studio" className="btn btn-primary btn-sm">{tx("เปิดบท", "Open chapter")}</Link>
          </div>
        ))}
      </div>

      <hr className="hr hr-section" />
      <SectionHead title={<>{tx("ข้อมูลที่ขาด", "Missing data")} <ExplainThis id="evidence-layers" /></>} tag={tx("คำขอข้อมูล", "Missing data requests")} note={tx("AI ร่างคำขอถึงผู้รับผิดชอบไว้แล้ว คุณแค่อนุมัติให้ส่ง", "The AI has drafted the request to each owner — you just approve sending it.")} />
      <div className="worklist">
        {missing.map((g) => (
          <div key={g.id} className="list-item">
            <Tag k={g.severity === "material" ? "bad" : "warn"}>{g.severity === "material" ? tx("สาระสำคัญ", "Material") : tx("ขาด", "Missing")}</Tag>
            <div style={{ flex: 1 }}><b>{L(g.cause)}</b><div className="muted small">{tx("ผู้รับผิดชอบ", "Owner")}: {L(g.owner)} · {tx("ภายใน", "due")} {fd(g.due)}</div></div>
            <Link href="/evidence" className="btn btn-secondary btn-sm btn-plain">{tx("ตรวจคำขอ", "Review request")}</Link>
          </div>
        ))}
        {!missing.length && <div className="note note-ok">{tx("ไม่มีข้อมูลที่ขาด", "Nothing missing")}</div>}
      </div>

      <hr className="hr hr-section" />
      <SectionHead title={<>{tx("ข้อยกเว้นและความเสี่ยง", "Exceptions and risks")} <ExplainThis id="material-gap" /></>} tag={tx("ศูนย์ข้อยกเว้น", "Exception center")} />
      <div className="worklist">
        {exceptions.map((g) => (
          <div key={g.id} className="list-item">
            <Tag k={g.severity === "material" ? "bad" : "warn"}>{g.source === "control" ? tx("การควบคุม", "Control") : g.source === "change" ? tx("กฎเปลี่ยน", "Rule change") : tx("ตรวจก่อนยื่น", "Preflight")}</Tag>
            <div style={{ flex: 1 }}><b>{L(g.cause)}</b><div className="muted small">{L(g.remediation)}</div></div>
            <Link href="/gaps" className="btn btn-ghost btn-sm">{tx("ดู", "Open")}</Link>
          </div>
        ))}
        {!exceptions.length && <div className="note note-ok">{tx("ไม่มีข้อยกเว้น", "No exceptions")}</div>}
      </div>
      <p className="muted tiny" style={{ marginTop: 18 }}>{tx(`AI ทำงานส่วนที่เหลือของ${ctx.entityName.th}แล้ว — ${ctx.factsSourced} ข้อความมีแหล่งอ้างอิง หลักฐาน ${ctx.evidenceProven} รายการพิสูจน์ได้`, `The AI has handled the rest for ${ctx.entityName.en} — ${ctx.factsSourced} claims sourced, ${ctx.evidenceProven} evidence items proven.`)}</p>
    </div>
  );
}
