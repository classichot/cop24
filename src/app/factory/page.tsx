"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, Tag } from "@/components/ui";
import { AiWriter } from "@/components/agi/AiWriter";
import { createRun, runMission, startRun, type MissionRun } from "@/core/agi/engine";
import { flagshipById } from "@/core/agi/flagship";
import { sha256 } from "@/core/agi/sha256";
import { TODAY } from "@/core/dates";
import { AGI_SITES } from "@/data/agi-sites";
import { USER } from "@/data/tenant";

/** One-click report generation (REQ-REPORT-001 Path A) on the real mission engine. */
const RUNS = "cop24.agi.runs.v1";
const REPORTS = [
  { fid: "F01", th: "รายงานผลการปฏิบัติตาม CoP (รายรอบ)", en: "CoP Monitoring Report (periodic)" },
  { fid: "F02", th: "ชุดคำขอ CoP ขั้นต้น (โครงการใหม่)", en: "Preliminary CoP package (new project)" },
  { fid: "F03", th: "ผลประเมินการปฏิบัติตาม", en: "Compliance assessment" },
  { fid: "F05", th: "ชุดเตรียมรับการตรวจ กกพ.", en: "ERC inspection readiness pack" },
];
const envFor = () => ({ sites: Object.fromEntries(AGI_SITES.map((s) => [s.id, structuredClone(s)])), actor: USER.initials, now: () => new Date().toISOString(), today: TODAY });
const loadRuns = (): MissionRun[] => { try { return JSON.parse(localStorage.getItem(RUNS) ?? "[]") as MissionRun[]; } catch { return []; } };
const saveRuns = (list: MissionRun[]) => { try { localStorage.setItem(RUNS, JSON.stringify(list.slice(0, 12))); } catch {} };

export default function FactoryPage() {
  const { L, tx, entityId } = useApp();
  const [siteId, setSiteId] = useState(AGI_SITES.some((s) => s.id === entityId) ? entityId : "lopburi-1");
  const [fid, setFid] = useState("F01");
  const [run, setRun] = useState<MissionRun | null>(null);
  const [ms, setMs] = useState(0);
  // show the latest one-click run for this plant and report type, if there is one
  useEffect(() => { queueMicrotask(() => setRun(loadRuns().find((r) => r.flagship === fid && r.sites.length === 1 && r.sites[0] === siteId) ?? null)); }, [fid, siteId]);

  const site = AGI_SITES.find((s) => s.id === siteId)!;
  const f = flagshipById(fid)!;
  const generate = () => {
    const t0 = performance.now();
    const now = new Date().toISOString();
    const r = createRun(fid, [structuredClone(site)], { autonomy: "supervised" }, USER.initials, now);
    startRun(r, USER.initials, now);
    runMission(r, envFor());
    setMs(Math.round(performance.now() - t0));
    saveRuns([r, ...loadRuns()]);
    setRun(r);
  };
  const updateRun = (fn: (r: MissionRun) => void) => {
    if (!run) return;
    const c = structuredClone(run); fn(c);
    saveRuns(loadRuns().map((x) => (x.id === c.id ? c : x)));
    setRun(c);
  };

  const report = run?.deliverables.filter((d) => d.id === "report" || d.id === "results-matrix" || d.id === "inspection" || d.id === "plan").at(-1);
  const draft = run?.deliverables.filter((d) => d.id === "report").at(-1);
  const qa = run?.tasks.find((x) => x.taskId === "qa")?.output;
  const blocked = draft?.sections?.filter((s) => s.status === "blocked").length ?? 0;
  const gates = run?.tasks.filter((x) => x.status === "awaiting") ?? [];
  const open = run?.humanTasks.filter((h) => h.status !== "done") ?? [];

  return (
    <div className="page page-mid">
      <PageHead explain={["cop", "evidence-guard"]} kicker={tx("สร้างรายงาน / ONE-CLICK REPORT GENERATION", "Report generation / One click")} title={tx("กดครั้งเดียว ได้ร่างรายงานจากหลักฐานจริง", "One click, a report draft built from real evidence")} lead={tx("เลือกโรงไฟฟ้าและชนิดรายงาน แล้วกดปุ่มเดียว ทีม AI ของ COP24 ระบุข้อกำหนด รวบรวมและตรวจหลักฐาน ร่างทุกบท และตรวจคุณภาพ ส่วนที่ยังไม่มีหลักฐานถูกกั้นไว้อย่างเปิดเผย ไม่ถูกแต่งขึ้น", "Pick the plant and the report, press one button. COP24's AI team identifies the requirements, gathers and checks the evidence, drafts every section and runs QA. Anything without evidence is openly blocked, never invented.")} />

      <div className="oneclick">
        <div className="oneclick-fields">
          <label className="field" style={{ margin: 0 }}><span className="label">{tx("โรงไฟฟ้า", "Plant")}</span>
            <select className="input" value={siteId} onChange={(e) => setSiteId(e.target.value)}>{AGI_SITES.map((s) => <option key={s.id} value={s.id}>{L(s.name)}</option>)}</select>
          </label>
          <label className="field" style={{ margin: 0 }}><span className="label">{tx("รายงาน", "Report")}</span>
            <select className="input" value={fid} onChange={(e) => setFid(e.target.value)}>{REPORTS.map((r) => <option key={r.fid} value={r.fid}>{tx(r.th, r.en)}</option>)}</select>
          </label>
        </div>
        <button type="button" className="btn btn-primary oneclick-btn" onClick={generate}>
          <span aria-hidden="true">⚡</span> {run ? tx("สร้างใหม่อีกครั้ง", "Generate again") : tx("สร้างรายงาน — คลิกเดียว", "Generate report — one click")}
        </button>
        <div className="muted tiny">{L(f.goal)} · {tx(`ปีรายงาน ${site.year + 543}`, `reporting year ${site.year}`)} · {tx("ทีม AI (Supervised) · การอนุมัติ การรับรอง และการยื่นยังเป็นของคน", "AI Team (Supervised) · approvals, certification and filing stay with people")}</div>
      </div>

      {run && (
        <>
          <div className={`note ${run.state === "completed" ? "note-ok" : run.blockedSites[siteId] ? "note-bad" : "note-warn"}`} style={{ marginTop: 18 }}>
            <b>{run.blockedSites[siteId] ? tx("ไม่สร้างรายงาน CoP — ", "No CoP report — ") + L(run.blockedSites[siteId]) : run.state === "completed" ? tx("ร่างเสร็จและผ่านการอนุมัติครบ", "Draft complete and fully approved") : tx("สร้างร่างแล้ว — ยังไม่ใช่ “อนุมัติ” หรือ “ยื่นแล้ว”", "Draft generated — not “approved” or “submitted”")}</b>
            <span className="muted"> · {run.id}{ms ? ` · ${ms} ms` : ""} · {tx("ชุดกฎ", "rules")} {run.rulesetVersion}</span>
          </div>

          <Cells min={150} style={{ marginTop: 14 }}>
            <div className="cell"><div className="label">{tx("งานที่ AI ทำ", "Tasks done by AI")}</div><div className="stat-value stat-value-sm">{run.tasks.filter((x) => x.status === "done").length}/{run.tasks.length}</div></div>
            <div className="cell"><div className="label">{tx("บทที่ถูกกั้น (ไม่มีหลักฐาน)", "Blocked sections (no evidence)")}</div><div className={`stat-value stat-value-sm ${blocked ? "ink-bad" : ""}`}>{blocked}</div></div>
            <div className="cell"><div className="label">{tx("ข้อค้นพบ", "Findings")}</div><div className="stat-value stat-value-sm">{run.findings.length}</div></div>
            <div className="cell"><div className="label">{tx("รอคุณ", "Waiting for you")}</div><div className="stat-value stat-value-sm">{gates.length + open.length}</div></div>
          </Cells>
          {qa && <div className={`note ${(qa.data as { passed?: boolean })?.passed ? "note-ok" : "note-bad"}`} style={{ marginTop: 12 }}><b>QA</b> · {L(qa.summary)}</div>}

          {report && (
            <section className="oneclick-report">
              <div className="row row-center" style={{ justifyContent: "space-between", gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 20 }}>{L(report.title)}</h3>
                <span className="muted tiny">v{report.version} · sha256 {report.hash?.slice(0, 12)}…</span>
              </div>
              {report.sections?.map((s) => (
                <div key={s.id} className={`oneclick-sec ${s.status}`}>
                  <div className="row row-center" style={{ justifyContent: "space-between", gap: 8 }}><b>{L(s.title)}</b>{s.status === "blocked" ? <Tag k="bad">{tx("ยังไม่มีหลักฐาน", "No evidence yet")}</Tag> : <Tag k="ok">{tx("มีแหล่งอ้างอิง", "Sourced")}</Tag>}</div>
                  <div style={{ marginTop: 4 }}>{L(s.text)}</div>
                  {s.sources.length > 0 && <div className="muted tiny" style={{ marginTop: 4 }}>{tx("แหล่ง", "Sources")}: {s.sources.join(", ")}</div>}
                </div>
              ))}
              {report.rows && (
                <div className="table-wrap" style={{ marginTop: 10 }}>
                  <table className="table"><thead><tr>{Object.keys(report.rows[0] ?? {}).map((k) => <th key={k}>{k}</th>)}</tr></thead><tbody>{report.rows.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j} className="small">{String(v)}</td>)}</tr>)}</tbody></table>
                </div>
              )}
              {draft && (
                <AiWriter d={draft} siteName={L(site.name)} onAccept={(sections, model) => updateRun((r) => {
                  const nd = { ...draft, sections, version: r.deliverables.filter((x) => x.id === "report" && x.site === draft.site).length + 1, hash: "" };
                  nd.hash = sha256(JSON.stringify(nd));
                  r.deliverables.push(nd);
                  const prev = r.audit.at(-1)?.hash ?? "GENESIS";
                  const at = new Date().toISOString();
                  const seq = r.audit.length + 1;
                  const detail = `AI-written sections by ${model}, each passed the report guard · ${nd.hash}`;
                  r.audit.push({ seq, at, actor: USER.initials, action: "deliverable", object: `${draft.site}:report@v${nd.version}`, detail, prev, hash: sha256([prev, seq, at, USER.initials, "", "deliverable", `${draft.site}:report@v${nd.version}`, detail].join("|")) });
                })} />
              )}
            </section>
          )}

          {(gates.length > 0 || open.length > 0) && (
            <div className="oneclick-next">
              <div className="label">{tx("สิ่งที่ต้องให้คนทำก่อนยื่น", "What a person must do before filing")}</div>
              <ul className="why-list">
                {gates.map((g) => <li key={g.key}>{L(f.tasks.find((x) => x.id === g.taskId)!.title)}</li>)}
                {open.slice(0, 8).map((h) => <li key={h.id}>{L(h.title)}</li>)}
                {open.length > 8 && <li>… +{open.length - 8}</li>}
              </ul>
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <Link href="/agi#control" className="btn btn-primary btn-sm">{tx("อนุมัติและทำต่อในศูนย์ควบคุม →", "Approve and continue in Mission Control →")}</Link>
                <Link href="/studio" className="btn btn-secondary btn-sm btn-plain">{tx("เปิดสตูดิโอรายงาน", "Open Report Studio")}</Link>
                <Link href="/preflight" className="btn btn-secondary btn-sm btn-plain">{tx("ตรวจก่อนยื่น", "Preflight")}</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
