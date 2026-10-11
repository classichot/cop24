"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/state/AppState";
import { missionById, missionsForRole, journey, STAGE_LABEL, type UxMission } from "@/core/ux/catalog";
import { understand, type Understanding } from "@/core/ux/intent";
import { Glyph, glyphFor } from "@/components/ui";
import { AssistLevel, WhyAI, type Assist } from "./parts";
import { uxSignal, useEntityRefs, useUx } from "./useUx";

/* ═══════════════ §3 24 Copilot — the universal AI entry point ═══════════════ */

interface CopilotCtx { open: (goal?: string) => void; close: () => void; isOpen: boolean }
const Ctx = createContext<CopilotCtx | null>(null);

export function useCopilot() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCopilot outside CopilotProvider");
  return c;
}

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [seed, setSeed] = useState("");
  const open = useCallback((goal?: string) => { setSeed(goal ?? ""); setOpen(true); }, []);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSeed(""); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {isOpen && <CopilotPanel seed={seed} onClose={close} />}
    </Ctx.Provider>
  );
}

function CopilotPanel({ seed, onClose }: { seed: string; onClose: () => void }) {
  const { tx } = useApp();
  return (
    <div className="copilot-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="copilot-panel" role="dialog" aria-modal="true" aria-label="24 Copilot">
        <div className="row row-center" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div className="kicker">24 Copilot</div>
            <div className="heading" style={{ fontSize: 20 }}>{tx("ต้องการให้ช่วยเรื่องอะไร?", "What do you need help with?")}</div>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} aria-label={tx("ปิด", "Close")}>✕</button>
        </div>
        <CopilotBox seed={seed} autoFocus onNavigate={onClose} />
        <div className="muted tiny" style={{ marginTop: 14 }}>{tx("เปิดได้ทุกหน้าด้วย Ctrl+K · Copilot วางแผนและพาไปยังเครื่องมือที่ถูกต้อง แต่จะไม่ส่งข้อความหรือยื่นอะไรโดยไม่ได้รับอนุมัติ", "Open anywhere with Ctrl+K · the Copilot plans and routes you to the right tool, but never sends or files anything without your approval.")}</div>
      </aside>
    </div>
  );
}

/**
 * Goal intake → understanding → recommended mission → required data → plan → assistance level.
 * Used inline on the home screen (Section A) and in the panel on every other screen.
 */
export function CopilotBox({ seed = "", autoFocus, onNavigate, large }: { seed?: string; autoFocus?: boolean; onNavigate?: () => void; large?: boolean }) {
  const { L, tx, setEntityId, entityId } = useApp();
  const ctx = useUx();
  const refs = useEntityRefs();
  const router = useRouter();
  const [goal, setGoal] = useState(seed);
  // a seeded goal (from the guard or a link) is answered on first render
  const [asked, setAsked] = useState<string | null>(seed || null);
  const [pick, setPick] = useState(0);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (autoFocus) input.current?.focus(); }, [autoFocus]);

  const ask = (text: string) => {
    const res = understand(text, ctx, refs);
    if (res.entityId && res.entityId !== entityId) setEntityId(res.entityId);
    if (!res.missions.length) uxSignal("search-miss");
    setAsked(text);
    setPick(0);
  };

  const go = (href: string) => { onNavigate?.(); router.push(href); };
  const act = (m: UxMission, a: Assist) => {
    if (a === "myself") return go(m.module);
    if (a === "for-me" && m.forMe === "/ingest") return go(`/ingest?goal=${encodeURIComponent(goal || L(m.title(ctx)))}`);
    go(`/missions?m=${m.id}&assist=${a}`);
  };
  const choose = (m: UxMission) => { const text = L(m.title(ctx)); setGoal(text); ask(text); };

  // recomputed every render, so an entity switch or new evidence updates the answer immediately
  const u: Understanding | null = asked === null ? null : understand(asked, ctx, refs);
  const cards = missionsForRole(ctx, 5).map((v) => v.mission);
  const chosen = u?.missions[pick]?.view;
  const j = chosen ? journey(chosen, ctx) : null;

  return (
    <div className="copilot">
      <form className="copilot-form" onSubmit={(e) => { e.preventDefault(); if (goal.trim()) ask(goal); }}>
        <textarea
          ref={input}
          className="input copilot-input"
          rows={large ? 2 : 2}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (goal.trim()) ask(goal); } }}
          placeholder={tx("อธิบายเป้าหมาย ปัญหา หรืองานที่ต้องทำ… เช่น “เตรียมรายงาน CoP ขั้นต้นของลพบุรี 1”", "Describe your goal, problem or task… e.g. “prepare the preliminary CoP report for Lopburi 1”")}
          aria-label={tx("เป้าหมายของคุณ", "Your goal")}
        />
        <button type="submit" className="btn btn-primary copilot-send" disabled={!goal.trim()}>{tx("ให้ 24 Copilot จัดการ →", "Let 24 Copilot handle it →")}</button>
      </form>

      {!u && (
        <div className="goal-cards" aria-label={tx("เป้าหมายที่พบบ่อย", "Common goals")}>
          {cards.map((m) => <button key={m.id} type="button" className="goal-card" onClick={() => choose(m)}>{L(m.title(ctx))}</button>)}
          <button type="button" className="goal-card goal-card-help" onClick={() => choose(missionById("start")!)}>{tx("ไม่รู้ว่าต้องเริ่มตรงไหน", "I don't know where to start")}</button>
        </div>
      )}

      {u && (
        <div className="copilot-answer" aria-live="polite">
          <div className="copilot-understood">
            <span className="label">{tx("สิ่งที่ Copilot เข้าใจ", "What Copilot understood")}</span>
            <div style={{ fontWeight: 600, marginTop: 3 }}>{L(u.summary)}</div>
            {u.clarify && <div className="muted small" style={{ marginTop: 4 }}>{L(u.clarify)}</div>}
          </div>

          {chosen && j ? (
            <>
              {u.missions.length > 1 && (
                <div className="row" style={{ gap: 6, marginTop: 10 }}>
                  {u.missions.map((x, i) => (
                    <button key={x.view.mission.id} type="button" className={`chip${i === pick ? " on" : ""}`} onClick={() => setPick(i)}>{L(x.view.title)}</button>
                  ))}
                </div>
              )}
              <div className="copilot-plan">
                <div className="label">{tx("ภารกิจที่แนะนำ", "Recommended mission")}</div>
                <div className="heading" style={{ fontSize: 17, marginTop: 2 }}>{L(chosen.title)}</div>
                <div className="muted small">{L(chosen.mission.outcome)}</div>
                <div className="copilot-stages">
                  {j.stages.map((s) => <span key={s.stage} className={`cstage cstage-${s.status}`}>{s.status === "done" ? "✓ " : ""}{L(STAGE_LABEL[s.stage])}</span>)}
                </div>
                <div className="copilot-cols">
                  <div>
                    <div className="label">{tx("แผนการทำงาน", "Plan")}</div>
                    <ol className="copilot-steps">
                      {chosen.plan.map((p, i) => (
                        <li key={i} className={p.done ? "done" : ""}><span className={`tag ${p.by === "ai" ? "st-info" : "st-warn"}`}>{p.by === "ai" ? "AI" : tx("คุณ", "You")}</span> {L(p.label)}{p.count ? ` (${p.count})` : ""}{p.done ? " ✓" : ""}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div className="label">{tx("ข้อมูลที่ต้องใช้", "Data needed")}</div>
                    <div className="stack" style={{ gap: 5, marginTop: 4 }}>
                      {chosen.requires.length ? chosen.requires.map((r, i) => <div key={i} style={{ display: "flex", gap: 7, fontSize: 12 }}><Glyph k={r.k}>{r.k === "warn" ? "⚠" : glyphFor(r.k)}</Glyph><span>{L(r.label)}</span></div>) : <span className="muted small">—</span>}
                    </div>
                    <div className="small" style={{ marginTop: 10 }}>{tx(`AI ทำได้ ${chosen.aiShare}% · เวลาของคุณ ~${chosen.userMinutes} นาที`, `AI can do ${chosen.aiShare}% · your time ~${chosen.userMinutes} min`)}</div>
                  </div>
                </div>
              </div>
              <div className="label" style={{ margin: "14px 0 6px" }}>{tx("ให้ช่วยแบบไหน", "How should we do it?")}</div>
              <AssistLevel onChange={(a) => act(chosen.mission, a)} />
              <div style={{ marginTop: 10 }}>
                <WhyAI
                  why={{ ...chosen.mission.why(ctx), reasoning: { th: `${chosen.mission.why(ctx).reasoning.th} (คำที่ใช้ตัดสิน: ${u.missions[pick].cues.join(", ") || "—"})`, en: `${chosen.mission.why(ctx).reasoning.en} (matched on: ${u.missions[pick].cues.join(", ") || "—"})` } }}
                  onAlternative={(id) => { const m = missionById(id); if (m) choose(m); }}
                />
              </div>
            </>
          ) : (
            <div className="goal-cards" style={{ marginTop: 10 }}>
              {cards.map((m) => <button key={m.id} type="button" className="goal-card" onClick={() => choose(m)}>{L(m.title(ctx))}</button>)}
              <button type="button" className="goal-card goal-card-help" onClick={() => choose(missionById("start")!)}>{tx("ไม่รู้ว่าต้องเริ่มตรงไหน", "I don't know where to start")}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
