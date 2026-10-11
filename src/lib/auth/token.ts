// Signed access tokens for COP24's server functions (same model as ACC24).
// A token is base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, DEMO_SECRET)).
// The browser can read the payload (guest, role, expiry) but cannot forge or extend it.
import { timingSafeEqual } from "node:crypto";

export const MAX_DEMO_DAYS = 45;
export const SESSION_HOURS = 12;
// g = who (email or guest name), o = organisation, m = role access ("all" or one role), n = display name
export type Payload = { id: string; kind: "demo" | "session"; g: string; o: string; m: string; i: string; e: string; n?: string };

const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

async function hmac(data: string, key: string) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}

export const secret = () => process.env.DEMO_SECRET || "";
/** Auth is enforced only once the server has a signing secret. */
export const authConfigured = () => Boolean(secret());

export async function sign(p: Payload): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(p)));
  return body + "." + b64url(await hmac(body, secret()));
}

export type Verified = { ok: true; payload: Payload } | { ok: false; status: number; error: string };

export async function verify(token: string | undefined | null): Promise<Verified> {
  if (!secret()) return { ok: false, status: 501, error: "not_configured" };
  if (!token || typeof token !== "string" || !token.includes(".")) return { ok: false, status: 401, error: "missing_token" };
  const [body, sig] = token.split(".");
  const expected = b64url(await hmac(body, secret()));
  const a = Buffer.from(sig || ""), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, status: 401, error: "bad_signature" };
  let p: Payload;
  try { p = JSON.parse(fromB64url(body).toString("utf8")); } catch { return { ok: false, status: 401, error: "bad_token" }; }
  const issued = Date.parse(p.i), expires = Date.parse(p.e), now = Date.now();
  if (!(expires > issued)) return { ok: false, status: 401, error: "bad_token" };
  if (p.kind === "demo" && (expires - issued) / 86400000 > MAX_DEMO_DAYS + 0.01) return { ok: false, status: 401, error: "over_limit" };
  if (now > expires) return { ok: false, status: 401, error: "expired" };
  return { ok: true, payload: p };
}

/** Constant-time string comparison for PINs and passwords. */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Guard for routes that spend money or touch data: when auth is configured the request must
 * carry a valid signed token (Authorization: Bearer …); without a secret the prototype stays open.
 */
export async function requireAuth(req: Request): Promise<Response | null> {
  if (!authConfigured()) return null;
  const h = req.headers.get("authorization") || "";
  const v = await verify(h.startsWith("Bearer ") ? h.slice(7) : null);
  return v.ok ? null : json(v.status, { error: v.error });
}

export const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
