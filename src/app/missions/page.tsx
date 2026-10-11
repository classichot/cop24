"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useApp } from "@/state/AppState";
import { AppChip, Cells, Glyph, PageHead, Seg, Tag } from "@/components/ui";
import { AGENTS } from "@/data/tenant";
import { APPS } from "@/packs";
import type { Status } from "@/core/types";
import { MISSIONS, journey, missionById, missionsForRole, viewMission } from "@/core/ux/catalog";
import { GuidedJourney } from "@/components/ux/Journey";
import { MissionCard } from "@/components/ux/MissionCard";
import { AssistLevel, ExplainThis, WhyAI, type Assist } from "@/components/ux/parts";
import { useUx } from "@/components/ux/useUx";

export default function MissionsPage() {
  return <Suspense fallback={<div className="page" />}><Missions /></Suspense>;
}

type Crew = "single" | "team" | "swarm";

function Missions() {
  const { L, tx, mode } = useApp();
  const ctx = useUx();
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("m");
  const assist = (params.get("assist") as Assist | null) ?? "guide";
  const mission = id ? missionById(id) : undefined;
  const [crew, setCrew] = useState<Crew>(mode === "agi" ? "team" : "single");
  const [run, setRun] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const start = () => {
    if (run) return;
    setRun(true); setStep(0); setDone(false);
    timer.current = setInterval(() => setStep((s) => { if (s + 1 >= 3) { if (timer.current) clearInterval(timer.current); setRun(false); setDone(true); return 3; } return s + 1; }), 1100);
  };
  const setAssist = (a: Assist) => {
    if (a === "myself" && mission) return router.push(mission.module);
    router.replace(`/missions?m=${id}&assist=${a}`);
  };

  /* ───────── a mission is open: §5 guided journey + §7 assistance level ───────── */
  if (mission) {
    const view = viewMission(mission, ctx);
    const j = journey(view, ctx);
    const aiSteps = view.plan.filter((p) => p.by === "ai");
    const humanSteps = view.plan.filter((p) => p.by === "human");
    const agents = crew === "single" ? AGENTS.slice(0, 1) : AGENTS;
    return (
      <div className="page page-mid">
        <PageHead kicker={<Link href="/missions" className="kicker" style={{ textDecoration: "none" }}>← {tx("ภารกิจของฉัน", "My missions")}</Link>} title={L(view.title)} lead={L(mission.outcome)} />
        <div style={{ marginTop: 18 }}>
          <div className="label" style={{ marginBottom: 6 }}>{tx("ให้ช่วยแบบไหน", "How should we do it?")}</div>
          <AssistLevel value={assist} onChange={setAssist} />
        </div>

        <div style={{ marginTop: 22 }}>
          <GuidedJourney j={j} title={L(view.title)} guide={assist === "guide"} continueHref={assist === "for-me" && mission.forMe ? `${mission.forMe}?goal=${encodeURIComponent(L(view.title))}` : undefined} />
        </div>

        {assist === "for-me" && (
          <section className="panel" style={{ marginTop: 22 }}>
            <div className="section-head"><h3 style={{ fontSize: 19 }}>{tx("ทำให้ฉัน — AI ทำงานแทน", "Do it for me — the AI does the work")}</h3><ExplainThis id="mission-authorisation" /></div>
            <Cells min={260} thin style={{ marginTop: 12 }}>
              <div className="cell cell-bg">
                <div className="label">{tx("AI ทำ", "The AI does")}</div>
                <ul className="why-list">{aiSteps.map((p, i) => <li key={i}>{L(p.label)}{p.done ? " ✓" : ""}</li>)}</ul>
              </div>
              <div className="cell cell-bg">
                <div className="label">{tx("ถามคุณเฉพาะ", "It asks you only for")}</div>
                <ul className="why-list">{humanSteps.map((p, i) => <li key={i}>{L(p.label)}{p.count ? ` (${p.count})` : ""}{p.done ? " ✓" : ""}</li>)}</ul>
                <div className="muted tiny" style={{ marginTop: 6 }}>{tx("ข้อมูลที่ขาด การตัดสินใจที่มีสาระสำคัญ การอนุมัติ ข้อยกเว้น และการกระทำที่ต้องมีคนอนุญาต", "Missing information, material decisions, approvals, exceptions and anything needing human authorisation.")}</div>
              </div>
            </Cells>
            <div className="row row-center" style={{ marginTop: 16, gap: 12 }}>
              <span className="label">{tx("รูปแบบการทำงานของ AI", "AI execution")}</span>
              <Seg<Crew> name="crew" value={crew} onChange={setCrew} options={[
                { v: "single", label: tx("เอเจนต์เดียว", "Single agent") },
                { v: "team", label: tx("ทีม", "Team") },
                ...(mode === "agi" ? [{ v: "swarm" as Crew, label: tx("ฝูง (Swarm)", "Swarm") }] : []),
              ]} />
              {mode !== "agi" && <span className="muted tiny">{tx("โหมด AGI เปิดตัวเลือก Swarm", "AGI mode adds Swarm")}</span>}
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              {mission.agi && <Link href={`/agi?f=${mission.agi}`} className="btn btn-primary">{tx("รันในศูนย์ควบคุม AGI →", "Run in AGI Mission Control →")}</Link>}
              {mission.forMe ? (
                <Link href={`${mission.forMe}?goal=${encodeURIComponent(L(view.title))}`} className="btn btn-primary">{tx("ส่งต่อให้ AI → ตั้งขอบเขตและอนุญาต", "Hand off to AI → set scope and authorise")}</Link>
              ) : (
                <button type="button" className="btn btn-primary" onClick={start}>{done ? tx("เริ่มใหม่", "Run again") : run ? tx("AI กำลังทำงาน…", "AI working…") : tx("ส่งภารกิจให้ AI", "Dispatch to the AI")}</button>
              )}
              <Link href={mission.module} className="btn btn-secondary btn-plain">{tx("ดูในโมดูล", "See it in the module")}</Link>
            </div>
            {(run || done) && !mission.forMe && (
              <Cells min={220} style={{ marginTop: 16 }}>
                {agents.map((a, i) => {
                  const stage = done ? 3 : run ? Math.min(step + 1, 3) : 0;
                  const idx = done ? 3 : Math.max(0, Math.min(stage - (i > 0 ? 1 : 0), 3));
                  const k: Status = done ? "ok" : "warn";
                  return (
                    <div key={a.id} className="cell cell-bg" style={{ padding: 14 }}>
                      <div className="row row-center" style={{ justifyContent: "space-between" }}><b>{L(a.name)}</b><Tag k={k}>{done ? tx("เสร็จ", "Done") : tx("ทำงาน", "Working")}</Tag></div>
                      <div className="muted tiny" style={{ marginTop: 6 }}>{L(a.logs[idx])}</div>
                    </div>
                  );
                })}
              </Cells>
            )}
            {done && !mission.forMe && (
              <div className="note note-ok" style={{ marginTop: 14 }}>{tx(`AI ทำส่วนของตัวเองแล้ว เหลือ ${humanSteps.filter((p) => !p.done).length} เรื่องที่ต้องให้คนตัดสิน — ดูที่ “งานของฉัน”`, `The AI has done its part; ${humanSteps.filter((p) => !p.done).length} item(s) need a person — see “My work”.`)} <Link href="/my-work">{tx("ไปที่งานของฉัน →", "Go to My work →")}</Link></div>
            )}
          </section>
        )}

        <div style={{ marginTop: 18 }}><WhyAI why={mission.why(ctx)} /></div>
      </div>
    );
  }

  /* ───────── no mission open: My missions + catalogue ───────── */
  const mine = missionsForRole(ctx, 8);
  const others = MISSIONS.filter((m) => !mine.some((v) => v.mission.id === m.id) && m.id !== "start" && m.id !== "my-tasks");
  return (
    <div className="page page-wide">
      <PageHead kicker={tx("ภารกิจของฉัน / MY MISSIONS", "My missions")} title={tx("งานที่จัดเป็นภารกิจ — AI ทำ คุณตัดสิน", "Work organised as missions — the AI does it, you decide")} lead={tx("แต่ละภารกิจรู้ว่าต้องใช้ข้อมูลอะไร อะไรที่ AI ทำได้ และอะไรที่ต้องให้คุณตัดสิน เลือกได้ว่าจะทำเอง ให้ AI แนะนำ หรือให้ AI ทำให้", "Each mission knows the data it needs, what the AI can do and what needs you. Do it yourself, be guided, or have the AI do it.")} />
      <div className="mcard-grid" style={{ marginTop: 20 }}>
        {mine.map((m) => <MissionCard key={m.mission.id} view={m} showApp={m.mission.app !== "cop24"} />)}
      </div>
      <hr className="hr hr-section" />
      <Link href="/agi#catalog" className="callout agi-callout">
        <span className="callout-kicker">{tx("โหมด AGI", "AGI mode")}</span>
        <span className="heading" style={{ fontSize: 20 }}>{tx("แคตตาล็อกภารกิจ AGI — 108 ภารกิจ ใน 12 หมวด →", "AGI mission catalog — 108 missions in 12 categories →")}</span>
        <span className="small">{tx("ภารกิจหลัก F01–F07 ตัวอย่างก่อนเริ่ม ศูนย์ควบคุมภารกิจ Single Bot / Team / Swarm", "Flagships F01–F07, mission preview, Mission Control, Single Bot / Team / Swarm")}</span>
      </Link>
      <h3 id="catalog" style={{ margin: "22px 0 12px", fontSize: 21 }}>{tx("เป้าหมายที่พบบ่อย — ข้ามทุกแอป 24", "Common goals — across every 24 app")}</h3>
      <Cells min={224}>
        {others.map((m) => {
          const app = APPS.find((a) => a.id === m.app)!;
          return (
            <Link key={m.id} href={`/missions?m=${m.id}`} className="tile tile-sm">
              <AppChip app={app.name} accent={app.accent} />
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{L(m.title(ctx))}</span>
              <span className="muted tiny" style={{ lineHeight: 1.45 }}>{L(m.outcome)}</span>
            </Link>
          );
        })}
      </Cells>
      <hr className="hr hr-section" />
      <h3 style={{ margin: "0 0 6px", fontSize: 21 }}>{tx("ทีมเอเจนต์และขอบเขต", "The agent team and its guardrails")}</h3>
      <p className="text-muted small" style={{ margin: "0 0 12px" }}>{tx("เอเจนต์ร่าง วิเคราะห์ สกัดข้อมูล และขอข้อมูลเพิ่มได้ แต่จะไม่สร้างผลตรวจวัดขึ้นเอง ไม่รับรองผลห้องปฏิบัติการ และไม่ยื่นรายงานแทนคุณ", "Agents draft, analyse, extract and request data, but never fabricate a measurement, certify a lab result or file on your behalf.")}</p>
      <Cells min={230}>
        {AGENTS.map((a) => (
          <div key={a.id} className="cell cell-bg" style={{ padding: 16 }}>
            <div className="heading" style={{ fontSize: 15 }}>{L(a.name)}</div>
            <div className="muted tiny" style={{ marginTop: 2, textTransform: "uppercase", letterSpacing: ".08em" }}>{tx("เครื่องยนต์", "engine")}: {a.engine}</div>
            <div className="small muted-7" style={{ marginTop: 8, lineHeight: 1.55 }}>{L(a.job)}</div>
            <div className="tiny" style={{ marginTop: 8, color: "var(--color-accent-800)" }}><Glyph k="bad">⛔</Glyph> {a.guardrails.map((g) => L(g)).join(" · ")}</div>
          </div>
        ))}
      </Cells>
    </div>
  );
}
