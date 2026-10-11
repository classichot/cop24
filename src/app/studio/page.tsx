"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/state/AppState";
import { Glyph, Tag, layerMark } from "@/components/ui";
import { ExplainThis } from "@/components/ux/parts";
import { obligationById } from "@/packs";
import { assessReport } from "@/core/report/assess";
import { checkRewrite } from "@/core/report/semantic";
import { LB1_REPORT_INPUT, LB1_REWRITE_DEMO } from "@/data/report-lb1";

export default function StudioPage() {
  const { L, tx, data, evidenceGuard, lang } = useApp();
  const report = data.report;
  const [chapterId, setChapterId] = useState("env");
  const [drafted, setDrafted] = useState<Record<string, boolean>>({});
  const [rewrite, setRewrite] = useState(false);
  const quality = useMemo(() => assessReport(LB1_REPORT_INPUT), []);
  const rewriteCheck = useMemo(() => checkRewrite(LB1_REWRITE_DEMO.before, LB1_REWRITE_DEMO.after, { sectionId: "env", outcome: "clarity", requirementIds: [], allowedSources: [], approvedFacts: [], lockedWording: [] }), []);
  const cur = report.chapters.find((c) => c.id === chapterId) ?? report.chapters[0];
  const hasBody = cur.paras.length > 0 || drafted[cur.id];
  const evidence = cur.evidenceIds.map((id) => data.evidence.find((e) => e.id === id)!).filter(Boolean);
  const missing = evidence.filter((e) => e.layers[0] === -1);
  const guardBlocks = evidenceGuard && (missing.length > 0 || cur.unresolved.length > 0);
  const ob = obligationById(cur.obligationIds[0]);
  const approved = report.chapters.filter((c) => c.state === "approved").length;
  const stText = (st: string) => (st === "approved" ? tx("อนุมัติแล้ว", "Approved") : st === "drafting" ? tx("ร่างโดย AI", "AI draft") : tx("ยังไม่ร่าง", "Not drafted"));

  return (
    <div style={{ padding: "22px 24px 48px" }}>
      <div className="row" style={{ alignItems: "baseline", gap: 14, marginBottom: 14 }}>
        <div className="kicker" style={{ margin: 0 }}>{tx("สตูดิโอรายงาน / AI REPORT STUDIO", "AI Report Studio")}</div>
        <span className="muted" style={{ fontSize: 13 }}>{L(data.entities.find((e) => e.id === report.entityId)!.name)} · {tx("รายงาน CoP ขั้นต้น", "Preliminary CoP report")} · {tx("ฉบับร่าง", "Draft")} {report.version} · rulepack {report.rulepackVersion}</span>
        {!evidenceGuard && <Tag k="warn">{tx("Evidence Guard ปิดอยู่", "Evidence Guard off")}</Tag>}
        <Tag k="bad">DRAFT</Tag>
        <ExplainThis id="evidence-guard" />
        <ExplainThis id="claim-ledger" />
        <Link href="/report-quality" className="btn btn-ghost btn-sm">{tx(`ประตูคุณภาพ ${quality.gates.filter((g) => g.result === "pass").length}/${quality.gates.length} →`, `Quality gates ${quality.gates.filter((g) => g.result === "pass").length}/${quality.gates.length} →`)}</Link>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 0, border: "2px solid var(--color-divider)" }}>
        <div style={{ flex: "1 1 200px", minWidth: 190, background: "var(--color-bg)", boxShadow: "0 0 0 1px var(--color-divider)", padding: "16px 0" }}>
          <div className="label" style={{ padding: "0 16px 10px", letterSpacing: ".12em" }}>{tx("บทในรายงาน", "Chapters")}</div>
          {report.chapters.map((c) => (
            <button key={c.id} className={`chapter-btn${c.id === cur.id ? " active" : ""}`} onClick={() => setChapterId(c.id)}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", width: "100%" }}>
                <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{c.num}. {L(c.title)}</span>
                <span className="dot" style={{ background: c.state === "approved" ? "var(--st-ok)" : c.state === "drafting" ? "var(--st-warn)" : "var(--color-neutral-400)" }} />
              </span>
              <span className="muted" style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>{stText(c.state)}</span>
            </button>
          ))}
          <div style={{ padding: "14px 16px 0", marginTop: 10, borderTop: "2px solid var(--color-divider)" }}>
            <div className="muted tiny" style={{ lineHeight: 1.55 }}>{tx(`อนุมัติแล้ว ${approved} จาก ${report.chapters.length} บท`, `${approved} of ${report.chapters.length} chapters approved`)}<br />{tx("ล็อกบทที่อนุมัติไว้ไม่ให้ AI เขียนทับ", "Approved chapters are locked against AI rewrites")}</div>
          </div>
        </div>

        <div style={{ flex: "3 1 420px", minWidth: 320, background: "var(--color-bg)", boxShadow: "0 0 0 1px var(--color-divider)", padding: "20px 22px" }}>
          <div className="row row-center" style={{ paddingBottom: 12, borderBottom: "2px solid var(--color-divider)" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setDrafted({ ...drafted, [cur.id]: true })}>{tx("ร่างหัวข้อนี้ด้วย AI", "Draft this section with AI")}</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setRewrite(!rewrite)}>{tx("เขียนใหม่ให้ชัดขึ้น", "Rewrite for clarity")}</button>
            <Link href="/preflight" className="btn btn-secondary btn-sm">{tx("ตรวจความสอดคล้องกับหน่วยงานกำกับ", "Check against the regulator")}</Link>
            <button className="btn btn-secondary btn-sm">{tx("สร้างตาราง", "Build table")}</button>
            <button className="btn btn-secondary btn-sm">{tx("หาหลักฐานสนับสนุน", "Find supporting evidence")}</button>
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="row row-center">
              <Tag k="info">{tx("หัวข้อบังคับ · แก้ไขชื่อไม่ได้", "Mandatory heading · title locked")}</Tag>
              <span className="muted tiny">{tx("กำหนดโดยแบบรายงานของหน่วยงานกำกับ", "Set by the regulator's template")}</span>
            </div>
            <h2 style={{ margin: "10px 0 4px", fontSize: 26, fontWeight: 700 }}>{cur.num}. {L(cur.title)}</h2>
            <div className="muted small" style={{ marginBottom: 16 }}>{L(cur.meta)}</div>

            {hasBody ? (
              <div className="prose">
                {(cur.paras.length ? cur.paras : [{ th: "ร่างโดย COP24 จากหลักฐานที่ผูกกับบทนี้ ข้อความทุกย่อหน้าชี้กลับไปยังไฟล์ต้นทางและเลขหน้าได้ ส่วนที่ยังไม่มีหลักฐานรองรับจะไม่ถูกเขียนเป็นข้อความยืนยัน", en: "Drafted by COP24 from the evidence bound to this chapter. Every paragraph points back to a source file and page; anything without evidence is not written as an assertion." }]).map((p, i) => <p key={i}>{L(p)}</p>)}
                {cur.unresolved.map((u, i) => (
                  <div key={i} className="note note-bad" style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600 }}>{tx("ยังไม่ยุติ · ไม่มีหลักฐานรองรับ", "Unresolved · no supporting evidence")}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{L(u)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashed" style={{ padding: 34 }}>
                <div className="heading" style={{ fontSize: 18 }}>{tx("ยังไม่มีเนื้อหาในบทนี้", "This chapter has no content yet")}</div>
                <div className="small muted-7" style={{ marginTop: 6, maxWidth: 420, marginInline: "auto", lineHeight: 1.6 }}>{tx(`COP24 มีหลักฐานที่เกี่ยวข้องกับบทนี้แล้ว ${evidence.length} รายการ และรู้ว่าแบบรายงานของหน่วยงานกำกับต้องการอะไรบ้าง`, `COP24 already holds ${evidence.length} related evidence items and knows what the regulator's template requires.`)}</div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setDrafted({ ...drafted, [cur.id]: true })}>{tx("ร่างหัวข้อนี้ด้วย AI", "Draft this section with AI")}</button>
              </div>
            )}

            <div className="row row-center" style={{ marginTop: 18, paddingTop: 16, borderTop: "2px solid var(--color-divider)" }}>
              <button className="btn btn-primary" disabled={guardBlocks || cur.state === "approved"} title={guardBlocks ? tx("Evidence Guard กั้นไว้", "Blocked by Evidence Guard") : undefined}>{cur.state === "approved" ? tx("ล็อกแล้ว", "Locked") : tx("อนุมัติและล็อกบทนี้", "Approve & lock chapter")}</button>
              <button className="btn btn-secondary">{tx("ส่งให้ผู้มีคุณวุฒิตรวจ", "Send to qualified reviewer")}</button>
              <span className="muted small" style={{ alignSelf: "center" }}>{tx("สถานะปล่อยผ่าน: ร่างโดย AI → หลักฐานครบ → พร้อมรับรอง → อนุมัติให้ยื่น", "Release gate: AI draft → evidence complete → ready to certify → approved to file")}</span>
            </div>
            {rewrite && (
              <div className="panel" style={{ marginTop: 14 }}>
                <div className="label" style={{ marginBottom: 8 }}>{tx("สัญญาการเขียนใหม่ · ตรวจการเปลี่ยนความหมาย (มาตรฐาน §10)", "Rewrite contract · semantic change check (standard §10)")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
                  <div><div className="label-9">{tx("ก่อน", "Before")}</div><div style={{ fontSize: 14, lineHeight: 1.7 }}>{LB1_REWRITE_DEMO.before}</div></div>
                  <div><div className="label-9">{tx("หลัง (ข้อเสนอของ AI)", "After (AI proposal)")}</div><div style={{ fontSize: 14, lineHeight: 1.7 }}>{LB1_REWRITE_DEMO.after}</div></div>
                </div>
                <div style={{ marginTop: 10 }}>
                  {rewriteCheck.changes.map((c, i) => <div key={i} className="small" style={{ display: "flex", gap: 8, padding: "3px 0" }}><Tag k={c.material ? "bad" : "warn"}>{c.kind}</Tag><span><span className="muted">{c.before}</span> → <strong>{c.after}</strong></span></div>)}
                </div>
                <div className="note note-bad" style={{ marginTop: 10 }}>{rewriteCheck.reasons.map((r) => (lang === "th" ? r.th : r.en)).join(" · ")} · {tx("ไม่อนุญาตให้ยอมรับแบบกลุ่ม และการอนุมัติเดิมจะถูกยกเลิกหากยอมรับ", "Batch acceptance is not allowed, and accepting would invalidate prior approval")}</div>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setRewrite(false)}>{tx("ปฏิเสธการเปลี่ยนแปลง", "Reject change")}</button>
                  <button className="btn btn-secondary btn-sm" disabled>{tx("ยอมรับ (ต้องมีหลักฐานใหม่และผู้ตรวจ)", "Accept (needs new evidence and a reviewer)")}</button>
                </div>
              </div>
            )}

            {quality.claims.some((c) => c.sectionId === cur.id) && (
              <div style={{ marginTop: 14 }}>
                <div className="label" style={{ marginBottom: 6 }}>{tx("บัญชีข้อความของบทนี้ (Claim ledger)", "Claim ledger for this chapter")}</div>
                {quality.claims.filter((c) => c.sectionId === cur.id).map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 0", borderBottom: "1px solid var(--color-divider)" }}>
                    <span className="code" style={{ width: 48, flex: "none" }}>{c.id}</span>
                    <span style={{ flex: 1, fontSize: 12, lineHeight: 1.5 }}>{L(c.text)}</span>
                    <Tag k={c.supportStatus === "supported" ? "ok" : c.supportStatus === "unsupported" ? "bad" : c.supportStatus === "unresolved" ? "cond" : "warn"}>{c.supportStatus}</Tag>
                  </div>
                ))}
                <Link href="/report-quality" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}>{tx("เปิดหลักฐานต้นทาง (Click to Source) →", "Click to Source →")}</Link>
              </div>
            )}
            {guardBlocks && <div className="note note-bad" style={{ marginTop: 10 }}>{tx("Evidence Guard: บทนี้ปิดไม่ได้จนกว่าหลักฐานที่ขาดจะเข้าระบบและช่อง “ยังไม่ยุติ” ถูกปิดโดยมนุษย์", "Evidence Guard: this chapter cannot close until the missing evidence arrives and every unresolved slot is closed by a person.")}</div>}
          </div>
        </div>

        <div style={{ flex: "1 1 260px", minWidth: 250, background: "var(--color-bg)", boxShadow: "0 0 0 1px var(--color-divider)", padding: "18px 18px 24px" }}>
          <div className="label" style={{ marginBottom: 10, letterSpacing: ".12em" }}>{tx("ข้อกำหนดที่บังคับบทนี้", "Obligation binding this chapter")}</div>
          {ob && (
            <div className="panel panel-thin">
              <div className="kbd">{ob.obligation.id}</div>
              <div className="small muted-7" style={{ marginTop: 6, lineHeight: 1.6 }}>{L(ob.obligation.summary)}</div>
              <div className="muted tiny" style={{ marginTop: 8 }}>{L(ob.pack.source)} · {tx("มีผล", "effective")} {ob.pack.effectiveFrom}</div>
              <Link href="/obligations" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}>ⓘ {tx("อธิบายข้อกำหนดนี้", "Explain this obligation")}</Link>
            </div>
          )}

          <div className="label" style={{ margin: "18px 0 10px", letterSpacing: ".12em" }}>{tx("หลักฐานที่ผูกกับบทนี้", "Evidence bound to this chapter")}</div>
          {evidence.map((e) => {
            const worst = e.layers.find((m) => m !== 1) ?? 1;
            const { k, g } = layerMark(worst);
            return (
              <div key={e.id} style={{ borderBottom: "1px solid var(--color-divider)", padding: "9px 0", display: "flex", gap: 9, alignItems: "flex-start" }}>
                <Glyph k={k}>{g}</Glyph>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{L(e.name)}</div>
                  <div className="muted tiny" style={{ lineHeight: 1.4 }}>{L(e.meta)}</div>
                </div>
              </div>
            );
          })}

          {missing.length > 0 && (
            <>
              <div className="label" style={{ margin: "18px 0 10px", letterSpacing: ".12em" }}>{tx("สิ่งที่ยังขาด", "Still missing")}</div>
              {missing.map((m) => (
                <div key={m.id} style={{ border: "1px solid var(--st-bad)", background: "var(--st-bad-bg)", padding: 12, marginBottom: 8 }}>
                  <div className="ink-bad" style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45 }}>{L(m.name)}</div>
                  <div className="ink-bad tiny" style={{ marginTop: 4, lineHeight: 1.5 }}>{m.requestedOn ? tx("ขอจากผู้รับผิดชอบแล้ว · รอตอบกลับ 3 วัน", "Requested from the owner · 3 days waiting") : L(m.meta)}</div>
                  <Link href="/evidence" className="btn btn-ghost btn-sm ink-bad" style={{ paddingInline: 0, marginTop: 4 }}>{tx("ติดตามคำขอ →", "Track request →")}</Link>
                </div>
              ))}
            </>
          )}

          <div className="label" style={{ margin: "18px 0 10px", letterSpacing: ".12em" }}>{tx("AI ทำอะไรให้ได้บ้าง", "What AI can do here")}</div>
          <div className="stack" style={{ gap: 6 }}>
            <button className="btn btn-secondary btn-left">{tx("เทียบกับรายงานปีที่แล้ว", "Compare with last year's report")}</button>
            <button className="btn btn-secondary btn-left">{tx("สรุปข้อสมมติที่ใช้ในบทนี้", "Summarise assumptions in this chapter")}</button>
            <Link href="/evidence" className="btn btn-secondary btn-left">{tx("ขอข้อมูลที่ขาดจากผู้รับผิดชอบ", "Request missing data from the owner")}</Link>
            <Link href="/xray" className="btn btn-secondary btn-left">{tx("ให้ผู้ตรวจจำลองท้วงบทนี้", "Let the simulated reviewer challenge this chapter")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
