"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/state/AppState";
import { detectStruggle, SIGNAL_LABEL, type GuardEvent, type GuardResult } from "@/core/ux/guard";
import { useUx } from "./useUx";

const KEY = "cop24.guard.v1";
const SNOOZE = "cop24.guard.snooze";
const SNOOZE_MS = 10 * 60_000;

const load = (): GuardEvent[] => { try { return JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as GuardEvent[]; } catch { return []; } };
const save = (ev: GuardEvent[]) => { try { sessionStorage.setItem(KEY, JSON.stringify(ev.slice(-80))); } catch {} };

/**
 * §11 24 Complexity Guard. Records navigation and struggle signals for this browser session
 * only, and offers contextual, dismissible help inline — never a popup, never sent anywhere.
 */
export function ComplexityGuard() {
  const path = usePathname();
  const { L, tx } = useApp();
  const ctx = useUx();
  const [result, setResult] = useState<GuardResult | null>(null);
  const lastActivity = useRef(0);

  useEffect(() => {
    const evaluate = () => {
      let snoozed = 0;
      try { snoozed = Number(sessionStorage.getItem(SNOOZE) ?? 0); } catch {}
      const now = Date.now();
      if (now < snoozed) { setResult(null); return; }
      setResult(detectStruggle(load(), now, lastActivity.current || now));
    };
    const push = (e: GuardEvent) => { save([...load(), e]); evaluate(); };
    const onSignal = (e: Event) => push({ kind: (e as CustomEvent).detail, at: Date.now() } as GuardEvent);
    let last = 0;
    const onActive = () => { const n = Date.now(); if (n - last > 2000) { last = n; lastActivity.current = n; } };
    lastActivity.current = Date.now();
    push({ kind: "visit", route: path, at: Date.now() });
    window.addEventListener("cop24:ux", onSignal);
    window.addEventListener("pointermove", onActive);
    window.addEventListener("keydown", onActive);
    const timer = setInterval(evaluate, 20_000);
    return () => {
      window.removeEventListener("cop24:ux", onSignal);
      window.removeEventListener("pointermove", onActive);
      window.removeEventListener("keydown", onActive);
      clearInterval(timer);
    };
  }, [path]);

  if (!result?.show) return null;
  const m = result.mission;
  const dismiss = () => { try { sessionStorage.setItem(SNOOZE, String(Date.now() + SNOOZE_MS)); } catch {} setResult(null); };
  return (
    <div className="guard" role="region" aria-label={tx("ความช่วยเหลือ", "Help")}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="heading" style={{ fontSize: 15 }}>{tx("ต้องการให้ช่วยไหม?", "Need some help?")}</div>
        <div className="small" style={{ marginTop: 2 }}>
          {m ? tx(`ดูเหมือนคุณกำลังทำ “${m.title(ctx).th}” — COP24 ตั้งค่าแนวทางที่แนะนำให้ได้`, `It looks like you're trying to ${L(m.title(ctx)).replace(/^./, (c) => c.toLowerCase())}. COP24 can set up the recommended approach for you.`) : tx("COP24 พาไปยังสิ่งที่ต้องการได้ บอกเป้าหมายเป็นภาษาธรรมดา", "COP24 can take you there — just say what you want to achieve.")}
        </div>
        <div className="muted tiny" style={{ marginTop: 3 }}>{tx("สังเกตจาก", "Noticed")}: {result.signals.map((s) => L(SIGNAL_LABEL[s])).join(" · ")}</div>
      </div>
      <div className="row" style={{ gap: 6 }}>
        {m && <Link href={`/missions?m=${m.id}&assist=guide`} className="btn btn-secondary btn-sm btn-plain" onClick={dismiss}>{tx("แนะนำฉัน", "Guide me")}</Link>}
        {m && <Link href={m.forMe === "/ingest" ? "/ingest" : `/missions?m=${m.id}&assist=for-me`} className="btn btn-primary btn-sm" onClick={dismiss}>{tx("ทำให้ฉัน", "Do it for me")}</Link>}
        <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>{tx("ไม่ต้อง", "Dismiss")}</button>
      </div>
    </div>
  );
}
