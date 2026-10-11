/**
 * COP24 ↔ RAG24: the connection is additive and fails safe. Exercised against a stand-in RAG24 HTTP
 * server that speaks the REST v1 contract, so the vendored SDK, its validation and the circuit breaker
 * all run for real.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
const seen: { path: string; auth?: string; body: Record<string, unknown> }[] = [];
let reply: "evidence" | "empty" | "error" = "evidence";

const passage = (day = "2022-01-01") => ({
  id: "cit_1", source_id: "src_1", title: "ระเบียบ กกพ. ว่าด้วยประมวลหลักการปฏิบัติ พ.ศ. 2565", issuer: "ERC", text: "ผู้รับใบอนุญาตต้องจัดทำรายงานผลการปฏิบัติตามมาตรการ…",
  source_version: 1, source_hash: "abc", location: { section: "ข้อ 21", paragraph: 2 }, authority: "law", category: "regulation", classification: "public",
  source_status: "approved", effective_from: day, effective_to: null, original_url: "/rag/v1/sources/src_1/original", source_url: "https://www.erc.or.th/th/code-of-practice",
  library_id: "lib_x", applicable: true, usage_restrictions: "", license_id: "public", content_role: "untrusted_evidence", extraction_version: "1", facts: [],
});

const body = (req: IncomingMessage) => new Promise<Record<string, unknown>>((ok) => { let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => ok(s ? JSON.parse(s) : {})); });
const server = createServer(async (req, res) => {
  seen.push({ path: req.url ?? "", auth: req.headers.authorization, body: await body(req) });
  if (req.url === "/health/ready") { res.writeHead(200, { "content-type": "application/json" }); res.end("{}"); return; }
  if (reply === "error") { res.writeHead(503, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "disabled" })); return; }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ id: "ret_1", evidence: reply === "empty" ? [] : [passage()], strategy: "lexical", warnings: [], retrieved_at: "2026-10-12T00:00:00Z", as_of: "2026-10-12", search_mode: "hybrid", semantic_enabled: false, authorized_sources_searched: 30 }));
});
let url = "";
type Rag24Module = typeof import("../../lib/rag24/server");
let rag24Config: Rag24Module["rag24Config"], rag24Entity: Rag24Module["rag24Entity"], rag24Evidence: Rag24Module["rag24Evidence"], rag24Reachable: Rag24Module["rag24Reachable"];
before(async () => {
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  ({ rag24Config, rag24Entity, rag24Evidence, rag24Reachable } = await import("../../lib/rag24/server"));
});
after(() => server.close());

const env = (vars: Record<string, string | undefined>) => { for (const [k, v] of Object.entries(vars)) if (v === undefined) delete process.env[k]; else process.env[k] = v; };

test("not configured or disabled: no call is made and callers carry on", async () => {
  env({ RAG24_URL: undefined, RAG24_SERVICE_KEY: undefined, RAG24_STAGE: "search_pilot" });
  assert.equal(rag24Config().configured, false);
  assert.equal((await rag24Evidence("search", "lopburi-1", "รายงาน CoP")).status, "not_configured");
  env({ RAG24_URL: url, RAG24_SERVICE_KEY: "rag24_svc_test", RAG24_STAGE: "disabled" });
  assert.equal((await rag24Evidence("search", "lopburi-1", "รายงาน CoP")).status, "disabled");
  env({ RAG24_STAGE: "everything" });
  assert.equal(rag24Config().stage, "disabled", "an unknown stage fails closed");
  assert.equal(seen.filter((s) => s.path.startsWith("/rag/v1")).length, 0);
});

test("search pilot: approved passages come back with provenance; the entity comes from the workspace", async () => {
  env({ RAG24_URL: url, RAG24_SERVICE_KEY: "rag24_svc_test", RAG24_STAGE: "search_pilot", RAG24_ENTITY_MAP: JSON.stringify({ "lopburi-1": "customer-a-lopburi-1" }) });
  reply = "evidence";
  const r = await rag24Evidence("search", "lopburi-1", "ต้องยื่นรายงานเมื่อไร", { year: 2026 });
  assert.equal(r.status, "evidence_available");
  assert.equal(r.passages[0].cite, "ระเบียบ กกพ. ว่าด้วยประมวลหลักการปฏิบัติ พ.ศ. 2565 · section ข้อ 21 · paragraph 2 · v1");
  assert.equal(r.passages[0].url, "https://www.erc.or.th/th/code-of-practice");
  const call = seen.find((s) => s.path === "/rag/v1/retrieve")!;
  assert.equal(call.auth, "Bearer rag24_svc_test");
  const ctx = call.body.context as Record<string, unknown>;
  assert.equal(ctx.application_id, "COP24");
  assert.equal(ctx.entity_id, "customer-a-lopburi-1");
  assert.equal(ctx.reporting_period, 2026);
  assert.equal(rag24Entity("lopburi-2"), "lopburi-2", "unmapped entities keep their COP24 id");
  assert.equal(await rag24Reachable(), true);
});

test("search pilot never runs report workflows", async () => {
  const before = seen.length;
  const r = await rag24Evidence("report_generation", "lopburi-1", "รายงานผลการปฏิบัติตาม");
  assert.equal(r.status, "disabled");
  assert.equal(r.reason, "workflow_not_enabled");
  assert.equal(seen.length, before);
});

test("missing evidence and outages are explicit — never invented citations", async () => {
  reply = "empty";
  const empty = await rag24Evidence("search", "lopburi-1", "ค่าธรรมเนียม");
  assert.equal(empty.status, "missing_evidence");
  assert.deepEqual(empty.passages, []);
  reply = "error";
  const down = await rag24Evidence("search", "lopburi-1", "ค่าธรรมเนียม");
  assert.equal(down.status, "unavailable");
  assert.deepEqual(down.passages, []);
  reply = "evidence";
});

test("the service key stays on the server", () => {
  const panel = readFileSync(join(ROOT, "src/components/Rag24Panel.tsx"), "utf8");
  assert.ok(!panel.includes("process.env") && !panel.includes("@/lib/rag24/server"), "the browser component never reads server configuration");
  const server = readFileSync(join(ROOT, "src/lib/rag24/server.ts"), "utf8");
  assert.ok(!server.includes('"use client"'));
  for (const f of ["src/app/api/rag24/route.ts", "src/app/api/paul/route.ts", "src/app/api/report/draft/route.ts"]) {
    const src = readFileSync(join(ROOT, f), "utf8");
    assert.ok(!/RAG24_SERVICE_KEY/.test(src), `${f} must go through src/lib/rag24/server.ts`);
  }
  const route = readFileSync(join(ROOT, "src/app/api/rag24/route.ts"), "utf8");
  assert.match(route, /requireAuth/);
});
