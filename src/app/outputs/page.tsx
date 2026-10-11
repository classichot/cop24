"use client";

import Link from "next/link";
import { useApp } from "@/state/AppState";
import { PageHead, Tag } from "@/components/ui";
import { ExplainThis, ResultInterpreter } from "@/components/ux/parts";
import { useUx } from "@/components/ux/useUx";
import type { Status } from "@/core/types";

/**
 * Reports & Outputs — §18. What COP24 produces, described by business outcome rather than by
 * module, each with a plain-language status and the next step.
 */
export default function OutputsPage() {
  const { L, tx, data } = useApp();
  const ctx = useUx();
  const r = data.report;
  const outputs: { title: string; what: string; status: string; k: Status; href: string; cta: string }[] = [
    { title: tx(`รายงาน CoP ขั้นต้น ${r.version}`, `Preliminary CoP report ${r.version}`), what: tx("รายงานที่ยื่น กกพ. — ร่างโดย AI จากหลักฐาน ทุกประโยคมีแหล่งอ้างอิง", "The report filed with the ERC — drafted by the AI from evidence, every sentence sourced."), status: tx(`อนุมัติแล้ว ${ctx.chaptersApproved}/${ctx.chaptersTotal} บท · ${ctx.gateLabel.th}`, `${ctx.chaptersApproved}/${ctx.chaptersTotal} chapters approved · ${ctx.gateLabel.en}`), k: ctx.gate >= 4 ? "ok" : "warn", href: "/studio", cta: tx("เปิดรายงาน", "Open report") },
    { title: tx("ชุดเอกสารสำหรับยื่น", "Submission bundle"), what: tx("รายงาน แบบฟอร์มหน้าปก ดัชนีหลักฐาน และคำแนะนำการยื่น ในไฟล์เดียว", "Report, cover form, evidence index and filing guide in one package."), status: ctx.gate >= 4 ? tx("พร้อมส่งออก", "Ready to export") : tx(`ยังไม่พร้อม — กั้นอยู่ ${ctx.blockers} รายการ`, `Not ready — ${ctx.blockers} blocker(s)`), k: ctx.gate >= 4 ? "ok" : "bad", href: "/preflight", cta: tx("ดูสิ่งที่กั้น", "See blockers") },
    { title: tx("ดัชนีหลักฐาน", "Evidence index"), what: tx("ทุกเอกสารที่รายงานอ้าง พร้อมสถานะ 3 ชั้น", "Every document the report cites, with its 3-layer status."), status: tx(`พิสูจน์แล้ว ${ctx.evidenceProven}/${ctx.evidenceRequired}`, `${ctx.evidenceProven}/${ctx.evidenceRequired} proven`), k: ctx.readiness >= 90 ? "ok" : "warn", href: "/evidence", cta: tx("เปิดดัชนี", "Open index") },
    { title: tx("ชุดตรวจสอบคุณภาพรายงาน", "Report quality audit package"), what: tx("บัญชีข้อความ การคำนวณ และผลของ 9 ประตูคุณภาพ สำหรับผู้ตรวจสอบ", "Claim ledger, calculations and the 9 quality gates — for auditors."), status: tx(`มีแหล่ง ${ctx.factsSourced}/${ctx.factsTotal} ข้อความ`, `${ctx.factsSourced}/${ctx.factsTotal} claims sourced`), k: ctx.factsSourced === ctx.factsTotal ? "ok" : "warn", href: "/report-quality", cta: tx("เปิดชุดตรวจสอบ", "Open package") },
    { title: tx("สรุปสำหรับบอร์ด", "Board summary"), what: tx("สถานะการปฏิบัติตามของทั้งกลุ่มในหน้าเดียว", "The whole group's compliance status on one page."), status: tx(`${ctx.entitiesTotal} หน่วยงาน · ช่องว่างสาระสำคัญ ${ctx.materialGaps}`, `${ctx.entitiesTotal} entities · ${ctx.materialGaps} material gap(s)`), k: ctx.materialGaps ? "warn" : "ok", href: "/portfolio", cta: tx("เปิดสรุป", "Open summary") },
    { title: tx("ผลเอกซเรย์รายงาน", "Report X-ray results"), what: tx("ช่องว่างรายบทของรายงานที่มีอยู่", "Chapter-level gaps in an existing report."), status: tx("สร้างเมื่ออัปโหลดรายงาน", "Produced when you upload a report"), k: "info", href: "/xray", cta: tx("ตรวจรายงาน", "Check a report") },
  ];
  return (
    <div className="page page-mid">
      <PageHead kicker={tx("รายงานและผลลัพธ์ / REPORTS & OUTPUTS", "Reports & outputs")} title={tx("สิ่งที่ COP24 ทำเสร็จให้คุณ", "What COP24 produces for you")} lead={tx("ทุกผลลัพธ์บอกว่าคืออะไร สถานะเป็นอย่างไร และต้องทำอะไรต่อ", "Each output says what it is, where it stands and what to do next.")} />
      <div style={{ marginTop: 18 }}>
        <div className="label" style={{ marginBottom: 6 }}>{tx("สถานะการยื่น", "Filing status")} <ExplainThis id="gate" /></div>
        <ResultInterpreter kind="gate" />
      </div>
      <div className="worklist" style={{ marginTop: 22 }}>
        {outputs.map((o) => (
          <div key={o.title} className="list-item">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="heading" style={{ fontSize: 16 }}>{o.title}</div>
              <div className="muted small" style={{ marginTop: 2 }}>{o.what}</div>
              <div style={{ marginTop: 6 }}><Tag k={o.k}>{o.status}</Tag></div>
            </div>
            <Link href={o.href} className="btn btn-secondary btn-sm btn-plain" style={{ whiteSpace: "nowrap" }}>{o.cta} →</Link>
          </div>
        ))}
      </div>
      <p className="muted tiny" style={{ marginTop: 16 }}>{L({ th: `ชุดกฎ ${r.rulepackVersion} · ทุกผลลัพธ์อ้างอิงเวอร์ชันของชุดกฎและหลักฐาน`, en: `Rule pack ${r.rulepackVersion} · every output cites its rule-pack version and evidence snapshot` })}</p>
    </div>
  );
}
