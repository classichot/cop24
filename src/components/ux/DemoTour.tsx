"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/state/AppState";
import { TOUR, tourIndex } from "@/core/ux/tour";

const KEY = "cop24.demo.v1";
type Saved = { active: boolean; step: number; auto: boolean };
const load = (): Saved => { try { return { active: false, step: 0, auto: false, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { active: false, step: 0, auto: false }; } };
const save = (s: Saved) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

/** True while demo mode is driving the app — its page hops are not a person's behaviour. */
export const demoActive = () => load().active;

/** Start the guided demo from anywhere, optionally at a named step. */
export const startDemo = (stepId?: string) => {
  save({ active: true, step: stepId ? tourIndex(stepId) : 0, auto: false });
  window.dispatchEvent(new Event("cop24:demo"));
};

function findTarget(selector?: string, text?: RegExp): HTMLElement | null {
  if (!selector) return null;
  const all = [...document.querySelectorAll<HTMLElement>(selector)].filter((e) => e.offsetParent !== null || e.getClientRects().length);
  return (text ? all.find((e) => text.test(e.textContent ?? "")) : all[0]) ?? null;
}

/**
 * Demo mode: spotlights each control on the real pages, explains it, moves between pages and
 * performs key actions (load the sample, generate a report) so a viewer sees COP24 working.
 */
export function DemoTour() {
  const path = usePathname();
  const router = useRouter();
  const { L, tx } = useApp();
  const [st, setSt] = useState<Saved>({ active: false, step: 0, auto: false });
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [acting, setActing] = useState(false);
  const acted = useRef<Set<number>>(new Set());
  const target = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sync = () => setSt(load());
    // a (re)start performs the demo's actions again, even if an earlier run already did them
    const restart = () => { acted.current.clear(); sync(); };
    queueMicrotask(sync);
    window.addEventListener("cop24:demo", restart);
    return () => window.removeEventListener("cop24:demo", restart);
  }, []);
  const update = useCallback((s: Saved) => { save(s); setSt(s); }, []);
  const step = TOUR[Math.min(st.step, TOUR.length - 1)];

  // go to the step's page, wait for its element, spotlight it, and act if the step says so
  useEffect(() => {
    if (!st.active) return;
    if (path !== step.route) { router.push(step.route); return; }
    let tries = 0, cancelled = false;
    const locate = () => {
      if (cancelled) return;
      const el = findTarget(step.selector, step.text);
      if (!el && step.selector && tries++ < 30) { setTimeout(locate, 150); return; }
      target.current = el;
      if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); setTimeout(() => !cancelled && setRect(el.getBoundingClientRect()), 350); }
      else setRect(null);
      if (el && step.act === "click" && !acted.current.has(st.step)) {
        acted.current.add(st.step);
        setActing(true);
        setTimeout(() => { if (!cancelled) { el.click(); setActing(false); setTimeout(() => !cancelled && setRect(el.getBoundingClientRect()), 400); } }, 1100);
      }
    };
    locate();
    return () => { cancelled = true; };
  }, [st.active, st.step, path, step, router]);

  // keep the spotlight on the element while the page scrolls or resizes
  useEffect(() => {
    if (!st.active) return;
    const re = () => { if (target.current) setRect(target.current.getBoundingClientRect()); };
    window.addEventListener("scroll", re, true);
    window.addEventListener("resize", re);
    return () => { window.removeEventListener("scroll", re, true); window.removeEventListener("resize", re); };
  }, [st.active]);

  const go = useCallback((d: number) => {
    const n = st.step + d;
    if (n >= TOUR.length) { update({ ...st, active: false, step: 0 }); setRect(null); return; }
    update({ ...st, step: Math.max(0, n) });
    setRect(null);
  }, [st, update]);

  useEffect(() => {
    if (!st.active) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") update({ ...st, active: false }); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [st, go, update]);

  // auto-play: a new step every 7 seconds
  useEffect(() => {
    if (!st.active || !st.auto) return;
    const tm = setTimeout(() => go(1), 7000);
    return () => clearTimeout(tm);
  }, [st.active, st.auto, st.step, go]);

  if (!st.active) return null;
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const cardW = Math.min(380, vw - 24);
  const below = rect ? rect.bottom + 14 + 220 < vh : true;
  const top = rect ? (below ? rect.bottom + 14 : Math.max(12, rect.top - 14 - 230)) : vh / 2 - 130;
  const left = rect ? Math.min(Math.max(12, rect.left), vw - cardW - 12) : vw / 2 - cardW / 2;

  return (
    <div className="demo-layer" aria-live="polite">
      {rect ? (
        <div className="demo-spot" style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }} />
      ) : <div className="demo-dim" />}
      <div className="demo-card" role="dialog" aria-label={tx("โหมดเดโม", "Demo mode")} style={{ top, left, width: cardW }}>
        <div className="row row-center" style={{ justifyContent: "space-between", gap: 8 }}>
          <span className="kicker">{tx("โหมดเดโม", "Demo mode")} · {st.step + 1}/{TOUR.length}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ ...st, active: false })}>{tx("ออกจากเดโม", "Exit demo")}</button>
        </div>
        <div className="heading" style={{ fontSize: 17, marginTop: 4 }}>{L(step.title)}</div>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55 }}>{L(step.body)}</p>
        {acting && <div className="small ink-ok" style={{ marginTop: 6 }}>▶ {tx("เดโมกำลังทำขั้นนี้ให้…", "The demo is doing this for you…")}</div>}
        <div className="bar bar-thin" style={{ marginTop: 10 }}><div style={{ width: `${((st.step + 1) / TOUR.length) * 100}%`, background: "var(--color-accent)" }} /></div>
        <div className="row row-center" style={{ justifyContent: "space-between", marginTop: 10, gap: 8 }}>
          <label className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={st.auto} onChange={(e) => update({ ...st, auto: e.target.checked })} />{tx("เล่นอัตโนมัติ", "Auto-play")}</label>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn btn-secondary btn-sm btn-plain" disabled={st.step === 0} onClick={() => go(-1)}>{tx("ย้อนกลับ", "Back")}</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => go(1)}>{st.step + 1 === TOUR.length ? tx("จบ", "Finish") : tx("ถัดไป →", "Next →")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
