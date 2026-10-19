import { requireAuth } from "@/lib/auth/token";
import { RAG24_WORKFLOWS, rag24Config, rag24Evidence, rag24Reachable, type Cop24Workflow } from "@/lib/rag24/server";

/**
 * GET  /api/rag24 — is COP24 connected to RAG24? (configuration, stage, host, reachability; never the key)
 * POST /api/rag24 — {query, entityId, workflow?} → RAG24 evidence for that plant (default workflow: search)
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
  let body: { query?: unknown; entityId?: unknown; workflow?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "invalid JSON" }, { status: 400 }); }
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const entityId = typeof body.entityId === "string" && /^[a-z0-9-]{1,60}$/.test(body.entityId) ? body.entityId : "";
  if (query.length < 2 || !entityId) return Response.json({ error: "query (2+ characters) and entityId are required" }, { status: 400 });
  const workflow = (RAG24_WORKFLOWS as readonly string[]).includes(String(body.workflow ?? "search")) ? (String(body.workflow ?? "search") as Cop24Workflow) : null;
  if (!workflow) return Response.json({ error: `workflow must be one of ${RAG24_WORKFLOWS.join(", ")}` }, { status: 400 });
  return Response.json(await rag24Evidence(workflow, entityId, query));
}
