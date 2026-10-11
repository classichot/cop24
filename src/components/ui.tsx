"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { LayerMark, Status } from "@/core/types";
import type { GlossaryId, ResultKind } from "@/core/ux/guidance";
import { ExplainThis, ResultInterpreter } from "./ux/parts";

/* Small presentational primitives that reproduce the prototype's repeated patterns. */

export const Tag = ({ k, children, style }: { k: Status; children: ReactNode; style?: CSSProperties }) => (
  <span className={`tag st-${k}`} style={style}>{children}</span>
);

export const glyphFor = (k: Status) => ({ ok: "✓", warn: "!", bad: "✕", cond: "→", info: "→" })[k];

export const Mark = ({ k, size, children }: { k: Status; size?: "lg" | "xl"; children?: ReactNode }) => (
  <span className={`mark st-${k}${size ? ` mark-${size}` : ""}`}>{children ?? glyphFor(k)}</span>
);

export const layerMark = (m: LayerMark): { k: Status; g: string } => (m === 1 ? { k: "ok", g: "✓" } : m === 0 ? { k: "warn", g: "?" } : { k: "bad", g: "✕" });

export const LayerCell = ({ m }: { m: LayerMark }) => {
  const { k, g } = layerMark(m);
  return <span className={`mark st-${k}`}>{g}</span>;
};

export const Glyph = ({ k, children }: { k: Status; children?: ReactNode }) => (
  <span className={`glyph ink-${k}`}>{children ?? glyphFor(k)}</span>
);

export const Kicker = ({ children }: { children: ReactNode }) => <div className="kicker">{children}</div>;

/**
 * Page heading. `explain` adds ⓘ Explain This for the screen's professional terms (§8) and
 * `interpret` adds the AI Result Interpreter for the screen's headline result (§12).
 */
export const PageHead = ({ kicker, title, lead, xl, children, explain, interpret }: { kicker: ReactNode; title: ReactNode; lead?: ReactNode; xl?: boolean; children?: ReactNode; explain?: GlossaryId[]; interpret?: ResultKind }) => (
  <>
    <Kicker>{kicker}</Kicker>
    <h1 className={`title${xl ? " title-xl" : ""}`}>{title}</h1>
    {lead && <p className="text-muted lead">{lead}</p>}
    {explain && explain.length > 0 && <div className="row" style={{ gap: 6, marginTop: 4 }}>{explain.map((id) => <ExplainThis key={id} id={id} />)}</div>}
    {interpret && <div style={{ marginTop: 14, maxWidth: 760 }}><ResultInterpreter kind={interpret} compact /></div>}
    {children}
  </>
);

export const SectionHead = ({ title, tag, note }: { title: ReactNode; tag?: ReactNode; note?: ReactNode }) => (
  <>
    <div className="section-head">
      <h3>{title}</h3>
      {tag && <span className="section-tag">{tag}</span>}
    </div>
    {note && <p className="text-muted small" style={{ margin: "6px 0 14px" }}>{note}</p>}
  </>
);

export const Cells = ({ min = 170, children, className = "", style, thin, accent }: { min?: number; children: ReactNode; className?: string; style?: CSSProperties; thin?: boolean; accent?: boolean }) => (
  <div className={`cells${thin ? " cells-thin" : ""}${accent ? " cells-accent" : ""} ${className}`} style={{ gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, ...style }}>{children}</div>
);

export const Stat = ({ label, value, sub, size, color, bg, className = "" }: { label: ReactNode; value: ReactNode; sub?: ReactNode; size?: "lg" | "md" | "sm" | "xs"; color?: string; bg?: boolean; className?: string }) => (
  <div className={`cell${bg ? " cell-bg" : ""} ${className}`}>
    <div className="label">{label}</div>
    <div className={`stat-value${size ? ` stat-value-${size}` : ""}`} style={color ? { color } : undefined}>{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

export const Bar = ({ pct, color, className = "bar" }: { pct: number; color?: string; className?: string }) => (
  <div className={className}><div style={{ width: `${pct}%`, background: color ?? "var(--color-accent-700)" }} /></div>
);

export const Sweep = ({ className = "bar bar-thin" }: { className?: string }) => (
  <div className={className} style={{ marginTop: 9 }}><div className="sweep" /></div>
);

export const Callout = ({ kicker, title, body, cta, href, onClick, bar, children }: { kicker: ReactNode; title?: ReactNode; body?: ReactNode; cta?: ReactNode; href?: string; onClick?: () => void; bar?: boolean; children?: ReactNode }) => (
  <div className={bar ? "callout-bar" : "callout"}>
    <div className="callout-kicker">{kicker}</div>
    {title && <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45 }}>{title}</div>}
    {body && <div style={{ fontSize: 12, color: "var(--color-accent-800)", marginTop: 5, lineHeight: 1.55 }}>{body}</div>}
    {children}
    {cta && href && <Link href={href} className="btn btn-primary" style={{ marginTop: 12 }}>{cta}</Link>}
    {cta && !href && <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onClick}>{cta}</button>}
  </div>
);

export const Seg = <T extends string>({ value, onChange, options, name }: { value: T; onChange: (v: T) => void; options: { v: T; label: ReactNode }[]; name: string }) => (
  <div className="seg">
    {options.map((o) => (
      <label key={o.v} className="seg-opt">
        <input type="radio" name={name} checked={value === o.v} onChange={() => onChange(o.v)} />
        {o.label}
      </label>
    ))}
  </div>
);

export const statusColor = (k: Status) => `var(--st-${k === "cond" || k === "info" ? "info" : k})`;

export const readinessColor = (n: number) => (n >= 80 ? "var(--st-ok)" : n >= 60 ? "var(--st-warn)" : "var(--st-bad)");

export const AppChip = ({ app, accent }: { app: string; accent?: string }) => (
  <span className="app-chip"><i style={{ background: accent ?? "var(--color-accent)" }} />{app}</span>
);
