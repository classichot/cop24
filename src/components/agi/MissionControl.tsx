"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/state/AppState";
import { Tag } from "@/components/ui";
import { agentById } from "@/core/agi/agents";
import { flagshipById } from "@/core/agi/flagship";
import { approve, archive, cancel, resolveHumanTask, retry, submit, trace, verifyAudit, verifyHumanTask, type MissionRun, type Role } from "@/core/agi/engine";
import type { Status } from "@/core/types";

const STATE_TONE: Record<string, Status> = { completed: "ok", archived: "info", blocked: "bad", failed: "bad", cancelled: "info", "awaiting-approval": "warn" };
const TASK_GLYPH: Record<string, string> = { done: "✓", awaiting: "!", skipped: "–", failed: "✕", pending: "·" };

/** REQ-UX-003 Mission Control — progress, workstreams, human actions, evidence, risks, deliverables, spend and audit. */
export function MissionControl({ run, onChange, onResume }: { run: MissionRun; onChange: (fn: (r: MissionRun) => void) => void; onResume: () => void }) {
  const { L, tx } = useApp();
  const f = flagshipById(run.flagship)!;
  const [role, setRole] = useState<Role>("owner");
  const [actor, setActor] = useState("nattawut");
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [ack, setAck] = useState("");
  const [msg, setMsg] = useState("");
  const done = run.tasks.filter((x) => x.status === "done" || x.status === "skipped").length;
  const pct = Math.round((done / run.tasks.length) * 100);
  const gates = run.tasks.filter((x) => x.status === "awaiting");
  const open = run.humanTasks.filter((h) => h.status !== "done");
  const chain = verifyAudit(run);
  const now = () => new Date().toISOString();
  const act = (fn: (r: MissionRun) => { ok: boolean; reason?: string } | void, after = true) => {
    onChange((r) => { const res = fn(r); if (res && !res.ok) setMsg(res.reason ?? ""); else setMsg(""); });
    if (after) setTimeout(onResume, 0);
  };

  return (
    <section className="mc">
      <div className="mc-head">
        <div style={{ minWidth: 0 }}>
          <div className="label">{run.id} · {tx("ชุดกฎ", "ruleset")} {run.rulesetVersion}</div>
          <h3 style={{ margin: "2px 0 0", fontSize: 20 }}>{f.id} · {L(f.title)}</h3>
          <div className="muted small">{run.mode === "S" ? "Single Bot" : run.mode === "T" ? "AI Team" : "Cooperative Swarm"} · {run.autonomy} · {run.sites.join(", ")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Tag k={STATE_TONE[run.state] ?? "info"}>{run.state}</Tag>
          <div className="small" style={{ marginTop: 6 }}>{tx("ค่าใช้จ่าย AI", "AI spend")} <b>{run.spentTHB.toFixed(2)}</b> / {run.budgetTHB} THB</div>
        </div>
      </div>
      <div className="bar bar-5" style={{ marginTop: 10 }}><div style={{ width: `${pct}%`, background: "var(--color-accent)" }} /></div>
      <div className="muted tiny" style={{ marginTop: 4 }}>{done}/{run.tasks.length} {tx("งาน", "tasks")} · {tx("หลักฐาน/ข้อค้นพบ", "findings")} {run.findings.length} · {tx("ผลงาน", "deliverables")} {run.deliverables.length}</div>

      {run.outcome && (
        <div className={`note ${run.outcome.status === "completed" ? "note-ok" : "note-bad"}`} style={{ marginTop: 12 }}>
          <b>{run.outcome.status === "completed" ? tx("เสร็จสมบูรณ์ — ส่งมอบครบ ผ่านการตรวจ และมีการอนุมัติครบ", "Completed — deliverables produced, validations passed, approvals recorded") : run.outcome.status === "blocked" ? tx("ติดขัด / ต้องให้คนดำเนินการ — ไม่ถือว่าเสร็จตามกฎระเบียบ", "Blocked / Needs Human Action — not a regulatory completion") : run.outcome.status}</b>
          {run.outcome.unresolved.length > 0 && <ul className="why-list">{run.outcome.unresolved.slice(0, 8).map((u, i) => <li key={i}>{L(u)}</li>)}{run.outcome.unresolved.length > 8 && <li>… +{run.outcome.unresolved.length - 8}</li>}</ul>}
        </div>
      )}
      {msg && <div className="note note-warn" style={{ marginTop: 8 }}>{msg}</div>}

      <div className="mc-grid">
        <div>
          <div className="label" style={{ marginBottom: 6 }}>{tx("ทีมและสายงาน", "Teams and workstreams")}</div>
          {run.workstreams.map((w) => (
            <details key={w.id} className="mc-ws" open={run.workstreams.length === 1}>
              <summary><b>{w.site}</b> <span className="muted tiny">{w.team.map((a) => agentById(a).name.en.replace(/ Agent$/, "")).join(" · ")}</span>{run.blockedSites[w.site] && <Tag k="bad" style={{ marginLeft: 6 }}>{tx("ถูกกั้น", "blocked")}</Tag>}</summary>
              <ol className="mc-tasks">
                {run.tasks.filter((x) => x.site === w.site).map((x) => {
                  const d = f.tasks.find((y) => y.id === x.taskId)!;
                  return (
                    <li key={x.key} className={`mc-task mc-${x.status}`}>
                      <span className="mc-glyph">{TASK_GLYPH[x.status]}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>{L(d.title)}<span className="muted tiny"> · {agentById(x.agent).name.en}{d.gate ? ` · ${tx("จุดอนุมัติ", "gate")}: ${d.gate}` : ""}</span>{x.output && <div className="muted tiny">{L(x.output.summary)}</div>}</span>
                    </li>
                  );
                })}
              </ol>
            </details>
          ))}
        </div>

        <div>
          <div className="label" style={{ marginBottom: 6 }}>{tx("สิ่งที่ต้องให้คนทำ", "Required human actions")}</div>
          <div className="row row-center" style={{ gap: 6, marginBottom: 8 }}>
            <input className="input" style={{ maxWidth: 140, minHeight: 30 }} value={actor} onChange={(e) => setActor(e.target.value)} aria-label={tx("ชื่อผู้ดำเนินการ", "Your name")} />
            <select className="input" style={{ maxWidth: 160, minHeight: 30 }} value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label={tx("บทบาท", "Role")}>
              <option value="owner">owner</option><option value="consultant">consultant</option><option value="exec">executive</option><option value="qualified">qualified signatory</option><option value="contributor">contributor</option>
            </select>
          </div>
          {gates.length === 0 && open.length === 0 && <div className="muted small">{tx("ไม่มีสิ่งที่รอคุณ", "Nothing is waiting for you")}</div>}
          {gates.map((g) => {
            const d = f.tasks.find((y) => y.id === g.taskId)!;
            const over = run.findings.some((x) => x.id === `budget:${g.key}`) && !run.approvals[`budget:${g.key}`];
            const key = over ? `budget:${g.key}` : g.key;
            return (
              <div key={g.key} className="mc-action">
                <div><b>{over ? tx("อนุมัติวงเงินเพิ่ม", "Approve more budget") : L(d.title)}</b> <span className="muted tiny">{g.site}{d.gate ? ` · ${d.gate}` : ""}</span></div>
                {(d.id === "consultation") && <input className="input" placeholder={tx("หลักฐานว่าจัดแล้ว เช่น บันทึกการประชุม", "Evidence it happened, e.g. minutes")} value={evidence[key] ?? ""} onChange={(e) => setEvidence({ ...evidence, [key]: e.target.value })} />}
                <button type="button" className="btn btn-primary btn-sm" onClick={() => act((r) => approve(r, key, actor, role, now(), evidence[key]))}>{tx("อนุมัติ", "Approve")}</button>
              </div>
            );
          })}
          {open.map((h) => (
            <div key={h.id} className="mc-action">
              <div><b>{L(h.title)}</b> <span className="muted tiny">{h.site} · {h.work} · {L(h.owner)}{h.status === "awaiting-verification" ? ` · ${tx("รอผู้ตรวจอิสระ", "awaiting independent verification")} (${h.doneBy})` : ""}</span></div>
              {h.status === "open" ? (
                <div className="row" style={{ gap: 6 }}>
                  <input className="input" style={{ flex: 1, minHeight: 30 }} placeholder={tx("หลักฐาน (ไฟล์/เลขที่)", "Evidence (file / reference)")} value={evidence[h.id] ?? ""} onChange={(e) => setEvidence({ ...evidence, [h.id]: e.target.value })} />
                  <button type="button" className="btn btn-secondary btn-sm btn-plain" onClick={() => act((r) => resolveHumanTask(r, h.id, actor, evidence[h.id] ?? "", now()))}>{tx("บันทึกว่าทำแล้ว", "Record as done")}</button>
                </div>
              ) : (
                <button type="button" className="btn btn-secondary btn-sm btn-plain" onClick={() => act((r) => verifyHumanTask(r, h.id, actor, now()))}>{tx("ตรวจยืนยันโดยอิสระ", "Verify independently")}</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {run.findings.length > 0 && (
        <details className="mc-section" open>
          <summary>{tx(`ความเสี่ยงและข้อค้นพบ (${run.findings.length})`, `Risks and findings (${run.findings.length})`)}</summary>
          <div className="worklist">
            {run.findings.map((x) => <div key={x.id} className="list-item"><Tag k={x.severity === "material" ? "bad" : x.severity === "major" ? "warn" : "info"}>{x.kind}</Tag><div style={{ flex: 1 }} className="small">{L(x.text)} <span className="muted tiny">· {x.site}</span></div></div>)}
          </div>
        </details>
      )}

      {run.deliverables.length > 0 && (
        <details className="mc-section" open>
          <summary>{tx(`ผลงานและฉบับ (${run.deliverables.length})`, `Deliverables and versions (${run.deliverables.length})`)}</summary>
          {run.deliverables.map((d) => (
            <details key={`${d.site}:${d.id}:${d.version}`} className="mc-dl">
              <summary><b>{L(d.title)}</b> <span className="muted tiny">{d.site} · v{d.version} · sha256 {d.hash?.slice(0, 12)}…</span></summary>
              {d.sections?.map((s) => <div key={s.id} className={`mc-sec ${s.status === "blocked" ? "ink-bad" : ""}`}><b>{L(s.title)}</b> — {L(s.text)} {s.sources.length > 0 && <span className="muted tiny">[{s.sources.join(", ")}]</span>}</div>)}
              {d.rows && <div className="table-wrap" style={{ marginTop: 6 }}><table className="table"><thead><tr>{Object.keys(d.rows[0] ?? {}).map((k) => <th key={k}>{k}</th>)}</tr></thead><tbody>{d.rows.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j} className="small">{String(v)}</td>)}</tr>)}</tbody></table></div>}
              {d.id === "report" && <TraceView run={run} site={d.site} />}
            </details>
          ))}
          <Link href="/studio" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}>{tx("เปิดสตูดิโอรายงาน →", "Open Report Studio →")}</Link>
        </details>
      )}

      <details className="mc-section">
        <summary>{tx(`บันทึกการทำงาน (${run.audit.length}) · ห่วงโซ่แฮช`, `Audit trail (${run.audit.length}) · hash chain`)} {chain.ok ? <span className="ink-ok">✓ {tx("สมบูรณ์", "intact")}</span> : <span className="ink-bad">✕ {tx(`ถูกแก้ไขที่ลำดับ ${chain.brokenAt}`, `altered at #${chain.brokenAt}`)}</span>}</summary>
        <ol className="mc-audit">{run.audit.slice(-60).map((e) => <li key={e.seq}><span className="muted tiny">#{e.seq} {e.at.slice(11, 19)}</span> <b>{e.actor}</b> {e.action} <span className="code tiny">{e.object}</span> <span className="muted tiny">{e.detail}</span></li>)}</ol>
      </details>

      <div className="row" style={{ marginTop: 12, gap: 6 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={onResume} disabled={["completed", "archived", "cancelled"].includes(run.state)}>{tx("ทำงานต่อ", "Resume")}</button>
        {run.state === "failed" && <button type="button" className="btn btn-secondary btn-sm" onClick={() => act((r) => retry(r, actor, now()))}>{tx("ลองใหม่", "Retry")}</button>}
        {!["completed", "archived", "cancelled"].includes(run.state) && <button type="button" className="btn btn-secondary btn-sm btn-plain" onClick={() => act((r) => cancel(r, actor, now()), false)}>{tx("ยกเลิกภารกิจ", "Cancel mission")}</button>}
        {(run.state === "completed" || run.state === "blocked") && <button type="button" className="btn btn-ghost btn-sm" onClick={() => act((r) => archive(r, actor, now()), false)}>{tx("เก็บเข้าคลัง", "Archive")}</button>}
      </div>
      {run.state === "completed" && (
        <div className="mc-action" style={{ marginTop: 10 }}>
          <div><b>{tx("การยื่นต่อ กกพ.", "Filing with the ERC")}</b> <span className="muted tiny">{tx("สถานะ", "status")}: {run.submission.status}{run.submission.reference ? ` · ${run.submission.reference}` : ""}</span></div>
          <div className="muted tiny">{tx("COP24 ไม่มีช่องทางยื่นที่ยืนยันตัวตน — ยื่นผ่านช่องทางของ กกพ. แล้วบันทึกเลขรับเรื่อง", "COP24 has no authenticated filing channel — file through the ERC's channel, then record the acknowledgement")}</div>
          <div className="row" style={{ gap: 6 }}>
            <input className="input" style={{ flex: 1, minHeight: 30 }} placeholder={tx("เลขรับเรื่องจาก กกพ.", "ERC acknowledgement number")} value={ack} onChange={(e) => setAck(e.target.value)} />
            <button type="button" className="btn btn-secondary btn-sm btn-plain" onClick={() => act((r) => submit(r, actor, role, { authenticated: Boolean(ack.trim()), acknowledgement: ack.trim() || undefined }, now()), false)}>{tx("บันทึกการยื่น", "Record filing")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function TraceView({ run, site }: { run: MissionRun; site: string }) {
  const { L, tx } = useApp();
  const tr = trace(run, site, "report");
  return (
    <details className="mc-trace">
      <summary>{tx("รายงานนี้ถูกสร้างอย่างไร", "How this report was produced")}</summary>
      <ul className="why-list">{tr.tasks.map((x) => <li key={x.key}><span className="code tiny">{x.key}</span> · {agentById(x.agent).name.en}{x.summary ? ` — ${L(x.summary)}` : ""}</li>)}</ul>
      <div className="muted tiny">{tx("แหล่งอ้างอิง", "Sources")}: {tr.sources.join(", ") || "—"}</div>
    </details>
  );
}
