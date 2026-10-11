"use client";

import { useApp } from "@/state/AppState";
import { PageHead } from "@/components/ui";
import { startDemo } from "@/components/ux/DemoTour";
import { MANUAL, MANUAL_VERSION } from "@/data/manual";

/** The user manual (demo edition) — printable, with “Show me” links into demo mode. */
export default function ManualPage() {
  const { L, tx } = useApp();
  return (
    <div className="page page-mid manual">
      <PageHead kicker={tx("คู่มือผู้ใช้ / USER MANUAL", "User manual")} title={tx("คู่มือการใช้งาน COP24", "How to use COP24")} lead={tx("อ่านทีละหัวข้อ หรือกด “ดูให้ฉันดู” เพื่อให้โหมดเดโมพาไปที่หน้าจอนั้นและสาธิตให้", "Read section by section, or press “Show me” and demo mode takes you to that screen and demonstrates it.")} />
      <div className="row manual-actions" style={{ gap: 8, marginTop: 14 }}>
        <button type="button" className="btn btn-primary" onClick={() => startDemo()}>▶ {tx("เริ่มเดโมนำชม", "Start the guided demo")}</button>
        <button type="button" className="btn btn-secondary btn-plain" onClick={() => window.print()}>{tx("พิมพ์ / บันทึกเป็น PDF", "Print / save as PDF")}</button>
      </div>
      <nav className="manual-toc" aria-label={tx("สารบัญ", "Contents")}>
        {MANUAL.map((s) => <a key={s.id} href={`#m-${s.id}`}>{L(s.title)}</a>)}
      </nav>
      {MANUAL.map((s) => (
        <section key={s.id} id={`m-${s.id}`} className="manual-sec">
          <div className="row row-center" style={{ justifyContent: "space-between", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>{L(s.title)}</h2>
            {s.tour && <button type="button" className="btn btn-secondary btn-sm btn-plain manual-show" onClick={() => startDemo(s.tour)}>▶ {tx("ดูให้ฉันดู", "Show me")}</button>}
          </div>
          <p>{L(s.intro)}</p>
          {s.steps && <ol className="pt-steps">{s.steps.map((x, i) => <li key={i}><span className="pt-n">{i + 1}</span><span>{L(x)}</span></li>)}</ol>}
          {s.notes?.map((n, i) => <div key={i} className="note note-ok" style={{ marginTop: 10 }}>{L(n)}</div>)}
        </section>
      ))}
      <p className="muted tiny" style={{ marginTop: 24 }}>{MANUAL_VERSION}</p>
    </div>
  );
}
