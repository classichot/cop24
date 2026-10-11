"use client";

import type { ReactNode } from "react";
import { useApp } from "@/state/AppState";
import { Seg, Tag } from "@/components/ui";
import type { Mode } from "@/core/agi/catalog";
import type { Autonomy, MissionPreview } from "@/core/agi/engine";
import { AGI_SITES } from "@/data/agi-sites";

export const MODE_LABEL: Record<Mode, string> = { S: "Single Bot", T: "AI Team", W: "Cooperative Swarm" };

/** REQ-UX-002 Mission Preview — accept the recommendation, change permitted settings, or cancel. */
export function MissionPreviewPanel({ p, sites, setSites, setMode, setAutonomy, budget, setBudget, onStart, onCancel }: {
  p: MissionPreview; sites: string[]; setSites: (s: string[]) => void; setMode: (m: Mode) => void; setAutonomy: (a: Autonomy) => void; budget: number; setBudget: (n: number) => void; onStart: () => void; onCancel: () => void;
}) {
  const { L, tx } = useApp();
  const row = (label: string, body: ReactNode) => <div className="pv-row"><div className="pv-k">{label}</div><div className="pv-v">{body}</div></div>;
  return (
    <section className="pv">
      <div className="row row-center" style={{ justifyContent: "space-between" }}>
        <div><div className="label">{tx("ตัวอย่างภารกิจก่อนเริ่ม", "Mission preview")}</div><h3 style={{ margin: "2px 0 0", fontSize: 20 }}>{p.flagship.id} · {L(p.flagship.title)}</h3></div>
        <Tag k="info">{p.flagship.priority}</Tag>
      </div>
      {row(tx("เป้าหมาย", "Objective"), L(p.objective))}
      {row(tx("ขอบเขต", "Scope"), (
        <div>
          <div className="row" style={{ gap: 6 }}>
            {AGI_SITES.map((s) => (
              <label key={s.id} className={`chip${sites.includes(s.id) ? " on" : ""}`} style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={sites.includes(s.id)} onChange={(e) => setSites(e.target.checked ? [...sites, s.id] : sites.filter((x) => x !== s.id))} style={{ marginRight: 4 }} />{L(s.name)}
              </label>
            ))}
          </div>
          {p.scope.map((s) => <div key={s.site} className="muted tiny" style={{ marginTop: 4 }}>{L(s.name)} · {tx("เส้นทาง", "route")} <b>{s.route.toUpperCase()}</b> · {s.period}</div>)}
        </div>
      ))}
      {row(tx("โหมดที่แนะนำ", "Recommended mode"), (
        <div>
          <Seg<Mode> name="agi-mode" value={p.mode} onChange={setMode} options={(["S", "T", "W"] as Mode[]).map((m) => ({ v: m, label: <>{MODE_LABEL[m]}{m === p.recommended.mode ? " ★" : ""}</> }))} />
          <div className="muted tiny" style={{ marginTop: 4 }}>★ {L(p.recommended.reason)}</div>
          {!p.modeCheck.ok && <div className="ink-bad tiny" style={{ marginTop: 4 }}>{L(p.modeCheck.reason!)}</div>}
        </div>
      ))}
      {row(tx("ระดับอิสระ", "Autonomy"), (
        <div>
          <Seg<Autonomy> name="agi-autonomy" value={p.autonomy} onChange={setAutonomy} options={[{ v: "draft", label: "Draft" }, { v: "supervised", label: "Supervised" }, { v: "autopilot", label: "Autopilot" }]} />
          <div className="muted tiny" style={{ marginTop: 4 }}>{p.autonomy === "draft" ? tx("AI สืบค้น เตรียม และเสนอ — คุณเป็นผู้ทำทุกการกระทำ", "AI investigates, prepares and recommends — you take every action") : p.autonomy === "supervised" ? tx("AI ทำขั้นตอนภายในที่อนุญาต และขออนุมัติที่จุดที่กำหนด", "AI runs permitted internal steps and asks for approval at defined gates") : tx("AI ทำงานภายในสิทธิ์ งบ และขอบเขตที่อนุมัติล่วงหน้า — การรับรองและการยื่นยังต้องเป็นคนเสมอ", "AI acts within pre-approved permissions, budget and limits — certification and filing always stay human")}</div>
        </div>
      ))}
      {row(tx("ข้อมูลที่ต้องใช้", "Required information"), (
        <div className="small">
          {p.available.map((a, i) => <div key={i} className="ink-ok">✓ {L(a)}</div>)}
          {p.missing.slice(0, 6).map((m, i) => <div key={i} className="ink-warn">⚠ {L(m)}</div>)}
          {p.missing.length > 6 && <div className="muted tiny">+{p.missing.length - 6}</div>}
        </div>
      ))}
      {row(tx("แผนงาน", "Planned work"), (
        <ol className="pv-plan">
          {p.plan.map((x) => <li key={x.id}><span className="tag st-info" style={{ marginRight: 6 }}>{x.phase}</span>{L(x.title)} <span className="muted tiny">· {L(x.agent)}{x.deps.length ? ` · ${tx("หลัง", "after")} ${x.deps.join(", ")}` : ""}{x.gate ? ` · ${tx("จุดอนุมัติ", "gate")}` : ""}{x.work !== "ai-digital" ? ` · ${x.work}` : ""}</span></li>)}
        </ol>
      ))}
      {p.mode !== "S" && row(tx("ทำขนานกันได้", "Runs in parallel"), <div className="muted tiny">{p.parallel.map((g, i) => `${i + 1}: ${g.join(" ‖ ")}`).join("  →  ")}</div>)}
      {row(tx("สิ่งที่จะได้รับ", "Deliverables"), <ul className="why-list" style={{ marginTop: 0 }}>{p.deliverables.map((d, i) => <li key={i}>{L(d)}</li>)}</ul>)}
      {row(tx("ประมาณการ", "Estimate"), (
        <div className="row row-center" style={{ gap: 10 }}>
          <span>~{p.estimate.minutes} {tx("นาที", "min")} · ~{p.estimate.costTHB.toFixed(2)} THB</span>
          <label className="small">{tx("วงเงิน", "Budget")} <input type="number" className="input" style={{ width: 90, minHeight: 28, display: "inline-block" }} value={budget} min={0} onChange={(e) => setBudget(Number(e.target.value))} /> THB</label>
          {p.estimate.overBudget && <Tag k="warn">{tx("เกินวงเงิน", "over budget")}</Tag>}
        </div>
      ))}
      {row(tx("จุดที่ต้องอนุมัติ", "Approval gates"), <ul className="why-list" style={{ marginTop: 0 }}>{p.gates.map((g, i) => <li key={i}>{L(g)}</li>)}</ul>)}
      {p.warnings.length > 0 && <div className="note note-warn" style={{ marginTop: 10 }}>{p.warnings.map((w, i) => <div key={i}>{L(w)}</div>)}</div>}
      <div className="row" style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-primary" disabled={!p.modeCheck.ok || sites.length === 0} onClick={onStart}>{tx("ยอมรับและเริ่มภารกิจ →", "Accept and start mission →")}</button>
        <button type="button" className="btn btn-secondary btn-plain" onClick={onCancel}>{tx("ยกเลิก", "Cancel")}</button>
      </div>
    </section>
  );
}
