"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/state/AppState";
import { AppChip, Cells, Glyph, PageHead, Tag } from "@/components/ui";
import { AGENTS, MISSION_CATALOG } from "@/data/tenant";
import { APPS } from "@/packs";
import type { Status } from "@/core/types";

export default function MissionsPage() {
  const { L, tx, data, entityId } = useApp();
  const entity = data.entities.find((e) => e.id === entityId)!;
  const [run, setRun] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = () => {
    if (run) return;
    setRun(true); setStep(0); setDone(false);
    timer.current = setInterval(() => setStep((s) => { if (s + 1 >= 3) { if (timer.current) clearInterval(timer.current); setRun(false); setDone(true); return 3; } return s + 1; }), 1100);
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return (
    <div className="page page-mid">
      <PageHead kicker={tx("ภารกิจ AGI / AGI MISSION MODE", "AGI Mission Mode")} title={tx("บอกผลลัพธ์ที่ต้องการ ทีมเอเจนต์จะจัดลำดับงานเอง", "Say the outcome you want; the agent team sequences the work")} lead={tx("เอเจนต์ร่าง วิเคราะห์ สกัดข้อมูล และขอข้อมูลเพิ่มได้ แต่จะไม่สร้างผลตรวจวัดขึ้นเอง ไม่รับรองผลห้องปฏิบัติการ และไม่ยื่นรายงานแทนคุณ — ทุกเอเจนต์ผูกกับเครื่องยนต์หนึ่งตัวใน COP24 Core และทำงานในขอบเขตเดียวกันไม่ว่าจะอยู่ใน ESG24, TP24 หรือ GMT24", "Agents draft, analyse, extract and request data, but never fabricate a measurement, certify a lab result or file on your behalf. Each agent is bound to one COP24 Core engine and works inside the same guardrails whether it runs in ESG24, TP24 or GMT24.")} />

      <div className="panel panel-framed" style={{ padding: 20, marginTop: 22 }}>
        <div className="label" style={{ letterSpacing: ".12em" }}>{tx("คำสั่งภารกิจ", "Mission order")}</div>
        <div className="heading" style={{ fontSize: 20, lineHeight: 1.4, marginTop: 6 }}>“{tx(`เตรียมรายงาน CoP ขั้นต้นของ${L(entity.name)} ใช้เอกสารที่มีอยู่ แล้วบอกผมเฉพาะสิ่งที่ยังขาด`, `Prepare the preliminary CoP report for ${L(entity.name)} from the documents we have, and tell me only what is still missing`)}”</div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={start}>{done ? tx("เริ่มภารกิจใหม่", "Start a new mission") : run ? tx("ทีมเอเจนต์กำลังทำงาน…", "Agent team working…") : tx("ส่งภารกิจให้ทีมเอเจนต์", "Dispatch to the agent team")}</button>
          <a href="#catalog" className="btn btn-secondary" style={{ background: "var(--color-bg)" }}>{tx("เลือกภารกิจอื่นจากแคตตาล็อก", "Pick another mission from the catalogue")}</a>
        </div>
      </div>

      <Cells min={230} style={{ marginTop: 22 }}>
        {AGENTS.map((a, i) => {
          const stage = done ? 3 : run ? Math.min(step + 1, 3) : 0;
          const idx = done ? 3 : Math.max(0, Math.min(stage - (i > 0 ? 1 : 0), 3));
          const st = done ? tx("เสร็จแล้ว", "Done") : !run ? tx("รอเริ่ม", "Idle") : idx >= 2 ? tx("กำลังทำงาน", "Working") : tx("รอข้อมูลต้นทาง", "Waiting upstream");
          const k: Status = done ? "ok" : !run ? "cond" : "warn";
          return (
            <div key={a.id} className="cell cell-bg" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, minHeight: 190 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div>
                  <div className="heading" style={{ fontSize: 16, lineHeight: 1.25 }}>{L(a.name)}</div>
                  <div className="muted" style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", marginTop: 2 }}>{tx("เครื่องยนต์", "engine")}: {a.engine}</div>
                </div>
                <Tag k={k}>{st}</Tag>
              </div>
              <div className="small muted-7" style={{ lineHeight: 1.6, flex: 1 }}>{L(a.job)}</div>
              <div className="muted tiny" style={{ borderTop: "1px solid var(--color-divider)", paddingTop: 8, lineHeight: 1.5 }}>{L(a.logs[done ? 3 : idx])}</div>
              <div className="tiny" style={{ color: "var(--color-accent-800)" }}>⛔ {a.guardrails.map((g) => L(g)).join(" · ")}</div>
            </div>
          );
        })}
      </Cells>

      {done && (
        <div className="callout" style={{ marginTop: 24, padding: 22 }}>
          <div className="callout-kicker">{tx("ผลภารกิจ", "Mission result")}</div>
          <h3 style={{ margin: "6px 0 12px", fontSize: 23 }}>{tx("ร่างเสร็จแล้ว เหลือ 6 เรื่องที่ต้องให้คนตัดสิน", "Draft done — 6 decisions left for humans")}</h3>
          <div className="stack" style={{ gap: 9, fontSize: 14, lineHeight: 1.55 }}>
            <div style={{ display: "flex", gap: 10 }}><Glyph k="ok" /><span>{tx("ร่างรายงาน 6 บท พร้อมดัชนีหลักฐาน 412 รายการ", "6 chapters drafted with a 412-item evidence index")}</span></div>
            <div style={{ display: "flex", gap: 10 }}><Glyph k="ok" /><span>{tx("แบบฟอร์มหน้าปกและหนังสือรับรองกรอกครบตามแบบของหน่วยงานกำกับ", "Cover form and certification letter completed to the regulator's template")}</span></div>
            <div style={{ display: "flex", gap: 10 }}><Glyph k="bad">!</Glyph><span>{tx("ผลคุณภาพน้ำใต้ดินและเสียงรอบดึกยังไม่มี — ส่งคำขอไปที่ไซต์แล้ว", "Groundwater and night-time noise results still missing — requests sent to site")}</span></div>
            <div style={{ display: "flex", gap: 10 }}><Glyph k="warn">?</Glyph><span>{tx("กำลังผลิตติดตั้งระหว่างใบอนุญาตกับแบบผังไม่ตรงกัน ต้องให้วิศวกรโครงการยืนยัน", "Installed capacity differs between licence and layout — project engineer must confirm")}</span></div>
            <div style={{ display: "flex", gap: 10 }}><Glyph k="info" /><span>{tx("รอผู้มีคุณวุฒิลงนามรับรองก่อนเปลี่ยนสถานะเป็น “อนุมัติให้ยื่น”", "Awaiting qualified signatory before \"approved to file\"")}</span></div>
          </div>
          <div className="row" style={{ marginTop: 18 }}>
            <Link href="/studio" className="btn btn-primary">{tx("เปิดร่างในสตูดิโอ →", "Open in Studio →")}</Link>
            <Link href="/evidence" className="btn btn-secondary" style={{ background: "var(--color-bg)" }}>{tx("ดูรายการที่ยังขาด", "See what's missing")}</Link>
          </div>
        </div>
      )}

      <hr className="hr" style={{ margin: "30px 0 18px" }} />
      <h3 id="catalog" style={{ margin: "0 0 12px", fontSize: 21 }}>{tx("แคตตาล็อกภารกิจ — ข้ามทุกแอป 24", "Mission catalogue — across every 24 app")}</h3>
      <Cells min={224}>
        {MISSION_CATALOG.map((c) => {
          const app = APPS.find((a) => a.id === c.app)!;
          return (
            <Link key={c.id} href={c.route} className="tile tile-sm">
              <AppChip app={app.name} accent={app.accent} />
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{L(c.title)}</span>
              <span className="muted tiny" style={{ lineHeight: 1.45 }}>{L(c.desc)}</span>
            </Link>
          );
        })}
      </Cells>
    </div>
  );
}
