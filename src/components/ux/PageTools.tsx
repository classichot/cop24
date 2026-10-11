"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/state/AppState";
import { SCREENS } from "@/core/ux/acceptance";
import { MISSIONS } from "@/core/ux/catalog";
import { explain, nextStepFor } from "@/core/ux/guidance";
import { PLAYBOOKS, ROUTE_TERMS } from "@/core/ux/playbooks";
import { useUx } from "./useUx";

/**
 * “Explain me” and “Playbook” on every screen, as pop-ups. Explain me says what the page is for,
 * what it does, the terms it uses (from live data) and what to do next; Playbook gives the steps.
 * “Ask Paul” hands the question to the chat assistant for a fuller, AI-written explanation.
 */
export function PageTools() {
  const path = usePathname();
  const { L, tx } = useApp();
  const ctx = useUx();
  const [open, setOpen] = useState<"explain" | "playbook" | null>(null);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);
  const base = "/" + (path.split("/")[1] ?? "");
  const screen = SCREENS.find((s) => s.route === base);
  const playbook = PLAYBOOKS[base];
  if (!screen) return null;
  const next = nextStepFor(base, ctx);
  const terms = (ROUTE_TERMS[base] ?? []).map((id) => explain(id, ctx));
  const guided = MISSIONS.find((m) => m.module === base && m.id !== "start");
  const askPaul = () => {
    setOpen(null);
    window.dispatchEvent(new CustomEvent("cop24:open-paul", { detail: { text: tx(`อธิบายหน้า “${L(screen.name)}” ให้ฟังหน่อย ใช้ทำอะไร และควรเริ่มอย่างไร`, `Explain the “${L(screen.name)}” page to me — what it's for and how to start`), mode: "help" } }));
  };

  return (
    <>
      <div className="page-tools">
        <button type="button" className="pt-btn" onClick={() => setOpen("explain")}><span aria-hidden="true">ⓘ</span> {tx("อธิบายหน้านี้", "Explain me")}</button>
        {playbook && <button type="button" className="pt-btn" onClick={() => setOpen("playbook")}><span aria-hidden="true">▶</span> {tx("คู่มือขั้นตอน", "Playbook")}</button>}
      </div>
      {open && (
        <div className="dialog-backdrop pt-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="dialog pt-dialog" role="dialog" aria-modal="true" aria-label={open === "explain" ? tx("อธิบายหน้านี้", "Explain me") : tx("คู่มือขั้นตอน", "Playbook")}>
            <div className="row row-center" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="kicker">{open === "explain" ? tx("อธิบายหน้านี้", "Explain me") : tx("คู่มือขั้นตอน", "Playbook")}</div>
                <div className="dialog-title">{L(screen.name)}</div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(null)} aria-label={tx("ปิด", "Close")}>✕</button>
            </div>
            {open === "explain" ? (
              <div className="pt-body">
                <div><div className="label">{tx("หน้านี้มีไว้ทำอะไร", "What this page is for")}</div><p>{L(screen.experience)}</p></div>
                <div><div className="label">{tx("ทำอะไรได้บ้าง", "What it can do")}</div><p>{L(screen.capability)}</p></div>
                {terms.length > 0 && (
                  <div><div className="label">{tx("คำที่ควรรู้ — จากข้อมูลจริงของคุณ", "Terms to know — from your own data")}</div>
                    {terms.map((x) => <p key={x.term.en}><b>{L(x.term)}</b> — {L(x.what)} <span className="muted">{L(x.forYou)}</span></p>)}
                  </div>
                )}
                <div className="pt-next"><div className="label">{tx("ควรทำอะไรต่อ", "What to do next")}</div><b>{L(next.title)}</b> <span className="muted small">— {L(next.why)}</span>
                  <div><Link href={next.href} className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => setOpen(null)}>{L(next.cta)}</Link></div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm btn-plain" onClick={askPaul}>{tx("ถาม Paul ให้อธิบายเพิ่ม →", "Ask Paul to explain more →")}</button>
              </div>
            ) : (
              <div className="pt-body">
                <ol className="pt-steps">{playbook!.steps.map((s, i) => <li key={i}><span className="pt-n">{i + 1}</span><span>{L(s)}</span></li>)}</ol>
                {playbook!.tips?.map((tp, i) => <div key={i} className="note note-ok">{L(tp)}</div>)}
                <div className="row" style={{ gap: 8 }}>
                  {guided && <Link href={`/missions?m=${guided.id}&assist=guide`} className="btn btn-primary btn-sm" onClick={() => setOpen(null)}>{tx("ให้ AI แนะนำทีละขั้น →", "Guide me step by step →")}</Link>}
                  <button type="button" className="btn btn-secondary btn-sm btn-plain" onClick={askPaul}>{tx("ถาม Paul", "Ask Paul")}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
