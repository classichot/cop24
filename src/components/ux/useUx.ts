"use client";

import { useMemo } from "react";
import { useApp } from "@/state/AppState";
import { uxContext, type UxContext } from "@/core/ux/context";
import type { EntityRef } from "@/core/ux/intent";

/** The experience layer's context for the active entity and role. */
export function useUx(): UxContext {
  const { snap, data, entityId, role } = useApp();
  return useMemo(() => uxContext(snap, data, entityId, role), [snap, data, entityId, role]);
}

/** Entity names the Copilot listens for, in both languages, plus short forms like “ลพบุรี 1”. */
export function useEntityRefs(): EntityRef[] {
  const { data } = useApp();
  return useMemo(() => data.entities.map((e) => {
    const names = [e.name.th, e.name.en];
    const short = [e.name.th.replace(/^โซลาร์ฟาร์ม\s*/u, ""), e.name.en.replace(/^Solar Farm\s*/i, "")];
    return { id: e.id, names: [...names, ...short.filter((s) => s.length >= 4)] };
  }), [data]);
}

/** Tell the Complexity Guard something happened (advanced toggle, empty search, validation error, help). */
export function uxSignal(kind: "advanced-toggle" | "search-miss" | "validation-error" | "help") {
  try { window.dispatchEvent(new CustomEvent("cop24:ux", { detail: kind })); } catch {}
}
