"use client";

import Link from "next/link";
import { useApp } from "@/state/AppState";
import { APPS } from "@/packs";
import { STATUS_LABEL, STATUS_TONE, journey, type MissionView } from "@/core/ux/catalog";
import { AppChip, Glyph, glyphFor } from "@/components/ui";
import { useUx } from "./useUx";

/**
 * §15 Universal Mission Card — the one card every 24 app uses for a mission.
 * Status, AI share, involvement, data readiness and user time are all derived from the plan.
 */
export function MissionCard({ view, showApp, href }: { view: MissionView; showApp?: boolean; href?: string }) {
  const { L, tx } = useApp();
  const ctx = useUx();
  const j = journey(view, ctx);
  const app = APPS.find((a) => a.id === view.mission.app);
  const cta = view.status === "completed" ? tx("ดูผลลัพธ์ →", "See outcome →") : view.status === "ready" ? tx("เริ่มภารกิจ →", "Start mission →") : tx("ดำเนินภารกิจต่อ →", "Continue mission →");
  return (
    <article className="mcard">
      <div className="mcard-head">
        <div style={{ minWidth: 0 }}>
          {showApp && app && <div style={{ marginBottom: 6 }}><AppChip app={app.name} accent={app.accent} /></div>}
          <h4 className="mcard-title">{L(view.title)}</h4>
        </div>
        <span className={`tag st-${STATUS_TONE[view.status]}`}>{L(STATUS_LABEL[view.status])}</span>
      </div>
      <dl className="mcard-stats">
        <div><dt>{tx("AI ทำได้", "AI can complete")}</dt><dd>{view.aiShare}%</dd></div>
        <div><dt>{tx("ความพร้อมข้อมูล", "Data readiness")}</dt><dd>{j.readiness}%</dd></div>
        <div><dt>{tx("คุณต้องมีส่วนร่วม", "Your involvement")}</dt><dd>{L(view.involvement)}</dd></div>
        <div><dt>{tx("เวลาที่คุณใช้", "Your time")}</dt><dd>{view.userMinutes ? tx(`~${view.userMinutes} นาที`, `~${view.userMinutes} min`) : "—"}</dd></div>
      </dl>
      {j.current && (
        <div className="mcard-step">{tx(`ขั้น ${j.stepIndex}/${j.totalSteps} · ${j.current.label.th}`, `Step ${j.stepIndex} of ${j.totalSteps} · ${j.current.label.en}`)}{view.nextStep && <> — {L(view.nextStep.label)}</>}</div>
      )}
      {view.requires.length > 0 && (
        <div className="stack" style={{ gap: 5 }}>
          <div className="label">{tx("ต้องใช้", "Requires")}</div>
          {view.requires.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 7, fontSize: 12, lineHeight: 1.45 }}><Glyph k={r.k}>{r.k === "warn" ? "⚠" : glyphFor(r.k)}</Glyph><span className="muted-7">{L(r.label)}</span></div>
          ))}
        </div>
      )}
      <Link href={href ?? `/missions?m=${view.mission.id}`} className="btn btn-primary btn-block">{cta}</Link>
    </article>
  );
}
