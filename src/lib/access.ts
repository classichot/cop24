"use client";

// Demo access links and the signed-in session (same model as ACC24).
// A link carries a self-contained token (role access, guest, expiry) so the gate can validate it;
// with a server secret it is HMAC-signed by /api/demo-mint. The host desk keeps its own register
// so links can be revoked from the host's browser. Hard ceiling: 45 days.

export const MAX_DAYS = 45;
export const DEFAULT_DAYS = 14;
/** Prototype PIN for local, unsigned links only — the real PIN is HOST_PIN in the server environment. */
export const HOST_PIN = "host24";
export type Role = "owner" | "consultant" | "exec" | "contributor";
export type DemoMode = Role | "all";
export type Invite = { id: string; guest: string; org: string; email: string; mode: DemoMode; days: number; issued: string; expires: string; note: string; revoked?: boolean; token?: string };

const KEY = "cop24-invites";
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4))));

export const loadInvites = (): Invite[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
export const saveInvites = (list: Invite[]) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode */ } };

export function mint(p: { guest: string; org: string; email: string; mode: DemoMode; days: number; note: string }): Invite {
  const days = Math.max(1, Math.min(MAX_DAYS, Math.round(p.days) || DEFAULT_DAYS));
  const issued = new Date();
  const expires = new Date(issued.getTime() + days * 86400000);
  const id = "DM-" + issued.toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const inv: Invite = { id, guest: p.guest.trim(), org: p.org.trim(), email: p.email.trim(), mode: p.mode, days, issued: issued.toISOString(), expires: expires.toISOString(), note: p.note.trim() };
  saveInvites([inv, ...loadInvites()]);
  return inv;
}
export const revoke = (id: string) => { saveInvites(loadInvites().map((i) => (i.id === id ? { ...i, revoked: true } : i))); };

export const token = (inv: Invite) => b64(JSON.stringify({ id: inv.id, g: inv.guest, o: inv.org, m: inv.mode, i: inv.issued, e: inv.expires }));
export const linkFor = (inv: Invite) => `${location.origin}/login#demo=${inv.token || token(inv)}`;

export type Gate = { ok: boolean; reason?: string; invite?: Invite; daysLeft?: number; token?: string; signed?: boolean };
export function validate(t: string): Gate {
  let p: { id?: string; g?: string; o?: string; m?: DemoMode; i?: string; e?: string };
  const signed = t.includes(".");
  try { p = JSON.parse(unb64(t.split(".")[0])); } catch { return { ok: false, reason: "This link is not a valid COP24 demo link." }; }
  if (!p || !p.id || !p.e || !p.i || !p.m) return { ok: false, reason: "This link is missing its access details." };
  const issued = new Date(p.i).getTime(), expires = new Date(p.e).getTime(), now = Date.now();
  if (!(expires > issued) || (expires - issued) / 86400000 > MAX_DAYS + 0.01) return { ok: false, reason: "This link asks for more than the 45-day maximum and was refused." };
  if (now > expires) return { ok: false, reason: "This demo link expired on " + fmtDate(p.e) + ". Ask your host for a new one." };
  const local = loadInvites().find((i) => i.id === p.id);
  if (local?.revoked) return { ok: false, reason: "This demo link was revoked by the host." };
  const inv: Invite = local || { id: p.id, guest: p.g || "Guest", org: p.o || "", email: "", mode: p.m, days: Math.round((expires - issued) / 86400000), issued: p.i, expires: p.e, note: "" };
  return { ok: true, invite: { ...inv, token: t }, daysLeft: Math.ceil((expires - now) / 86400000), token: t, signed };
}
export const gateFromUrl = (): Gate | null => { const m = location.hash.match(/demo=([A-Za-z0-9_.-]+)/); return m ? validate(m[1]) : null; };
export const allowedRoles = (mode: DemoMode): Role[] => (mode === "all" ? ["owner", "consultant", "exec", "contributor"] : [mode]);
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const status = (inv: Invite) => (inv.revoked ? "Revoked" : Date.now() > new Date(inv.expires).getTime() ? "Expired" : "Active · " + Math.ceil((new Date(inv.expires).getTime() - Date.now()) / 86400000) + " days left");
export const mailto = (inv: Invite, link: string) => `mailto:${encodeURIComponent(inv.email)}?subject=${encodeURIComponent("Your COP24 demo access · " + inv.days + " days")}&body=${encodeURIComponent(`Hi ${inv.guest},\n\nHere is your COP24 demo link (${inv.mode === "all" ? "all four roles" : inv.mode + " role"}), valid until ${fmtDate(inv.expires)}:\n\n${link}\n\nOpen it and pick a role; no password is needed for the demo.\n\n${inv.note ? inv.note + "\n\n" : ""}— COP24 host desk`)}`;
export const lineShare = (link: string) => `https://line.me/R/share?text=${encodeURIComponent("Your COP24 demo link: " + link)}`;

// Server-backed host desk: the PIN is checked and links are signed by /api/demo-mint.
// "offline" means no backend secrets — the desk falls back to local, unsigned links.
export async function unlockRemote(pin: string): Promise<"ok" | "wrong" | "offline"> {
  try {
    const res = await fetch("/api/demo-mint", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin, check: true }) });
    return res.ok ? "ok" : res.status === 401 ? "wrong" : "offline";
  } catch { return "offline"; }
}
export async function mintRemote(pin: string, p: { guest: string; org: string; email: string; mode: DemoMode; days: number; note: string }): Promise<Invite> {
  const res = await fetch("/api/demo-mint", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin, ...p }) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "mint_failed");
  const { invite, token: tk } = await res.json();
  const inv: Invite = { ...invite, token: tk };
  saveInvites([inv, ...loadInvites()]);
  return inv;
}

/* ───────────── session ───────────── */

export type Session = { email: string; role: Role; name: string; expires: string; token?: string; demo?: { id: string; guest: string; org: string } };
const SKEY = "cop24-session";
export const currentSession = (): Session | null => { try { const s = JSON.parse(localStorage.getItem(SKEY) || "null") as Session | null; return s && Date.now() < new Date(s.expires).getTime() ? s : null; } catch { return null; } };
export const saveSession = (s: Session) => { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch { /* */ } };
export const signOut = () => { try { localStorage.removeItem(SKEY); } catch { /* */ } };
/** Bearer header for server functions that require sign-in once auth is configured. */
export const authHeaders = (): Record<string, string> => { const s = currentSession(); return s?.token ? { authorization: `Bearer ${s.token}` } : {}; };

export async function serverAuth(): Promise<{ configured: boolean; hostDesk: boolean }> {
  try { return await (await fetch("/api/session")).json(); } catch { return { configured: false, hostDesk: false }; }
}
export async function signIn(email: string, password: string, role: Role): Promise<{ ok: true; token: string; expires: string } | { ok: false; reason: string; message?: string }> {
  try {
    const r = await fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, role }) });
    const j = await r.json();
    return r.ok ? { ok: true, token: j.token, expires: j.expires } : { ok: false, reason: j.error, message: j.message };
  } catch { return { ok: false, reason: "unreachable" }; }
}
