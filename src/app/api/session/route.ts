// GET  /api/session → { configured, hostDesk }                         (what the login page offers)
// POST /api/session { email, password, role } → { token, expires }     (workspace sign-in)
// The workspace password lives only in the server environment (WORKSPACE_PASSWORD).
import { json, safeEqual, secret, SESSION_HOURS, sign } from "@/lib/auth/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["owner", "consultant", "exec", "contributor"];
const attempts = new Map<string, { n: number; at: number }>();

export function GET() {
  return json(200, { configured: Boolean(secret() && process.env.WORKSPACE_PASSWORD), hostDesk: Boolean(secret() && process.env.HOST_PIN) });
}

export async function POST(request: Request) {
  if (!secret() || !process.env.WORKSPACE_PASSWORD) return json(501, { error: "not_configured" });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json(400, { error: "bad_request" }); }
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 160);
  const role = String(body.role ?? "");
  if (!email || !ROLES.includes(role)) return json(400, { error: "bad_request" });
  // simple per-instance throttle: 5 wrong attempts per email per minute
  const ip = email;
  const a = attempts.get(ip);
  if (a && a.n >= 5 && Date.now() - a.at < 60_000) return json(429, { error: "rate_limited", message: "Too many attempts — wait a minute." });
  if (typeof body.password !== "string" || !safeEqual(body.password, process.env.WORKSPACE_PASSWORD)) {
    attempts.set(ip, { n: (a && Date.now() - a.at < 60_000 ? a.n : 0) + 1, at: Date.now() });
    return json(401, { error: "wrong_password" });
  }
  attempts.delete(ip);
  const issued = new Date(), expires = new Date(issued.getTime() + SESSION_HOURS * 3600_000);
  const token = await sign({ id: "SS-" + issued.getTime().toString(36), kind: "session", g: email, o: "", m: role, i: issued.toISOString(), e: expires.toISOString() });
  return json(200, { token, expires: expires.toISOString() });
}
