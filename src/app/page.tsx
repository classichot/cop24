"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/state/AppState";
import { ATTENTION_BY_ROLE } from "@/data/roles";
import { Cells, Kicker, SectionHead, Stat, Tag } from "@/components/ui";
import { CopilotBox } from "@/components/ux/Copilot";
import { MissionCard } from "@/components/ux/MissionCard";
import { ExplainThis, ResultInterpreter } from "@/components/ux/parts";
import { useUx } from "@/components/ux/useUx";
import { missionsForRole, type MissionStatus } from "@/core/ux/catalog";
import { recommendedActions } from "@/core/ux/guidance";

type Filter = "all" | "in-progress" | "waiting-for-me" | "ai-working" | "completed";
const matches = (f: Filter, s: MissionStatus) => f === "all" || s === f || (f === "in-progress" && (s === "waiting-for-me" || s === "ai-working"));

/**
 * §14 Universal Home: A Ask 24 · B Recommended actions · C My missions · D Attention required ·
 * E Management snapshot. Contributors see “things you need to do” first and no management view.
 */
export default function HomePage() {
  const { role, L, tx, snap } = useApp();
  const ctx = useUx();
  const [filter, setFilter] = useState<Filter>("all");
  const missions = missionsForRole(ctx, 6);
  const shown = missions.filter((m) => matches(filter, m.status));
  const attention = ATTENTION_BY_ROLE[role];
  const actions = recommendedActions(ctx, snap.nba);
  const contributor = role === "contributor";
  const count = (f: Filter) => missions.filter((m) => matches(f, m.status)).length;

  const attentionBlock = (
    <div>
      <SectionHead
        title={contributor ? tx("สิ่งที่คุณต้องทำ", "Things you need to do") : tx("ต้องการความสนใจจากคุณ", "Attention required")}
        tag="Section D"
        note={contributor ? tx("เฉพาะงานที่ถูกขอจากคุณ ไม่ต้องรู้จักส่วนอื่นของระบบ", "Only what was asked of you — you don't need to know the rest of the system.") : tx("แสดงเฉพาะข้อยกเว้น ความเสี่ยง ข้อมูลที่ขาด และสิ่งที่รออนุมัติ — ไม่ใช่รายการงานทั้งหมด", "Only exceptions, risks, missing data and approvals — not every task.")}
      />
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
  );

  return (
    <div className="page">
      <Kicker>{tx("หน้าหลัก / ASK 24", "Home / ASK 24")}</Kicker>
      <h1 className="title title-xl">{tx("คุณต้องการทำอะไรให้สำเร็จ?", "What would you like to achieve?")}</h1>
      <p className="text-muted lead" style={{ maxWidth: 680 }}>
        {tx("บอกเป้าหมายเป็นภาษาธรรมดา COP24 จะเข้าใจ เลือกภารกิจ ตรวจว่ามีข้อมูลอะไรแล้วและขาดอะไร แล้ววางแผนให้ — ไม่ต้องรู้จักเมนูหรือศัพท์เฉพาะ", "Say your goal in plain words. COP24 works out the mission, checks what data you have and what's missing, and plans the work — no menus or jargon to learn.")}
      </p>

      <section className="panel ask-panel" aria-label="Section A · Ask 24">
        <CopilotBox large />
      </section>

      {contributor && <><hr className="hr hr-section" />{attentionBlock}</>}

      <hr className="hr hr-section" />
      <SectionHead title={tx("สิ่งที่แนะนำให้ทำตอนนี้", "Recommended actions")} tag="Section B" note={tx("เลือกจากสถานะจริง กำหนดเวลา และบทบาทของคุณ", "Chosen from live status, deadlines and your role.")} />
      <Cells min={230} style={{ marginTop: 12 }}>
        {actions.map((a, i) => (
          <Link key={i} href={a.href} className="tile tile-sm" style={{ minHeight: 132 }}>
            <span className="tile-num">{i === 0 ? tx("สำคัญที่สุด · Next Best Action", "Most important · Next Best Action") : `0${i + 1}`}</span>
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{L(a.title)}</span>
            <span className="muted tiny" style={{ lineHeight: 1.5, flex: 1 }}>{L(a.why)}</span>
            <span className="tile-cta">{L(a.cta)}</span>
          </Link>
        ))}
      </Cells>

      <hr className="hr hr-section" />
      <SectionHead title={tx("ภารกิจของฉัน", "My missions")} tag="Section C" />
      <div className="row filter-row" role="tablist" aria-label={tx("กรองภารกิจ", "Filter missions")}>
        {([["all", tx("ทั้งหมด", "All")], ["in-progress", tx("กำลังดำเนินการ", "In progress")], ["waiting-for-me", tx("รอคุณ", "Waiting for me")], ["ai-working", tx("AI กำลังทำงาน", "AI working")], ["completed", tx("เสร็จแล้ว", "Completed")]] as [Filter, string][]).map(([f, label]) => (
          <button key={f} type="button" role="tab" aria-selected={filter === f} className={`chip${filter === f ? " on" : ""}`} onClick={() => setFilter(f)}>{label} <span className="muted">{count(f)}</span></button>
        ))}
      </div>
      <div className="mcard-grid">
        {shown.map((m) => <MissionCard key={m.mission.id} view={m} showApp={m.mission.app !== "cop24"} />)}
        {!shown.length && <div className="dashed muted small">{tx("ไม่มีภารกิจในกลุ่มนี้", "No missions in this group")}</div>}
      </div>

      {!contributor && (
        <>
          <hr className="hr hr-section" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 28 }}>
            {attentionBlock}
            <div>
              <SectionHead title={tx("ภาพรวมสำหรับผู้บริหาร", "Management snapshot")} tag="Section E" note={tx("ตัวเลขน้อยที่สุดที่ยังตอบได้ว่าเราพร้อมยื่นหรือยัง — พร้อมคำอธิบายว่าแปลว่าอะไร", "The fewest numbers that still answer “are we ready to file?” — each one explained.")} />
              <Cells min={130}>
                <Stat label={<>{tx("ความพร้อมหลักฐาน", "Evidence readiness")} <ExplainThis id="readiness" label="" /></>} value={`${ctx.readiness}%`} sub={tx(`${ctx.evidenceProven} จาก ${ctx.evidenceRequired} รายการ`, `${ctx.evidenceProven} of ${ctx.evidenceRequired} items`)} color="var(--color-accent-700)" />
                <Stat label={tx("ประเด็นค้าง", "Open issues")} value={ctx.openGaps} sub={<span className="ink-bad">{ctx.materialGaps} {tx("รายการเป็นสาระสำคัญ", "material")}</span>} />
                <Stat label={tx("รอคุณอนุมัติ", "Awaiting you")} value={ctx.chaptersReview + ctx.chaptersDrafting + ctx.conflicts} sub={tx("บทและค่าที่ต้องตัดสิน", "chapters and values to decide")} />
                <Stat label={tx("กำหนดถัดไป", "Next deadline")} value={ctx.nextDeadline?.days ?? "—"} sub={ctx.nextDeadline ? tx(`วัน · ${ctx.nextDeadline.label.th}`, `days · ${ctx.nextDeadline.label.en}`) : undefined} />
              </Cells>
              <div style={{ marginTop: 16 }}>
                <ResultInterpreter kind="readiness" compact />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
