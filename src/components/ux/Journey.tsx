"use client";

import Link from "next/link";
import { useApp } from "@/state/AppState";
import type { Journey } from "@/core/ux/catalog";
import { AIWorking } from "./parts";

/**
 * §5 Guided Journey — Assess → Collect → Analyze → Recommend → Execute → Review → Complete,
 * using only the stages the mission needs. Always answers: where am I, what happens next,
 * what does AI need from me, what is AI doing, which decisions are mine.
 */
export function GuidedJourney({ j, title, continueHref, guide }: { j: Journey; title: string; continueHref?: string; guide?: boolean }) {
  const { L, tx } = useApp();
  const aiNow = j.next?.by === "ai";
  return (
    <section className="journey" aria-label={tx("เส้นทางภารกิจ", "Mission journey")}>
      <div className="journey-head">
        <div>
          <div className="label">{tx("ภารกิจ", "Mission")}</div>
          <h3 style={{ margin: "2px 0 0", fontSize: 21 }}>{title}</h3>
        </div>
        {j.current ? (
          <div className="journey-where">{tx(`ขั้น ${j.stepIndex} จาก ${j.totalSteps} — ${j.current.label.th}`, `Step ${j.stepIndex} of ${j.totalSteps} — ${j.current.label.en}`)}</div>
        ) : <div className="journey-where ink-ok">{tx("เสร็จสิ้นแล้ว", "Complete")}</div>}
      </div>

      <ol className="journey-stages">
        {j.stages.map((s, i) => (
          <li key={s.stage} className={`jstage jstage-${s.status}`} aria-current={s.status === "current" ? "step" : undefined}>
            <span className="jstage-num">{s.status === "done" ? "✓" : i + 1}</span>
            <span className="jstage-label">{L(s.label)}</span>
          </li>
        ))}
      </ol>

      <dl className="journey-stats">
        <div><dt>{tx("ความพร้อมโดยรวม", "Overall readiness")}</dt><dd>{j.readiness}%</dd></div>
        <div><dt>{tx("AI ทำเสร็จแล้ว", "AI completed")}</dt><dd>{j.aiCompleted} {tx("งาน", j.aiCompleted === 1 ? "task" : "tasks")}</dd></div>
        <div><dt>{tx("รอคุณ", "Waiting for you")}</dt><dd>{j.waitingForYou} {tx("รายการ", j.waitingForYou === 1 ? "item" : "items")}</dd></div>
        <div><dt>{tx("ข้อมูลที่ขาด", "Missing data")}</dt><dd>{j.missingData} {tx("รายการ", j.missingData === 1 ? "item" : "items")}</dd></div>
      </dl>

      {j.next && (
        <div className="journey-next">
          <div>
            <div className="label">{aiNow ? tx("AI กำลังทำ", "What AI is doing") : tx("สิ่งที่ต้องการจากคุณ", "What AI needs from you")}</div>
            <div style={{ fontWeight: 600, marginTop: 3 }}>{L(j.next.label)}{j.next.count ? ` (${j.next.count})` : ""}</div>
            {aiNow ? <div style={{ marginTop: 6 }}><AIWorking /></div> : <div className="muted small" style={{ marginTop: 3 }}>{tx("นี่คือการตัดสินใจหรือข้อมูลที่ต้องเป็นคน — ส่วนที่เหลือ AI ทำให้", "This needs a person — the AI does the rest.")}</div>}
          </div>
          {(j.next.href || continueHref) && <Link href={(guide && j.next.href) || continueHref || j.next.href!} className="btn btn-primary">{tx("ดำเนินภารกิจต่อ →", "Continue mission →")}</Link>}
        </div>
      )}

      {guide && (
        <ol className="journey-steps">
          {j.stages.flatMap((s) => s.steps).map((p, i) => (
            <li key={i} className={p.done ? "done" : ""}>
              <span className={`tag ${p.by === "ai" ? "st-info" : "st-warn"}`}>{p.by === "ai" ? "AI" : tx("คุณ", "You")}</span>
              <span style={{ flex: 1 }}>{L(p.label)}{p.count ? ` · ${p.count}` : ""}</span>
              {p.done ? <span className="ink-ok tiny">✓ {tx("เสร็จ", "done")}</span> : p.href && p.by === "human" ? <Link href={p.href} className="btn btn-ghost btn-sm">{tx("ทำขั้นนี้ →", "Do this step →")}</Link> : <span className="muted tiny">{tx("รอ", "pending")}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
