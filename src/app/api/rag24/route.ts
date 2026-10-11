import { requireAuth } from "@/lib/auth/token";
import { rag24Config, rag24Evidence, rag24Reachable } from "@/lib/rag24/server";

/**
 * GET  /api/rag24 — is COP24 connected to RAG24? (configuration, stage, host, reachability; never the key)
 * POST /api/rag24 — {query, entityId} → the RAG24 search-pilot result for that plant
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const c = rag24Config();
  return Response.json({ ...c, reachable: await rag24Reachable() });
}

export async function POST(req: Request) {
  const denied = await requireAuth(req);
  if (denied) return denied;
  let body: { query?: unknown; entityId?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "invalid JSON" }, { status: 400 }); }
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const entityId = typeof body.entityId === "string" && /^[a-z0-9-]{1,60}$/.test(body.entityId) ? body.entityId : "";
  if (query.length < 2 || !entityId) return Response.json({ error: "query (2+ characters) and entityId are required" }, { status: 400 });
  return Response.json(await rag24Evidence("search", entityId, query));
}
