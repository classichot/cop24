// POST /api/demo-mint  { pin, check? } → { ok }                     (unlock the host desk)
// POST /api/demo-mint  { pin, guest, org, email, mode, days, note } → { invite, token }
// The host PIN lives only in the server environment (HOST_PIN); links are signed and capped at 45 days.
import { json, MAX_DEMO_DAYS, safeEqual, secret, sign } from "@/lib/auth/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODES = ["owner", "consultant", "exec", "contributor", "all"];
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

export async function POST(request: Request) {
  if (!secret() || !process.env.HOST_PIN) return json(501, { error: "not_configured" });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json(400, { error: "bad_request" }); }
  if (typeof body?.pin !== "string" || !safeEqual(body.pin, process.env.HOST_PIN)) return json(401, { error: "wrong_pin" });
  if (body.check) return json(200, { ok: true });

  const guest = clip(body.guest, 80);
  if (!guest) return json(400, { error: "guest_required" });
  if (!MODES.includes(String(body.mode))) return json(400, { error: "bad_mode" });
  const days = Math.max(1, Math.min(MAX_DEMO_DAYS, Math.round(Number(body.days)) || 14));
  const issued = new Date(), expires = new Date(issued.getTime() + days * 86400000);
  const id = "DM-" + issued.toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const org = clip(body.org, 120);
  const token = await sign({ id, kind: "demo", g: guest, o: org, m: String(body.mode), i: issued.toISOString(), e: expires.toISOString() });
  const invite = { id, guest, org, email: clip(body.email, 160), mode: body.mode, days, issued: issued.toISOString(), expires: expires.toISOString(), note: clip(body.note, 300) };
  return json(200, { invite, token });
}
