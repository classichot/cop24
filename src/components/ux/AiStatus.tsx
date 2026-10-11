"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/state/AppState";

export interface AiStatus { provider: string; model: string; connected: boolean; error?: string }

/**
 * “AI READY” badge beside the COP24 logo. It blinks only when the server has verified the
 * configured AI provider with a real (token-free) model lookup; a missing, wrong or expired
 * key shows as offline or error instead. Clicking it opens Paul.
 */
export function AiReadyBadge() {
  const { tx } = useApp();
  const [s, setS] = useState<AiStatus | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/paul").then((r) => r.json()).then((j: AiStatus) => { if (alive) setS(j); }).catch(() => { if (alive) setS({ provider: "offline", model: "-", connected: false }); });
    load();
    const t = setInterval(load, 5 * 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

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
