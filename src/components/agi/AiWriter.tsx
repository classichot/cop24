"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/state/AppState";
import type { BenchCase, Check } from "@/core/report/benchmark";
import type { Deliverable } from "@/core/agi/types";
import type { LText } from "@/core/types";

interface Status { outcome: "run" | "fallback" | "queued"; modelId?: string; configured?: string; reason: LText }
interface Result { id: string; text: string; accepted: boolean; grade?: { checks: Check[] }; error?: string }

/** Turn a report deliverable into guarded section tasks: supported sections become facts, blocked ones stay unverified. */
function toSections(d: Deliverable, siteName: string): BenchCase[] {
  return (d.sections ?? []).map((s) => {
    const numbers = [...new Set(s.text.th.match(/\d+(?:\.\d+)?/g) ?? [])];
    return {
      id: s.id, title: s.title, task: `เขียนหัวข้อ “${s.title.th}” ของรายงานผลการปฏิบัติตามประมวลหลักการปฏิบัติ ${siteName}`,
      facts: s.status === "supported" ? [{ id: "F1", text: s.text.th, numbers, source: s.sources.join(", ") || "หลักฐานใน COP24" }] : [],
      blocked: s.status === "blocked" ? [{ name: s.title.th, reason: s.text.th.replace(/^\[|\]$/g, "") }] : [],
      required: [], allowedNumbers: numbers,
    };
  });
}

/**
 * "Write with AI" for a mission's report draft. Runs only on a benchmark-qualified frontier model;
 * every section is checked by the same guard, and only passing sections replace the evidence-only text.
 */
export function AiWriter({ d, siteName, onAccept }: { d: Deliverable; siteName: string; onAccept: (sections: NonNullable<Deliverable["sections"]>, model: string) => void }) {
  const { L, tx } = useApp();
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [model, setModel] = useState("");
  useEffect(() => { fetch("/api/report/draft").then((r) => r.json()).then(setStatus).catch(() => setStatus({ outcome: "queued", reason: { th: "ตรวจสถานะไม่ได้", en: "Status unavailable" } })); }, []);

  const write = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/report/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sections: toSections(d, siteName) }) });
      const j = (await r.json()) as { outcome: string; modelId?: string; results?: Result[]; reason?: LText };
      if (j.results) { setResults(j.results); setModel(j.modelId ?? ""); } else if (j.reason) setStatus({ outcome: "queued", reason: j.reason });
    } finally { setBusy(false); }
  };
  const accept = () => {
    if (!results || !d.sections) return;
    const next = d.sections.map((s) => {
      const r = results.find((x) => x.id === s.id && x.accepted);
      return r ? { ...s, text: { th: r.text, en: s.text.en } } : s;
    });
    onAccept(next, model);
    setResults(null);
  };

  if (!status) return null;
  const ready = status.outcome !== "queued";
  return (
    <div className="ai-writer">
      <div className="row row-center" style={{ justifyContent: "space-between", gap: 8 }}>
        <div className="small"><b>{tx("เขียนด้วย AI", "Write with AI")}</b> · {ready ? tx(`โมเดลที่ผ่านการรับรอง: ${status.modelId}`, `qualified model: ${status.modelId}`) : L(status.reason)}{status.configured && !ready ? ` (${status.configured})` : ""}</div>
        <button type="button" className="btn btn-primary btn-sm" disabled={!ready || busy} onClick={write}>{busy ? tx("กำลังเขียน…", "Writing…") : tx("เขียนแต่ละบทด้วย AI", "Write sections with AI")}</button>
      </div>
      {!ready && <div className="muted tiny" style={{ marginTop: 4 }}>{tx("ร่างนี้มาจากหลักฐานที่ยืนยันแล้วเท่านั้น AI จะเขียนได้เมื่อโมเดลผ่านชุดทดสอบรายงานและมีผู้ทรงคุณวุฒิลงชื่อ — ดูที่หน้า มาตรฐานคุณภาพรายงาน", "This draft comes from verified evidence only. AI writing unlocks once a model passes the report benchmark and a qualified reviewer signs off — see Report Quality.")}</div>}
      {results && (
        <div style={{ marginTop: 8 }}>
          {results.map((r) => (
            <div key={r.id} className={`note ${r.accepted ? "note-ok" : "note-bad"}`} style={{ marginBottom: 6 }}>
              <b>{r.id} · {r.accepted ? tx("ผ่านการตรวจ", "passed the guard") : tx("ไม่ผ่าน — ใช้ข้อความจากหลักฐานเดิม", "rejected — the evidence-only text is kept")}</b>
              {r.error && <div className="tiny">{r.error}</div>}
              {r.grade && !r.accepted && <div className="tiny">{r.grade.checks.filter((c) => !c.pass).map((c) => `${c.id}: ${c.detail}`).join(" · ")}</div>}
              {r.text && <div className="small" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{r.text}</div>}
            </div>
          ))}
          <button type="button" className="btn btn-primary btn-sm" disabled={!results.some((r) => r.accepted)} onClick={accept}>{tx("ใช้บทที่ผ่านการตรวจเป็นฉบับใหม่", "Use the passing sections as a new version")}</button>
        </div>
      )}
    </div>
  );
}
