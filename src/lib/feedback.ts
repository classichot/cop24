"use client";

import type { Triage } from "@/core/paul/paul";

/** Feedback register kept in this browser; items are also forwarded to GitHub when the server is configured. */
export interface FeedbackItem {
  id: string;
  at: string;
  text: string;
  route: string;
  role: string;
  triage: Triage;
  forwarded: boolean;
  url?: string;
  status: "open" | "done";
}

const KEY = "cop24.feedback.v1";
const EVENT = "cop24:feedback";

export function loadFeedback(): FeedbackItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as FeedbackItem[]; } catch { return []; }
}

export function saveFeedback(items: FeedbackItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items.slice(-500))); } catch {}
  try { window.dispatchEvent(new Event(EVENT)); } catch {}
}

export function addFeedback(item: FeedbackItem) { saveFeedback([...loadFeedback(), item]); }

export function updateFeedback(id: string, patch: Partial<FeedbackItem>) {
  saveFeedback(loadFeedback().map((f) => (f.id === id ? { ...f, ...patch } : f)));
}

export function onFeedbackChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => { window.removeEventListener(EVENT, fn); window.removeEventListener("storage", fn); };
}
