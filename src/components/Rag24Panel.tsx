"use client";

import { useState } from "react";
import { useApp } from "@/state/AppState";
import { authHeaders } from "@/lib/access";
import { Tag } from "./ui";
import { useRag24Status } from "./ux/Rag24Status";

interface Passage { id: string; title: string; issuer: string; text: string; cite: string; url: string | null; effectiveFrom: string; effectiveTo: string | null }
interface Result { status: string; reason: string; passages: Passage[]; warnings: string[]; retrievedAt?: string }
interface Check { status: string; supported: boolean; reason: string; passages: Passage[] }

/**
 * RAG24 shared evidence — the search pilot. Results sit beside COP24's own corpus and never replace
 * it; every passage is approved evidence, not a legal conclusion.
 */
export function Rag24Panel() {
  const { L, tx, entityId, data } = useApp();
  const st = useRag24Status() ?? null;
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [claim, setClaim] = useState("");
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<Check | null>(null);
  const verify = async () => {
    if (claim.trim().length < 10) return;
    setChecking(true);
    try {
      const r = await fetch("/api/rag24/verify", { method: "POST", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify({ claim, entityId }) });
      setCheck(await r.json());
    } catch { setCheck({ status: "unavailable", supported: false, reason: "network", passages: [] }); } finally { setChecking(false); }
  };
  const entity = data.entities.find((e) => e.id === entityId);

  const search = async () => {
    if (q.trim().length < 2) return;
    setBusy(true);
    try {
      const r = await fetch("/api/rag24", { method: "POST", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify({ query: q, entityId }) });
      setRes(await r.json());
    } catch { setRes({ status: "unavailable", reason: "network", passages: [], warnings: [] }); } finally { setBusy(false); }
  };

  const live = st?.configured && st.stage !== "disabled";
  const badge = !st ? <Tag k="info">…</Tag>
    : !st.configured ? <Tag k="info">{tx("ยังไม่เชื่อมต่อ", "Not connected")}</Tag>
      : st.stage === "disabled" ? <Tag k="warn">{tx("ปิดอยู่", "Disabled")}</Tag>
        : st.reachable === false ? <Tag k="bad">{tx("ติดต่อไม่ได้", "Unreachable")}</Tag>
          : <Tag k="ok">{st.stage === "search_pilot" ? tx("นำร่องค้นหา", "Search pilot") : tx("เวิร์กโฟลว์", "Workflows")} · {st.host}</Tag>;
  const msg = (r: Result) => r.status === "evidence_available" ? tx(`พบ ${r.passages.length} ตอนจากแหล่งที่อนุมัติแล้ว — เป็นหลักฐาน ไม่ใช่ข้อสรุปทางกฎหมาย`, `${r.passages.length} passage(s) from approved sources — evidence, not a legal conclusion`)
    : r.status === "missing_evidence" ? tx("ไม่พบหลักฐานที่อนุมัติแล้วสำหรับคำถามนี้", "No approved evidence found for this question")
      : r.status === "unavailable" ? tx("RAG24 ไม่พร้อมใช้งานขณะนี้ — คลังกฎหมายของ COP24 ยังใช้ได้ตามปกติ", "RAG24 is unavailable right now — COP24's own corpus still works")
        : tx("การเชื่อมต่อ RAG24 ปิดอยู่", "The RAG24 connection is off");

  return (
    <section id="rag24" className="rag24-panel" aria-label="RAG24">
      <div className="row row-center" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div className="row row-center" style={{ gap: 8 }}><span className="label" style={{ margin: 0 }}>{tx("หลักฐานร่วม · RAG24", "Shared evidence · RAG24")}</span>{badge}</div>
        {st?.configured && <span className="muted tiny">{tx("ชุดโดเมน", "domain pack")} COP24 {st.pack}</span>}
      </div>
      <p className="small muted" style={{ margin: "6px 0 10px", lineHeight: 1.5 }}>{tx("ค้นข้อความกฎระเบียบจากบริการหลักฐานกลางของ 24 Series (RAG24) ซึ่งคืนเฉพาะแหล่งที่ได้รับอนุมัติและได้รับสิทธิ์สำหรับโครงการนี้ พร้อมตำแหน่งและวันที่มีผล Paul ใช้แหล่งเดียวกันเมื่อเชื่อมต่อแล้ว", "Search regulatory text in the 24 Series shared evidence service (RAG24). It returns only approved sources this project is authorised to use, with location and effective dates. Paul uses the same source once connected.")}</p>
      {live ? (
        <form className="row" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); void search(); }}>
          <input className="input" style={{ flex: 1, minWidth: 200 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("เช่น ต้องยื่นรายงานผลการปฏิบัติตาม CoP เมื่อไร", "e.g. when must the CoP monitoring report be filed?")} aria-label={tx("คำค้นหลักฐาน", "Evidence search")} />
          <button className="btn btn-primary" disabled={busy || q.trim().length < 2}>{busy ? tx("กำลังค้น…", "Searching…") : tx("ค้นหลักฐาน", "Find evidence")}</button>
        </form>
      ) : (
        <div className="note" style={{ margin: 0 }}>{!st?.configured ? tx("ยังไม่ได้ตั้งค่า RAG24_URL และ RAG24_SERVICE_KEY บนเซิร์ฟเวอร์ — COP24 ใช้คลังกฎหมายของตัวเองตามปกติ", "RAG24_URL and RAG24_SERVICE_KEY are not set on the server — COP24 uses its own corpus as usual.") : tx("RAG24_STAGE เป็น disabled — เปิดเป็น search_pilot เมื่อพร้อม", "RAG24_STAGE is disabled — set it to search_pilot when ready.")}</div>
      )}
      {st?.stage === "workflows" && (
        <div className="rag24-verify">
          <div className="label" style={{ margin: "14px 0 6px" }}>{tx("ตรวจข้อความกฎระเบียบ", "Verify a regulatory statement")}</div>
          <form className="row" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); void verify(); }}>
            <input className="input" style={{ flex: 1, minWidth: 200 }} value={claim} onChange={(e) => setClaim(e.target.value)} placeholder={tx("วางประโยคจากรายงาน เช่น ข้อกำหนดที่อ้างถึงระเบียบ กกพ.", "Paste a sentence from the report that states an ERC requirement")} aria-label={tx("ข้อความที่จะตรวจ", "Statement to verify")} />
            <button className="btn btn-secondary btn-plain" disabled={checking || claim.trim().length < 10}>{checking ? tx("กำลังตรวจ…", "Verifying…") : tx("ตรวจกับแหล่งที่อนุมัติ", "Verify against approved sources")}</button>
          </form>
          {check && (
            <div className={`note ${check.supported ? "note-ok" : check.status === "unavailable" ? "note-bad" : "note-warn"}`} style={{ marginTop: 8 }}>
              {check.supported
                ? tx("ข้อความนี้ตรงกับแหล่งกฎระเบียบที่อนุมัติแล้ว — ยังต้องให้ผู้มีคุณวุฒิยืนยันการตีความและการบังคับใช้", "This statement matches approved regulatory sources — a qualified person still confirms interpretation and applicability")
                : check.status === "unavailable" ? tx("RAG24 ไม่พร้อมใช้งานขณะนี้", "RAG24 is unavailable right now")
                  : tx("ยืนยันไม่ได้จากแหล่งที่อนุมัติแล้ว — อย่าเขียนเป็นข้อกำหนดจนกว่าจะมีแหล่งรองรับ", "Not verified by approved sources — don't state it as a requirement until a source supports it")}
            </div>
          )}
        </div>
      )}
      {res && (
        <div style={{ marginTop: 12 }}>
          <div className={`note ${res.status === "evidence_available" ? "note-ok" : res.status === "unavailable" ? "note-bad" : "note-warn"}`} style={{ margin: 0 }}>{msg(res)}{entity ? ` · ${L(entity.name)}` : ""}</div>
          {res.passages.map((p) => (
            <div key={p.id} className="rag24-hit">
              <b>{p.cite}</b>
              <div className="muted tiny">{p.issuer} · {tx("มีผลตั้งแต่", "effective from")} {p.effectiveFrom}{p.effectiveTo ? ` ${tx("ถึง", "to")} ${p.effectiveTo}` : ""}{p.url && <> · <a href={p.url} target="_blank" rel="noreferrer">{tx("ต้นฉบับ", "publisher")}</a></>}</div>
              <div className="rag24-text">{p.text.slice(0, 700)}{p.text.length > 700 ? "…" : ""}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
