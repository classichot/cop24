"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createSnapshot, type Snapshot, type TenantData } from "@/core/engine";
import { pick } from "@/core/i18n-text";
import { fmtDate } from "@/core/dates";
import type { Lang, LText } from "@/core/types";
import { ALL_PACKS } from "@/packs";
import { THEME_KEY, type Theme } from "./theme";
import { ENTITIES, EVIDENCE, CONTROLS, CONTROL_TESTS, REG_CHANGES, REPORT_DRAFT, REPORT_CONFLICTS, REPORT_FACTS, EXTRA_EVENTS, MANUAL_GAPS } from "@/data/tenant";

export type Role = "owner" | "consultant" | "exec";
export type Mode = "easy" | "professional" | "agi";
export type { Theme } from "./theme";

export interface AppCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  role: Role;
  setRole: (r: Role) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  /** Colour theme; saved in the browser, defaults to the operating-system setting. */
  theme: Theme;
  setTheme: (t: Theme) => void;
  evidenceGuard: boolean;
  setEvidenceGuard: (v: boolean) => void;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  entityId: string;
  setEntityId: (id: string) => void;
  data: TenantData;
  snap: Snapshot;
  /** Localise a bilingual string. */
  L: (text: LText | string | undefined) => string;
  /** Inline bilingual string. */
  tx: (th: string, en: string) => string;
  /** Format an ISO date in the active language (Buddhist era for Thai). */
  fd: (iso: string | null) => string;
}

const Ctx = createContext<AppCtx | null>(null);

export const TENANT: TenantData = {
  entities: ENTITIES,
  packs: ALL_PACKS,
  evidence: EVIDENCE,
  controls: CONTROLS,
  tests: CONTROL_TESTS,
  changes: REG_CHANGES,
  report: REPORT_DRAFT,
  conflicts: REPORT_CONFLICTS,
  facts: REPORT_FACTS,
  extraEvents: EXTRA_EVENTS,
  manualGaps: MANUAL_GAPS,
};

const KEY = "cop24.prefs.v1";

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("th");
  const [role, setRole] = useState<Role>("owner");
  const [mode, setMode] = useState<Mode>("professional");
  const [evidenceGuard, setEvidenceGuard] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [entityId, setEntityId] = useState("lopburi-1");
  const [hydrated, setHydrated] = useState(false);
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // The layout script has already resolved the theme onto <html>; mirror it in state.
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setThemeState(root.dataset.theme === "dark" ? "dark" : "light");
    queueMicrotask(sync);
    // With no saved choice the app follows the operating system, including later changes.
    const onSystem = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch {}
      if (saved === "light" || saved === "dark") return;
      root.dataset.theme = mq.matches ? "dark" : "light";
      sync();
    };
    mq.addEventListener("change", onSystem);
    return () => mq.removeEventListener("change", onSystem);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch {}
    setThemeState(t);
  }, []);

  useEffect(() => {
    // Hydrate saved preferences after mount (deferred so the server-rendered
    // markup matches the first client render, then updates in one pass).
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const p = JSON.parse(raw) as Partial<{ lang: Lang; role: Role; mode: Mode; evidenceGuard: boolean; entityId: string }>;
          if (p.lang) setLang(p.lang);
          if (p.role) setRole(p.role);
          if (p.mode) setMode(p.mode);
          if (typeof p.evidenceGuard === "boolean") setEvidenceGuard(p.evidenceGuard);
          if (p.entityId) setEntityId(p.entityId);
        }
      } catch {}
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ lang, role, mode, evidenceGuard, entityId }));
    } catch {}
  }, [hydrated, lang, role, mode, evidenceGuard, entityId]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const snap = useMemo(() => createSnapshot(TENANT), []);
  const L = useCallback((text: LText | string | undefined) => pick(text, lang), [lang]);
  const tx = useCallback((th: string, en: string) => (lang === "th" ? th : en), [lang]);
  const fd = useCallback((iso: string | null) => fmtDate(iso, lang), [lang]);

  const value: AppCtx = { lang, setLang, role, setRole, mode, setMode, theme, setTheme, evidenceGuard, setEvidenceGuard, showAll, setShowAll, entityId, setEntityId, data: TENANT, snap, L, tx, fd };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}
