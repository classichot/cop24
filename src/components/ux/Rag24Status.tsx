"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/state/AppState";

export interface Rag24Status { configured: boolean; stage: "disabled" | "search_pilot" | "workflows"; pack: string; host: string | null; reachable: boolean | null }

// one request per page load, shared by the header badge and the Legal Corpus panel
let cache: { at: number; p: Promise<Rag24Status | null> } | null = null;
function fetchStatus(): Promise<Rag24Status | null> {
  if (!cache || Date.now() - cache.at > 5 * 60_000) {
    cache = { at: Date.now(), p: fetch("/api/rag24").then((r) => r.json() as Promise<Rag24Status>).catch(() => null) };
  }
  return cache.p;
}

/** RAG24 connection status (server-side readiness probe; never the key). */
export function useRag24Status(): Rag24Status | null | undefined {
  const [s, setS] = useState<Rag24Status | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const load = () => fetchStatus().then((j) => { if (alive) setS(j); });
    load();
    const t = setInterval(load, 5 * 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return s;
}

const GlobeIcon = () => (
  <svg className="rag-badge-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M2.5 12h19M12 2.5c2.6 2.8 3.9 6 3.9 9.5s-1.3 6.7-3.9 9.5c-2.6-2.8-3.9-6-3.9-9.5s1.3-6.7 3.9-9.5z" />
  </svg>
);

/**
 * RAG24 badge beside “AI READY”: a globe that appears once COP24 is connected to the 24 Series shared
 * evidence service (configured, switched on and answering its readiness probe). Configured but
 * unreachable shows in red; not configured or switched off shows nothing. Opens the RAG24 search.
 */
export function Rag24Badge({ asLink = true }: { asLink?: boolean }) {
  const { tx } = useApp();
  const s = useRag24Status();
  if (!s || !s.configured || s.stage === "disabled") return null;
  const up = s.reachable === true;
  const stage = s.stage === "search_pilot" ? tx("นำร่องค้นหา", "search pilot") : tx("เวิร์กโฟลว์", "workflows");
  const title = up
    ? tx(`เชื่อมต่อ RAG24 แล้ว · ${stage} · ${s.host} — หลักฐานร่วมที่อนุมัติแล้ว`, `Connected to RAG24 · ${stage} · ${s.host} — approved shared evidence`)
    : tx(`ตั้งค่า RAG24 แล้วแต่ติดต่อไม่ได้ (${s.host}) — COP24 ใช้คลังกฎหมายของตัวเอง`, `RAG24 is configured but not reachable (${s.host}) — COP24 uses its own corpus`);
  const body = <><GlobeIcon />RAG24</>;
  const cls = `rag-badge ${up ? "rag-on" : "rag-down"}`;
  return asLink
    ? <Link href="/corpus#rag24" className={cls} title={title} aria-label={title}>{body}</Link>
    : <span className={cls} title={title} aria-label={title}>{body}</span>;
}
