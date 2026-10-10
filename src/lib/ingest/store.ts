"use client";

import type { IngestionState } from "@/core/ingest/types";

/**
 * Per-device persistence for the ingestion workspace (IndexedDB). Missions are plain,
 * checkpointed data, so a backend worker can run the same state from PostgreSQL; this browser
 * store is the demo persistence and survives closing the tab, not closing the device.
 */
const DB = "cop24-ingest";
const STORE = "states";

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function loadState(key: string): Promise<IngestionState | undefined> {
  try {
    const db = await open();
    return await new Promise((res, rej) => {
      const q = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      q.onsuccess = () => res(q.result as IngestionState | undefined);
      q.onerror = () => rej(q.error);
    });
  } catch { return undefined; }
}

export async function saveState(key: string, s: IngestionState): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(JSON.parse(JSON.stringify(s)), key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch { /* storage unavailable (private mode) — the workspace still works in memory */ }
}

export async function clearState(key: string): Promise<void> {
  try {
    const db = await open();
    db.transaction(STORE, "readwrite").objectStore(STORE).delete(key);
  } catch { /* ignore */ }
}
