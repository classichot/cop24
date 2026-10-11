/* Vendored from RAG24 (github.com/classichot/RAG24) sdk/typescript/src/index.ts @ 952c00b. Do not edit here — change RAG24, then run npm run rag24:sync-sdk. */
/** Server-to-server SDK. Never place a RAG24 access key in a browser bundle. */
export interface ApplicationProfile {
  application_id: string;
  display_name: string;
  aliases: string[];
  rag_priority: "critical" | "high" | "medium";
  target_pack_version: string;
  knowledge_areas: string[];
  sample_query: string;
}

export interface Rag24Context {
  application_id: string;
  domain_pack_version?: string;
  entity_id: string;
  reporting_period: number;
  jurisdiction?: string;
  task_id?: string;
  as_of?: string | null;
  mode?: "draft" | "supervised" | "autopilot";
}
export interface Evidence {
  id: string;
  source_id: string;
  title: string;
  issuer: string;
  text: string;
  source_version: number;
  source_hash: string;
  location: Record<string, string | number>;
  authority: string;
  category: string;
  classification: string;
  source_status: string;
  effective_from: string;
  effective_to: string | null;
  original_url: string;
  source_url: string | null;
  library_id: string | null;
  applicable?: boolean | null;
  score?: number;
  ranking?: Record<string, number>;
  usage_restrictions: string;
  license_id: string;
  content_role: "untrusted_evidence";
  extraction_version: string;
  facts: Array<{ key: string; value: string; unit: string }>;
}
export interface EvidenceRequirement {
  category: string;
  label: string;
  critical: boolean;
  resolution: string;
  status: "complete" | "missing";
  source_ids: string[];
}
export interface EvidencePackage {
  retrieval: RetrievalMetadata;
  id: string;
  context: Rag24Context;
  authorization_context: {
    tenant_id: string;
    workspace_id: string;
    user_identity: string;
  };
  query: string;
  evidence: Evidence[];
  snapshot_hash: string;
  readiness: "ready" | "blocked";
  checklist: EvidenceRequirement[];
  missing_evidence: EvidenceRequirement[];
  conflicts: Array<Record<string, unknown>>;
  assumptions: string[];
  structured_results: Calculation[];
  created_at: string;
}
export interface RetrievalRequest {
  context: Rag24Context;
  query: string;
  top_k?: number;
  allow_external_processing?: boolean;
  search_mode?: "hybrid" | "exact" | "semantic";
}
export interface RetrievalMetadata {
  strategy: string;
  warnings: string[];
  retrieved_at: string;
  as_of: string;
  search_mode: "hybrid" | "exact" | "semantic";
  semantic_enabled: boolean;
  authorized_sources_searched: number;
}
export interface RetrievalResult extends RetrievalMetadata {
  id: string;
  evidence: Evidence[];
}
export interface PackageRequest extends RetrievalRequest {
  assumptions?: string[];
  calculation_ids?: string[];
}
export interface Claim {
  text: string;
  category?:
    | "regulatory"
    | "fact"
    | "numerical"
    | "interpretation"
    | "judgment"
    | "assumption"
    | "narrative";
  citation_ids?: string[];
  calculation_id?: string | null;
}
export interface Verification {
  id?: string;
  package_id: string;
  finalization_allowed: boolean;
  claims: Array<
    Claim & {
      status:
        | "verified"
        | "supported_with_qualifications"
        | "conflicting"
        | "unsupported"
        | "unable_to_verify";
      reason: string;
    }
  >;
  readiness: "ready" | "blocked";
  snapshot_ready: boolean;
  package_action: string | null;
}
export interface SourceMetadata {
  library_id?: string;
  source_url?: string;
  application_id: string;
  domain_pack_version?: string;
  title: string;
  issuer?: string;
  logical_id?: string;
  version?: number;
  category?: string;
  scope?: "tenant" | "domain" | "global";
  entity_id: string;
  jurisdiction?: string;
  publication_date?: string;
  effective_from: string;
  effective_to?: string | null;
  reporting_periods?: number[];
  authority?:
    | "law"
    | "guidance"
    | "standard"
    | "policy"
    | "client"
    | "research"
    | "commentary";
  classification?: "public" | "internal" | "confidential" | "restricted";
  language?: string;
  eligible_applications?: string[];
  license_id?: string;
  usage_restrictions?: string;
  allow_external_processing?: boolean;
}
export interface IngestionJob {
  id: string;
  source_id: string;
  status: string;
  stage: string;
  progress: number;
  attempts: number;
  error: string | null;
  warnings: string[];
}
export interface Calculation {
  id: string;
  context: Rag24Context;
  adapter_id: string;
  formula: string;
  inputs: Array<{
    citation_id: string;
    key: string;
    value: string;
    unit: string;
    source_hash: string;
  }>;
  value: string;
  unit: string;
  statement: string;
  engine_version: string;
  result_hash: string;
}
export interface ReportInput {
  package_id: string;
  title: string;
  claims: Claim[];
}
export interface Report extends ReportInput {
  id: string;
  status: "draft" | "approved";
  verification: Verification;
  snapshot_hash?: string;
  evidence_snapshot?: EvidencePackage;
}
export class Rag24Error extends Error {
  readonly status: number;
  readonly requestId: string | null;
  readonly details: unknown;
  constructor(status: number, requestId: string | null, details: unknown) {
    super(`RAG24 request failed (${status})`);
    this.name = "Rag24Error";
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}
export class Rag24Client {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;
  constructor(options: {
    baseUrl: string;
    apiKey: string;
    fetch?: typeof fetch;
    timeoutMs?: number;
  }) {
    if (typeof window !== "undefined")
      throw new Error(
        "Rag24Client is server-only; never expose service keys to a browser.",
      );
    const url = new URL(options.baseUrl);
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
    ) {
      throw new Error("Use HTTPS for shared RAG24 services.");
    }
    if (!options.apiKey)
      throw new Error("An application access key is required.");
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.fetcher = options.fetch ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 5_000;
    if (
      !Number.isFinite(this.timeoutMs) ||
      this.timeoutMs < 1 ||
      this.timeoutMs > 120_000
    )
      throw new Error("timeoutMs must be between 1 and 120000");
  }
  private async request<T>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error("RAG24 deadline exceeded"));
      }, this.timeoutMs);
    });
    const operation = async () => {
      const form = body instanceof FormData;
      const response = await this.fetcher(`${this.baseUrl}/rag/v1${path}`, {
        method,
        redirect: "error",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...(body && !form ? { "Content-Type": "application/json" } : {}),
        },
        body:
          body === undefined ? undefined : form ? body : JSON.stringify(body),
      });
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new Rag24Error(
          response.ok ? 502 : response.status,
          response.headers.get("X-Request-ID"),
          { error: "Invalid JSON service response" },
        );
      }
      if (!response.ok)
        throw new Rag24Error(
          response.status,
          response.headers.get("X-Request-ID"),
          data,
        );
      return data as T;
    };
    try {
      return await Promise.race([operation(), timeout]);
    } finally {
      clearTimeout(timer!);
    }
  }

  evidencePackage(body: PackageRequest) {
    return this.request<EvidencePackage>("/evidence-packages", "POST", body);
  }
  retrieve(body: RetrievalRequest) {
    return this.request<RetrievalResult>("/retrieve", "POST", body);
  }
  verify(packageId: string, claims: Claim[]) {
    return this.request<Verification>("/claims/verify", "POST", {
      package_id: packageId,
      claims,
    });
  }
  citation(id: string) {
    return this.request<Evidence>(`/citations/${encodeURIComponent(id)}`);
  }
  verifySource(id: string, context: Rag24Context) {
    return this.request<{
      source_id: string;
      approved: boolean;
      applicable: boolean;
      integrity_valid: boolean;
      legal_conclusion_verified: false;
    }>(`/sources/${encodeURIComponent(id)}/verify`, "POST", context);
  }
  lineage(id: string) {
    return this.request<Record<string, unknown>>(
      `/lineage/${encodeURIComponent(id)}`,
    );
  }
  ingest(source: SourceMetadata, text: string, idempotencyKey: string) {
    return this.request<IngestionJob>("/ingestions", "POST", {
      source,
      text,
      idempotency_key: idempotencyKey,
    });
  }
  upload(
    source: SourceMetadata,
    file: Blob,
    filename: string,
    idempotencyKey: string,
  ) {
    const form = new FormData();
    form.set("file", file, filename);
    form.set("metadata", JSON.stringify(source));
    form.set("idempotency_key", idempotencyKey);
    return this.request<IngestionJob>("/ingestions/upload", "POST", form);
  }
  ingestion(id: string) {
    return this.request<IngestionJob>(`/ingestions/${encodeURIComponent(id)}`);
  }
  retryIngestion(id: string) {
    return this.request<IngestionJob>(
      `/ingestions/${encodeURIComponent(id)}/retry`,
      "POST",
    );
  }
  sourceDecision(
    id: string,
    status: "approved" | "inactive" | "rejected",
    note: string,
  ) {
    return this.request<SourceMetadata>(
      `/sources/${encodeURIComponent(id)}/decision`,
      "POST",
      { status, note },
    );
  }
  knowledgeStatus(context: Rag24Context) {
    const query = new URLSearchParams({
      application_id: context.application_id,
      entity_id: context.entity_id,
      reporting_period: String(context.reporting_period),
      jurisdiction: context.jurisdiction ?? "TH",
      domain_pack_version: context.domain_pack_version ?? "1.0.0",
    });
    return this.request<{
      readiness: string;
      checklist: EvidenceRequirement[];
    }>(`/knowledge-status?${query}`);
  }
  calculate(
    context: Rag24Context,
    adapterId: string,
    inputs: Array<{ citation_id: string; fact_key: string }>,
  ) {
    return this.request<Calculation>("/calculations", "POST", {
      context,
      adapter_id: adapterId,
      inputs,
    });
  }
  createReport(body: ReportInput) {
    return this.request<Report>("/reports", "POST", body);
  }
  reviseReport(id: string, body: ReportInput) {
    return this.request<Report>(
      `/reports/${encodeURIComponent(id)}`,
      "PUT",
      body,
    );
  }
  approveReport(id: string, note: string) {
    return this.request<Report>(
      `/reports/${encodeURIComponent(id)}/approve`,
      "POST",
      { note },
    );
  }
  impactAnalysis(sourceId: string) {
    return this.request<Record<string, unknown>>("/impact-analysis", "POST", {
      source_id: sourceId,
    });
  }
  registerDomainPack(body: Record<string, unknown>) {
    return this.request<Record<string, unknown>>("/domain-packs", "POST", body);
  }
  applications() {
    return this.request<ApplicationProfile[]>("/applications");
  }
  domainPacks() {
    return this.request<Array<Record<string, unknown>>>("/domain-packs");
  }
}

export { Rag24Integration } from "./integration";
export type {
  IntegrationResult,
  IntegrationOptions,
  IntegrationStage,
  IntegrationWorkflow,
} from "./integration";
