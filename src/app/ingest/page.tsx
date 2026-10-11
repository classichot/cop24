"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, Seg, Stat, Tag } from "@/components/ui";
import { AdvancedSettings } from "@/components/ux/parts";
import { acceptLink, addSource, analyze, approveRequest, authorize, cancel, draftRequest, emptyState, ingest, pause, planMission, readiness, reextract, resume, reviewField, revoke, runMission, toReportInput, trace, type MissionEnv } from "@/core/ingest";
import { EVIDENCE_TYPES, RULESET_VERSION, STANDARDS_VERSION } from "@/core/ingest/rules";
import { CLASSIFIER_VERSION } from "@/core/ingest/classify";
import { EXTRACTOR_VERSION } from "@/core/ingest/extract";
import type { ExtractedField, IngestionState, ParsedDocument, Phase, ReportKind } from "@/core/ingest/types";
import { assessReport } from "@/core/report/assess";
import { expand, filesFromDrop, filesFromInput, parseFile, type InputFile } from "@/lib/ingest/parse";
import { clearState, loadState, saveState } from "@/lib/ingest/store";
import { SAMPLE_DUPLICATE, SAMPLE_FILES, SAMPLE_RETURNED } from "@/data/ingest-samples";
import { OWNERS } from "@/data/ingest-directory";
import { LB1_BRIEF } from "@/data/report-lb1";
import type { Status } from "@/core/types";

type Tab = "checklist" | "documents" | "review" | "missing" | "findings" | "mission" | "profile" | "audit";
const TENANT = "lgp";
const USER = "nattawut";
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const phaseFor = (r: ReportKind): Phase => (r === "monitoring" ? "operation" : "pre-construction");
const makeFresh = (projectId: string, report: ReportKind, year: number, tech?: string) => analyze(emptyState(TENANT, projectId, { report, year, phase: phaseFor(report), tech }));
/** Event-time ids (kept outside the component so render stays pure). */
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;
const stamp = (): string => new Date().toISOString();

export default function IngestPage() {
  const { L, tx, data, fd } = useApp();
  const plants = data.entities.filter((e) => e.hasPowerPlant);
  const [projectId, setProjectId] = useState(plants[0]?.id ?? "lopburi-1");
  const [report, setReport] = useState<ReportKind>("preliminary");
  const [year, setYear] = useState(2026);
  const plant = plants.find((p) => p.id === projectId)!;
  const key = `${TENANT}:${projectId}:${report}:${year}`;
  const tech = plant?.plantTech;
  const fresh = () => makeFresh(projectId, report, year, tech);
  const [s, setS] = useState<IngestionState>(() => makeFresh(projectId, report, year, tech));
  const [loadedKey, setLoadedKey] = useState("");
  const loaded = loadedKey === key;
  const [staged, setStaged] = useState<InputFile[]>([]);
  const [progress, setProgress] = useState<{ path: string; msg: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [autoOcr, setAutoOcr] = useState(true);
  const [tab, setTab] = useState<Tab>("checklist");
  const [instruction, setInstruction] = useState("");
  // a goal handed over by the 24 Copilot ("Do it for me") pre-fills the hand-off instruction
  useEffect(() => {
    queueMicrotask(() => {
      try { const g = new URLSearchParams(window.location.search).get("goal"); if (g) setInstruction(g); } catch {}
    });
  }, []);
  const [authDraft, setAuthDraft] = useState<{ sources: string[]; recipients: string[]; send: "never" | "each-approval" | "pre-approved-internal"; limit: number } | null>(null);
  const returnedInbox = useRef<ParsedDocument[]>([]);
  const parsedCache = useRef<Map<string, InputFile>>(new Map());
  const [selField, setSelField] = useState<string>("");
  const [correction, setCorrection] = useState({ value: "", rationale: "" });
  const [dragOver, setDragOver] = useState(false);

  // load persisted workspace for this project/report/year
  useEffect(() => {
    let alive = true;
    loadState(key).then((st) => { if (!alive) return; setS(st ?? makeFresh(projectId, report, year, tech)); setLoadedKey(key); });
    return () => { alive = false; };
  }, [key, projectId, report, year, tech]);
  useEffect(() => { if (loaded) void saveState(key, s); }, [s, key, loaded]);

  const apply = (fn: (n: IngestionState) => void) => setS((prev) => { const n = clone(prev); fn(n); analyze(n); return n; });
  const r = readiness(s);
  const openFindings = s.findings.filter((f) => f.status === "open");
  const reportAssessment = useMemo(() => (s.documents.length ? assessReport(toReportInput(s, { ...LB1_BRIEF, entityId: projectId, stage: report })) : null), [s, projectId, report]);

  /* ───── Action A: Import Everything ───── */
  const stage = async (files: InputFile[]) => setStaged((prev) => [...prev, ...files]);
  const startImport = async () => {
    if (!staged.length) return;
    setBusy(true);
    setProgress([]);
    const srcId = newId("SRC-UPLOAD");
    const files = await expand(staged);
    const parsed: ParsedDocument[] = [];
    for (const f of files) {
      setProgress((p) => [...p, { path: f.path, msg: tx("กำลังอ่าน", "Reading") }]);
      const pd = await parseFile(f, { ocr: autoOcr, sourceConnectionId: srcId, onProgress: (path, msg) => setProgress((p) => [...p, { path, msg }]) });
      parsedCache.current.set(pd.sha256, f);
      parsed.push(pd);
      setProgress((p) => [...p, { path: f.path, msg: pd.parseErrors.length ? `⚠ ${pd.parseErrors[0]}` : tx("อ่านแล้ว", "Read") }]);
    }
    apply((n) => {
      addSource(n, { id: srcId, kind: staged.some((f) => f.path.includes("/")) ? "folder" : staged.some((f) => f.name.endsWith(".zip")) ? "zip" : "upload", label: `${files.length} ${tx("ไฟล์", "files")} · ${stamp().slice(0, 16).replace("T", " ")}`, authorizedBy: USER, authorizedAt: stamp() });
      ingest(n, parsed, USER, srcId);
    });
    setStaged([]);
    setBusy(false);
  };
  const loadSample = () => apply((n) => {
    if (!n.sources.some((x) => x.id === "SRC-SAMPLE")) addSource(n, { id: "SRC-SAMPLE", kind: "folder", label: tx("ชุดตัวอย่างที่มีข้อบกพร่องจงใจ (สมมติ)", "Seeded flawed sample set (illustrative)"), authorizedBy: USER, authorizedAt: stamp() });
    ingest(n, [...SAMPLE_FILES, SAMPLE_DUPLICATE], USER, "SRC-SAMPLE");
  });
  const runOcr = async (docId: string) => {
    const d = s.documents.find((x) => x.id === docId)!;
    const v = d.versions.find((x) => x.id === d.currentVersionId)!;
    const f = parsedCache.current.get(v.sha256);
    if (!f) { alert(tx("ไฟล์ต้นฉบับไม่อยู่ในหน่วยความจำของแท็บนี้ — ลากไฟล์เข้ามาใหม่เพื่อทำ OCR", "The original file is not in this tab's memory — drop it again to run OCR")); return; }
    setBusy(true);
    const pd = await parseFile(f, { ocr: true, sourceConnectionId: v.sourceConnectionId, onProgress: (path, msg) => setProgress((p) => [...p, { path, msg }]) });
    apply((n) => reextract(n, docId, pd, USER));
    setBusy(false);
  };

  /* ───── Action B: Hand Off to AI ───── */
  const prepareMission = () => {
    if (!instruction.trim()) return;
    apply((n) => { planMission(n, instruction.trim(), USER); });
    const recips = [...new Set(Object.values(OWNERS).map((o) => o.email!))];
    setAuthDraft({ sources: s.sources.filter((x) => !x.revokedAt).map((x) => x.id), recipients: recips.filter((e) => e.endsWith("@lgp.example")), send: "pre-approved-internal", limit: 500 });
    setTab("mission");
  };
  const mission = s.missions[s.missions.length - 1];
  const env: MissionEnv = {
    collect: () => [], // uploads/folders are read at import time; cloud connectors are P1
    owners: (id) => OWNERS[id],
    deliver: () => false, // no mailer connected in this build: approved requests are opened in the user's mail client
    returned: () => { const d = returnedInbox.current; returnedInbox.current = []; return d; },
  };
  const go = async () => {
    if (!mission) return;
    const n = clone(s);
    await runMission(n, mission.id, env);
    analyze(n);
    setS(n);
  };
  const grant = async () => {
    if (!mission || !authDraft) return;
    const n = clone(s);
    authorize(n, mission.id, { sources: authDraft.sources, recipients: authDraft.recipients, externalActions: { sendRequests: authDraft.send }, spendLimitTHB: authDraft.limit, grantedBy: USER });
    await runMission(n, mission.id, env);
    analyze(n);
    setS(n);
    setAuthDraft(null);
  };
  const missionCtl = (fn: typeof pause) => apply((n) => fn(n, mission.id, USER));
  const markSent = (rid: string) => apply((n) => { const q = n.requests.find((x) => x.id === rid)!; q.status = "sent"; q.sentAt = stamp(); q.deliveryPending = false; const m = n.missing.find((x) => x.id === q.missingId); if (m) m.status = "requested"; });
  const uploadOnBehalf = async (rid: string, list: FileList | null) => {
    if (!list?.length) return;
    const files = await expand(filesFromInput(list));
    for (const f of files) { const pd = await parseFile(f, { ocr: autoOcr, sourceConnectionId: "SRC-UPLOAD-LINKS" }); parsedCache.current.set(pd.sha256, f); returnedInbox.current.push(pd); }
    apply((n) => { const q = n.requests.find((x) => x.id === rid); if (q) q.status = "sent"; });
    setTimeout(() => void go(), 0);
  };

  /* ───── Derived views ───── */
  const fieldsToReview = s.fields.filter((f) => f.confidence.approval === "pending" && (f.confidence.extraction < 0.8 || f.state !== "value" || f.key.startsWith("capacity") || f.key.startsWith("measurement") || f.key.startsWith("licence") || f.key.startsWith("validity")));
  const sel = s.fields.find((f) => f.id === selField) ?? fieldsToReview[0];
  const tr = sel ? trace(s, sel.id) : undefined;
  const statusK = (st: string): Status => (st === "verified" ? "ok" : st === "received" ? "info" : st === "needs-review" ? "warn" : st === "not-applicable" ? "cond" : "bad");
  const statusLabel = (st: string) => ({ missing: tx("ขาด", "Missing"), received: tx("ได้รับแล้ว", "Received"), "needs-review": tx("ต้องตรวจ", "Needs review"), verified: tx("ยืนยันแล้ว", "Verified"), "historical-only": tx("มีแต่ของรอบก่อน", "Historical only"), "not-applicable": tx("ไม่เกี่ยวข้อง", "Not applicable") }[st] ?? st);
  const levelLabel = (l: string) => ({ mandatory: tx("บังคับ", "Mandatory"), conditional: tx("มีเงื่อนไข", "Conditional"), optional: tx("ไม่บังคับ", "Optional"), "not-applicable": tx("ไม่เกี่ยวข้อง", "N/A") }[l] ?? l);
  const actionLabel = (a: string) => ({ "ai-collect": tx("AI ดึงข้อมูล", "AI collect"), request: tx("ส่งคำขอ", "Request"), verify: tx("ยืนยัน", "Verify"), review: tx("ตรวจ", "Review"), reuse: tx("ใช้ของเดิม", "Reuse"), none: "—" }[a] ?? a);
  const stateLabel = (st: ExtractedField["state"]) => ({ value: "", zero: tx("ศูนย์", "zero"), "not-detected": tx("ตรวจไม่พบ (ND)", "not detected"), "not-measured": tx("ไม่ได้ตรวจวัด", "not measured"), "not-provided": tx("ไม่มีข้อมูล", "not provided"), unclear: tx("อ่านไม่ชัด", "unclear") }[st]);

  return (
    <div className="page page-wide">
      <PageHead explain={["mission-authorisation","lab-accreditation","noise-baseline"]} kicker={tx("เตรียมข้อมูล / SMART DATA INGESTION", "Data preparation / Smart Data Ingestion")} title={tx("อัปโหลดครั้งเดียว AI ทำงานต่อ คนดูแลเฉพาะข้อยกเว้น", "Upload once. AI does the work. People handle exceptions.")} lead={tx("ไม่ต้องตั้งชื่อ แยกหมวด หรือกรอกแบบฟอร์ม — COP24 อ่านไฟล์ทั้งกอง จัดหมวด สกัดค่า ตรวจความถูกต้อง จับคู่กับข้อกำหนด กกพ. และบอกเฉพาะสิ่งที่ขาดหรือขัดแย้ง ไฟล์ถูกอ่านในเบราว์เซอร์ของคุณ ไม่ถูกส่งออกไปที่ใด", "No naming, sorting or form-filling. COP24 reads the whole pile, classifies, extracts, validates, maps to ERC requirements and tells you only what is missing or conflicting. Files are read in your browser and are not sent anywhere.")} />

      <div className="row row-center" style={{ gap: 12, marginTop: 18 }}>
        <span className="label">{tx("โรงไฟฟ้า", "Plant")}</span>
        <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ maxWidth: 240 }}>{plants.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}</select>
        <span className="label">{tx("รายงาน", "Report")}</span>
        <Seg<ReportKind> name="rk" value={report} onChange={setReport} options={[{ v: "preliminary", label: tx("CoP ขั้นต้น", "Preliminary") }, { v: "final", label: tx("ขั้นสุดท้าย", "Final") }, { v: "monitoring", label: tx("ติดตามผล", "Monitoring") }]} />
        <select className="input" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ maxWidth: 110 }}>{[2025, 2026, 2027].map((y) => <option key={y} value={y}>{tx(String(y + 543), String(y))}</option>)}</select>
      </div>

      {/* ── The two primary actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 0, border: "2px solid var(--color-divider)", marginTop: 18 }}>
        <div className="cell" style={{ padding: 22, background: dragOver ? "var(--color-accent-100)" : undefined }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          onDrop={async (e) => { e.preventDefault(); setDragOver(false); await stage(await filesFromDrop(e.dataTransfer.items)); }}>
          <div className="tile-num">A · {tx("นำเข้าทุกอย่าง", "Import everything")}</div>
          <div className="heading" style={{ fontSize: 22, marginTop: 6 }}>{tx("ลากไฟล์ โฟลเดอร์ หรือ ZIP มาวาง", "Drop files, folders or ZIPs")}</div>
          <div className="small muted-7" style={{ marginTop: 6, lineHeight: 1.6 }}>{tx("PDF (รวมสแกน) · Word · Excel/CSV · ภาพถ่าย · ZIP · รายงาน CoP เดิม · ใบอนุญาต · ผลแล็บ — ไม่ต้องตั้งชื่อหรือแยกหมวด", "PDF (incl. scans) · Word · Excel/CSV · photos · ZIP · previous COP reports · licences · lab reports — no naming or sorting needed")}</div>
          <div className="row" style={{ marginTop: 14 }}>
            <label className="btn btn-secondary btn-sm" style={{ background: "var(--color-bg)" }}>{tx("เลือกไฟล์", "Choose files")}<input type="file" multiple hidden onChange={async (e) => { if (e.target.files) await stage(filesFromInput(e.target.files)); e.target.value = ""; }} /></label>
            <label className="btn btn-secondary btn-sm" style={{ background: "var(--color-bg)" }}>{tx("เลือกโฟลเดอร์", "Choose folder")}<input type="file" multiple hidden {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} onChange={async (e) => { if (e.target.files) await stage(filesFromInput(e.target.files)); e.target.value = ""; }} /></label>
            <button className="btn btn-ghost btn-sm" onClick={loadSample}>{tx("ลองชุดตัวอย่าง →", "Try the sample set →")}</button>
          </div>
          {staged.length > 0 && (
            <div style={{ marginTop: 14, borderTop: "1px solid var(--color-divider)", paddingTop: 10 }}>
              <div className="small" style={{ fontWeight: 600 }}>{staged.length} {tx("รายการพร้อมนำเข้า", "item(s) ready")}</div>
              <div className="muted tiny" style={{ maxHeight: 70, overflow: "auto", lineHeight: 1.6 }}>{staged.slice(0, 30).map((f) => f.path).join(" · ")}</div>
              <div style={{ marginTop: 8 }}><AdvancedSettings summary={autoOcr ? tx("ค่าแนะนำ: OCR อัตโนมัติ", "Recommended: auto OCR") : tx("OCR ปิดอยู่", "OCR off")}><label className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={autoOcr} onChange={(e) => setAutoOcr(e.target.checked)} />{tx("ทำ OCR ไทย+อังกฤษอัตโนมัติสำหรับหน้าที่เป็นภาพสแกน", "Auto Thai+English OCR for scanned pages")}</label><span className="muted tiny">{tx(`ตัวจำแนก ${CLASSIFIER_VERSION} · ตัวสกัด ${EXTRACTOR_VERSION} · กฎ ${RULESET_VERSION}`, `Classifier ${CLASSIFIER_VERSION} · extractor ${EXTRACTOR_VERSION} · rules ${RULESET_VERSION}`)}</span></AdvancedSettings></div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn btn-primary" disabled={busy} onClick={startImport}>{busy ? tx("กำลังประมวลผล…", "Processing…") : tx("เริ่มประมวลผล", "Start processing")}</button>
                <button className="btn btn-secondary" onClick={() => setStaged([])}>{tx("ล้าง", "Clear")}</button>
              </div>
            </div>
          )}
        </div>
        <div className="cell" style={{ padding: 22 }}>
          <div className="tile-num">B · {tx("ส่งต่อให้ AI", "Hand off to AI")}</div>
          <div className="heading" style={{ fontSize: 22, marginTop: 6 }}>{tx("บอกว่าต้องการรายงานอะไร AI จะทำงานรวบรวมให้", "Say which report you need — AI does the collection")}</div>
          <textarea className="input" value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder={tx(`เช่น เตรียมข้อมูลรายงานผลการปฏิบัติตาม CoP ปี ${year + 543} ของ${L(plant?.name)} รวบรวมเอกสารที่มีทั้งหมดและขอข้อมูลที่ขาดจากทีมเรา`, `e.g. Prepare the ${year} COP Monitoring Report for ${L(plant?.name)}. Collect all available documents and request missing information from our team.`)} style={{ marginTop: 12, minHeight: 92, background: "var(--color-bg)" }} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn-primary" onClick={prepareMission} disabled={!instruction.trim()}>{tx("เตรียมภารกิจ →", "Prepare mission →")}</button>
            <span className="muted tiny" style={{ alignSelf: "center" }}>{tx("คุณอนุมัติแหล่งข้อมูล ผู้รับ และการส่งออกภายนอกก่อนเริ่มทุกครั้ง", "You approve sources, recipients and external actions before it runs")}</span>
          </div>
        </div>
      </div>

      {progress.length > 0 && busy && (
        <div className="panel" style={{ marginTop: 14, maxHeight: 140, overflow: "auto" }}>
          <div className="bar bar-thin"><div className="sweep" /></div>
          {progress.slice(-8).map((p, i) => <div key={i} className="code muted" style={{ marginTop: 4 }}>{p.path} · {p.msg}</div>)}
        </div>
      )}

      {/* ── Results ── */}
      {s.documents.length > 0 && (
        <>
          <Cells min={150} style={{ marginTop: 22 }}>
            <Stat label={tx("ความพร้อมของหลักฐาน", "Evidence readiness")} value={`${r.pct}%`} size="lg" color="var(--color-accent-700)" sub={`${r.applicable} ${tx("รายการที่บังคับใช้", "applicable items")}`} />
            <Stat label={tx("ยืนยันแล้ว", "Verified")} value={r.verified} color="var(--st-ok)" sub={`+${r.received} ${tx("ได้รับแล้วรอยืนยัน", "received, awaiting verification")}`} />
            <Stat label={tx("ต้องตรวจ", "Need review")} value={r.review + r.fieldsReview} color="var(--st-warn)" sub={`${r.fieldsReview} ${tx("ค่าที่สกัด", "extracted values")}`} />
            <Stat label={tx("ขาด", "Missing")} value={r.missing} color="var(--st-bad)" />
            <Stat label={tx("ข้อค้นพบเปิดอยู่", "Open findings")} value={openFindings.length} sub={`${openFindings.filter((f) => f.severity === "critical").length} ${tx("วิกฤต", "critical")}`} />
          </Cells>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginTop: 14 }}>
            <div className="callout-bar" style={{ borderLeftColor: "var(--st-ok)", background: "var(--st-ok-bg)" }}>
              <div className="callout-kicker" style={{ color: "var(--st-ok)" }}>{tx("AI ทำแล้ว", "AI completed")}</div>
              <div className="small" style={{ lineHeight: 1.65 }}>{tx(`อ่าน ${s.documents.length} เอกสาร · จัดหมวดอัตโนมัติ · สกัด ${s.fields.length} ค่า และ ${s.measurements.length} ผลตรวจวัด · จับคู่หลักฐาน ${s.links.length} รายการกับข้อกำหนด · พบไฟล์ซ้ำ ${s.findings.filter((f) => f.code === "duplicate").length} และฉบับเก่า ${s.documents.filter((d) => d.documentStatus === "superseded").length}`, `Read ${s.documents.length} documents · classified automatically · extracted ${s.fields.length} values and ${s.measurements.length} measurements · mapped ${s.links.length} evidence links to requirements · found ${s.findings.filter((f) => f.code === "duplicate").length} duplicate(s) and ${s.documents.filter((d) => d.documentStatus === "superseded").length} superseded version(s)`)}</div>
            </div>
            <div className="callout-bar">
              <div className="callout-kicker">{tx("ต้องการความสนใจ", "Needs attention")}</div>
              <div className="small" style={{ lineHeight: 1.65 }}>{openFindings.filter((f) => f.severity !== "minor").slice(0, 4).map((f) => L(f.title)).join(" · ") || tx("ไม่มีข้อยกเว้นสำคัญ", "No major exceptions")}{r.missing ? tx(` · ขาดหลักฐาน ${r.missing} รายการ — AI ร่างคำขอให้ผู้รับผิดชอบเพื่อรออนุมัติ`, ` · ${r.missing} missing item(s) — AI drafts requests to the owners for your approval`) : ""}</div>
            </div>
          </div>
          {reportAssessment && (
            <div className="row row-center" style={{ marginTop: 12, gap: 10 }}>
              <span className="small muted-7">{tx("ส่งต่อให้ระบบรายงาน (24ReportCore):", "Handed to 24ReportCore:")} {reportAssessment.gates.filter((g) => g.result === "pass").length}/{reportAssessment.gates.length} {tx("ประตูคุณภาพผ่าน", "quality gates pass")} · {reportAssessment.claims.filter((c) => c.type === "gap").length} {tx("ช่องว่างที่เปิดเผย", "disclosed gaps")}</span>
              <Link href="/factory" className="btn btn-secondary btn-sm">{tx("สร้างร่างรายงาน →", "Generate draft →")}</Link>
              <Link href="/studio" className="btn btn-ghost btn-sm">{tx("เปิดในสตูดิโอ", "Open in Studio")}</Link>
            </div>
          )}

          <div className="row row-center" style={{ marginTop: 22 }}>
            <Seg<Tab> name="it" value={tab} onChange={setTab} options={[
              { v: "checklist", label: tx("รายการหลักฐาน", "Checklist") },
              { v: "documents", label: `${tx("เอกสาร", "Documents")} ${s.documents.length}` },
              { v: "review", label: `${tx("ตรวจค่าที่สกัด", "Review values")} ${fieldsToReview.length}` },
              { v: "missing", label: `${tx("ที่ขาด & คำขอ", "Missing & requests")} ${s.missing.length}` },
              { v: "findings", label: `${tx("ข้อค้นพบ", "Findings")} ${openFindings.length}` },
              { v: "mission", label: tx("ภารกิจ AI", "AI mission") },
              { v: "profile", label: tx("โปรไฟล์โครงการ", "Project profile") },
              { v: "audit", label: tx("บันทึก", "Audit") },
            ]} />
          </div>
        </>
      )}

      {/* Mission panel is reachable before any upload */}
      {(s.documents.length > 0 || tab === "mission") && tab === "mission" && (
        <div style={{ marginTop: 16 }}>
          {!mission && <div className="muted small">{tx("ยังไม่มีภารกิจ — พิมพ์คำสั่งในช่อง “ส่งต่อให้ AI”", "No mission yet — type an instruction under “Hand off to AI”")}</div>}
          {mission && (
            <>
              <div className="panel">
                <div className="row row-center" style={{ gap: 10 }}>
                  <span className="code">{mission.id}</span>
                  <Tag k={mission.status === "completed" ? "ok" : mission.status === "running" ? "warn" : mission.status === "waiting-for-responses" ? "info" : mission.status === "cancelled" || mission.status === "failed" ? "bad" : "cond"}>{mission.status}</Tag>
                  <span className="small">{mission.target.report} · {mission.target.year}</span>
                  <span className="muted small" style={{ marginLeft: "auto" }}>{tx("ใช้ไป", "spent")} {mission.spentTHB} / {mission.authorization?.spendLimitTHB ?? "—"} THB</span>
                </div>
                <div className="heading" style={{ fontSize: 16, marginTop: 8 }}>“{mission.instruction}”</div>
                {mission.outcome && <div className="note note-ok" style={{ marginTop: 10 }}>{L(mission.outcome)}</div>}
                <div className="row" style={{ marginTop: 10 }}>
                  {(mission.status === "running" || mission.status === "waiting-for-responses") && <button className="btn btn-secondary btn-sm" onClick={() => missionCtl(pause)}>{tx("หยุดชั่วคราว", "Pause")}</button>}
                  {mission.status === "paused" && !mission.authorization?.revokedAt && <button className="btn btn-primary btn-sm" onClick={async () => { const n = clone(s); resume(n, mission.id, USER); await runMission(n, mission.id, env); analyze(n); setS(n); }}>{tx("ทำต่อ", "Resume")}</button>}
                  {mission.status === "waiting-for-responses" && <button className="btn btn-primary btn-sm" onClick={go}>{tx("ตรวจการตอบกลับและทำต่อ", "Check responses and continue")}</button>}
                  {mission.authorization && !mission.authorization.revokedAt && mission.status !== "completed" && <button className="btn btn-secondary btn-sm" onClick={() => missionCtl(revoke)}>{tx("เพิกถอนสิทธิ์", "Revoke authorisation")}</button>}
                  {mission.status !== "completed" && mission.status !== "cancelled" && <button className="btn btn-secondary btn-sm" onClick={() => missionCtl(cancel)}>{tx("ยกเลิกภารกิจ", "Cancel mission")}</button>}
                </div>
              </div>

              {mission.status === "awaiting-authorization" && authDraft && (
                <div className="callout" style={{ marginTop: 14 }}>
                  <div className="callout-kicker">{tx("อนุมัติขอบเขตของภารกิจ", "Approve the mission's scope")}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginTop: 6 }}>
                    <div>
                      <div className="label" style={{ marginBottom: 6 }}>{tx("แหล่งข้อมูลที่อ่านได้ (อ่านอย่างเดียว)", "Sources it may read (read-only)")}</div>
                      {s.sources.length === 0 && <div className="muted small">{tx("ยังไม่มี — นำเข้าไฟล์ก่อน หรือเชื่อม Drive/SharePoint (P1)", "None yet — import files first, or connect Drive/SharePoint (P1)")}</div>}
                      {s.sources.map((x) => <label key={x.id} className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={authDraft.sources.includes(x.id)} onChange={(e) => setAuthDraft({ ...authDraft, sources: e.target.checked ? [...authDraft.sources, x.id] : authDraft.sources.filter((y) => y !== x.id) })} />{x.label}</label>)}
                    </div>
                    <div>
                      <div className="label" style={{ marginBottom: 6 }}>{tx("ผู้รับคำขอที่อนุญาต", "Approved recipients")}</div>
                      {[...new Map(Object.values(OWNERS).map((o) => [o.email!, o])).values()].map((o) => <label key={o.email} className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={authDraft.recipients.includes(o.email!)} onChange={(e) => setAuthDraft({ ...authDraft, recipients: e.target.checked ? [...authDraft.recipients, o.email!] : authDraft.recipients.filter((y) => y !== o.email) })} />{o.name} · {o.role}{o.external ? <Tag k="warn" style={{ marginLeft: 4 }}>{tx("ภายนอก", "external")}</Tag> : null}</label>)}
                    </div>
                    <div>
                      <div className="label" style={{ marginBottom: 6 }}>{tx("การส่งคำขอ", "Sending requests")}</div>
                      <Seg<"never" | "each-approval" | "pre-approved-internal"> name="snd" value={authDraft.send} onChange={(v) => setAuthDraft({ ...authDraft, send: v })} options={[{ v: "never", label: tx("ห้ามส่ง", "Never") }, { v: "each-approval", label: tx("อนุมัติทีละฉบับ", "Approve each") }, { v: "pre-approved-internal", label: tx("ภายในส่งได้", "Internal pre-approved") }]} />
                      <div className="muted tiny" style={{ marginTop: 6 }}>{tx("ผู้รับภายนอกต้องอนุมัติทีละฉบับเสมอ", "External recipients always need per-message approval")}</div>
                      <div className="label" style={{ margin: "10px 0 6px" }}>{tx("วงเงินค่าประมวลผล (บาท)", "Processing spend limit (THB)")}</div>
                      <input className="input" type="number" min={0} value={authDraft.limit} onChange={(e) => setAuthDraft({ ...authDraft, limit: Number(e.target.value) })} style={{ maxWidth: 140 }} />
                    </div>
                  </div>
                  <div className="row" style={{ marginTop: 14 }}>
                    <button className="btn btn-primary" onClick={grant}>{tx("อนุญาตและเริ่มภารกิจ", "Authorise and start")}</button>
                    <span className="muted tiny" style={{ alignSelf: "center" }}>{tx("ไม่มีการลงนาม รับรอง หรือยื่นต่อ กกพ. โดย AI", "AI never signs, certifies or files with the ERC")}</span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 14, borderTop: "2px solid var(--color-divider)" }}>
                {mission.steps.map((st, i) => (
                  <div key={st.kind} className="list-item" style={{ padding: "9px 0" }}>
                    <span className={`mark st-${st.status === "done" ? "ok" : st.status === "running" ? "warn" : st.status === "failed" || st.status === "blocked" ? "bad" : "info"}`}>{st.status === "done" ? "✓" : st.status === "skipped" ? "–" : i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13 }}>{L(st.title)}</span>
                    <span className="muted tiny">{st.status}</span>
                  </div>
                ))}
              </div>
              <div className="label" style={{ margin: "16px 0 6px" }}>{tx("บันทึกการทำงานของเอเจนต์", "Agent log")}</div>
              <div className="panel panel-thin" style={{ maxHeight: 260, overflow: "auto" }}>
                {mission.log.map((l, i) => <div key={i} className="code" style={{ lineHeight: 1.7, color: l.result === "blocked" ? "var(--st-warn)" : l.result === "failed" ? "var(--st-bad)" : undefined }}>{l.at.slice(11, 19)} · {l.agent} · {l.action} · {l.result}{l.detail ? ` — ${l.detail}` : ""}</div>)}
                {!mission.log.length && <span className="muted small">—</span>}
              </div>
              <div className="note note-warn" style={{ marginTop: 10, fontSize: 12 }}>{tx("ภารกิจถูกบันทึกเป็นจุดตรวจ (checkpoint) ในเครื่องนี้ และทำต่อได้หลังปิดแท็บ การทำงานต่อเนื่องขณะปิดแอปต้องใช้ backend worker + ฐานข้อมูล ซึ่งยังไม่ได้เปิดใช้ใน deployment นี้", "The mission is checkpointed on this device and resumes after closing the tab. Running while the app is closed needs a backend worker and database, which this deployment does not have yet.")}</div>
            </>
          )}
        </div>
      )}

      {s.documents.length > 0 && tab === "checklist" && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="table" style={{ minWidth: 1100 }}>
            <thead><tr><th>{tx("เอกสาร/ข้อมูลที่ต้องมี", "Document or data required")}</th><th style={{ width: 230 }}>{tx("เหตุที่ต้องมี", "Why required")}</th><th style={{ width: 100 }}>{tx("ระดับ", "Level")}</th><th style={{ width: 120 }}>{tx("สถานะ", "Status")}</th><th style={{ width: 150 }}>{tx("แหล่ง", "Source")}</th><th style={{ width: 150 }}>{tx("ผู้รับผิดชอบ", "Responsible")}</th><th style={{ width: 120 }}>{tx("ช่วงเวลา", "Period")}</th><th style={{ width: 100 }}>{tx("ต่อไป", "Next")}</th></tr></thead>
            <tbody>{s.checklist.map((c) => (
              <tr key={c.evidenceTypeId} style={{ opacity: c.level === "not-applicable" ? 0.6 : 1 }}>
                <td style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.45 }}><div style={{ fontWeight: 600 }}>{L(c.label)}</div><div className="code muted">{c.evidenceTypeId}</div></td>
                <td style={{ verticalAlign: "top", fontSize: 12, lineHeight: 1.5 }}>{L(c.why)}<div className="code muted"><Link href="/corpus">{c.clause.sourceId}</Link>{c.clause.clause ? ` · ${c.clause.clause}` : ""}</div>{c.naReason && <div className="tiny" style={{ color: "var(--color-accent-800)" }}>{L(c.naReason)}</div>}</td>
                <td style={{ verticalAlign: "top" }}><Tag k={c.level === "mandatory" ? "bad" : c.level === "conditional" ? "warn" : "cond"}>{levelLabel(c.level)}</Tag></td>
                <td style={{ verticalAlign: "top" }}><Tag k={statusK(c.status)}>{statusLabel(c.status)}</Tag></td>
                <td className="small" style={{ verticalAlign: "top" }}>{c.documentIds.map((id) => s.documents.find((d) => d.id === id)?.title).filter(Boolean).join(", ") || "—"}</td>
                <td className="small muted-7" style={{ verticalAlign: "top" }}>{L(c.responsible)}</td>
                <td className="small muted-7" style={{ verticalAlign: "top" }}>{c.period === "standing" ? tx("เอกสารคงสถานะ", "Standing") : `${fd(c.period.from)} – ${fd(c.period.to)}`}</td>
                <td style={{ verticalAlign: "top" }}>{c.nextAction !== "none" && <Tag k="info">{actionLabel(c.nextAction)}</Tag>}</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="muted tiny" style={{ padding: "8px 10px" }}>{RULESET_VERSION} · {tx("ระดับและเหตุผลมาจากกฎที่มีเวอร์ชัน ไม่ได้มาจากโมเดลภาษา", "Levels and reasons come from versioned rules, not a language model")}</div>
        </div>
      )}

      {s.documents.length > 0 && tab === "documents" && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="table" style={{ minWidth: 1100 }}>
            <thead><tr><th style={{ width: 150 }}>ID</th><th>{tx("เอกสาร", "Document")}</th><th style={{ width: 230 }}>{tx("หมวด (หลายหมวดได้)", "Categories (multi-label)")}</th><th style={{ width: 110 }}>{tx("เอกสาร", "Document")}</th><th style={{ width: 110 }}>{tx("การสกัด", "Extraction")}</th><th style={{ width: 110 }}>{tx("ตรวจสอบ", "Validation")}</th></tr></thead>
            <tbody>{s.documents.map((d) => {
              const v = d.versions.find((x) => x.id === d.currentVersionId)!;
              return (
                <tr key={d.id}>
                  <td className="code" style={{ verticalAlign: "top" }}>{d.id}<div className="muted">#{v.sha256.slice(0, 10)}</div></td>
                  <td style={{ verticalAlign: "top", fontSize: 13 }}><div style={{ fontWeight: 600 }}>{d.title}</div><div className="muted tiny">{v.path} · {(v.size / 1024).toFixed(0)} KB · {v.pages} {tx("หน้า", "pp")}{v.ocr ? " · OCR" : ""}{d.copSubtype ? ` · CoP ${d.copSubtype}` : ""}{d.validUntil ? ` · ${tx("ใช้ได้ถึง", "valid until")} ${fd(d.validUntil)}` : ""}</div>{d.supersededBy && <div className="tiny ink-warn">{tx("ถูกแทนที่โดย", "superseded by")} {d.supersededBy}</div>}</td>
                  <td style={{ verticalAlign: "top" }}>{d.categories.map((c) => <div key={c.category} className="tiny" title={c.signals.join(", ")}><span className="code">{c.category}</span> <span className="muted">{c.score}</span> <span className="muted">[{c.signals.slice(0, 2).join(", ")}]</span></div>)}</td>
                  <td style={{ verticalAlign: "top" }}><Tag k={d.documentStatus === "active" ? "ok" : "cond"}>{d.documentStatus}</Tag></td>
                  <td style={{ verticalAlign: "top" }}><Tag k={d.extractionStatus === "extracted" ? "ok" : d.extractionStatus === "partial" ? "warn" : "bad"}>{d.extractionStatus}</Tag>{(d.extractionStatus === "needs-ocr" || d.extractionStatus === "failed") && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => runOcr(d.id)}>OCR ↻</button>}</td>
                  <td style={{ verticalAlign: "top" }}><Tag k={d.validationStatus === "valid" ? "ok" : d.validationStatus === "issues" ? "warn" : d.validationStatus === "invalid" ? "bad" : "cond"}>{d.validationStatus}</Tag></td>
                </tr>
              );
            })}</tbody>
          </table>
          <div className="muted tiny" style={{ padding: "8px 10px" }}>{CLASSIFIER_VERSION} · {EXTRACTOR_VERSION} · {tx("สถานะเอกสาร การสกัด และการตรวจสอบแยกจากกัน", "Document, extraction and validation statuses are tracked separately")}</div>
        </div>
      )}

      {s.documents.length > 0 && tab === "review" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px,1fr) 2fr", gap: 0, border: "2px solid var(--color-divider)", marginTop: 16 }}>
          <div style={{ boxShadow: "0 0 0 1px var(--color-divider)", maxHeight: 560, overflow: "auto" }}>
            {fieldsToReview.length === 0 && <div className="muted small" style={{ padding: 14 }}>{tx("ไม่มีค่าที่รอการตรวจ", "Nothing waiting for review")}</div>}
            {fieldsToReview.map((f) => (
              <button key={f.id} className={`chapter-btn${sel?.id === f.id ? " active" : ""}`} onClick={() => { setSelField(f.id); setCorrection({ value: String(f.normalized ?? ""), rationale: "" }); }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{L(f.label)}</span>
                <span className="muted tiny">{String(f.normalized ?? stateLabel(f.state))} {f.unit ?? ""} · {s.documents.find((d) => d.id === f.locator.documentId)?.title.slice(0, 32)}</span>
              </button>
            ))}
          </div>
          {sel && tr && (
            <div style={{ boxShadow: "0 0 0 1px var(--color-divider)", padding: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
                <div>
                  <div className="label" style={{ marginBottom: 6 }}>{tx("ต้นฉบับ", "Source")}</div>
                  <div className="code muted">{tr.document.title} · {tr.location.page ? `p.${tr.location.page} l.${tr.location.line}` : `${tr.location.sheet}!${tr.location.cell}`} · #{tr.version.sha256.slice(0, 10)}</div>
                  <blockquote style={{ margin: "8px 0 0", padding: "10px 12px", borderLeft: "3px solid var(--color-accent)", background: "var(--color-surface)", fontSize: 14, lineHeight: 1.7 }}>{tr.location.excerpt}</blockquote>
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 6 }}>{tx("ค่าที่สกัดได้", "Extracted")}</div>
                  <div className="small">{tx("ดิบ", "Raw")}: <span className="code">{sel.raw}</span></div>
                  <div className="small">{tx("ปรับมาตรฐาน", "Normalised")}: <span className="code">{String(sel.normalized ?? "—")} {sel.unit ?? ""}</span> {sel.state !== "value" && <Tag k="warn">{stateLabel(sel.state)}</Tag>}</div>
                  {sel.date && <div className="small">{tx("วันที่ (ค.ศ.)", "Date (CE)")}: <span className="code">{sel.date}</span></div>}
                  <div className="small muted-7">{tx("วิธี", "Method")}: <span className="code">{sel.method}</span></div>
                  <div className="row" style={{ marginTop: 8, gap: 6 }}>
                    <Tag k={sel.confidence.extraction >= 0.85 ? "ok" : sel.confidence.extraction >= 0.6 ? "warn" : "bad"}>{tx("สกัด", "extraction")} {Math.round(sel.confidence.extraction * 100)}%</Tag>
                    <Tag k={sel.confidence.integrity === "ok" ? "ok" : "warn"}>{tx("ความสมบูรณ์", "integrity")} {sel.confidence.integrity}</Tag>
                    <Tag k="info">{tx("กระทบยอด", "reconciliation")} {sel.confidence.reconciliation}</Tag>
                    <Tag k={sel.confidence.regulatory === "verified" ? "ok" : "cond"}>{tx("กฎหมาย", "regulatory")} {sel.confidence.regulatory}</Tag>
                    <Tag k={sel.confidence.approval === "approved" ? "ok" : "cond"}>{tx("อนุมัติ", "approval")} {sel.confidence.approval}</Tag>
                  </div>
                  <div className="muted tiny" style={{ marginTop: 6 }}>{tx("ความมั่นใจในการสกัดไม่ใช่หลักฐานว่าปฏิบัติตามกฎหมาย", "Extraction confidence is not proof of compliance")}</div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--color-divider)", marginTop: 14, paddingTop: 12 }}>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => apply((n) => reviewField(n, sel.id, "approve", USER))}>{tx("ยอมรับ", "Accept")}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => apply((n) => reviewField(n, sel.id, "reject", USER, { rationale: correction.rationale }))}>{tx("ปฏิเสธ", "Reject")}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => apply((n) => reviewField(n, sel.id, "clarify", USER, { rationale: correction.rationale }))}>{tx("ขอคำชี้แจง", "Request clarification")}</button>
                </div>
                <div className="row row-center" style={{ marginTop: 10, gap: 8 }}>
                  <input className="input" value={correction.value} onChange={(e) => setCorrection({ ...correction, value: e.target.value })} placeholder={tx("ค่าที่ถูกต้อง", "Corrected value")} style={{ maxWidth: 160 }} />
                  <input className="input" value={correction.rationale} onChange={(e) => setCorrection({ ...correction, rationale: e.target.value })} placeholder={tx("เหตุผล (จำเป็น)", "Rationale (required)")} style={{ flex: 1, minWidth: 200 }} />
                  <button className="btn btn-secondary btn-sm" disabled={!correction.rationale.trim()} onClick={() => apply((n) => reviewField(n, sel.id, "correct", USER, { value: isNaN(Number(correction.value)) ? correction.value : Number(correction.value), rationale: correction.rationale }))}>{tx("แก้ไข", "Correct")}</button>
                </div>
                {sel.corrections.map((c, i) => <div key={i} className="code muted" style={{ marginTop: 6 }}>{c.at.slice(0, 16)} · {c.by}: {String(c.from)} → {String(c.to)} — {c.rationale}</div>)}
              </div>
              <div className="label" style={{ margin: "14px 0 6px" }}>{tx("หลักฐานที่ค่านี้รองรับ", "Evidence this value supports")}</div>
              {tr.evidence.map((l) => <div key={l.id} className="row row-center small" style={{ gap: 8, padding: "4px 0" }}><span className="code">{l.evidenceTypeId}</span><span className="muted">{l.period}</span><Tag k={l.status === "accepted" ? "ok" : l.status === "rejected" ? "bad" : "cond"}>{l.status}</Tag>{l.status === "proposed" && <><button className="btn btn-ghost btn-sm" onClick={() => apply((n) => acceptLink(n, l.id, USER))}>{tx("ยืนยันการจับคู่", "Confirm mapping")}</button><button className="btn btn-ghost btn-sm" onClick={() => apply((n) => acceptLink(n, l.id, USER, false))}>{tx("ไม่ใช่", "Not this")}</button></>}</div>)}
              {!tr.evidence.length && <div className="muted small">—</div>}
            </div>
          )}
        </div>
      )}

      {s.documents.length > 0 && tab === "missing" && (
        <div style={{ marginTop: 16, borderTop: "2px solid var(--color-divider)" }}>
          {s.missing.length === 0 && <div className="muted small" style={{ padding: 12 }}>{tx("ไม่มีหลักฐานที่ขาด", "No missing evidence")}</div>}
          {s.missing.map((m) => {
            const req = s.requests.find((q) => q.id === m.requestId);
            const owner = OWNERS[m.evidenceTypeId];
            return (
              <div key={m.id} style={{ borderBottom: "1px solid var(--color-divider)", padding: "14px 0" }}>
                <div className="row row-center" style={{ gap: 10 }}>
                  <Tag k={m.importance === "critical" ? "bad" : m.importance === "high" ? "warn" : "info"}>{m.importance}</Tag>
                  <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{L(m.missing)}</span>
                  <span className="muted small">{tx("กำหนด", "due")} {fd(m.deadline)}</span>
                </div>
                <div className="small muted-7" style={{ marginTop: 4, lineHeight: 1.6 }}>{L(m.requirement)} · <span className="code">{m.reference.sourceId}{m.reference.clause ? ` ${m.reference.clause}` : ""}</span> · {L(m.consequence)}</div>
                <div className="small" style={{ marginTop: 4 }}>{tx("ทางที่ง่ายที่สุด", "Easiest resolution")}: <strong>{L(m.recommendation)}</strong> · {tx("ผู้รับผิดชอบ", "owner")} {L(m.owner)}</div>
                {!req && owner && <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => apply((n) => { draftRequest(n, n.missing.find((x) => x.id === m.id)!, owner); })}>{tx(`ร่างคำขอถึง ${owner.name}`, `Draft request to ${owner.name}`)}</button>}
                {req && (
                  <div className="panel panel-thin" style={{ marginTop: 8 }}>
                    <div className="row row-center" style={{ gap: 8 }}><span className="code">{req.id}</span><Tag k={req.status === "sent" || req.status === "responded" ? "ok" : req.status === "approved" ? "info" : "warn"}>{req.status}</Tag><span className="small muted">{req.recipient.name} · {req.recipient.email}{req.recipient.external ? ` · ${tx("ภายนอก", "external")}` : ""}</span></div>
                    <div className="small" style={{ fontWeight: 600, marginTop: 6 }}>{req.subject}</div>
                    <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-body)", fontSize: 12, lineHeight: 1.6, margin: "6px 0 0", maxHeight: 160, overflow: "auto" }}>{req.body}</pre>
                    <div className="row" style={{ marginTop: 8 }}>
                      {req.status === "awaiting-approval" && <button className="btn btn-primary btn-sm" onClick={() => apply((n) => approveRequest(n, req.id, USER))}>{tx("อนุมัติคำขอ", "Approve request")}</button>}
                      {req.status === "approved" && <a className="btn btn-secondary btn-sm" href={`mailto:${req.recipient.email}?subject=${encodeURIComponent(req.subject)}&body=${encodeURIComponent(req.body)}`}>{tx("เปิดในโปรแกรมอีเมล", "Open in mail client")}</a>}
                      {req.status === "approved" && <button className="btn btn-secondary btn-sm" onClick={() => markSent(req.id)}>{tx("ทำเครื่องหมายว่าส่งแล้ว", "Mark as sent")}</button>}
                      {(req.status === "sent" || req.status === "approved") && <label className="btn btn-ghost btn-sm">{tx("รับไฟล์ที่ตอบกลับ", "Receive returned file")}<input type="file" multiple hidden onChange={(e) => uploadOnBehalf(req.id, e.target.files)} /></label>}
                      {(req.status === "sent" || req.status === "approved") && req.missingId.includes("LOCATION") && <button className="btn btn-ghost btn-sm" onClick={() => { returnedInbox.current.push(SAMPLE_RETURNED); apply((n) => { const q = n.requests.find((x) => x.id === req.id); if (q) q.status = "sent"; }); setTimeout(() => void go(), 0); }}>{tx("จำลองการตอบกลับ (ตัวอย่าง)", "Simulate a response (sample)")}</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {s.documents.length > 0 && tab === "findings" && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="table" style={{ minWidth: 980 }}>
            <thead><tr><th style={{ width: 90 }}>{tx("ระดับ", "Severity")}</th><th style={{ width: 110 }}>{tx("ชั้น", "Level")}</th><th>{tx("ข้อค้นพบ", "Finding")}</th><th style={{ width: 280 }}>{tx("สิ่งที่ควรทำ", "Suggested action")}</th><th style={{ width: 100 }}>{tx("สถานะ", "Status")}</th></tr></thead>
            <tbody>{s.findings.map((f) => (
              <tr key={f.id}>
                <td style={{ verticalAlign: "top" }}><Tag k={f.severity === "critical" ? "bad" : f.severity === "major" ? "warn" : "info"}>{f.severity}</Tag></td>
                <td className="small muted-7" style={{ verticalAlign: "top" }}>{f.level}<div className="code">{f.code}</div></td>
                <td style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.55 }}><div style={{ fontWeight: 600 }}>{L(f.title)}</div>{L(f.detail)}</td>
                <td className="small muted-7" style={{ verticalAlign: "top", lineHeight: 1.5 }}>{L(f.suggestedAction)}</td>
                <td style={{ verticalAlign: "top" }}>{f.status === "open" ? <button className="btn btn-ghost btn-sm" onClick={() => apply((n) => { const x = n.findings.find((y) => y.id === f.id); if (x) x.status = "resolved"; })}>{tx("ปิดเรื่อง", "Resolve")}</button> : <Tag k="ok">{f.status}</Tag>}</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="muted tiny" style={{ padding: "8px 10px" }}>{STANDARDS_VERSION} · {tx("ค่ามาตรฐานตัวเลขยังรอเจ้าของโดเมนยืนยัน ผลเกินมาตรฐานจึงเป็นผลชั่วคราว AI อธิบายได้ แต่ไม่แก้ข้อมูลต้นฉบับ", "Numeric standards await domain-owner confirmation, so exceedances are provisional. AI explains issues but never edits source data.")}</div>
        </div>
      )}

      {s.documents.length > 0 && tab === "profile" && s.profile && (
        <div style={{ marginTop: 16 }}>
          <div className="note note-warn" style={{ marginBottom: 12, fontSize: 12 }}>{tx("ค่าทั้งหมดเป็นข้อเสนอจากหลักฐาน — AI ไม่สรุปว่าโครงการที่ไม่ชัดเจนเข้าข่ายหรือได้รับยกเว้นโดยไม่มีการยืนยัน", "All values are suggestions from evidence — AI does not conclude an ambiguous project is in scope or exempt without verification")}</div>
          <Cells min={240} thin>
            {([["name", tx("ชื่อโครงการ", "Project")], ["owner", tx("เจ้าของ", "Owner")], ["location", tx("ที่ตั้ง", "Location")], ["coordinates", tx("พิกัด", "Coordinates")], ["technology", tx("เทคโนโลยี", "Technology")], ["capacityAcMW", tx("กำลังผลิต (MW)", "Capacity (MW)")], ["capacityDcMWp", tx("กำลังผลิตแผง (MWp)", "Panel capacity (MWp)")], ["licenceNumber", tx("เลขที่ใบอนุญาต", "Licence no.")], ["licenceValidUntil", tx("ใบอนุญาตใช้ได้ถึง", "Licence valid until")], ["phase", tx("ระยะโครงการ", "Phase")], ["framework", tx("กรอบการรายงาน", "Framework")]] as const).map(([k, label]) => {
              const v = s.profile![k];
              return (
                <div key={k} className="cell cell-bg cell-tight">
                  <div className="label-9">{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{v.value !== undefined ? String(v.value) : "—"}</div>
                  <Tag k={v.status === "verified" ? "ok" : v.status === "conflict" ? "bad" : v.status === "suggested" ? "warn" : "cond"} style={{ marginTop: 4 }}>{v.status}{v.alternatives?.length ? ` · ${tx("อีกค่า", "alt")} ${v.alternatives.join(", ")}` : ""}</Tag>
                </div>
              );
            })}
          </Cells>
          <div className="label" style={{ margin: "16px 0 6px" }}>{tx("รายงานเดิมที่พบ", "Prior reports found")}</div>
          {s.profile.priorReports.map((p) => <div key={p.documentId} className="small">{s.documents.find((d) => d.id === p.documentId)?.title} · {p.kind ?? "?"} · {p.period ?? "?"} — {tx("ใช้เป็นข้อมูลย้อนหลังและตั้งต้นเท่านั้น ไม่ใช่หลักฐานของรอบปัจจุบัน", "used as history and seed only, not current-period evidence")}</div>)}
          {!s.profile.priorReports.length && <div className="muted small">—</div>}
        </div>
      )}

      {s.documents.length > 0 && tab === "audit" && (
        <div className="panel panel-thin" style={{ marginTop: 16, maxHeight: 520, overflow: "auto" }}>
          {[...s.audit].reverse().map((a) => <div key={a.id} className="code" style={{ lineHeight: 1.7 }}>{a.at.replace("T", " ").slice(0, 19)} · <span style={{ color: a.actorKind === "agent" ? "var(--color-accent-700)" : undefined }}>{a.actor}</span> · {a.action} · {a.object}{a.detail ? ` — ${a.detail}` : ""}{a.result !== "ok" ? ` [${a.result}]` : ""}</div>)}
        </div>
      )}

      {s.documents.length > 0 && (
        <div className="row" style={{ marginTop: 24 }}>
          <button className="btn btn-secondary btn-sm" onClick={async () => { if (confirm(tx("ล้างพื้นที่ทำงานนี้ในเครื่องนี้?", "Clear this workspace on this device?"))) { await clearState(key); setS(fresh()); } }}>{tx("ล้างพื้นที่ทำงาน", "Clear workspace")}</button>
          <span className="muted tiny" style={{ alignSelf: "center" }}>{tx("บันทึกอัตโนมัติในเบราว์เซอร์นี้ (IndexedDB)", "Saved automatically in this browser (IndexedDB)")} · {EVIDENCE_TYPES.length} {tx("ประเภทหลักฐาน", "evidence types")}</span>
        </div>
      )}
    </div>
  );
}
