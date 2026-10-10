"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/state/AppState";
import { ATTENTION_BY_ROLE, MISSIONS_BY_ROLE } from "@/data/roles";
import { Callout, Cells, Glyph, Kicker, SectionHead, Stat, Tag } from "@/components/ui";
import { daysUntil } from "@/core/dates";

export default function HomePage() {
  const { role, L, tx, snap, data, entityId } = useApp();
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const missions = MISSIONS_BY_ROLE[role];
  const attention = ATTENTION_BY_ROLE[role];
  const entityGaps = snap.gaps.filter((g) => g.entityId === entityId && g.status !== "closed");
  const material = entityGaps.filter((g) => g.severity === "material").length;
  const awaiting = data.report.chapters.filter((c) => c.state === "drafting").length + 1;
  const hearing = data.extraEvents.find((e) => e.kind === "hearing");
  const daysToHearing = hearing ? daysUntil(hearing.date) : 0;

  return (
    <div className="page">
      <Kicker>{tx("หน้าหลัก / ASK 24", "Home / ASK 24")}</Kicker>
      <h1 className="title title-xl">{tx("คุณต้องการทำสิ่งใด?", "What do you need to get done?")}</h1>
      <p className="text-muted lead" style={{ maxWidth: 660 }}>
        {tx("พิมพ์เป้าหมายเป็นภาษาธรรมดา COP24 จะระบุข้อกำหนดที่บังคับใช้ ตรวจว่ามีหลักฐานอะไรอยู่แล้ว และวางลำดับงานให้เอง โดยไม่ต้องรู้จักโครงสร้างเมนูของระบบ", "Type a goal in plain language. COP24 finds the obligations that bind, checks what evidence already exists and sequences the work — you never need to learn the menu.")}
      </p>

      <div className="panel" style={{ marginTop: 20, padding: 16 }}>
        <div className="row" style={{ gap: 10, alignItems: "stretch" }}>
          <input className="input" value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && router.push("/missions")} placeholder={tx("เช่น ผมต้องเตรียมรายงาน CoP ขั้นต้นสำหรับโครงการโซลาร์ที่ลพบุรี", "e.g. I need to prepare the preliminary CoP report for the Lopburi solar project")} style={{ flex: "1 1 360px", minHeight: 46, fontSize: 15, background: "var(--color-bg)" }} />
          <Link href="/missions" className="btn btn-primary" style={{ minHeight: 46, paddingInline: 20 }}>{tx("ให้ 24 Copilot จัดการ →", "Let 24 Copilot handle it →")}</Link>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <Link href="/factory" className="btn btn-secondary btn-sm btn-plain">{tx("จัดทำรายงาน CoP ขั้นต้นให้ครบทั้งฉบับ", "Draft the whole preliminary CoP report")}</Link>
          <Link href="/evidence" className="btn btn-secondary btn-sm btn-plain">{tx("บอกหน่อยว่าผมยังขาดเอกสารอะไร", "Tell me what evidence I'm missing")}</Link>
          <Link href="/xray" className="btn btn-secondary btn-sm btn-plain">{tx("ตรวจรายงานที่ที่ปรึกษาทำไว้", "Check the report my consultant wrote")}</Link>
          <Link href="/universe" className="btn btn-secondary btn-sm btn-plain">{tx("กฎหมายอะไรบ้างที่บังคับใช้กับกลุ่มเรา", "Which laws bind our group?")}</Link>
          <Link href="/start" className="btn btn-secondary btn-sm btn-plain">{tx("ผมไม่รู้ว่าต้องเริ่มตรงไหน", "I don't know where to start")}</Link>
        </div>
      </div>

      <hr className="hr hr-section" />
      <SectionHead title={tx("สามสิ่งที่คนส่วนใหญ่มาทำที่ COP24", "The three things people come to COP24 for")} tag="Section B · Recommended actions" />
      <Cells min={248} style={{ marginTop: 16 }}>
        <Link href="/factory" className="tile">
          <span className="tile-num">01 · One-Click</span>
          <span className="tile-title">{tx("สร้างรายงานฉบับเต็ม", "Generate a complete report")}</span>
          <span className="tile-body">{tx("AI ประกอบร่างรายงานตามแบบของหน่วยงานกำกับจากหลักฐานที่มีอยู่ — CoP, 56-1, Local File — พร้อมรายการสิ่งที่ยังขาด", "AI assembles a draft to the regulator's template from existing evidence — CoP, 56-1, local file — with the list of what is still missing.")}</span>
          <span className="tile-cta">{tx("เริ่มสร้าง →", "Start →")}</span>
        </Link>
        <Link href="/studio" className="tile">
          <span className="tile-num">02 · Studio</span>
          <span className="tile-title">{tx("เปิดสตูดิโอรายงาน", "Open the Report Studio")}</span>
          <span className="tile-body">{tx("ร่าง ตรวจ แก้ไข และอนุมัติทีละบท พร้อมเห็นข้อกำหนดและหลักฐานที่อ้างอิงอยู่ข้างกัน", "Draft, review, edit and approve chapter by chapter with the binding obligation and its evidence beside the text.")}</span>
          <span className="tile-cta">{tx("เปิดสตูดิโอ →", "Open studio →")}</span>
        </Link>
        <Link href="/xray" className="tile">
          <span className="tile-num">03 · X-Ray</span>
          <span className="tile-title">{tx("ตรวจรายงานที่มีอยู่", "X-ray an existing report")}</span>
          <span className="tile-body">{tx("อัปโหลดรายงานที่มีอยู่ รับผลประเมินช่องว่างรายบท ข้อความที่ไม่มีหลักฐานรองรับ และเอกสารที่ขาด", "Upload a report and get chapter gaps, unsupported statements and missing documents.")}</span>
          <span className="tile-cta">{tx("อัปโหลดและตรวจ →", "Upload & check →")}</span>
        </Link>
      </Cells>

      <hr className="hr hr-section" />
      <SectionHead title={tx("ภารกิจของฉัน", "My missions")} tag="Section C · My missions" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(282px,1fr))", gap: 16, marginTop: 16 }}>
        {missions.map((m) => (
          <div key={m.title.en} className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div className="heading" style={{ fontSize: 17, lineHeight: 1.25 }}>{L(m.title)}</div>
              <Tag k={m.k}>{L(m.status)}</Tag>
            </div>
            <Cells min={92} thin>
              <Stat bg className="cell-xs" label={tx("AI ทำได้", "AI can do")} value={m.ai} size="xs" />
              <Stat bg className="cell-xs" label={tx("ความพร้อมข้อมูล", "Data ready")} value={m.data} size="xs" />
              <Stat bg className="cell-xs" label={tx("เวลาที่คุณใช้", "Your time")} value={L(m.time)} size="xs" />
            </Cells>
            <div className="stack" style={{ gap: 5 }}>
              {m.req.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 7, fontSize: 12, lineHeight: 1.45 }}><Glyph k={r.k}>{r.g}</Glyph><span className="muted-7">{L(r.t)}</span></div>
              ))}
            </div>
            <Link href={m.href} className="btn btn-primary btn-block">{L(m.cta)}</Link>
          </div>
        ))}
      </div>

      <hr className="hr hr-section" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 28 }}>
        <div>
          <SectionHead title={tx("ต้องการความสนใจจากคุณ", "Needs your attention")} tag="Section D" note={tx("แสดงเฉพาะข้อยกเว้น ความเสี่ยง ข้อมูลที่ขาด และสิ่งที่รออนุมัติ — ไม่ใช่รายการงานทั้งหมด", "Only exceptions, risks, missing data and approvals — not every task.")} />
          <div style={{ borderTop: "2px solid var(--color-divider)" }}>
            {attention.map((a) => (
              <div key={a.title.en} className="list-item">
                <Tag k={a.k}>{L(a.kind)}</Tag>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{L(a.title)}</div>
                  <div className="muted small" style={{ marginTop: 2, lineHeight: 1.5 }}>{L(a.note)}</div>
                </div>
                <Link href={a.href} className="btn btn-ghost btn-sm" style={{ whiteSpace: "nowrap" }}>{L(a.cta)}</Link>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionHead title={tx("ภาพรวมสำหรับผู้บริหาร", "Executive overview")} tag="Section E" note={tx("ตัวเลขน้อยที่สุดที่ยังตอบได้ว่าเราพร้อมยื่นหรือยัง", "The fewest numbers that still answer: are we ready to file?")} />
          <Cells min={130}>
            <Stat label={tx("ความพร้อมหลักฐาน", "Evidence readiness")} value={`${snap.evidenceScore.readiness}%`} sub={tx("+14% จากสัปดาห์ที่แล้ว", "+14% vs last week")} color="var(--color-accent-700)" />
            <Stat label={tx("ประเด็นค้าง", "Open issues")} value={entityGaps.length} sub={<span className="ink-bad">{material} {tx("รายการเป็นสาระสำคัญ", "material")}</span>} />
            <Stat label={tx("รอคุณอนุมัติ", "Awaiting you")} value={awaiting} sub={tx("บทที่ 3 และหน้าปก", "Chapter 3 and cover")} />
            <Stat label={tx("กำหนดยื่นถัดไป", "Next deadline")} value={daysToHearing} sub={tx("วัน · ก่อนเวทีรับฟังความคิดเห็น", "days · to the public hearing")} />
          </Cells>
          <div style={{ marginTop: 16 }}>
            <Callout kicker={tx("สิ่งที่ควรทำต่อไป · Next Best Action", "Next Best Action")} title={L(snap.nba.title)} body={L(snap.nba.why)} cta={L(snap.nba.cta)} href={snap.nba.route} />
          </div>
        </div>
      </div>
    </div>
  );
}
