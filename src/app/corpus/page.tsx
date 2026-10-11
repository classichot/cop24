"use client";

import { useState } from "react";
import { useApp } from "@/state/AppState";
import { AppChip, Cells, PageHead, Seg, Stat, Tag } from "@/components/ui";
import { APPS, DOMAINS } from "@/packs";
import { corpusStats, packCoverage, type CorpusIndex, type CorpusManifest, type LegalSource } from "@/core/corpus";
import manifestJson from "../../../corpus/manifest.json";
import indexJson from "../../../corpus/index.json";
import type { Status } from "@/core/types";
import { Rag24Panel } from "@/components/Rag24Panel";

const fullManifest = manifestJson as CorpusManifest;
/** This screen belongs to COP24: it lists COP24's legal sources only. Other 24 apps keep their own. */
const APP = "cop24";
const index = indexJson as CorpusIndex;

type Filter = "all" | "in-force" | "ingested" | "pending" | "superseded" | "examples";

export default function CorpusPage() {
  const { L, tx, data, snap, fd } = useApp();
  const [filter, setFilter] = useState<Filter>("in-force");
  // a source belongs to COP24 when one of its packs does; sources without a pack are COP24's own
  // ERC catalogue (checklists for other plant technologies, reference reports)
  const appsOf = (s: LegalSource) => s.packIds.map((pid) => data.packs.find((p) => p.id === pid)?.app).filter((a): a is NonNullable<typeof a> => Boolean(a));
  const isMine = (s: LegalSource) => s.packIds.length === 0 || appsOf(s).includes(APP);
  const manifest: CorpusManifest = { ...fullManifest, sources: fullManifest.sources.filter(isMine) };
  const others = fullManifest.sources.filter((s) => !isMine(s));
  const otherApps = [...new Set(others.flatMap(appsOf))].map((a) => APPS.find((x) => x.id === a)?.name ?? String(a).toUpperCase());
  const myPacks = data.packs.filter((p) => p.app === APP);
  const stats = corpusStats(manifest, index);
  const cov = packCoverage(manifest, index);
  const laws = manifest.sources.filter((s) => s.role !== "example");
  const examples = manifest.sources.filter((s) => s.role === "example");
  const isLow = (s: LegalSource) => { const e = index.sources[s.id]; return !!e && ((e.thaiMarkRatio !== undefined && e.thaiMarkRatio < 0.03) || e.emptyPages >= e.pages / 2); };
  const rows = manifest.sources.filter((s) => {
    if (filter === "examples") return s.role === "example";
    if (s.role === "example") return false;
    if (filter === "in-force") return s.inForce !== false;
    if (filter === "superseded") return s.inForce === false;
    if (filter === "ingested") return !!index.sources[s.id];
    if (filter === "pending") return !index.sources[s.id];
    return true;
  });

  const backs = (sourceId: string) => snap.instances.filter((i) => i.obligation.citations?.some((c) => c.sourceId === sourceId)).length;
  const citationCount = myPacks.reduce((n, p) => n + p.obligations.reduce((m, o) => m + (o.citations?.length ?? 0), 0), 0);
  const clauseLevel = myPacks.reduce((n, p) => n + p.obligations.reduce((m, o) => m + (o.citations?.filter((c) => c.clause).length ?? 0), 0), 0);

  const statusOf = (s: LegalSource): { k: Status; label: string } => {
    const e = index.sources[s.id];
    if (s.inForce === false) return { k: "info", label: tx("ยกเลิกแล้ว", "Repealed") };
    if (!e) return { k: "cond", label: tx("รอไฟล์", "Awaiting file") };
    if (isLow(s)) return { k: "warn", label: tx("ต้อง OCR", "Needs OCR") };
    return { k: "ok", label: tx("นำเข้าแล้ว", "Ingested") };
  };

  return (
    <div className="page page-wide">
      <PageHead explain={["rulepack","applicability"]} kicker={tx("คลังกฎหมาย / LEGAL CORPUS", "Legal Corpus")} title={tx("ทุกข้อผูกพันต้องชี้กลับไปยังตัวบทกฎหมาย", "Every obligation points back to the text of the law")} lead={tx("คลังกฎหมายคือข้อความต้นฉบับที่อยู่เบื้องหลังชุดกฎทุกชุด เครื่องยนต์อ้างอิงจากที่นี่ ไม่ใช่จากความจำ ชุดแรกมาจากแคตตาล็อกทางการของ กกพ. (หน้าระเบียบ มาตรา 50 และหน้าประมวลหลักการปฏิบัติ) — แต่ละไฟล์ถูกตรึงด้วยแฮช แยกเป็นข้อ/มาตรา/ส่วน และตรวจคุณภาพการสกัดข้อความภาษาไทย", "The corpus is the source text behind every rule pack; the engine cites from here, not from memory. The first set comes from the ERC's official catalogue (its regulations page and Code of Practice page). Each file is pinned by hash, split into clauses and checked for Thai extraction quality.")} />
      <Rag24Panel />

      <Cells min={150} style={{ marginTop: 22 }}>
        <Stat label={tx("แหล่งกฎหมายในรายการ", "Legal sources listed")} value={stats.total} size="md" sub={`${stats.inForce} ${tx("มีผล", "in force")} · ${stats.superseded} ${tx("ยกเลิก", "repealed")}`} />
        <Stat label={tx("นำเข้าข้อความแล้ว", "Text ingested")} value={stats.ingested} size="md" color={stats.ingested ? "var(--st-ok)" : undefined} sub={`${stats.pending} ${tx("รอไฟล์", "awaiting file")}`} />
        <Stat label={tx("ข้อ / มาตรา / ส่วน", "Clauses indexed")} value={stats.clauses.toLocaleString()} size="md" />
        <Stat label={tx("ต้อง OCR", "Need OCR")} value={laws.filter(isLow).length} size="md" color="var(--st-warn)" sub={tx("ไม่มีชั้นข้อความที่ใช้ได้", "no usable text layer")} />
        <Stat label={tx("การอ้างอิงจากข้อผูกพัน", "Obligation citations")} value={citationCount} size="md" sub={`${clauseLevel} ${tx("ระบุถึงระดับข้อ/มาตรา", "at clause level")}`} />
        <Stat label={tx("รายงานตัวอย่าง", "Reference reports")} value={examples.length + 1} size="md" sub={tx("แบบฟอร์มทางการ + รายงานจริง", "official form + real report")} />
      </Cells>

      <div className="row row-center" style={{ gap: 12, marginTop: 24 }}>
        <Seg<Filter> name="cf" value={filter} onChange={setFilter} options={[
          { v: "in-force", label: `${tx("มีผล", "In force")} ${stats.inForce}` },
          { v: "ingested", label: `${tx("นำเข้าแล้ว", "Ingested")} ${stats.ingested}` },
          { v: "pending", label: `${tx("รอไฟล์", "Pending")} ${stats.pending}` },
          { v: "superseded", label: `${tx("ยกเลิก", "Repealed")} ${stats.superseded}` },
          { v: "examples", label: `${tx("ตัวอย่าง", "Examples")} ${examples.length}` },
          { v: "all", label: tx("ทั้งหมด", "All") },
        ]} />
        <span className="muted small" style={{ marginLeft: "auto" }}>{index.generatedAt ? `${tx("อัปเดตดัชนี", "Index updated")} ${fd(index.generatedAt.slice(0, 10))}` : ""}</span>
      </div>

      {others.length > 0 && (
        <div className="muted small" style={{ marginTop: 10 }}>
          {tx(`แสดงเฉพาะแหล่งกฎหมายของ COP24 · อีก ${others.length} แหล่งเป็นของแอป 24 อื่น (${otherApps.join(", ")}) และจัดการในแอปนั้น`, `Showing COP24's legal sources only · ${others.length} more belong to other 24 apps (${otherApps.join(", ")}) and are managed there`)}
        </div>
      )}

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="table" style={{ minWidth: 1040 }}>
          <thead><tr>
            <th>{tx("แหล่งกฎหมาย", "Source")}</th>
            <th style={{ width: 120 }}>{tx("ประเภท", "Type")}</th>
            <th style={{ width: 170 }}>{tx("ชุดกฎที่ใช้", "Packs")}</th>
            <th style={{ width: 70 }}>{tx("ผูก", "Backs")}</th>
            <th style={{ width: 170 }}>{tx("ข้อความ", "Text")}</th>
            <th style={{ width: 110 }}>{tx("สถานะ", "Status")}</th>
          </tr></thead>
          <tbody>
            {rows.map((s) => {
              const e = index.sources[s.id];
              const st = statusOf(s);
              const dom = DOMAINS.find((d) => d.id === s.domain);
              return (
                <tr key={s.id}>
                  <td style={{ verticalAlign: "top", lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 600 }}>{L(s.shortTitle)}</div>
                    <div className="muted tiny" style={{ marginTop: 2 }}>{L(s.title)}</div>
                    <div className="code muted" style={{ marginTop: 2 }}>{s.id}{s.downloadUrl ? <> · <a href={s.downloadUrl} target="_blank" rel="noreferrer">{tx("ไฟล์ทางการ", "official file")}</a></> : null}{s.sourcePage ? <> · <a href={s.sourcePage} target="_blank" rel="noreferrer">{new URL(s.sourcePage).host}</a></> : null}</div>
                    {s.notes && <div className="tiny" style={{ marginTop: 3, color: "var(--color-accent-800)" }}>{L(s.notes)}</div>}
                  </td>
                  <td className="muted-7" style={{ verticalAlign: "top", fontSize: 12 }}>{s.type}{s.tech ? <div className="code">{s.tech}</div> : null}<div>{dom ? L(dom.short) : s.domain}</div></td>
                  <td style={{ verticalAlign: "top" }}>
                    <div className="stack" style={{ gap: 4 }}>
                      {s.packIds.length ? s.packIds.filter((pid) => data.packs.find((x) => x.id === pid)?.app === APP).map((pid) => {
                        const p = data.packs.find((x) => x.id === pid);
                        const app = p && APPS.find((a) => a.id === p.app);
                        return <span key={pid} style={{ display: "flex", gap: 6, alignItems: "center" }}>{app && <AppChip app={app.name} accent={app.accent} />}<span className="code">{pid}</span></span>;
                      }) : <span className="muted tiny">{s.role === "example" ? tx("แบบอย่างการเขียน", "drafting reference") : tx("สำรองสำหรับเทคโนโลยีอื่น", "held for other technologies")}</span>}
                    </div>
                  </td>
                  <td style={{ verticalAlign: "top", fontSize: 13, textAlign: "center" }}>{backs(s.id) || "—"}</td>
                  <td className="muted-7" style={{ verticalAlign: "top", fontSize: 12, lineHeight: 1.5 }}>{e ? <>{e.pages} {tx("หน้า", "pp")} · {e.clauses} {tx("ส่วนย่อย", "clauses")}<div className="code muted">#{e.sha256.slice(0, 12)}</div>{e.thaiMarkRatio !== undefined && <div className={e.thaiMarkRatio < 0.03 ? "ink-bad" : "muted"}>{tx("วรรณยุกต์", "tone marks")} {e.thaiMarkRatio}</div>}</> : s.sizeBytes ? `${(s.sizeBytes / 1048576).toFixed(1)} MB` : "—"}</td>
                  <td style={{ verticalAlign: "top" }}><Tag k={st.k}>{st.label}</Tag></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <hr className="hr" style={{ margin: "30px 0 18px" }} />
      <h3 style={{ margin: "0 0 10px", fontSize: 21 }}>{tx("รายงานอ้างอิง — ใช้เป็นแบบอย่าง ไม่ใช่แหล่งกฎหมาย", "Reference reports — drafting models, not legal sources")}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <div className="panel">
          <div className="kicker">{tx("แบบฟอร์มทางการ กกพ. · Version 1.0/2567 · 13 หน้า", "Official ERC form · Version 1.0/2567 · 13 pages")}</div>
          <div className="heading" style={{ fontSize: 16, marginTop: 4 }}>{tx("รายงาน CoP และ Checklist — Solar Rooftop", "CoP report and checklist — Solar Rooftop")}</div>
          <div className="small muted-7" style={{ marginTop: 6, lineHeight: 1.65 }}>{tx("ปก: ข้อมูลการประกอบกิจการ (กำลังผลิต MWp ทศนิยม 3 / kVA ทศนิยม 2) และผู้จัดทำ + คำรับรอง · ส่วนที่ 1 บทนำ (1-1, 1-2) · ส่วนที่ 2 รายละเอียดโครงการ: 2.1 พื้นที่ 2.2 แผนผัง 2.3 ระบบไฟฟ้าและความปลอดภัย (วิศวกรควบคุมลงนาม 2-4…2-15) 2.4 อุปกรณ์ชำรุด (2-16, 2-17) · ส่วนที่ 3 สภาพแวดล้อม: พิกัด 4 ทิศ ภาพถ่ายมีวันที่ สิ่งปลูกสร้างในรัศมี 300 ม. ตารางระยะ 0–100 / 101–300 / 301 ม.–1/3/5 กม. · ส่วนที่ 4 มาตรการทั่วไป ก่อสร้าง ดำเนินการ รื้อถอน (4-1) · ส่วนที่ 5 การมีส่วนร่วม (เฉพาะขั้นสุดท้าย 5-1…5-4) · ทุกหน้ามีช่อง “พิจารณาแล้ว (เจ้าหน้าที่)” และลายมือชื่อ 4 ช่อง", "Cover: operator data (capacity MWp to 3 dp / kVA to 2 dp), preparer and certification · Part 1 introduction (1-1, 1-2) · Part 2 project: 2.1 site 2.2 layout 2.3 electrical design & safety (control-engineer sign-off 2-4…2-15) 2.4 damaged equipment (2-16, 2-17) · Part 3 environment: coordinates for 4 directions, dated photos, structures within 300 m, distance bands 0–100 / 101–300 / 301 m–1/3/5 km · Part 4 general, construction, operation, decommissioning measures (4-1) · Part 5 participation (final only, 5-1…5-4) · every page has an ERC officer “reviewed” column and four signature blocks")}</div>
          <div className="code muted" style={{ marginTop: 6 }}>erc-cop-checklist-solar-rooftop · {index.sources["erc-cop-checklist-solar-rooftop"]?.clauses ?? 0} {tx("ส่วน", "parts")}</div>
        </div>
        {examples.map((s) => (
          <div key={s.id} className="panel">
            <div className="kicker">{tx("รายงานจริง · กฟผ. · พฤษภาคม 2560 · 127 หน้า", "Real report · EGAT · May 2017 · 127 pages")}</div>
            <div className="heading" style={{ fontSize: 16, marginTop: 4 }}>{L(s.shortTitle)}</div>
            <div className="small muted-7" style={{ marginTop: 6, lineHeight: 1.65 }}>{tx("โครงสร้าง: 1 รายละเอียดโครงการ (วัตถุประสงค์ ความจำเป็น ลักษณะ องค์ประกอบ แผนงาน) · 2 สภาพแวดล้อมปัจจุบันในรัศมี 1 กม. (พืชพรรณ สัตว์ป่า ทัศนียภาพ — แต่ละหัวข้อมี ขอบเขต วิธีศึกษา การวิเคราะห์ ผล และการคาดการณ์ผลกระทบ พร้อมวันสำรวจภาคสนาม) · 3 มาตรการ (ออกแบบ ขยะ ระยะก่อสร้าง/ดำเนินการ/รื้อถอน) · ภาคผนวก (ผัง ลม มาตรฐาน มอก./IEC ค่า PCF/PR โครงสร้าง) — แบบอย่างสำคัญ: ทุกมาตรการเขียนเป็นคู่ “ข้อกำหนด → โครงการปฏิบัติอย่างไร + ตัวเลขที่ออกแบบจริง + ภาคผนวกที่พิสูจน์” เช่น PCF ≥ 15% → ออกแบบ 16.83%", "Structure: 1 project description (objective, need, nature, components, schedule) · 2 baseline within 1 km (flora, wildlife, landscape — each with scope, method, analysis, results and impact prediction, plus field-survey dates) · 3 measures (design, waste; construction / operation / decommissioning) · annexes (layout, wind, TIS/IEC standards, PCF/PR, structure). Key pattern: each measure is written as “requirement → how the project complies + the designed figure + the annex that proves it”, e.g. PCF ≥ 15% → designed 16.83%")}</div>
            <div className="note note-warn" style={{ marginTop: 8 }}>{L(s.notes)}</div>
          </div>
        ))}
      </div>

      <hr className="hr" style={{ margin: "30px 0 18px" }} />
      <h3 style={{ margin: "0 0 12px", fontSize: 21 }}>{tx("ความครอบคลุมต่อชุดกฎ", "Coverage by pack")}</h3>
      <Cells min={220}>
        {myPacks.map((p) => {
          const c = cov.get(p.id);
          const pct = c?.total ? Math.round((c.ingested / c.total) * 100) : 0;
          return (
            <div key={p.id} className="cell">
              <div className="label">{p.app.toUpperCase()} · {p.id}</div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginTop: 4 }}>{L(p.name)}</div>
              <div className="bar" style={{ marginTop: 10 }}><div style={{ width: `${pct}%`, background: pct === 100 ? "var(--st-ok)" : "var(--color-accent-700)" }} /></div>
              <div className="muted tiny" style={{ marginTop: 4 }}>{c?.ingested ?? 0} / {c?.total ?? 0} {tx("แหล่งนำเข้าแล้ว", "sources ingested")}</div>
            </div>
          );
        })}
      </Cells>

      <hr className="hr" style={{ margin: "30px 0 18px" }} />
      <h3 style={{ margin: "0 0 10px", fontSize: 21 }}>{tx("วิธีเติมคลัง", "Filling the corpus")}</h3>
      <div className="panel" style={{ fontSize: 13, lineHeight: 1.9 }}>
        <div>1 · <span className="code">npm run corpus:fetch</span> {tx("ดึงไฟล์ทางการที่มีผลบังคับจาก URL ใน manifest (≤ 10 MB ต่อไฟล์)", "fetches in-force official files from the URLs in the manifest (≤ 10 MB each)")}</div>
        <div>2 · {tx("ไฟล์จากโฟลเดอร์ Google Drive “cop24 regulation” ให้วางที่", "Files from the Google Drive “cop24 regulation” folder go in")} <span className="code">corpus/inbox/</span> {tx("โดยตั้งชื่อขึ้นต้นด้วยรหัสแหล่ง", "named with the source id as prefix")}</div>
        <div>3 · <span className="code">npm run corpus:ingest</span> {tx("— สกัดข้อความ ซ่อมวรรณยุกต์ PUA และสระอำ แยกเป็นข้อ/มาตรา/ส่วน (รองรับเลขไทย) ตรึงแฮช และเขียนดัชนี", "— extracts text, repairs PUA tone marks and SARA AM, splits into clauses (Thai numerals supported), pins the hash and writes the index")}</div>
      </div>
    </div>
  );
}
