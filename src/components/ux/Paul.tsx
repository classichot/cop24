"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/state/AppState";
import type { PaulAction, PaulMode, Triage } from "@/core/paul/paul";
import { addFeedback, updateFeedback } from "@/lib/feedback";
import { authHeaders } from "@/lib/access";
import { uxSignal, useUx } from "./useUx";

/* ═══════════════ Paul — the COP24 chat assistant ═══════════════
   1 · how to use COP24 · 2 · legal consultant for CoP projects · 3 · feedback that improves COP24 */

interface Source { id: string; cite: string; title: string; url?: string; excerpt: string; origin?: "rag24" }
interface Rag24Meta { status: string; stage: string; count: number }
interface Msg {
  role: "user" | "assistant";
  content: string;
  mode?: PaulMode;
  provider?: string;
  model?: string;
  sources?: Source[];
  rag24?: Rag24Meta;
  actions?: PaulAction[];
  triage?: Triage;
  note?: string;
  feedbackId?: string;
  forwarded?: { ok: boolean; url?: string };
}

const STORE = "cop24.paul.v1";
type Pick = "auto" | PaulMode;

export function Paul() {
  const { tx, lang, role } = useApp();
  const ctx = useUx();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<Pick>("auto");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<{ provider: string; model: string; connected?: boolean } | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    queueMicrotask(() => { try { const s = sessionStorage.getItem(STORE); if (s) setMsgs(JSON.parse(s) as Msg[]); } catch {} });
  }, []);
  // the AI READY badge in the header opens Paul
  useEffect(() => {
    const openPaul = (e: Event) => {
      setOpen(true);
      const d = (e as CustomEvent<{ text?: string; mode?: PaulMode }>).detail;
      if (d?.text) setInput(d.text);
      if (d?.mode) setPick(d.mode);
    };
    window.addEventListener("cop24:open-paul", openPaul);
    return () => window.removeEventListener("cop24:open-paul", openPaul);
  }, []);
  useEffect(() => { try { sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-40))); } catch {} end.current?.scrollIntoView({ block: "end" }); }, [msgs]);
  useEffect(() => {
    if (!open) return;
    box.current?.focus();
    if (!provider) fetch("/api/paul").then((r) => r.json()).then(setProvider).catch(() => setProvider({ provider: "offline", model: "rules" }));
  }, [open, provider]);

  const patchLast = (fn: (m: Msg) => Msg) => setMsgs((all) => all.map((m, i) => (i === all.length - 1 ? fn(m) : m)));

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...msgs, { role: "user" as const, content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    let meta: Partial<Msg> = {};
    try {
      const res = await fetch("/api/paul", { method: "POST", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, content: m.content })), mode: pick === "auto" ? undefined : pick, lang, route: path, ctx }) });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as { type: string; text?: string; message?: string } & Partial<Msg>;
          if (ev.type === "meta") { meta = { mode: ev.mode, provider: ev.provider, model: ev.model, sources: ev.sources, rag24: ev.rag24, actions: ev.actions, triage: ev.triage }; patchLast((m) => ({ ...m, ...meta })); }
          else if (ev.type === "delta") patchLast((m) => ({ ...m, content: m.content + (ev.text ?? "") }));
          else if (ev.type === "provider-error") patchLast((m) => ({ ...m, note: tx(`AI ขัดข้อง (${ev.message}) — ตอบแบบออฟไลน์แทน`, `AI unavailable (${ev.message}) — answered offline instead`) }));
        }
      }
    } catch (e) {
      patchLast((m) => ({ ...m, content: tx("ขออภัย ติดต่อ Paul ไม่ได้ในขณะนี้", "Sorry — Paul could not be reached just now."), note: String(e) }));
    }
    setBusy(false);

    // job 3: feedback becomes an improvement item, forwarded to the team when configured
    if (meta.mode === "feedback" && meta.triage) {
      const id = `FB-${Date.now().toString(36)}`;
      addFeedback({ id, at: new Date().toISOString(), text: q, route: path, role, triage: meta.triage, forwarded: false, status: "open" });
      patchLast((m) => ({ ...m, feedbackId: id }));
      try {
        const r = await fetch("/api/paul/feedback", { method: "POST", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify({ text: q, route: path, lang, role }) });
        const j = (await r.json()) as { forwarded: boolean; url?: string };
        updateFeedback(id, { forwarded: j.forwarded, url: j.url });
        patchLast((m) => ({ ...m, forwarded: { ok: j.forwarded, url: j.url } }));
      } catch {}
    }
  };

  const suggestions: Record<PaulMode, string[]> = {
    help: [tx("จะนำเข้าเอกสารทั้งโฟลเดอร์ทำอย่างไร", "How do I import a whole folder of documents?"), tx("ทำรายงาน CoP ขั้นต้นต้องเริ่มตรงไหน", "Where do I start the preliminary CoP report?"), tx("โหมดง่ายกับโหมดมืออาชีพต่างกันอย่างไร", "What's the difference between Easy and Pro mode?")],
    legal: [tx("ต้องยื่นรายงาน CoP ขั้นต้นเมื่อไร", "When must the preliminary CoP report be filed?"), tx("การรับฟังความคิดเห็นของโครงการโซลาร์ต้องทำอย่างไร", "What are the public hearing requirements for a solar project?"), tx("โซลาร์ฟาร์มต้องวัดเสียงพื้นฐานอย่างไร", "Does a solar farm need a noise baseline, and how?")],
    feedback: [tx("หน้านี้ใช้ยากตรงที่…", "This screen is confusing because…"), tx("อยากให้ COP24 มี…", "I wish COP24 could…"), tx("พบปัญหา: กดแล้ว…", "Bug: when I click…")],
  };
  const shownMode: PaulMode = pick === "auto" ? "help" : pick;
  const providerLabel = !provider ? "…" : provider.provider === "offline" ? tx("ออฟไลน์ · ตอบจากคลังข้อมูล ไม่มี AI", "Offline · answers from COP24's own data, no AI") : provider.connected === false ? tx(`ตั้งค่า ${provider.provider} แล้วแต่เชื่อมต่อไม่ได้ — ตอบแบบออฟไลน์`, `${provider.provider} configured but not reachable — answering offline`) : `${provider.provider === "openai" ? "OpenAI" : "Claude"} · ${provider.model}`;

  if (!open) {
    return (
      <button type="button" className="paul-fab" onClick={() => { setOpen(true); uxSignal("help"); }} aria-label={tx("เปิดแชทกับ Paul", "Chat with Paul")}>
        <span className="paul-avatar" aria-hidden="true">P</span>
        <span className="paul-fab-text"><b>{tx("ถาม Paul", "Ask Paul")}</b><small>{tx("วิธีใช้ · กฎหมาย CoP · ข้อเสนอแนะ", "How-to · CoP law · Feedback")}</small></span>
      </button>
    );
  }

  return (
    <section className="paul" role="dialog" aria-label="Paul">
      <header className="paul-head">
        <span className="paul-avatar" aria-hidden="true">P</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="heading" style={{ fontSize: 16 }}>Paul</div>
          <div className="muted tiny">{tx("ผู้ช่วย COP24 · ที่ปรึกษากฎหมาย CoP · รับข้อเสนอแนะ", "COP24 helper · CoP legal consultant · feedback")}</div>
        </div>
        {msgs.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMsgs([])}>{tx("เริ่มใหม่", "New chat")}</button>}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)} aria-label={tx("ปิด", "Close")}>✕</button>
      </header>

      <div className="paul-modes" role="radiogroup" aria-label={tx("เรื่องที่ถาม", "Topic")}>
        {([["auto", tx("อัตโนมัติ", "Auto")], ["help", tx("1 · วิธีใช้แอป", "1 · Using the app")], ["legal", tx("2 · กฎหมาย CoP", "2 · CoP law")], ["feedback", tx("3 · ข้อเสนอแนะ", "3 · Feedback")]] as [Pick, string][]).map(([v, label]) => (
          <button key={v} type="button" role="radio" aria-checked={pick === v} className={`chip${pick === v ? " on" : ""}`} onClick={() => setPick(v)}>{label}</button>
        ))}
      </div>

      <div className="paul-log" aria-live="polite">
        {msgs.length === 0 && (
          <div className="paul-hello">
            <p style={{ margin: 0 }}>{tx("สวัสดีครับ ผม Paul ถามได้ 3 เรื่อง: วิธีใช้ COP24 · ข้อกฎหมายของโครงการ CoP (อ้างอิงระเบียบ กกพ. ทุกครั้ง) · และบอกผมได้ว่าอะไรควรปรับปรุง", "Hi, I'm Paul. Ask me how to use COP24, about the law for your CoP project (I always cite the ERC rules), or tell me what should be better.")}</p>
            <div className="goal-cards">{suggestions[shownMode].map((s) => <button key={s} type="button" className="goal-card" onClick={() => (s.endsWith("…") ? setInput(s.replace(/…$/, " ")) : void send(s))}>{s}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`paul-msg paul-${m.role}`}>
            {m.role === "assistant" && m.mode && <div className="paul-tag">{m.mode === "legal" ? tx("กฎหมาย CoP", "CoP law") : m.mode === "feedback" ? tx("ข้อเสนอแนะ", "Feedback") : tx("วิธีใช้", "How-to")}</div>}
            <div className="paul-text">{m.content ? renderText(m.content) : <span className="pulse muted">{tx("Paul กำลังพิมพ์…", "Paul is typing…")}</span>}</div>
            {m.sources && m.sources.length > 0 && (
              <details className="paul-sources">
                <summary>{tx(`แหล่งอ้างอิง ${m.sources.length} ตอน`, `${m.sources.length} sources`)}</summary>
                {m.sources.map((s, j) => (
                  <div key={s.id} className={`paul-source${s.origin === "rag24" ? " paul-source-rag24" : ""}`}><b>[{j + 1}] {s.cite}</b><div className="muted tiny">{s.title}</div><div className="paul-excerpt">{s.excerpt}{s.excerpt.length >= 600 ? "…" : ""}</div></div>
                ))}
              </details>
            )}
            {m.rag24 && m.rag24.status !== "not_configured" && m.rag24.status !== "disabled" && (
              <div className="muted tiny" style={{ marginTop: 4 }}>RAG24 · {m.rag24.status === "evidence_available" ? tx(`หลักฐานร่วม ${m.rag24.count} ตอน`, `${m.rag24.count} shared passage(s)`) : m.rag24.status === "missing_evidence" ? tx("ไม่พบหลักฐานร่วม", "no shared evidence found") : tx("ไม่พร้อมใช้งาน — ตอบจากคลังของ COP24", "unavailable — answered from COP24's own corpus")}</div>
            )}
            {m.triage && <div className="paul-triage">{tx("บันทึกแล้ว", "Logged")}: <b>{m.triage.category}</b> · {m.triage.severity} · {m.triage.screen}{m.forwarded ? (m.forwarded.ok ? <> · <a href={m.forwarded.url} target="_blank" rel="noreferrer">{tx("ส่งถึงทีมแล้ว", "sent to the team")}</a></> : <> · {tx("เก็บในเบราว์เซอร์นี้", "kept in this browser")}</>) : null}</div>}
            {m.actions && m.actions.length > 0 && <div className="row" style={{ gap: 6, marginTop: 8 }}>{m.actions.map((a) => <Link key={a.href} href={a.href} className="btn btn-secondary btn-sm btn-plain" onClick={() => setOpen(false)}>{a.label} →</Link>)}</div>}
            {m.note && <div className="muted tiny" style={{ marginTop: 6 }}>{m.note}</div>}
          </div>
        ))}
        <div ref={end} />
      </div>

      <form className="paul-form" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <textarea ref={box} className="input" rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }} placeholder={pick === "feedback" ? tx("เล่าปัญหาหรือไอเดียของคุณ…", "Tell us the problem or idea…") : pick === "legal" ? tx("ถามเรื่องข้อกฎหมายของโครงการ CoP…", "Ask about the law for your CoP project…") : tx("ถาม Paul ได้ทุกเรื่องเกี่ยวกับ COP24…", "Ask Paul anything about COP24…")} aria-label={tx("ข้อความถึง Paul", "Message to Paul")} />
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>{tx("ส่ง", "Send")}</button>
      </form>
      <div className="paul-foot">
        <span>{providerLabel}</span>
        <span>{provider && provider.provider !== "offline" ? tx("ข้อความและสรุปสถานะของหน้าจะถูกส่งไปยังผู้ให้บริการ AI · ไม่ใช่คำปรึกษาทางกฎหมาย", "Messages and a status summary are sent to the AI provider · not legal advice") : tx("ไม่ใช่คำปรึกษาทางกฎหมาย", "Not legal advice")}</span>
      </div>
    </section>
  );
}

/** Minimal, safe renderer for Paul's replies: paragraphs, numbered and bulleted lists, quotes, **bold**, _note_. */
function renderText(s: string): ReactNode[] {
  const inline = (t: string, k: string): ReactNode[] => t.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <b key={`${k}-${i}`}>{part.slice(2, -2)}</b>
      : part.startsWith("_") && part.endsWith("_") && part.length > 2 ? <em key={`${k}-${i}`} className="muted">{part.slice(1, -1)}</em>
        : <span key={`${k}-${i}`}>{part}</span>);
  return s.split("\n").map((line, i) => {
    const k = String(i);
    if (!line.trim()) return <div key={k} style={{ height: 6 }} />;
    if (/^>\s?/.test(line)) return <blockquote key={k} className="paul-quote">{inline(line.replace(/^>\s?/, ""), k)}</blockquote>;
    const num = line.match(/^(\d+)\.\s+(.*)$/);
    if (num) return <div key={k} className="paul-li"><span className="paul-num">{num[1]}.</span><span>{inline(num[2], k)}</span></div>;
    const bul = line.match(/^[-•*]\s+(.*)$/);
    if (bul) return <div key={k} className="paul-li"><span className="paul-num">•</span><span>{inline(bul[1], k)}</span></div>;
    return <p key={k} className="paul-p">{inline(line, k)}</p>;
  });
}
