"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/state/AppState";
import { explain, interpret, nextStepFor, type GlossaryId, type ResultKind } from "@/core/ux/guidance";
import type { WhyAI as WhyAIData } from "@/core/ux/catalog";
import type { Status } from "@/core/types";
import { uxSignal, useUx } from "./useUx";

/* ═══════════════ 24 Core UX Components — small parts (VIBE24 design system) ═══════════════ */

/** §8 ⓘ Explain This — what / why / what it means for you / what to do, from live data. */
export function ExplainThis({ id, label }: { id: GlossaryId; label?: ReactNode }) {
  const { L, tx } = useApp();
  const ctx = useUx();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const pid = useId();
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const x = explain(id, ctx);
  return (
    <span className="explain" ref={ref}>
      <button type="button" className="explain-btn" aria-expanded={open} aria-controls={pid} onClick={() => { setOpen(!open); if (!open) uxSignal("help"); }}>
        <span aria-hidden="true">ⓘ</span> {label ?? L(x.term)}
      </button>
      {open && (
        <span className="explain-pop" id={pid} role="dialog" aria-label={L(x.term)}>
          <span className="explain-term">{L(x.term)}</span>
          <span className="explain-q">{tx("คืออะไร", "What is this?")}</span><span>{L(x.what)}</span>
          <span className="explain-q">{tx("ทำไมสำคัญ", "Why does it matter?")}</span><span>{L(x.why)}</span>
          <span className="explain-q">{tx("หมายความว่าอะไรสำหรับเรา", "What does it mean for us?")}</span><span>{L(x.forYou)}</span>
          <span className="explain-q">{tx("ควรทำอะไร", "What should I do?")}</span><span>{L(x.todo)}</span>
          {x.href && <Link href={x.href} className="btn btn-primary btn-sm" style={{ marginTop: 10, alignSelf: "flex-start" }} onClick={() => setOpen(false)}>{tx("ทำเลย →", "Do it →")}</Link>}
        </span>
      )}
    </span>
  );
}

/** §20 Why did AI choose this? — reasoning, data, assumptions, sources, alternatives. */
export function WhyAI({ why, onAlternative }: { why: WhyAIData; onAlternative?: (missionId: string) => void }) {
  const { L, tx } = useApp();
  const list = (title: string, items: ReactNode[]) => items.length ? (
    <div><div className="label" style={{ marginBottom: 4 }}>{title}</div><ul className="why-list">{items.map((it, i) => <li key={i}>{it}</li>)}</ul></div>
  ) : null;
  return (
    <details className="why" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) uxSignal("help"); }}>
      <summary>{tx("ทำไม AI จึงเลือกสิ่งนี้?", "Why did AI choose this?")}</summary>
      <div className="why-body">
        <p style={{ margin: 0 }}>{L(why.reasoning)}</p>
        {list(tx("ข้อมูลที่ใช้", "Data used"), why.data.map(L))}
        {list(tx("ข้อสมมติ", "Assumptions"), why.assumptions.map(L))}
        {list(tx("แหล่งอ้างอิง", "Sources"), why.sources.map(L))}
        {list(tx("ทางเลือกอื่น", "Alternatives"), why.alternatives.map((a) => onAlternative ? <button key={a.missionId} type="button" className="btn btn-ghost btn-sm" style={{ padding: 0 }} onClick={() => onAlternative(a.missionId)}>{L(a.label)} →</button> : <Link key={a.missionId} href={`/missions?m=${a.missionId}`}>{L(a.label)} →</Link>))}
      </div>
    </details>
  );
}

/** §6 Progressive disclosure: recommended configuration first, expert controls behind “Advanced settings ▾”. */
export function AdvancedSettings({ children, summary }: { children: ReactNode; summary?: ReactNode }) {
  const { tx } = useApp();
  return (
    <details className="advanced" onToggle={() => uxSignal("advanced-toggle")}>
      <summary>{tx("การตั้งค่าขั้นสูง", "Advanced settings")} <span aria-hidden="true">▾</span>{summary && <span className="muted tiny" style={{ marginLeft: 8, fontWeight: 400 }}>{summary}</span>}</summary>
      <div className="advanced-body">{children}</div>
    </details>
  );
}

export type Assist = "myself" | "guide" | "for-me";

/** §7 Do It Myself | Guide Me | Do It For Me. */
export function AssistLevel({ value, onChange, compact }: { value?: Assist; onChange: (a: Assist) => void; compact?: boolean }) {
  const { tx } = useApp();
  const opts: { v: Assist; title: string; sub: string }[] = [
    { v: "myself", title: tx("ทำเอง", "Do it myself"), sub: tx("ใช้เครื่องมือโดยตรง สำหรับผู้เชี่ยวชาญ", "Use the module directly — for experts") },
    { v: "guide", title: tx("แนะนำฉันทีละขั้น", "Guide me"), sub: tx("AI พาทำทีละขั้นและอธิบายการตัดสินใจ", "AI walks you through and explains each decision") },
    { v: "for-me", title: tx("ทำให้ฉัน", "Do it for me"), sub: tx("AI ทำงานแทน ถามคุณเฉพาะข้อมูลที่ขาด การตัดสินใจ และการอนุมัติ", "AI does the work and asks only for missing data, decisions and approvals") },
  ];
  return (
    <div className={`assist${compact ? " assist-compact" : ""}`} role="radiogroup" aria-label={tx("ระดับความช่วยเหลือ", "Assistance level")}>
      {opts.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} className={`assist-opt${value === o.v ? " on" : ""}`} onClick={() => onChange(o.v)}>
          <span className="assist-title">{o.title}</span>
          {!compact && <span className="assist-sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

/** AI working indicator. */
export function AIWorking({ label }: { label?: ReactNode }) {
  const { tx } = useApp();
  return (
    <span className="ai-working" role="status"><span className="ai-dot pulse" aria-hidden="true" />{label ?? tx("AI กำลังทำงาน", "AI working")}</span>
  );
}

/** §12 AI Result Interpreter — never leave a number unexplained. */
export function ResultInterpreter({ kind, compact }: { kind: ResultKind; compact?: boolean }) {
  const { L, tx } = useApp();
  const ctx = useUx();
  const r = interpret(kind, ctx);
  return (
    <div className={`interp interp-${r.verdict}`}>
      <div className="row row-center" style={{ justifyContent: "space-between", gap: 10 }}>
        <span className="heading" style={{ fontSize: compact ? 15 : 17 }}>{L(r.headline)}</span>
        <span className={`tag st-${r.verdict}`}>{L(r.verdictLabel)}</span>
      </div>
      <dl className="interp-grid">
        <dt>{tx("เกิดอะไรขึ้น", "What happened")}</dt><dd>{L(r.happened)}</dd>
        <dt>{tx("หมายความว่า", "What it means")}</dt><dd>{L(r.meaning)}</dd>
        {!compact && <><dt>{tx("เทียบกับเกณฑ์", "How it compares")}</dt><dd>{L(r.compare)}</dd></>}
        <dt>{tx("สาเหตุ", "Why")}</dt><dd>{L(r.why)}</dd>
        <dt>{tx("ควรทำต่อ", "What next")}</dt><dd>{L(r.next)}</dd>
      </dl>
      <Link href={r.fix.href} className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>{L(r.fix.label)}</Link>
    </div>
  );
}

/** §16 Next Best Action strip, shown at the top of every screen. */
export function NextStepBar() {
  const path = usePathname();
  const { L, tx } = useApp();
  const ctx = useUx();
  if (path === "/") return null; // the home screen carries its own Next Best Action
  const n = nextStepFor(path, ctx);
  const here = n.href.split("?")[0] === path;
  return (
    <div className="nextstep" role="note" aria-label={tx("สิ่งที่ควรทำต่อไป", "What to do next")}>
      <span className="nextstep-k">{tx("ต่อไป", "Next")}</span>
      <span className="nextstep-t"><b>{L(n.title)}</b> <span className="muted">— {L(n.why)}</span></span>
      {!here && <Link href={n.href} className="btn btn-primary btn-sm">{L(n.cta)}</Link>}
    </div>
  );
}

/** Progress / data readiness bar with a label. */
export function Readiness({ pct, label }: { pct: number; label: ReactNode }) {
  const k: Status = pct >= 80 ? "ok" : pct >= 50 ? "warn" : "bad";
  return (
    <div className="readiness">
      <div className="row row-center" style={{ justifyContent: "space-between" }}><span className="label">{label}</span><span className={`ink-${k}`} style={{ fontWeight: 700, fontSize: 13 }}>{pct}%</span></div>
      <div className="bar bar-5"><div style={{ width: `${pct}%`, background: `var(--st-${k})` }} /></div>
    </div>
  );
}
