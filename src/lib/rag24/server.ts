import { Rag24Integration, type IntegrationResult, type IntegrationStage, type IntegrationWorkflow } from "./sdk/index";
import { AGI_SITES } from "@/data/agi-sites";
import { ENTITIES } from "@/data/tenant";

/**
 * COP24 ↔ RAG24 — server side only. RAG24 supplies approved, permission-checked evidence; COP24 keeps
 * its own corpus, engines, report guard and human approval. The connection is additive: when RAG24 is
 * off, unconfigured or down, every caller gets an explicit status and carries on exactly as before.
 *
 * Environment (never sent to the browser):
 *   RAG24_URL           https://… the RAG24 service
 *   RAG24_SERVICE_KEY   a COP24 *service* credential (reader), never an operator or admin key
 *   RAG24_STAGE         disabled (default) | search_pilot | workflows — must match the server registration
 *   RAG24_PACK_VERSION  the COP24 domain pack pinned on the registration (default 1.1.0)
 *   RAG24_ENTITY_MAP    optional JSON {"lopburi-1":"customer-a-lopburi-1"} — COP24 entity → RAG24 entity grant
 */
export type Rag24Stage = IntegrationStage;
export interface Rag24Config { configured: boolean; stage: Rag24Stage; pack: string; host: string | null }

const STAGES: Rag24Stage[] = ["disabled", "search_pilot", "workflows"];

export function rag24Config(): Rag24Config {
  const url = process.env.RAG24_URL?.trim() ?? "";
  const configured = Boolean(url && process.env.RAG24_SERVICE_KEY?.trim());
  const raw = (process.env.RAG24_STAGE ?? "disabled").trim() as Rag24Stage;
  let host: string | null = null;
  try { host = url ? new URL(url).host : null; } catch {}
  return { configured, stage: configured && STAGES.includes(raw) ? raw : "disabled", pack: process.env.RAG24_PACK_VERSION?.trim() || "1.1.0", host };
}

// one adapter per service credential, so its circuit breaker spans requests
let INST: { sig: string; rag: Rag24Integration } | null = null;
function adapter(): Rag24Integration | null {
  const c = rag24Config();
  if (!c.configured || c.stage === "disabled") return null;
  const key = process.env.RAG24_SERVICE_KEY!.trim();
  const sig = [process.env.RAG24_URL, key, c.stage, c.pack].join("|");
  if (INST?.sig !== sig) {
    INST = {
      sig,
      rag: new Rag24Integration({
        applicationId: "COP24",
        domainPackVersion: c.pack,
        baseUrl: process.env.RAG24_URL!.trim(),
        apiKey: key,
        stage: c.stage,
        timeoutMs: 2500,
        // status and reason only — never passages, tokens or raw errors
        audit: (e) => console.info(`[rag24] ${e.application} ${e.workflow} → ${e.status} (${e.reason})`),
      }),
    };
  }
  return INST.rag;
}

const entityMap = (): Record<string, string> => { try { return JSON.parse(process.env.RAG24_ENTITY_MAP ?? "{}") as Record<string, string>; } catch { return {}; } };

/** The RAG24 entity grant for a COP24 entity: RAG24_ENTITY_MAP when set, else the same id. */
export function rag24Entity(entityId: string): string {
  const map = entityMap();
  return typeof map[entityId] === "string" && map[entityId] ? map[entityId] : entityId;
}

/** The plants this COP24 workspace holds (entities and mission sites), plus any mapped ids. */
function workspaceEntities(): Set<string> {
  return new Set([...ENTITIES.map((e) => e.id), ...AGI_SITES.map((s) => s.id), ...Object.keys(entityMap())]);
}

export type Rag24Status = IntegrationResult["status"] | "not_configured";
export interface Rag24Passage { id: string; sourceId: string; title: string; issuer: string; text: string; cite: string; url: string | null; version: number; effectiveFrom: string; effectiveTo: string | null }
export interface Rag24Evidence { status: Rag24Status; reason: string; stage: Rag24Stage; passages: Rag24Passage[]; warnings: string[]; readiness?: "ready" | "blocked"; missing?: string[]; packageId?: string; retrievedAt?: string }

const where = (loc: Record<string, string | number>) => Object.entries(loc).filter(([k]) => !/offset|char/i.test(k)).map(([k, v]) => `${k} ${v}`).join(" · ");

/**
 * Evidence for one COP24 workflow. `search` runs in the search pilot; report workflows need the
 * `workflows` stage. The entity comes from the signed-in workspace's active entity, never a free-text field.
 */
/** COP24's workflows, as RAG24 names them. Search runs in the search pilot; the rest need "workflows". */
export const RAG24_WORKFLOWS = ["search", "regulatory_check", "report_generation", "studio", "report_review"] as const;
export type Cop24Workflow = (typeof RAG24_WORKFLOWS)[number];

type Ready = { rag: Rag24Integration; stage: Rag24Stage; context: { entity_id: string; reporting_period: number; jurisdiction: string; as_of: string } };
type NotReady = { status: Rag24Status; reason: string; stage: Rag24Stage };

/** Configuration, switch and workspace checks shared by every call; the context comes from the server. */
function prepare(entityId: string, opts: { year?: number; asOf?: string }): Ready | NotReady {
  const c = rag24Config();
  if (!c.configured) return { status: "not_configured", reason: "rag24_not_configured", stage: "disabled" };
  const rag = adapter();
  if (!rag) return { status: "disabled", reason: "integration_disabled", stage: c.stage };
  // only this workspace's plants: an unknown entity would be refused by RAG24 and count toward the
  // circuit breaker, pausing the connection for every user of this instance
  if (!workspaceEntities().has(entityId)) return { status: "disabled", reason: "entity_not_in_workspace", stage: c.stage };
  const today = new Date().toISOString().slice(0, 10);
  return { rag, stage: c.stage, context: { entity_id: rag24Entity(entityId), reporting_period: opts.year ?? Number(today.slice(0, 4)), jurisdiction: "TH", as_of: opts.asOf ?? today } };
}

const toPassages = (r: IntegrationResult): Rag24Passage[] => r.evidence.slice(0, 6).map((e) => ({
  id: e.id, sourceId: e.source_id, title: e.title, issuer: e.issuer, text: e.text.slice(0, 1200),
  cite: [e.title, where(e.location), `v${e.source_version}`].filter(Boolean).join(" · "),
  url: e.source_url, version: e.source_version, effectiveFrom: e.effective_from, effectiveTo: e.effective_to,
}));

/**
 * Evidence for one COP24 workflow. `search` runs in the search pilot; report workflows need the
 * `workflows` stage and return RAG24's evidence package (readiness and what is missing). The entity comes
 * from the signed-in workspace's active entity, never a free-text field.
 */
export async function rag24Evidence(workflow: IntegrationWorkflow, entityId: string, query: string, opts: { year?: number; asOf?: string } = {}): Promise<Rag24Evidence> {
  const p = prepare(entityId, opts);
  if (!("rag" in p)) return { ...p, passages: [], warnings: [] };
  const r = await p.rag.evidence(workflow, p.context, query.slice(0, 1000));
  return {
    status: r.status,
    reason: r.reason,
    stage: p.stage,
    warnings: r.warnings,
    readiness: r.package?.readiness,
    missing: r.package?.missing_evidence.map((m) => m.label),
    packageId: r.package?.id,
    retrievedAt: r.retrieval?.retrieved_at,
    passages: toPassages(r),
  };
}

export interface Rag24ClaimCheck { status: Rag24Status; supported: boolean; reason: string; stage: Rag24Stage; passages: Rag24Passage[] }

/**
 * Is a regulatory statement supported, word for word, by approved sources? RAG24 builds an evidence
 * package for the statement and verifies it against the package's passages (workflows stage only).
 * Even "supported" is never approval: interpretation and legal applicability stay with a person.
 */
export async function rag24CheckClaim(entityId: string, claim: string, opts: { year?: number; asOf?: string } = {}): Promise<Rag24ClaimCheck> {
  const p = prepare(entityId, opts);
  if (!("rag" in p)) return { ...p, supported: false, passages: [] };
  const text = claim.trim().slice(0, 2000);
  const r = await p.rag.evidence("regulatory_check", p.context, text);
  if (r.status !== "evidence_available") return { status: r.status, supported: false, reason: r.reason, stage: p.stage, passages: toPassages(r) };
  const v = await p.rag.verifyAuthority(r, [{ text, category: "regulatory", citation_ids: r.evidence.slice(0, 30).map((e) => e.id) }]);
  return { status: r.status, supported: v.authority_supported, reason: v.reason, stage: p.stage, passages: toPassages(r) };
}

/** Is the RAG24 service up? Uses the unauthenticated readiness probe, so it never spends the key. */
let HEALTH: { at: number; ok: boolean } | null = null;
export async function rag24Reachable(): Promise<boolean | null> {
  const c = rag24Config();
  if (!c.configured) return null;
  if (HEALTH && Date.now() - HEALTH.at < 60_000) return HEALTH.ok;
  let ok = false;
  try {
    const r = await fetch(`${process.env.RAG24_URL!.trim().replace(/\/$/, "")}/health/ready`, { signal: AbortSignal.timeout(2500), cache: "no-store" });
    ok = r.ok;
  } catch {}
  HEALTH = { at: Date.now(), ok };
  return ok;
}

