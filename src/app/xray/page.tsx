"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, Tag } from "@/components/ui";
import type { Status } from "@/core/types";

export default function XrayPage() {
  const { tx } = useApp();
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => { if (state === "running") return; setState("running"); timer.current = setTimeout(() => setState("done"), 1900); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const rows: { ch: string; finding: string; sev: string; k: Status }[] = [
    { ch: tx("บทที่ 1 · ข้อมูลทั่วไปของโครงการ", "Ch.1 · General project information"), finding: tx("ครบตามแบบรายงาน ไม่พบข้อบกพร่อง", "Complete per template; no defects"), sev: tx("ผ่าน", "Pass"), k: "ok" },
    { ch: tx("บทที่ 2 · รายละเอียดการออกแบบ", "Ch.2 · Design details"), finding: tx("กำลังผลิตติดตั้งระบุ 48 MW แต่ตารางในบทที่ 5 ระบุ 45 MW — ตัวเลขที่ผู้ตรวจมักท้วงเป็นอันดับแรก", "Installed capacity 48 MW here but 45 MW in Chapter 5 — the first thing a reviewer challenges"), sev: tx("สาระสำคัญ", "Material"), k: "bad" },
    { ch: tx("บทที่ 3 · สภาพแวดล้อมปัจจุบัน", "Ch.3 · Current conditions"), finding: tx("มีข้อความอ้างผลตรวจวัด 11 จุดโดยไม่มีรายงานห้องปฏิบัติการแนบ", "11 statements cite measurements with no laboratory report attached"), sev: tx("สาระสำคัญ", "Material"), k: "bad" },
    { ch: tx("บทที่ 4 · มาตรการป้องกันและแก้ไข", "Ch.4 · Mitigation"), finding: tx("ขาดมาตรการจัดการน้ำล้างแผงและการจัดการแผงเสื่อมสภาพที่ชุดกฎกำหนด", "Missing the panel-washing and end-of-life panel measures the pack requires"), sev: tx("สาระสำคัญ", "Material"), k: "bad" },
    { ch: tx("บทที่ 5 · มาตรการติดตามตรวจสอบ", "Ch.5 · Monitoring"), finding: tx("ระบุความถี่การตรวจวัดไม่ครบทุกพารามิเตอร์ และไม่ได้ระบุผู้รับผิดชอบ", "Frequencies missing for some parameters; no owner named"), sev: tx("ควรแก้ไข", "Should fix"), k: "warn" },
    { ch: tx("บทที่ 6 · การมีส่วนร่วมของประชาชน", "Ch.6 · Public participation"), finding: tx("ยังไม่มีเนื้อหา — เหมาะสมกับรายงานขั้นต้น แต่ต้องเติมก่อนแปลงเป็นขั้นสุดท้าย", "Empty — acceptable for a preliminary report, must be filled before final"), sev: tx("มีเงื่อนไข", "Conditional"), k: "cond" },
    { ch: tx("เอกสารแนบ", "Annexes"), finding: tx("สำเนาใบอนุญาตไม่มีการรับรองสำเนาถูกต้อง และขาดหนังสือรับรองห้องปฏิบัติการที่ยังไม่หมดอายุ", "Licence copy not certified; valid laboratory accreditation missing"), sev: tx("ควรแก้ไข", "Should fix"), k: "warn" },
  ];

  return (
    <div className="page page-mid">
      <PageHead kicker={tx("เอกซเรย์รายงานเดิม / COMPLIANCE X-RAY", "Compliance X-Ray")} title={tx("รายงานที่ที่ปรึกษาทำไว้ ใช้ยื่นได้จริงไหม", "Is the consultant's report actually fileable?")} lead={tx("อัปโหลดรายงานที่มีอยู่ — CoP, 56-1, Local File, นโยบาย PDPA — COP24 จะเทียบกับชุดกฎที่บังคับใช้จริง แล้วคืนผลเป็นช่องว่างรายบท ข้อความที่ไม่มีหลักฐานรองรับ และข้อมูลที่ขัดแย้งกันเอง", "Upload any existing report — CoP, 56-1, local file, PDPA policy — and COP24 compares it with the pack that actually binds, returning chapter gaps, unsupported statements and internal contradictions.")} />

      <div className="dashed" style={{ padding: 26, marginTop: 22, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", textAlign: "left" }}>
        <div style={{ flex: "1 1 300px", minWidth: 0 }}>
          <div className="heading" style={{ fontSize: 17 }}>{tx("รายงาน CoP ขั้นต้น ลพบุรี 1 (ฉบับที่ปรึกษา).pdf", "Preliminary CoP report — Lopburi 1 (consultant).pdf")}</div>
          <div className="muted small" style={{ marginTop: 4 }}>184 {tx("หน้า", "pages")} · 24.8 MB · {tx("อัปโหลดเมื่อ 2 นาทีที่แล้ว", "uploaded 2 minutes ago")}</div>
        </div>
        <button className="btn btn-primary" onClick={start} style={{ minHeight: 44, paddingInline: 20 }}>{state === "done" ? tx("วิเคราะห์ใหม่", "Analyse again") : state === "running" ? tx("กำลังวิเคราะห์…", "Analysing…") : tx("วิเคราะห์ความสอดคล้อง", "Analyse compliance")}</button>
      </div>

      {state === "running" && (
        <div style={{ marginTop: 20, border: "2px solid var(--color-divider)", padding: 18 }}>
          <div className="pulse" style={{ fontSize: 14, fontWeight: 600 }}>{tx("กำลังเทียบ 184 หน้า กับข้อผูกพัน 61 ข้อ…", "Comparing 184 pages with 61 obligations…")}</div>
          <div className="bar bar-5" style={{ marginTop: 12 }}><div className="sweep" style={{ width: "28%" }} /></div>
        </div>
      )}

      {state === "done" && (
        <div>
          <Cells min={180} style={{ marginTop: 24 }}>
            <div className="cell" style={{ padding: 20 }}><div className="label">{tx("ความสอดคล้องโดยรวม", "Overall compliance")}</div><div className="stat-value" style={{ fontSize: 44, lineHeight: 1.05, color: "var(--st-warn)" }}>63<span style={{ fontSize: 20, color: "var(--color-neutral-600)" }}>/100</span></div></div>
            <div className="cell" style={{ padding: 20 }}><div className="label">{tx("หัวข้อบังคับที่ขาด", "Mandatory headings missing")}</div><div className="stat-value stat-value-md" style={{ fontSize: 30 }}>4</div><div className="small muted-7" style={{ marginTop: 3 }}>{tx("จากทั้งหมด 7 บท", "of 7 chapters")}</div></div>
            <div className="cell" style={{ padding: 20 }}><div className="label">{tx("ข้อความไร้หลักฐาน", "Unsupported statements")}</div><div className="stat-value stat-value-md ink-bad" style={{ fontSize: 30 }}>19</div><div className="small muted-7" style={{ marginTop: 3 }}>{tx("อ้างผลโดยไม่มีเอกสารแนบ", "cite results with no attachment")}</div></div>
            <div className="cell" style={{ padding: 20 }}><div className="label">{tx("ข้อมูลขัดแย้งกันเอง", "Internal contradictions")}</div><div className="stat-value stat-value-md ink-bad" style={{ fontSize: 30 }}>5</div><div className="small muted-7" style={{ marginTop: 3 }}>{tx("ตัวเลขไม่ตรงกันระหว่างบท", "figures disagree between chapters")}</div></div>
          </Cells>

          <div className="callout" style={{ marginTop: 20 }}>
            <div className="callout-kicker">{tx("แปลผลให้ฟัง", "In plain words")}</div>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{tx("63/100 หมายความว่ารายงานฉบับนี้มีโครงสร้างใช้ได้ แต่ยังยื่นไม่ได้", "63/100 means the structure is usable, but the report cannot be filed yet")}</div>
            <div style={{ fontSize: 13, color: "var(--color-accent-900)", marginTop: 6, lineHeight: 1.7 }}>{tx("ปัญหาหลักไม่ใช่การเขียน แต่เป็นหลักฐาน: ข้อความ 19 จุดอ้างผลการตรวจวัดโดยไม่มีเอกสารแนบ และกำลังผลิตติดตั้งในบทที่ 2 (48 MW) ไม่ตรงกับบทที่ 5 (45 MW) ซึ่งเป็นประเด็นที่ผู้ตรวจมักท้วงเป็นอันดับแรก", "The problem is not the writing but the evidence: 19 statements cite measurements with nothing attached, and installed capacity in Chapter 2 (48 MW) disagrees with Chapter 5 (45 MW) — the first thing a reviewer will challenge.")}</div>
            <Link href="/studio" className="btn btn-primary" style={{ marginTop: 12 }}>{tx("ให้ COP24 ซ่อมให้ →", "Let COP24 fix it →")}</Link>
          </div>

          <h3 style={{ margin: "28px 0 10px", fontSize: 22 }}>{tx("ช่องว่างรายบท", "Gaps by chapter")}</h3>
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 680 }}>
              <thead><tr><th style={{ width: "30%" }}>{tx("บท", "Chapter")}</th><th>{tx("สิ่งที่ตรวจพบ", "Finding")}</th><th style={{ width: 130 }}>{tx("ความรุนแรง", "Severity")}</th></tr></thead>
              <tbody>{rows.map((x, i) => <tr key={i}><td style={{ verticalAlign: "top", fontWeight: 600, lineHeight: 1.4 }}>{x.ch}</td><td className="muted-7" style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.6 }}>{x.finding}</td><td style={{ verticalAlign: "top" }}><Tag k={x.k}>{x.sev}</Tag></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
