import { requireAuth } from "@/lib/auth/token";
import { rag24CheckClaim } from "@/lib/rag24/server";

/** POST /api/rag24/verify — {claim, entityId} → is this regulatory statement supported by approved sources? */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await requireAuth(req);
  if (denied) return denied;
  let body: { claim?: unknown; entityId?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "invalid JSON" }, { status: 400 }); }
  const claim = typeof body.claim === "string" ? body.claim.trim() : "";
  const entityId = typeof body.entityId === "string" && /^[a-z0-9-]{1,60}$/.test(body.entityId) ? body.entityId : "";
  if (claim.length < 10 || !entityId) return Response.json({ error: "claim (10+ characters) and entityId are required" }, { status: 400 });
  return Response.json(await rag24CheckClaim(entityId, claim));
}
