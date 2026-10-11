"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, Seg, Stat, Tag } from "@/components/ui";
import { assessReport } from "@/core/report/assess";
import { RUBRIC, EDITORIAL_TARGET, weighted } from "@/core/report/editorial";
import { MODEL_REGISTRY, MODEL_ROUTES, REGISTRY_VERSION } from "@/core/report/models";
import { display } from "@/core/report/metrics";
import { LB1_REPORT_INPUT } from "@/data/report-lb1";
import type { Status } from "@/core/types";
import type { GateResult, Severity, SupportStatus } from "@/core/report/types";

type Tab = "gates" | "requirements" | "claims" | "numbers" | "findings" | "data" | "models" | "release";

const gateK = (r: GateResult): Status => (r === "pass" ? "ok" : r === "fail" ? "bad" : "warn");
const supK = (s: SupportStatus): Status => (s === "supported" ? "ok" : s === "partial" || s === "pending" ? "warn" : s === "unresolved" ? "cond" : "bad");
const sevK = (s: Severity): Status => (s === "critical" ? "bad" : s === "major" ? "warn" : "info");

export default function ReportQualityPage() {
  const { L, tx, fd } = useApp();
  const a = useMemo(() => assessReport(LB1_REPORT_INPUT), []);
  const input = LB1_REPORT_INPUT;
  const [tab, setTab] = useState<Tab>("gates");
  const [openClaim, setOpenClaim] = useState<string>("CL-1.3");
  const passCount = a.gates.filter((g) => g.result === "pass").length;
  const openFindings = a.findings.filter((f) => f.status === "open");
  const crit = openFindings.filter((f) => f.severity === "critical").length;
  const major = openFindings.filter((f) => f.severity === "major").length;
  const lifecycle = { draft: tx("ร่าง", "Draft"), generated: tx("สร้างแล้ว — ยังไม่พร้อมตรวจ", "Generated — not ready for review"), "ready-for-review": tx("พร้อมให้ตรวจ", "Ready for review"), approved: tx("อนุมัติแล้ว", "Approved"), submitted: tx("ยื่นแล้ว", "Submitted") }[a.status.lifecycle];
  const steps = [tx("เลือกรายงาน", "Choose report"), tx("เพิ่ม/เชื่อมข้อมูล", "Add or connect data"), tx("สร้างร่าง", "Generate draft"), tx("แก้ประเด็นจากการตรวจ", "Resolve review items"), tx("อนุมัติและส่งออก", "Approve and export")];
  const stepAt = a.status.lifecycle === "approved" ? 4 : a.status.lifecycle === "ready-for-review" ? 3 : 3;

  return (
    <div className="page page-wide">
      <div className="note note-warn" style={{ marginBottom: 14, fontSize: 12 }}>
        <strong>{tx("การสาธิต", "DEMONSTRATION")}</strong> · {tx("ข้อมูลโครงการเป็นตัวอย่างสมมติ (มาตรฐาน §4) · แหล่งกฎหมาย กกพ. เป็นของจริงและตรึงเวอร์ชันด้วยแฮชของไฟล์ในคลังกฎหมาย", "Project data is illustrative (standard §4) · ERC legal sources are real and pinned by the hash of the file in the legal corpus")}
      </div>
      <PageHead explain={["claim-ledger","gate"]} interpret="facts" kicker={tx("มาตรฐานคุณภาพการสร้างรายงาน 24 Series v1.0 / REPORT QUALITY", "24 Series Report Generation Quality Standard v1.0 / Report Quality")} title={tx("ทุกประโยคชี้กลับไปยังหลักฐาน ทุกตัวเลขมาจากการคำนวณ ทุกการปล่อยผ่านมีคนอนุมัติ", "Every sentence traces to evidence, every number to a calculation, every release to a person")} lead={tx("เครื่องยนต์รายงานร่วมของ 24 Series บังคับใช้กับรายงาน CoP ขั้นต้นของโซลาร์ฟาร์ม ลพบุรี 1 ตามแบบฟอร์มทางการ Solar Farm V1.0/2565 — ประตูคุณภาพ 9 ประตูต้องผ่านทั้งหมด ผลที่ไม่ทราบถือว่าไม่ผ่าน", "The shared 24 Series report engine applied to the Solar Farm Lopburi 1 preliminary CoP report against the official Solar Farm form V1.0/2565. All nine gates must pass; an unknown result fails closed.")} />

      <div className="gate" style={{ marginTop: 18, border: "2px solid var(--color-divider)" }}>
        {steps.map((s, i) => (
          <div key={i} className={i < stepAt ? "gate-on" : i === stepAt ? "gate-next" : "gate-off"}><div style={{ fontSize: 10, opacity: .85 }}>{i + 1}</div><div style={{ fontSize: 12, fontWeight: 600 }}>{s}</div></div>
        ))}
      </div>

      <Cells min={150} style={{ marginTop: 16 }}>
        <Stat label={tx("สถานะรายงาน", "Report status")} value={<span style={{ fontSize: 18 }}>{lifecycle}</span>} sub={a.releasable ? tx("ส่งออกฉบับจริงได้", "Final export enabled") : tx("ส่งออกได้เฉพาะฉบับร่างที่มีตราว่า DRAFT", "Only DRAFT-marked export")} />
        <Stat label={tx("ประตูคุณภาพที่ผ่าน", "Gates passed")} value={`${passCount} / ${a.gates.length}`} color={passCount === a.gates.length ? "var(--st-ok)" : "var(--st-bad)"} />
        <Stat label={tx("หลักฐานครอบคลุม", "Evidence coverage")} value={`${a.status.evidenceCoverage.covered} / ${a.status.evidenceCoverage.total}`} sub={tx("ข้อความเชิงข้อเท็จจริงที่รองรับครบ", "factual claims fully supported")} />
        <Stat label={tx("ข้อกำหนดครบ", "Requirements complete")} value={`${a.status.requirementCompleteness.fulfilled} / ${a.status.requirementCompleteness.applicable}`} sub={tx("ตามแบบฟอร์ม กกพ.", "per the ERC form")} />
        <Stat label={tx("ประเด็นค้าง", "Open findings")} value={openFindings.length} color="var(--st-bad)" sub={`${crit} ${tx("วิกฤต", "critical")} · ${major} ${tx("สำคัญ", "major")}`} />
        <Stat label={tx("การตรวจภาษา", "Editorial review")} value={<span style={{ fontSize: 16 }}>{L(a.editorial.label)}</span>} sub={tx(`เป้าหมาย > ${EDITORIAL_TARGET}/100 โดยบรรณาธิการ`, `Target > ${EDITORIAL_TARGET}/100 by an editor`)} />
      </Cells>

      <div className="row row-center" style={{ marginTop: 22, gap: 10 }}>
        <Seg<Tab> name="rq" value={tab} onChange={setTab} options={[
          { v: "gates", label: tx("ประตูคุณภาพ", "Gates") },
          { v: "requirements", label: tx("ข้อกำหนด", "Requirements") },
          { v: "claims", label: tx("บัญชีข้อความ", "Claim ledger") },
          { v: "numbers", label: tx("ตัวเลข", "Numbers") },
          { v: "findings", label: `${tx("ประเด็น", "Findings")} ${openFindings.length}` },
          { v: "data", label: tx("ขอบเขตข้อมูล", "Data contract") },
          { v: "models", label: tx("โมเดล", "Models") },
          { v: "release", label: tx("อนุมัติและส่งออก", "Approval & export") },
        ]} />
      </div>

      {tab === "gates" && (
        <div style={{ marginTop: 16, borderTop: "2px solid var(--color-divider)" }}>
          {a.gates.map((g, i) => (
            <div key={g.id} className="list-item">
              <span className={`mark mark-lg st-${gateK(g.result)}`}>{g.result === "pass" ? "✓" : g.result === "fail" ? "✕" : "?"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{i + 1}. {L(g.title)}</div>
                <div className="muted small" style={{ lineHeight: 1.5 }}>{L(g.condition)}</div>
                <div className="small" style={{ marginTop: 4, lineHeight: 1.55 }}>{L(g.detail)}</div>
              </div>
              {g.denominator !== undefined && <span className="code" style={{ whiteSpace: "nowrap" }}>{g.numerator}/{g.denominator}</span>}
              <Tag k={gateK(g.result)}>{g.result === "pass" ? tx("ผ่าน", "Pass") : g.result === "fail" ? tx("ไม่ผ่าน", "Fail") : tx("ไม่ทราบ = ไม่ผ่าน", "Unknown = fail")}</Tag>
            </div>
          ))}
          <div className="note note-bad" style={{ marginTop: 14 }}>{tx("คะแนนสำนวนสูงไม่สามารถชดเชยประตูด้านข้อเท็จจริง การรักษาความลับ หรือการเปิดเผยข้อมูลบังคับที่ไม่ผ่าน และผู้ดูแลระบบไม่สามารถข้ามความล้มเหลวแล้วคงสถานะ “อนุมัติ” ได้", "A high style score never overrides a failed factual, confidentiality or mandatory-disclosure gate, and no administrator can override a failure and keep “approved”.")}</div>
        </div>
      )}

      {tab === "requirements" && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="table" style={{ minWidth: 980 }}>
            <thead><tr><th style={{ width: 150 }}>{tx("ข้อกำหนด", "Requirement")}</th><th>{tx("สิ่งที่แบบฟอร์มต้องการ", "What the form requires")}</th><th style={{ width: 120 }}>{tx("ส่วน/ข้อ", "Part / section")}</th><th style={{ width: 170 }}>{tx("แหล่งในคลังกฎหมาย", "Corpus source")}</th><th style={{ width: 150 }}>{tx("ผูกกับ", "Linked")}</th><th style={{ width: 110 }}>{tx("สถานะ", "Status")}</th></tr></thead>
            <tbody>
              {a.requirements.map((r) => {
                const s = a.requirementStatus.find((x) => x.requirementId === r.id)!;
                const k: Status = s.state === "fulfilled" ? "ok" : s.state === "partial" ? "warn" : s.state === "not-applicable" ? "info" : "bad";
                return (
                  <tr key={r.id}>
                    <td className="code" style={{ verticalAlign: "top", fontWeight: 600 }}>{r.id}</td>
                    <td style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.5 }}>{L(r.title)}{r.qualifiedSignatory && <div className="muted tiny">✎ {L(r.qualifiedSignatory)}</div>}{r.thresholds?.map((th) => <div key={th.key} className="tiny ink-warn">≥ {th.min} {th.unit} · {L(th.label)}</div>)}</td>
                    <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{r.part} · {r.section}</td>
                    <td className="code" style={{ verticalAlign: "top" }}><Link href="/corpus">{r.source.sourceId}</Link>{r.source.clause ? <div>{r.source.clause}</div> : null}</td>
                    <td className="code muted" style={{ verticalAlign: "top" }}>{[...s.claimIds, ...s.evidenceIds].join(" ") || "—"}</td>
                    <td style={{ verticalAlign: "top" }}><Tag k={k}>{s.state === "fulfilled" ? tx("ครบ", "Fulfilled") : s.state === "partial" ? tx("บางส่วน", "Partial") : s.state === "not-applicable" ? tx("ไม่เกี่ยวข้อง", "N/A") : tx("ขาด", "Missing")}</Tag></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "claims" && (
        <div style={{ marginTop: 16 }}>
          <p className="text-muted small" style={{ margin: "0 0 10px" }}>{tx("กดที่ข้อความเพื่อเปิดหลักฐานต้นทาง (Click to Source) — ทุกข้อความถูกจัดประเภท: ข้อเท็จจริงจากแหล่ง การคำนวณ การวิเคราะห์ ค่าประมาณ ข้อเสนอแนะ หรือช่องว่างที่ยังไม่ยุติ", "Click a claim to open its source passage (Click to Source). Every claim is typed: sourced fact, calculation, analysis, estimate, recommendation or unresolved gap.")}</p>
          <div style={{ borderTop: "2px solid var(--color-divider)" }}>
            {a.claims.map((c) => {
              const k = a.checks.find((x) => x.claimId === c.id)!;
              const open = openClaim === c.id;
              return (
                <div key={c.id} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                  <button onClick={() => setOpenClaim(open ? "" : c.id)} style={{ width: "100%", display: "flex", gap: 12, alignItems: "flex-start", background: "transparent", border: 0, padding: "12px 4px", cursor: "pointer", textAlign: "left", color: "inherit" }}>
                    <span className="code" style={{ width: 54, flex: "none", paddingTop: 2 }}>{c.id}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, lineHeight: 1.55 }}>{L(c.text)}</span>
                      <span className="muted tiny">{c.sectionId} ¶{c.paragraph} · {c.type}</span>
                    </span>
                    <Tag k={supK(c.supportStatus)}>{c.supportStatus}</Tag>
                  </button>
                  {open && (
                    <div style={{ background: "var(--color-surface)", borderLeft: "3px solid var(--color-accent)", padding: "12px 16px", margin: "0 0 12px" }}>
                      {k.reasons.length > 0 && <div className="small ink-bad" style={{ marginBottom: 8, lineHeight: 1.55 }}>{k.reasons.map((r, i) => <div key={i}>• {L(r)}</div>)}</div>}
                      {c.evidenceIds.length === 0 && c.metricIds.length === 0 && <div className="small muted">{tx("ไม่มีหลักฐานผูกไว้", "No evidence linked")}</div>}
                      {c.evidenceIds.map((id) => {
                        const ev = input.evidence.find((e) => e.id === id);
                        const src = ev && input.sources.find((s) => s.id === ev.locator.sourceId);
                        return (
                          <div key={id} style={{ marginBottom: 8 }}>
                            <div className="code" style={{ fontWeight: 600 }}>{id} → {ev ? `${ev.locator.sourceId}${ev.locator.clause ? " · " + ev.locator.clause : ""}${ev.locator.page ? " · p." + ev.locator.page : ""} · v${ev.locator.sourceVersion}` : tx("ไม่อยู่ในทะเบียน", "not registered")}</div>
                            {src && <div className="muted tiny">{L(src.title)} · {src.access} · {tx("ทบทวน", "review")}: {src.reviewStatus}{src.snapshot.retained ? ` · ${tx("เก็บสำเนาแล้ว", "snapshot retained")}` : ""}</div>}
                            {ev && <blockquote style={{ margin: "6px 0 0", padding: "6px 10px", borderLeft: "2px solid var(--color-divider)", fontSize: 13, lineHeight: 1.6 }}>“{ev.excerpt}”</blockquote>}
                          </div>
                        );
                      })}
                      {c.metricIds.map((id) => { const m = input.metrics.find((x) => x.id === id); return m ? <div key={id} className="code">{id} = {display(m)} {m.unit} · {m.method.id}@{m.method.version} · inputs [{m.inputs.join(", ")}]</div> : null; })}
                      {c.basis?.length ? <div className="code muted">{tx("อาศัย", "basis")}: {c.basis.join(", ")}</div> : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "numbers" && (
        <div style={{ marginTop: 16 }}>
          {a.conflicts.map((c, i) => <div key={i} className="note note-bad" style={{ marginBottom: 12, fontSize: 13 }}><strong>{tx("ข้อมูลขัดแย้ง", "Conflict")}</strong> · {L(c.detail!)}</div>)}
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 820 }}>
              <thead><tr><th style={{ width: 150 }}>{tx("ตัวชี้วัด", "Metric")}</th><th>{tx("ชื่อ", "Label")}</th><th style={{ width: 130 }}>{tx("ค่า (แสดงผล)", "Value (display)")}</th><th style={{ width: 120 }}>{tx("วิธี", "Method")}</th><th style={{ width: 160 }}>{tx("อินพุต", "Inputs")}</th><th style={{ width: 110 }}>{tx("สถานะ", "State")}</th></tr></thead>
              <tbody>{input.metrics.map((m) => (
                <tr key={m.id}><td className="code" style={{ fontWeight: 600 }}>{m.id}{m.key && <div className="muted">{m.key}</div>}</td><td style={{ fontSize: 13 }}>{L(m.label)}</td><td className="code">{display(m)} {m.unit}</td><td className="code">{m.method.id}@{m.method.version}</td><td className="code muted">{m.inputs.join(", ") || "—"}</td><td><Tag k={m.valueState === "value" ? "ok" : "warn"}>{m.valueState}</Tag></td></tr>
              ))}</tbody>
            </table>
          </div>
          <p className="muted small" style={{ marginTop: 10 }}>{tx("ค่าแสดงผลได้จากค่าตั้งต้นที่ไม่ปัดเศษเสมอ โมเดลภาษาอธิบายผลได้ แต่ไม่ใช่เครื่องคำนวณที่เชื่อถือได้ (มาตรฐาน §7) — ค่าที่ไม่มีจะแสดงเป็นสถานะ ไม่ใช่ค่าตั้งต้น", "Display values always derive from the unrounded canonical value. The language model may explain results but is never the authoritative calculator (standard §7). A missing value shows as a state, never a default.")}</p>
        </div>
      )}

      {tab === "findings" && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="table" style={{ minWidth: 1000 }}>
            <thead><tr><th style={{ width: 70 }}>ID</th><th style={{ width: 90 }}>{tx("ระดับ", "Severity")}</th><th style={{ width: 150 }}>{tx("ประเภท", "Category")}</th><th>{tx("ประเด็น", "Issue")}</th><th>{tx("แนวทางแก้", "Remedy")}</th><th style={{ width: 140 }}>{tx("ผู้รับผิดชอบ", "Owner")}</th></tr></thead>
            <tbody>{openFindings.map((f) => (
              <tr key={f.id}>
                <td className="code" style={{ verticalAlign: "top" }}>{f.id}<div className="muted">{f.requirementId ?? f.sectionId}</div></td>
                <td style={{ verticalAlign: "top" }}><Tag k={sevK(f.severity)}>{f.severity}</Tag></td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 12 }}>{f.category}</td>
                <td style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.55 }}>{L(f.issue)}{f.passage && <div className="muted tiny" style={{ marginTop: 3 }}>“{f.passage}”</div>}</td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.55 }}>{L(f.remedy)}</td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(f.owner)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "data" && (
        <div style={{ marginTop: 16 }}>
          <p className="text-muted small" style={{ margin: "0 0 10px" }}>{tx("ผู้เขียนรายงานได้รับเฉพาะฟิลด์ที่ผ่านสัญญาข้อมูล — ข้อมูลหน่วยงานอื่น รอบอื่น ผู้เช่าอื่น ข้อมูลวินิจฉัย และข้อความทดสอบถูกตัดออก ข้อความที่ดูเหมือนคำสั่งยังคงเป็นเนื้อหาและถูกทำเครื่องหมาย", "The writer receives only fields that pass the data contract. Other entities, periods and tenants, diagnostics and test text are excluded. Text that looks like an instruction stays content and is flagged.")}</p>
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 860 }}>
              <thead><tr><th style={{ width: 170 }}>{tx("ฟิลด์", "Field")}</th><th style={{ width: 140 }}>{tx("ประเภท", "Category")}</th><th style={{ width: 180 }}>{tx("ค่า", "Value")}</th><th>{tx("เหตุผล", "Reasons")}</th><th style={{ width: 110 }}>{tx("ผล", "Decision")}</th></tr></thead>
              <tbody>{input.fields.map((f) => {
                const rej = a.contract.rejected.find((r) => r.field.key === f.key);
                const flagged = a.contract.flaggedInstructions.includes(f.key);
                return (
                  <tr key={f.key}>
                    <td className="code" style={{ verticalAlign: "top" }}>{f.key}<div className="muted">{f.entityId} · {f.period}</div></td>
                    <td className="muted-7" style={{ verticalAlign: "top", fontSize: 12 }}>{f.category}</td>
                    <td style={{ verticalAlign: "top", fontSize: 12 }}>{f.valueState === "value" ? String(f.value) : f.valueState}{f.unit ? ` ${f.unit}` : ""}</td>
                    <td className="small" style={{ verticalAlign: "top", lineHeight: 1.5 }}>{rej ? rej.decision.reasons.map((r, i) => <div key={i} className="ink-bad">• {L(r)}</div>) : <span className="muted">—</span>}{flagged && <div className="ink-warn">⚑ {tx("มีข้อความลักษณะคำสั่ง — เก็บเป็นเนื้อหา ไม่ปฏิบัติตาม", "Contains instruction-like text — kept as content, not obeyed")}</div>}</td>
                    <td style={{ verticalAlign: "top" }}><Tag k={rej ? "bad" : "ok"}>{rej ? tx("ปฏิเสธ", "Rejected") : tx("รับเข้า", "Admitted")}</Tag></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "models" && (
        <div style={{ marginTop: 16 }}>
          <div className="note note-warn" style={{ fontSize: 13, marginBottom: 12 }}>{tx("ยังไม่มีโมเดลใดผ่านชุดทดสอบรายงานที่กำหนดล่วงหน้า (ข้อเท็จจริง ภาษาไทย/อังกฤษ เอกสารยาว และการตรวจโดยผู้ทรงคุณวุฒิ 2 คน) — งานร่างจริงจึงถูกพักไว้ ไม่ลดระดับโมเดลแบบเงียบ ชื่อแบรนด์ ขนาด หรืออันดับบนกระดานคะแนนไม่ใช่หลักฐานความเหมาะสม", "No model has yet passed the predefined report benchmark (facts, Thai/English, long documents, two qualified reviewers), so real drafting jobs are queued — never silently downgraded. Brand, size or leaderboard rank is not evidence of suitability.")}</div>
          <Cells min={240}>
            {MODEL_REGISTRY.map((m) => (
              <div key={m.modelId} className="cell">
                <div className="code" style={{ fontWeight: 600 }}>{m.modelId}</div>
                <div className="muted tiny">{m.provider} · {(m.contextTokens / 1e6).toFixed(0)}M ctx · {(m.maxOutputTokens / 1000).toFixed(0)}K out · {m.versionPinned ? tx("ตรึงเวอร์ชันได้", "version pinned") : tx("ตรึงเวอร์ชันไม่ได้", "unpinned")}</div>
                <Tag k={m.status === "approved" ? "ok" : "cond"} style={{ marginTop: 6 }}>{m.status === "approved" ? tx("อนุมัติ", "Approved") : tx("ผู้สมัคร · รอประเมิน", "Candidate · evaluation pending")}</Tag>
                <div className="small muted-7" style={{ marginTop: 6, lineHeight: 1.5 }}>{L(m.notes)}</div>
              </div>
            ))}
          </Cells>
          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table className="table" style={{ minWidth: 820 }}>
              <thead><tr><th>{tx("งาน", "Task")}</th><th>{tx("ลำดับที่ต้องการ", "Preferred → fallbacks")}</th><th>{tx("การตั้งค่า", "Settings")}</th><th>{tx("ผลการจัดเส้นทาง", "Routing decision")}</th></tr></thead>
              <tbody>{a.routing.map((d) => {
                const r = MODEL_ROUTES.find((x) => x.task === d.task && x.category === d.category)!;
                return <tr key={d.task}><td className="code">{d.category} · {d.task}</td><td className="code">{r.preferred} → {r.fallbacks.join(", ")}</td><td className="code">effort {r.settings.effort} · {r.settings.maxOutputTokens / 1000}K · {r.promptTemplateVersion}</td><td><Tag k={d.outcome === "run" ? "ok" : d.outcome === "fallback" ? "warn" : "bad"}>{d.outcome}</Tag><div className="small muted-7" style={{ marginTop: 4 }}>{L(d.reason)}</div></td></tr>;
              })}</tbody>
            </table>
          </div>
          <p className="muted tiny" style={{ marginTop: 8 }}>{tx("ทะเบียนโมเดล", "Model registry")} {REGISTRY_VERSION} · {tx("ทบทวนอย่างน้อยรายไตรมาสหรือเมื่อมีโมเดลใหม่ การถอนโมเดล หรือคุณภาพถดถอย", "reviewed at least quarterly and on any new model, retirement or regression")}</p>
        </div>
      )}

      {tab === "release" && (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20 }}>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>{tx("การผูกการอนุมัติ (§12)", "Approval binding (§12)")}</div>
            <div className="panel panel-thin">
              <div className="code">{tx("เนื้อหาปัจจุบัน", "current content")} #{a.contentHash}</div>
              <div className="code">{tx("ชุดหลักฐาน", "evidence snapshot")} #{a.evidenceHash}</div>
              <div className="code">pack {input.pack.id}@{input.pack.version}</div>
              {input.approvals.map((ap, i) => (
                <div key={i} style={{ marginTop: 10, borderTop: "1px solid var(--color-divider)", paddingTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{L(ap.approver)} · {L(ap.role)} · rev {ap.reportRevision}</div>
                  <div className="code muted">#{ap.contentHash} · #{ap.evidenceSnapshotHash}</div>
                  <Tag k="bad" style={{ marginTop: 4 }}>{tx("ถูกยกเลิก — เนื้อหาเปลี่ยนหลังอนุมัติ", "Invalidated — content changed after approval")}</Tag>
                </div>
              ))}
            </div>
            <div className="label" style={{ margin: "16px 0 8px" }}>{tx("ผู้อนุมัติที่แพ็กกำหนด", "Approvers the pack requires")}</div>
            {input.pack.approvalPolicy.map((p, i) => <div key={i} className="list-item" style={{ padding: "8px 0" }}><span style={{ flex: 1, fontSize: 13 }}>{L(p.role)}{p.qualification && <span className="muted tiny"> · {L(p.qualification)}</span>}</span><Tag k="cond">{tx("รอ", "Pending")}</Tag></div>)}
            <div className="note note-warn" style={{ marginTop: 12 }}>{tx("แพ็กรายงานนี้ยังไม่ได้รับอนุมัติจากเจ้าของโดเมน จึงยังไม่สามารถเรียกว่าพร้อมสำหรับการยื่นต่อหน่วยงานกำกับ (§3)", "This report pack has not yet been approved by a domain owner, so it cannot be called ready for authority filing (§3).")}</div>
          </div>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>{tx("ชุดเอกสารตรวจสอบ (§14)", "Audit package (§14)")}</div>
            <div style={{ borderTop: "2px solid var(--color-divider)" }}>
              {[
                [tx("รายงานที่อ่านได้ (DOCX แก้ไขได้ + PDF)", "Readable report (editable DOCX + PDF)"), a.releasable],
                [tx("ทะเบียนแหล่ง (ปิดบังตามสิทธิ์ผู้รับ)", "Source register (redacted for the recipient)"), true],
                [tx("กระดาษทำการการคำนวณ", "Calculation workpapers"), true],
                [tx("เมทริกซ์ข้อกำหนด", "Requirement matrix"), true],
                [tx("ประเด็นจากการตรวจและการตัดสิน", "Review findings and dispositions"), true],
                [tx("บันทึกการอนุมัติ", "Approval record"), a.status.approval === "approved"],
                [tx("Manifest เชื่อมทุกชิ้นกับฉบับรายงาน", "Manifest tying every item to the revision"), true],
              ].map(([label, ready], i) => <div key={i} className="list-item" style={{ padding: "8px 0" }}><span style={{ flex: 1, fontSize: 13 }}>{label as string}</span><Tag k={ready ? "ok" : "bad"}>{ready ? tx("พร้อม", "Ready") : tx("ถูกกั้น", "Blocked")}</Tag></div>)}
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn btn-secondary">{tx("ส่งออกฉบับร่าง (มีตรา DRAFT)", "Export draft (DRAFT-marked)")}</button>
              <button className="btn btn-primary" disabled={!a.releasable} title={a.releasable ? "" : tx("ประตูคุณภาพยังไม่ผ่านทั้งหมด", "Not every gate has passed")}>{tx("ส่งออกฉบับจริง", "Export final")}</button>
            </div>
            <div className="muted small" style={{ marginTop: 8, lineHeight: 1.5 }}>{tx("ไฟล์ฉบับจริงจะถูกเรนเดอร์ในพื้นที่ตรวจที่จำกัดก่อนอนุมัติ และการอนุมัติผูกกับไบต์ของไฟล์นั้น", "The final artifact is rendered inside the restricted review workspace before approval, and approval binds to those exact bytes.")}</div>
          </div>
        </div>
      )}

      <hr className="hr" style={{ margin: "30px 0 18px" }} />
      <h3 style={{ margin: "0 0 10px", fontSize: 21 }}>{tx("รายงานสรุปขอบเขต (Report Brief)", "Report Brief")} <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>v{input.brief.version} · {a.brief.ok ? tx("ครบถ้วน", "complete") : tx("ยังไม่ครบ", "incomplete")}</span></h3>
      <Cells min={210} thin>
        {[
          [tx("วัตถุประสงค์", "Purpose"), L(input.brief.purpose)],
          [tx("ผู้รับรายงาน", "Audience"), L(input.brief.audience)],
          [tx("แพ็กรายงาน", "Report pack"), `${input.pack.id}@${input.pack.version}`],
          [tx("ขอบเขต", "Boundary"), L(input.brief.boundary)],
          [tx("รอบรายงาน · ตัดข้อมูล", "Period · cut-off"), `${fd(input.brief.period.from)} – ${fd(input.brief.period.to)} · ${fd(input.brief.period.cutoff)}`],
          [tx("ภาษา · หน่วย", "Language · units"), `${input.brief.languages.join("/")} · ${Object.values(input.brief.units).join(", ")}`],
          [tx("ค่าประมาณ", "Estimates"), input.brief.estimatesPermitted ? tx("อนุญาต", "Permitted") : tx("ไม่อนุญาต", "Not permitted")],
          [tx("แบบฟอร์ม", "Template"), input.brief.template],
        ].map(([k, v], i) => <div key={i} className="cell cell-bg cell-tight"><div className="label-9">{k}</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, lineHeight: 1.4 }}>{v}</div></div>)}
      </Cells>

      <hr className="hr" style={{ margin: "30px 0 18px" }} />
      <h3 style={{ margin: "0 0 10px", fontSize: 21 }}>{tx("เกณฑ์คุณภาพภาษา (Human Editorial Quality)", "Human Editorial Quality rubric")}</h3>
      <div className="table-wrap">
        <table className="table" style={{ minWidth: 640 }}>
          <thead><tr><th>{tx("มิติ", "Dimension")}</th><th style={{ width: 90 }}>{tx("น้ำหนัก", "Weight")}</th><th style={{ width: 200 }}>{tx("คะแนนอัตโนมัติ (ชั่วคราว)", "Automated score (provisional)")}</th></tr></thead>
          <tbody>
            {RUBRIC.map((r) => <tr key={r.dimension}><td>{L(r.label)}</td><td className="code">{r.weight * 100}%</td><td className="code muted">{input.editorial[0]?.scores.find((s) => s.dimension === r.dimension)?.score ?? "—"}</td></tr>)}
            <tr><td style={{ fontWeight: 600 }}>{tx("ค่าเฉลี่ยถ่วงน้ำหนัก", "Weighted mean")}</td><td /><td className="code muted">{input.editorial[0] ? `${weighted(input.editorial[0].scores)} · ${tx("ชั่วคราว ไม่ใช่ผลรับรอง", "provisional, not certified")}` : "—"}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="muted small" style={{ marginTop: 8, lineHeight: 1.6 }}>{tx("คะแนนนี้วัดคุณภาพการเขียนตามเกณฑ์ของผู้ตรวจที่เป็นมนุษย์ ไม่ใช่ความน่าจะเป็นที่มนุษย์เขียน และไม่ใช้ตัวตรวจจับ AI เป็นเกณฑ์ผ่าน จนกว่าจะปรับเทียบเกณฑ์แล้ว ระบบแสดง “รอการตรวจทานโดยบรรณาธิการ” แทนตัวเลขร้อยละ", "This measures writing quality against a human reviewer rubric — not a probability that a human wrote it, and no AI detector is used as the gate. Until the rubric is calibrated the product shows “editorial review pending” instead of a percentage.")}</p>
    </div>
  );
}
