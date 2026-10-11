"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/state/AppState";

export interface AiStatus { provider: string; model: string; connected: boolean; error?: string }

// one request per page load, shared by the header badge and the menu badges
let cache: { at: number; p: Promise<AiStatus> } | null = null;
function fetchStatus(): Promise<AiStatus> {
  if (!cache || Date.now() - cache.at > 5 * 60_000) {
    cache = { at: Date.now(), p: fetch("/api/paul").then((r) => r.json() as Promise<AiStatus>).catch(() => ({ provider: "offline", model: "-", connected: false })) };
  }
  return cache.p;
}

/** Live AI connection status (verified server-side with a token-free model lookup). */
export function useAiStatus(): AiStatus | null {
  const [s, setS] = useState<AiStatus | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => fetchStatus().then((j) => { if (alive) setS(j); });
    load();
    const t = setInterval(load, 5 * 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return s;
}

/**
 * “AI READY” badge beside the COP24 logo. It blinks only when the server has verified the
 * configured AI provider with a real (token-free) model lookup; a missing, wrong or expired
 * key shows as offline or error instead. Clicking it opens Paul.
 */
export function AiReadyBadge() {
  const { tx } = useApp();
  const s = useAiStatus();
  const state = !s ? "checking" : s.connected ? "ready" : s.provider !== "offline" ? "error" : "offline";
  const name = s?.provider === "openai" ? "OpenAI" : s?.provider === "anthropic" ? "Claude" : "";
  const label = state === "ready" ? "AI READY" : state === "error" ? "AI ERROR" : state === "offline" ? "AI OFFLINE" : "AI …";
  const title = state === "ready" ? tx(`เชื่อมต่อ AI แล้ว: ${name} · ${s!.model}`, `AI connected: ${name} · ${s!.model}`)
    : state === "error" ? tx(`ตั้งค่า ${name} แล้วแต่เชื่อมต่อไม่ได้: ${s!.error ?? ""}`, `${name} is configured but not reachable: ${s!.error ?? ""}`)
      : state === "offline" ? tx("ยังไม่ได้เชื่อมต่อ AI — Paul และภารกิจทำงานแบบออฟไลน์", "No AI connected — Paul and missions run offline")
        : tx("กำลังตรวจการเชื่อมต่อ AI", "Checking the AI connection");
  return (
    <button type="button" className={`ai-badge ai-${state}`} title={title} aria-label={title} onClick={() => window.dispatchEvent(new Event("cop24:open-paul"))}>
      <span className="ai-badge-dot" aria-hidden="true" />
      {label}
    </button>
  );
}
