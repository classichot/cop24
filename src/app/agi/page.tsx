"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, SectionHead, Tag } from "@/components/ui";
import { MissionControl } from "@/components/agi/MissionControl";
import { MissionPreviewPanel, MODE_LABEL } from "@/components/agi/Preview";
import { AGENTS, type AgentId } from "@/core/agi/agents";
import { CATALOG, CATEGORIES, isAvailable, type Mode } from "@/core/agi/catalog";
import { createRun, preview, runMission, startRun, type Autonomy, type MissionRun } from "@/core/agi/engine";
import { FLAGSHIPS, flagshipById } from "@/core/agi/flagship";
import { ROUTING } from "@/core/agi/routing";
import { evaluateTriggers } from "@/core/agi/triggers";
import { TODAY } from "@/core/dates";
import { AGI_SITES } from "@/data/agi-sites";
import { USER } from "@/data/tenant";

const RUNS = "cop24.agi.runs.v1";
const TEAM = "cop24.agi.team.v1";
const env = () => ({ sites: Object.fromEntries(AGI_SITES.map((s) => [s.id, structuredClone(s)])), actor: USER.initials, now: () => new Date().toISOString(), today: TODAY });

export default function AgiPage() {
  return <Suspense fallback={<div className="page" />}><Agi /></Suspense>;
}

function Agi() {
  const { L, tx, entityId } = useApp();
  const params = useSearchParams();
  const [fid, setFid] = useState<string | null>(params.get("f"));
  const [sites, setSites] = useState<string[]>([params.get("site") ?? (AGI_SITES.some((s) => s.id === entityId) ? entityId : "lopburi-1")]);
  const [mode, setMode] = useState<Mode | undefined>();
  const [autonomy, setAutonomy] = useState<Autonomy | undefined>();
  const [budget, setBudget] = useState<number | undefined>();
  const [runs, setRuns] = useState<MissionRun[]>([]);
  // the latest runs, so an approval followed by an automatic resume never works on a stale copy
  const runsRef = useRef<MissionRun[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [cat, setCat] = useState<"all" | "available" | "planned">("all");
  const [modeFilter, setModeFilter] = useState<"all" | Mode>("all");
  const [team, setTeam] = useState<{ off: AgentId[]; provider: "auto" | "openai" | "anthropic"; certifier: string }>({ off: [], provider: "auto", certifier: "Qualified signatory" });
  const [trigAuto, setTrigAuto] = useState<Autonomy>("supervised");

  useEffect(() => {
    queueMicrotask(() => {
      try { const r = localStorage.getItem(RUNS); if (r) { const list = JSON.parse(r) as MissionRun[]; runsRef.current = list; setRuns(list); if (list[0]) setActive(list[0].id); } } catch {}
      try { const tm = localStorage.getItem(TEAM); if (tm) setTeam(JSON.parse(tm)); } catch {}
    });
  }, []);
  const persist = (list: MissionRun[]) => { runsRef.current = list; setRuns(list); try { localStorage.setItem(RUNS, JSON.stringify(list.slice(0, 12))); } catch {} };
  const saveTeam = (tm: typeof team) => { setTeam(tm); try { localStorage.setItem(TEAM, JSON.stringify(tm)); } catch {} };

  const chosen = AGI_SITES.filter((s) => sites.includes(s.id));
  const f = fid ? flagshipById(fid) : undefined;
  const p = useMemo(() => (f && chosen.length ? preview(f.id, chosen, { mode, autonomy, budgetTHB: budget }) : null), [f, chosen, mode, autonomy, budget]);
  const pick = (id: string) => { setFid(id); setMode(undefined); setAutonomy(undefined); setBudget(undefined); setTimeout(() => document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" }), 50); };

  const start = () => {
    if (!p) return;
    const now = new Date().toISOString();
    const run = createRun(p.flagship.id, chosen.map((s) => structuredClone(s)), { mode: p.mode, autonomy: p.autonomy, budgetTHB: p.estimate.budgetTHB }, USER.initials, now);
    startRun(run, USER.initials, now);
    runMission(run, env());
    persist([run, ...runsRef.current]);
    setActive(run.id);
    setFid(null);
    setTimeout(() => document.getElementById("control")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const change = (id: string, fn: (r: MissionRun) => void) => persist(runsRef.current.map((r) => { if (r.id !== id) return r; const c = structuredClone(r); fn(c); return c; }));
  const resume = (id: string) => change(id, (r) => runMission(r, env()));
  const current = runs.find((r) => r.id === active);
  const triggers = evaluateTriggers(AGI_SITES.filter((s) => !s.id.startsWith("demo")), TODAY, trigAuto, { runs });
  const shown = CATALOG.filter((m) => (cat === "all" || (cat === "available") === isAvailable(m)) && (modeFilter === "all" || m.mode === modeFilter));

  return (
    <div className="page page-wide">
      <PageHead explain={["mission-authorisation", "evidence-layers"]} kicker={tx("โหมด AGI / ศูนย์ควบคุมภารกิจ", "AGI mode / Mission Control")} title={tx("แผนกปฏิบัติตาม CoP เสมือน — บอกเป้าหมาย ทีม AI ทำงาน คุณอนุมัติ", "A virtual CoP compliance department — say the goal, the AI team works, you approve")} lead={tx("ทุกภารกิจรันบนเครื่องยนต์เดียว: ระบุข้อกำหนด วางแผน รวบรวมหลักฐาน ตรวจ ร่าง ตรวจคุณภาพอิสระ และเตรียมชุดยื่นให้คุณอนุมัติ AI ไม่สร้างผลตรวจวัด การตรวจ การอนุมัติ หรือกิจกรรมที่ไม่ได้เกิดขึ้นจริง และไม่ยื่นแทนคุณ", "Every mission runs on one engine: identify requirements, plan, collect evidence, check, draft, independently QA and prepare the package for your approval. The AI never invents measurements, inspections, approvals or activities, and never files on your behalf.")} />
      <nav className="agi-sections" aria-label={tx("ส่วนของหน้า", "Page sections")}>
        <a href="#flagships" className="chip">{tx("ภารกิจหลัก F01–F07", "Flagships F01–F07")}</a>
        <a href="#catalog" className="chip on">{tx(`แคตตาล็อก ${CATALOG.length} ภารกิจ`, `Mission catalog · ${CATALOG.length}`)}</a>
        <a href="#control" className="chip">{tx(`ศูนย์ควบคุม · ${runs.length}`, `Mission Control · ${runs.length}`)}</a>
        <a href="#triggers" className="chip">{tx("ทริกเกอร์", "Triggers")}</a>
        <a href="#team" className="chip">{tx("ทีม AI", "AI team")}</a>
        <a href="#routing" className="chip">{tx("โมเดลและค่าใช้จ่าย", "Models & cost")}</a>
      </nav>
      <hr className="hr hr-section" />
      <div id="flagships" className="anchor" />
      <hr className="hr hr-section" />
      <SectionHead title={tx("ต้องการให้ COP24 ทำอะไร?", "What would you like COP24 to do?")} tag={tx("ภารกิจหลัก F01–F07", "Flagship missions F01–F07")} note={tx("ภารกิจหลักประกอบจากภารกิจย่อยในแคตตาล็อก 108 รายการ เลือกแล้วดูตัวอย่างก่อนเริ่ม", "Flagships are built from the 108 catalog missions. Pick one to see the preview before it starts.")} />
      <Cells min={250} style={{ marginTop: 12 }}>
        {FLAGSHIPS.map((x) => (
          <button key={x.id} type="button" className={`tile tile-sm agi-flag${fid === x.id ? " on" : ""}`} onClick={() => pick(x.id)}>
            <span className="tile-num">{x.id} · {MODE_LABEL[x.defaultMode]} · {x.priority}</span>
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{L(x.title)}</span>
            <span className="muted tiny" style={{ lineHeight: 1.5, flex: 1 }}>{L(x.goal)}</span>
            <span className="tile-cta">{tx("ดูตัวอย่าง →", "Preview →")}</span>
          </button>
        ))}
      </Cells>

      {p && (
        <div id="preview" style={{ marginTop: 20 }}>
          <MissionPreviewPanel p={p} sites={sites} setSites={setSites} setMode={setMode} setAutonomy={setAutonomy} budget={p.estimate.budgetTHB} setBudget={setBudget} onStart={start} onCancel={() => setFid(null)} />
        </div>
      )}
      <hr className="hr hr-section" />
      <div id="catalog" className="anchor" />
      <SectionHead title={tx("แคตตาล็อกภารกิจ 108 รายการ", "Mission catalog — 108 missions")} tag={tx(`ใช้งานได้ ${CATALOG.filter(isAvailable).length} · วางแผน ${CATALOG.filter((m) => !isAvailable(m)).length}`, `${CATALOG.filter(isAvailable).length} available · ${CATALOG.filter((m) => !isAvailable(m)).length} planned`)} note={tx("ภารกิจที่ยังไม่ได้สร้างแสดงเป็น “วางแผน” และเริ่มไม่ได้ — ไม่แสดงเป็นความสามารถที่ใช้งานได้", "Missions not built yet show as “planned” and cannot be started — they are never presented as working capabilities.")} />
      <div className="row row-center" style={{ gap: 6, marginBottom: 10 }}>
        {([["all", tx("ทั้งหมด", "All")], ["available", tx("ใช้งานได้", "Available")], ["planned", tx("วางแผน", "Planned")]] as const).map(([v, l]) => <button key={v} type="button" className={`chip${cat === v ? " on" : ""}`} onClick={() => setCat(v)}>{l}</button>)}
        <span className="muted tiny" style={{ marginLeft: 8 }}>{tx("โหมด", "Mode")}</span>
        {(["all", "S", "T", "W"] as const).map((v) => <button key={v} type="button" className={`chip${modeFilter === v ? " on" : ""}`} onClick={() => setModeFilter(v)}>{v === "all" ? tx("ทั้งหมด", "All") : MODE_LABEL[v]}</button>)}
      </div>
      {CATEGORIES.map((c) => {
        const list = shown.filter((m) => m.category === c.id);
        if (!list.length) return null;
        return (
          <section key={c.id} className="agi-cat" aria-label={L(c.name)}>
            <div className="agi-cat-head">
              <span className="agi-cat-letter">{c.id}</span>
              <div style={{ minWidth: 0 }}>
                <div className="heading" style={{ fontSize: 17 }}>{L(c.name)}</div>
                <div className="muted tiny">{L(c.objective)} · {tx(`${list.length} ภารกิจ`, `${list.length} missions`)}</div>
              </div>
            </div>
            {/* the 24-series modular card grid, same as the home screen tiles */}
            <Cells min={232}>
              {list.map((m) => {
                const body = (
                  <>
                    <span className="tile-num">{m.id} · {MODE_LABEL[m.mode]}</span>
                    <span className="agi-card-title">{L(m.title)}</span>
                    <span className="muted tiny" style={{ flex: 1, lineHeight: 1.5 }}>{m.flagships.length ? tx(`ใช้ใน ${m.flagships.join(", ")}`, `Used in ${m.flagships.join(", ")}`) : tx("ภารกิจย่อยเดี่ยว", "Standalone building block")}</span>
                    <span className="agi-card-foot">
                      <Tag k={m.priority === "P0" ? "ok" : m.priority === "P1" ? "warn" : "info"}>{m.priority}</Tag>
                      {isAvailable(m) ? <span className="tile-cta">{tx("ใช้งาน →", "Open →")}</span> : <span className="tag st-cond">{tx("วางแผน · ยังเริ่มไม่ได้", "Planned · not startable")}</span>}
                    </span>
                  </>
                );
                return isAvailable(m)
                  ? <Link key={m.id} href={m.flagships[0] && m.route === "/agi" ? `/agi?f=${m.flagships[0]}` : m.route!} className="tile tile-sm agi-card">{body}</Link>
                  : <div key={m.id} className="tile tile-sm agi-card agi-card-planned" aria-disabled="true">{body}</div>;
              })}
            </Cells>
          </section>
        );
      })}

      <hr className="hr hr-section" />
      <div id="control">
        <SectionHead title={tx("ศูนย์ควบคุมภารกิจ", "Mission Control")} tag={tx(`${runs.length} ภารกิจ · บันทึกในเบราว์เซอร์นี้`, `${runs.length} run(s) · saved in this browser`)} />
        {runs.length === 0 ? <div className="dashed muted small">{tx("ยังไม่มีภารกิจ — เลือกภารกิจหลักด้านบนแล้วกดเริ่ม", "No missions yet — pick a flagship above and start it")}</div> : (
          <>
            <div className="row" style={{ gap: 6, margin: "10px 0" }}>
              {runs.map((r) => <button key={r.id} type="button" className={`chip${r.id === active ? " on" : ""}`} onClick={() => setActive(r.id)}>{r.flagship} · {r.sites.join("+")} · {r.state}</button>)}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { persist([]); setActive(null); }}>{tx("ล้างทั้งหมด", "Clear all")}</button>
            </div>
            {current && <MissionControl run={current} onChange={(fn) => change(current.id, fn)} onResume={() => resume(current.id)} />}
          </>
        )}
      </div>

      <hr className="hr hr-section" />
      <div id="triggers" className="anchor" />
      <SectionHead title={tx("ทริกเกอร์ภารกิจ", "Mission triggers")} tag="REQ-AGI-007" note={tx("เหตุการณ์ที่เสนอภารกิจให้ — สิ่งที่เกิดต่อขึ้นกับระดับอิสระ การทำงานเบื้องหลังขณะปิดแอปต้องใช้ backend ซึ่งยังไม่ได้เปิดใช้", "Events that propose missions; what happens next depends on autonomy. Running while the app is closed needs a backend, which is not provisioned yet.")} />
      <div className="row row-center" style={{ gap: 8, marginBottom: 8 }}>
        {(["draft", "supervised", "autopilot"] as Autonomy[]).map((a) => <button key={a} type="button" className={`chip${trigAuto === a ? " on" : ""}`} onClick={() => setTrigAuto(a)}>{a}</button>)}
      </div>
      <div className="worklist">
        {triggers.map((tg, i) => (
          <div key={i} className="list-item">
            <Tag k={tg.kind === "exception" ? "bad" : tg.kind === "deadline" ? "warn" : "info"}>{tg.kind}</Tag>
            <div style={{ flex: 1 }}><b>{L(tg.reason)}</b><div className="muted tiny">{tg.mission} · {L(flagshipById(tg.mission)!.title)} · {L(tg.behaviour)}</div></div>
            <button type="button" className="btn btn-secondary btn-sm btn-plain" onClick={() => { setSites([tg.site]); pick(tg.mission); }}>{tx("ดูตัวอย่าง", "Preview")}</button>
          </div>
        ))}
        {!triggers.length && <div className="muted small">{tx("ไม่มีทริกเกอร์", "No triggers")}</div>}
      </div>


      <hr className="hr hr-section" />
      <div id="team" className="anchor" />
      <SectionHead title={tx("คลังเอเจนต์ และ “สร้างทีม AI ของฉัน”", "Agent library and Build My AI Team")} tag="REQ-AGI-003" note={tx("ปิดเอเจนต์ที่ไม่ต้องการ เลือกผู้ให้บริการโมเดล และผู้ลงนามรับรอง — หัวหน้าภารกิจ ผู้ตรวจคุณภาพอิสระ และผู้ควบคุมค่าใช้จ่ายปิดไม่ได้", "Switch agents off, choose the model provider and the certifier — the Mission Lead, Independent QA and Cost Governor cannot be switched off.")} />
      <Cells min={240}>
        {AGENTS.map((a) => {
          const locked = a.id === "lead" || a.id === "qa" || a.id === "cost";
          const on = locked || !team.off.includes(a.id);
          return (
            <label key={a.id} className={`cell agi-agent${on ? "" : " off"}`}>
              <div className="row row-center" style={{ justifyContent: "space-between" }}>
                <b style={{ fontSize: 14 }}>{L(a.name)}</b>
                <input type="checkbox" checked={on} disabled={locked} onChange={(e) => saveTeam({ ...team, off: e.target.checked ? team.off.filter((x) => x !== a.id) : [...team.off, a.id] })} aria-label={L(a.name)} />
              </div>
              <div className="muted tiny" style={{ marginTop: 4, lineHeight: 1.5 }}>{L(a.job)}</div>
              <div className="tiny" style={{ marginTop: 6 }}>{a.engines.length ? `engines: ${a.engines.join(", ")}` : tx("ยังไม่มีเครื่องยนต์รองรับ (GIS)", "No engine yet (GIS)")}{a.canAct ? "" : tx(" · อ่านอย่างเดียว", " · read-only")}</div>
            </label>
          );
        })}
      </Cells>
      <div className="row row-center" style={{ gap: 10, marginTop: 12 }}>
        <span className="label">{tx("ผู้ให้บริการโมเดล", "Model provider")}</span>
        {(["auto", "openai", "anthropic"] as const).map((v) => <button key={v} type="button" className={`chip${team.provider === v ? " on" : ""}`} onClick={() => saveTeam({ ...team, provider: v })}>{v}</button>)}
        <span className="label" style={{ marginLeft: 10 }}>{tx("ผู้ลงนามรับรอง", "Certifier")}</span>
        <input className="input" style={{ maxWidth: 220, minHeight: 30 }} value={team.certifier} onChange={(e) => saveTeam({ ...team, certifier: e.target.value })} />
      </div>

      <hr className="hr hr-section" />
      <div id="routing" className="anchor" />
      <SectionHead title={tx("การเลือกโมเดลและการควบคุมค่าใช้จ่าย", "Model routing and cost governance")} tag="REQ-AGI-006" note={tx("งานสำคัญเลือกตามความถูกต้อง ไม่ใช่ราคา การคำนวณและเกณฑ์ไม่ใช้โมเดล ภารกิจหยุดขออนุมัติก่อนเกินวงเงิน", "Critical work routes on accuracy, not price; calculations never go to a model; missions pause for approval before exceeding the budget.")} />
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{tx("งาน", "Task")}</th><th>{tx("ระดับ", "Tier")}</th><th>{tx("กลยุทธ์", "Strategy")}</th></tr></thead>
          <tbody>{ROUTING.map((r, i) => <tr key={i}><td>{L(r.task)}</td><td><Tag k={r.tier === "deterministic" ? "ok" : r.tier === "frontier" ? "warn" : "info"}>{r.tier}</Tag></td><td className="small">{L(r.strategy)}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="muted tiny" style={{ marginTop: 10 }}>{tx("ในรุ่นนี้ งานร่างและตรวจรันแบบกำหนดแน่นอนจากหลักฐานที่ยืนยันแล้ว ค่าใช้จ่ายที่แสดงคือประมาณการเมื่อเชื่อมต่อผู้ให้บริการ AI (ตั้งค่าใน .env)", "In this build drafting and QA run deterministically from verified evidence; the cost shown is the estimate once an AI provider is connected (configured in .env).")}</p>
    </div>
  );
}
