"use client";

import { useState } from "react";
import { useApp } from "@/state/AppState";
import { authHeaders } from "@/lib/access";
import { Tag } from "./ui";
import { useRag24Status } from "./ux/Rag24Status";

type Workflow = "regulatory_check" | "report_generation" | "studio" | "report_review";
interface Passage { id: string; title: string; issuer: string; text: string; cite: string; url: string | null; effectiveFrom: string }
interface Result { status: string; reason: string; readiness?: "ready" | "blocked"; missing?: string[]; packageId?: string; passages: Passage[] }

/**
 * RAG24 evidence for one COP24 workflow — report generation, Report Studio or report review. It appears
 * only when the connection is in the "workflows" stage and sits beside COP24's own checks, never replacing
 * them: a ready package is evidence, not approval, and filing still needs the qualified person.
 */
export function Rag24Workflow({ workflow, entityId, query, title }: { workflow: Workflow; entityId: string; query: string; title: string }) {
  const { tx } = useApp();
  const st = useRag24Status();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  if (!st || !st.configured || st.stage !== "workflows") return null;

  const run = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/rag24", { method: "POST", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify({ workflow, entityId, query }) });
      setRes(await r.json());
    } catch { setRes({ status: "unavailable", reason: "network", passages: [] }); } finally { setBusy(false); }
  };

  const verdict = !res ? null
    : res.status === "unavailable" ? { k: "bad" as const, text: tx("RAG24 ไม่พร้อมใช้งานขณะนี้ — การตรวจของ COP24 ยังใช้ได้ตามปกติ", "RAG24 is unavailable right now — COP24's own checks still apply") }
      : res.readiness === "ready" ? { k: "ok" as const, text: tx("หลักฐานครบตามรายการของ RAG24 — ยังต้องให้คนตรวจและอนุมัติ", "RAG24's evidence checklist is complete — a person still reviews and approves") }
        : res.readiness === "blocked" || res.status === "missing_evidence" ? { k: "warn" as const, text: tx("หลักฐานยังไม่ครบตามรายการของ RAG24", "RAG24's evidence checklist is not complete yet") }
          : { k: "info" as const, text: tx("การเชื่อมต่อ RAG24 ปิดอยู่สำหรับขั้นนี้", "The RAG24 connection is off for this step") };

  return (
    <div className="rag24-flow">
      <div className="row row-center" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span className="label" style={{ margin: 0 }}>RAG24 · {title}</span>
        <button type="button" className="btn btn-secondary btn-sm btn-plain" disabled={busy} onClick={() => void run()}>{busy ? tx("กำลังตรวจ…", "Checking…") : res ? tx("ตรวจอีกครั้ง", "Check again") : tx("ตรวจหลักฐานกับ RAG24", "Check evidence with RAG24")}</button>
      </div>
      {verdict && (
        <div style={{ marginTop: 8 }}>
          <div className={`note note-${verdict.k === "info" ? "warn" : verdict.k}`} style={{ margin: 0 }}><Tag k={verdict.k}>{res!.readiness === "ready" ? tx("พร้อม", "Ready") : res!.readiness === "blocked" ? tx("ยังไม่พร้อม", "Blocked") : res!.status}</Tag> {verdict.text}</div>
          {res!.missing && res!.missing.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div className="muted tiny">{tx("ที่ยังขาด", "Still missing")}</div>
              <ul className="why-list" style={{ marginTop: 4 }}>{res!.missing.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}
          {res!.passages.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary className="small">{tx(`แหล่งที่อนุมัติแล้ว ${res!.passages.length} ตอน`, `${res!.passages.length} approved passage(s)`)}{res!.packageId ? <span className="muted tiny"> · {res!.packageId}</span> : null}</summary>
              {res!.passages.map((p) => (
                <div key={p.id} className="rag24-hit">
                  <b>{p.cite}</b>
                  <div className="muted tiny">{p.issuer} · {tx("มีผลตั้งแต่", "effective from")} {p.effectiveFrom}{p.url && <> · <a href={p.url} target="_blank" rel="noreferrer">{tx("ต้นฉบับ", "publisher")}</a></>}</div>
                  <div className="rag24-text">{p.text.slice(0, 500)}{p.text.length > 500 ? "…" : ""}</div>
                </div>
              ))}
            </details>
          )}
        </div>
      )}
    </div>
  );
}
