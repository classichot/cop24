"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { useApp } from "@/state/AppState";
import { PageHead } from "@/components/ui";
import { menuItem } from "@/components/AppShell";
import { startDemo } from "@/components/ux/DemoTour";
import { APP_JOURNEY, type JourneyKind } from "@/core/ux/app-journey";

/** The app journey — which menu to start on, which comes next, and which one finishes the job. */
const KEY = "cop24.journey.v1";
const loadDone = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]; } catch { return []; } };

export default function JourneyPage() {
  const { L, tx } = useApp();
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { queueMicrotask(() => setDone(loadDone())); }, []);
  const toggle = (route: string) => {
    const next = done.includes(route) ? done.filter((r) => r !== route) : [...done, route];
    setDone(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };
  const current = APP_JOURNEY.find((s) => !done.includes(s.route));
  const menu = (href: string) => { const m = menuItem(href); return m ? { num: m.num, name: L(m) } : { num: "", name: href }; };
  const marker = (kind: JourneyKind, i: number) => kind === "start" ? tx("เริ่ม", "START") : kind === "finish" ? tx("จบ", "FINISH") : String(i + 1);

  return (
    <div className="page page-mid">
      <PageHead kicker={tx("เส้นทางการใช้งาน / APP JOURNEY", "App journey")} title={tx("เริ่มที่ไหน ต่อไปไหน และจบที่ไหน", "Where to start, what comes next, where it finishes")} lead={tx("รายงาน CoP หนึ่งฉบับเดินตามเส้นทางเดียว 8 ขั้น จากเมนูเริ่มต้นถึงเมนูสุดท้าย ในเมนูซ้ายแต่ละขั้นมีป้าย เริ่ม · 2–7 · จบ และทุกหน้าบนเส้นทางบอกเมนูก่อนหน้าและเมนูถัดไป", "One CoP report follows one path of 8 stages, from the start menu to the finish menu. In the left menu each stage carries a START · 2–7 · FINISH marker, and every page on the path shows the menu before it and the menu after it.")} />

      <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        {current ? (
          <Link href={current.route} className="btn btn-primary">{done.length ? tx("ทำต่อ", "Continue") : tx("เริ่มที่เมนูเริ่มต้น", "Begin at the start menu")}: {menu(current.route).num} {menu(current.route).name} →</Link>
        ) : <span className="note note-ok" style={{ margin: 0 }}>✓ {tx("ครบทุกขั้นแล้ว", "Every stage is done")}</span>}
        <button type="button" className="btn btn-secondary btn-plain" onClick={() => startDemo("journey")}>▶ {tx("ดูให้ฉันดูในเดโม", "Show me in the demo")}</button>
        {done.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setDone([]); try { localStorage.removeItem(KEY); } catch {} }}>{tx("ล้างความคืบหน้า", "Reset progress")}</button>}
      </div>

      {/* the whole path at a glance */}
      <ol className="jmap-line" aria-label={tx("ภาพรวมเส้นทาง", "The path at a glance")}>
        {APP_JOURNEY.map((s, i) => (
          <Fragment key={s.route}>
            {i > 0 && <li className="jmap-arrow" aria-hidden="true">→</li>}
            <li>
              <a href={`#j-${i + 1}`} className={`jmap-chip jmap-${s.kind}${done.includes(s.route) ? " done" : ""}${current?.route === s.route ? " here" : ""}`}>
                <span className={`nav-jr nav-jr-${s.kind}`}>{marker(s.kind, i)}</span>
                <span>{menu(s.route).num} {menu(s.route).name}</span>
              </a>
            </li>
          </Fragment>
        ))}
      </ol>

      {/* the path in detail */}
      <ol className="journey-map">
        {APP_JOURNEY.map((s, i) => {
          const m = menu(s.route);
          const isDone = done.includes(s.route);
          return (
            <li key={s.route} id={`j-${i + 1}`} className={`jnode jnode-${s.kind}${isDone ? " done" : ""}${current?.route === s.route ? " here" : ""}`}>
              <span className="jnode-dot" aria-hidden="true">{isDone ? "✓" : s.kind === "start" ? "▶" : s.kind === "finish" ? "■" : i + 1}</span>
              <div className="jnode-card">
                <div className="row row-center" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div className="row row-center" style={{ gap: 8, flexWrap: "wrap" }}>
                    <span className={`nav-jr nav-jr-${s.kind}`}>{s.kind === "start" ? tx("เมนูเริ่มต้น", "START MENU") : s.kind === "finish" ? tx("เมนูสุดท้าย", "FINISH MENU") : tx(`ขั้น ${i + 1}`, `STEP ${i + 1}`)}</span>
                    <b style={{ fontSize: 17 }}>{L(s.stage)}</b>
                  </div>
                  {current?.route === s.route && <span className="jnode-here">{tx("คุณอยู่ตรงนี้", "You are here")}</span>}
                </div>
                <div className="jnode-menu">{tx("เมนู", "Menu")} <b>{m.num}</b> · {m.name}</div>
                <div className="jnode-grid">
                  <div><div className="label">{tx("ทำอะไรที่นี่", "What you do here")}</div><div>{L(s.doHere)}</div></div>
                  <div><div className="label">{tx("ไปขั้นถัดไปเมื่อ", "Move on when")}</div><div>{L(s.doneWhen)}</div></div>
                </div>
                {s.helpers && (
                  <div className="jnode-help"><span className="muted tiny">{tx("เมนูช่วย", "Helper menus")}:</span>
                    {s.helpers.map((h) => { const hm = menu(h); return h.startsWith("#") ? <span key={h} className="tag">{hm.num} {hm.name}</span> : <Link key={h} href={h} className="tag">{hm.num} {hm.name}</Link>; })}
                  </div>
                )}
                <div className="row row-center" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <Link href={s.route} className="btn btn-primary btn-sm">{tx("เปิดเมนู", "Open menu")} {m.num} →</Link>
                  <label className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={isDone} onChange={() => toggle(s.route)} />{tx("ขั้นนี้เสร็จแล้ว", "This stage is done")}</label>
                  {i + 1 < APP_JOURNEY.length && <span className="muted tiny">{tx("ถัดไป", "Next")}: {menu(APP_JOURNEY[i + 1].route).num} {menu(APP_JOURNEY[i + 1].route).name}</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="muted small" style={{ marginTop: 18 }}>{tx("เมนูอื่นที่ไม่อยู่บนเส้นทางเป็นเครื่องมือเสริม ใช้เมื่อจำเป็น เช่น Paul ปฏิทิน และภารกิจ AGI ความคืบหน้าที่ทำเครื่องหมายไว้เก็บในเบราว์เซอร์นี้เท่านั้น", "Menus not on the path are tools you use when needed, such as Paul, the calendar and AGI missions. The progress you tick is kept in this browser only.")}</p>
    </div>
  );
}
