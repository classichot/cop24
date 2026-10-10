"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, Sweep } from "@/components/ui";

export default function FactoryPage() {
  const { L, tx, data, entityId, snap } = useApp();
  const entity = data.entities.find((e) => e.id === entityId)!;
  const packs = snap.applicability.filter((a) => a.entityId === entityId && a.applicable).map((a) => data.packs.find((p) => p.id === a.packId)!);
  const reports = packs.flatMap((p) => p.reports.map((r) => ({ pack: p, r })));
  const [reportIdx, setReportIdx] = useState(0);
  const sel = reports[Math.min(reportIdx, Math.max(0, reports.length - 1))];
  const [run, setRun] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = [
    { t: tx("อ่านและจัดหมวดหมู่เอกสารของหน่วยงาน", "Read and classify the entity's documents"), d: tx("128 ไฟล์ · PDF แบบสแกน 41 ไฟล์ ผ่าน OCR · ไฟล์ซ้ำ 6 ไฟล์ถูกรวม", "128 files · 41 scanned PDFs through OCR · 6 duplicates merged") },
    { t: tx("ระบุชุดกฎที่บังคับใช้กับหน่วยงานนี้", "Pin the rule pack that binds this entity"), d: sel ? `${sel.pack.id} ${sel.pack.version} · ${sel.pack.obligationCount} ${tx("ข้อผูกพัน", "obligations")}` : "—" },
    { t: tx("สกัดข้อเท็จจริงและผูกกับหน้าต้นฉบับ", "Extract facts and bind them to source pages"), d: tx("412 ข้อเท็จจริง · ทุกค่ามีเลขหน้าและชื่อไฟล์กำกับ", "412 facts · every value carries a page number and file name") },
    { t: tx("สร้างตารางและชุดข้อมูล", "Build tables and datasets"), d: tx("17 ตาราง · 4 กราฟเปรียบเทียบ · หน่วยและวิธีวิเคราะห์ถูกตรวจแล้ว", "17 tables · 4 comparison charts · units and methods checked") },
    { t: tx("เขียนร่างทุกบทตามแบบของหน่วยงานกำกับ", "Draft every chapter to the regulator's template"), d: sel ? `${sel.r.chapters.length || 6} ${tx("บท · หัวข้อบังคับถูกล็อกไว้", "chapters · mandatory headings locked")}` : "—" },
    { t: tx("ตรวจความครบถ้วนและความขัดแย้ง 9 ชั้น", "Run the 9-layer completeness and conflict check"), d: tx(`พบประเด็นค้าง ${snap.preflight.blockers + snap.preflight.observations} รายการ · ไม่มีการเติมค่าที่ไม่มีแหล่งอ้างอิง`, `${snap.preflight.blockers + snap.preflight.observations} open issues found · no unsourced value filled`) },
  ];

  const start = () => {
    if (run) return;
    setRun(true); setStep(0); setDone(false);
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= steps.length) { if (timer.current) clearInterval(timer.current); setRun(false); setDone(true); return steps.length; }
        return s + 1;
      });
    }, 950);
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return (
    <div className="page page-mid">
      <PageHead kicker={tx("สร้างรายงานอัตโนมัติ / ONE-CLICK REPORT FACTORY", "One-Click Report Factory")} title={tx("กดครั้งเดียว ได้ร่างรายงานทั้งฉบับ", "One click, a complete draft")} lead={tx("Reporting Engine อ่านเอกสารทั้งหมดที่มี เทียบกับชุดกฎที่บังคับใช้ เขียนทุกบท แล้วส่งคืนเป็นร่างพร้อมรายการข้อยกเว้นให้คนตรวจ — ใช้เครื่องยนต์เดียวกันไม่ว่าจะเป็นรายงาน CoP, 56-1 One Report หรือ Local File", "The Reporting Engine reads every document, matches the binding pack, writes every chapter and returns a draft with an exception list for humans — the same engine whether it is a CoP report, a 56-1 One Report or a TP local file.")} />

      <Cells min={190} style={{ marginTop: 22 }}>
        <div className="cell" style={{ padding: "14px 16px" }}><div className="label-9">{tx("หน่วยงาน", "Entity")}</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{L(entity.name)}</div></div>
        <div className="cell" style={{ padding: "14px 16px" }}>
          <div className="label-9">{tx("ประเภทรายงาน", "Report type")}</div>
          <select className="input" value={reportIdx} onChange={(e) => setReportIdx(Number(e.target.value))} style={{ marginTop: 4, fontWeight: 600, fontSize: 13, minHeight: 32, padding: "2px 6px" }}>
            {reports.map((x, i) => <option key={x.r.id} value={i}>{L(x.r.name)} · {x.pack.app.toUpperCase()}</option>)}
            {!reports.length && <option>{tx("ไม่มีแบบรายงานสำหรับหน่วยงานนี้", "No report template for this entity")}</option>}
          </select>
        </div>
        <div className="cell" style={{ padding: "14px 16px" }}><div className="label-9">{tx("ชุดกฎ", "Rule pack")}</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{sel ? `${sel.pack.id} ${sel.pack.version}` : "—"}</div></div>
        <div className="cell" style={{ padding: "14px 16px" }}><div className="label-9">{tx("แหล่งข้อมูล", "Sources")}</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>128 {tx("ไฟล์", "files")} · {snap.evidenceScore.required} {tx("รายการบังคับ", "required items")}</div></div>
      </Cells>
      <div className="muted small" style={{ marginTop: 8 }}>{tx("COP24 ตั้งค่าที่แนะนำไว้ให้แล้ว · ", "Recommended settings applied · ")}<a href="#">{tx("ตั้งค่าขั้นสูง ▾", "Advanced ▾")}</a></div>

      <div className="row row-center" style={{ marginTop: 22, gap: 10 }}>
        <button className="btn btn-primary btn-xl" onClick={start} disabled={!sel}>{done ? tx("สร้างใหม่อีกครั้ง", "Generate again") : run ? tx("กำลังสร้างร่าง…", "Drafting…") : tx("สร้างร่างรายงานทั้งฉบับ", "Draft the whole report")}</button>
        <span className="muted small">{tx("ใช้เวลาประมาณ 6–9 นาที · คุณไม่ต้องเฝ้าหน้าจอ", "About 6–9 minutes · you don't need to watch")}</span>
      </div>

      <hr className="hr" style={{ margin: "28px 0 0" }} />
      <div>
        {steps.map((s, i) => {
          const isDone = done || i < step;
          const live = run && i === step;
          return (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "16px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div style={{ flex: "none", width: 30, height: 30, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, background: isDone ? "var(--color-accent)" : live ? "var(--color-accent-200)" : "transparent", color: isDone ? "var(--on-accent)" : live ? "var(--color-accent-700)" : "var(--color-neutral-600)", border: isDone ? 0 : "2px solid var(--color-divider)" }}>{isDone ? "✓" : live ? "·" : i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{s.t}</div>
                <div className="muted small" style={{ marginTop: 3, lineHeight: 1.55 }}>{s.d}</div>
                {live && <Sweep />}
              </div>
              <div className="section-tag" style={{ whiteSpace: "nowrap", paddingTop: 3 }}>{isDone ? tx("เสร็จแล้ว", "Done") : live ? tx("กำลังทำ", "Running") : tx("รอคิว", "Queued")}</div>
            </div>
          );
        })}
      </div>

      {done && (
        <div className="callout" style={{ marginTop: 28, padding: 22 }}>
          <div className="callout-kicker">{tx("ผลลัพธ์ · ต้องผ่านการตรวจโดยมนุษย์", "Result · requires human review")}</div>
          <h3 style={{ margin: "6px 0 10px", fontSize: 24 }}>{tx("ร่าง", "Draft of")} {sel && L(sel.r.name)} {tx("พร้อมให้ตรวจแล้ว", "is ready for review")}</h3>
          <Cells min={140} thin accent>
            <div className="cell" style={{ padding: "12px 14px" }}><div className="label-9">{tx("บทที่เขียนแล้ว", "Chapters drafted")}</div><div className="stat-value stat-value-sm">{sel?.r.chapters.length || 6} / {sel?.r.chapters.length || 6}</div></div>
            <div className="cell" style={{ padding: "12px 14px" }}><div className="label-9">{tx("ข้อเท็จจริงที่มีแหล่งอ้างอิง", "Sourced facts")}</div><div className="stat-value stat-value-sm">{data.facts.sourced}</div></div>
            <div className="cell" style={{ padding: "12px 14px" }}><div className="label-9">{tx("ตารางและกราฟ", "Tables & charts")}</div><div className="stat-value stat-value-sm">17</div></div>
            <div className="cell" style={{ padding: "12px 14px" }}><div className="label-9">{tx("ประเด็นค้าง", "Open issues")}</div><div className="stat-value stat-value-sm ink-bad">{snap.preflight.blockers + snap.preflight.observations}</div></div>
          </Cells>
          <div style={{ fontSize: 13, lineHeight: 1.7, marginTop: 14, color: "var(--color-accent-900)" }}>{tx(`AI ไม่ได้เติมตัวเลขใด ๆ ที่หาแหล่งอ้างอิงไม่ได้ — ช่องที่ยังไม่มีหลักฐานถูกทำเครื่องหมายไว้ว่า “ยังไม่ยุติ” ทั้งหมด ${data.facts.total - data.facts.sourced} จุด และจะไม่หายไปเองจนกว่าจะมีคนปิด`, `The AI filled no number it could not source — ${data.facts.total - data.facts.sourced} slots are marked "unresolved" and will not disappear until a person closes them.`)}</div>
          <div className="row" style={{ marginTop: 16 }}>
            <Link href="/studio" className="btn btn-primary">{tx("เปิดร่างในสตูดิโอ →", "Open in Studio →")}</Link>
            <Link href="/preflight" className="btn btn-secondary" style={{ background: "var(--color-bg)" }}>{tx("ดูผลตรวจก่อนยื่น", "See preflight")}</Link>
            <button className="btn btn-secondary" style={{ background: "var(--color-bg)" }}>{tx("ดาวน์โหลด Word / PDF", "Download Word / PDF")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
