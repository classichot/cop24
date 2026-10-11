/* Vendored from RAG24 (github.com/classichot/RAG24) sdk/typescript/src/integration.ts @ 952c00b. Do not edit here — change RAG24, then run npm run rag24:sync-sdk. */
import { Rag24Client } from "./index";
import type {
  Claim,
  Evidence,
  EvidencePackage,
  Rag24Context,
  RetrievalMetadata,
} from "./index";

export type IntegrationStage = "disabled" | "search_pilot" | "workflows";
export type IntegrationWorkflow =
  | "search"
  | "regulatory_check"
  | "report_generation"
  | "studio"
  | "report_review"
  | "legal_research"
  | "contract_drafting"
  | "clause_comparison"
  | "contract_review";
export interface IntegrationOptions {
  applicationId: "COP24" | "LAW24";
  domainPackVersion: string;
  stage?: IntegrationStage;
  timeoutMs?: number;
  failureThreshold?: number;
  recoveryMs?: number;
  baseUrl: string;
  apiKey: string;
  fetch?: typeof fetch;
  audit?: (event: {
    application: string;
    workflow: string;
    status: string;
    reason: string;
  }) => void | Promise<void>;
}
export interface IntegrationResult {
  status:
    "disabled" | "unavailable" | "missing_evidence" | "evidence_available";
  reason: string;
  evidence: Evidence[];
  package?: EvidencePackage;
  warnings: string[];
  retrieval?: RetrievalMetadata;
  authority_verified: false;
  final_output_approved: false;
}
const workflows = {
  COP24: [
    "search",
    "regulatory_check",
    "report_generation",
    "studio",
    "report_review",
  ],
  LAW24: [
    "legal_research",
    "contract_drafting",
    "clause_comparison",
    "contract_review",
  ],
};

/** Keep one instance per scoped service credential on the application backend.
 * No local/private evidence cache. Existing application engines remain the caller's responsibility.
 */
export class Rag24Integration {
  private readonly client: Rag24Client | null;
  private stage: IntegrationStage;
  private rolloutRevision = 0;
  private failures = 0;
  private openUntil = 0;
  private probing = false;
  private readonly threshold: number;
  private readonly recoveryMs: number;
  constructor(private readonly options: IntegrationOptions) {
    this.stage = options.stage ?? "disabled";
    this.threshold = options.failureThreshold ?? 3;
    this.recoveryMs = options.recoveryMs ?? 30_000;
    if (
      !Number.isInteger(this.threshold) ||
      this.threshold < 1 ||
      !Number.isFinite(this.recoveryMs) ||
      this.recoveryMs < 1
    )
      throw new Error("Invalid circuit breaker configuration");
    try {
      this.client = new Rag24Client({
        ...options,
        timeoutMs: options.timeoutMs ?? 2500,
      });
    } catch {
      this.client = null;
    }
  }
  setStage(stage: IntegrationStage) {
    this.stage = stage;
    this.rolloutRevision++;
  }
  private emit(workflow: string, status: string, reason: string) {
    try {
      Promise.resolve(
        this.options.audit?.({
          application: this.options.applicationId,
          workflow,
          status,
          reason,
        }),
      ).catch(() => {});
    } catch {
      /* Host telemetry failure must not break an application. */
    }
  }
  private result(
    workflow: string,
    status: IntegrationResult["status"],
    reason: string,
    evidence: Evidence[] = [],
    pkg?: EvidencePackage,
    warnings: string[] = [],
    retrieval?: RetrievalMetadata,
  ): IntegrationResult {
    this.emit(workflow, status, reason);
    return {
      status,
      reason,
      evidence,
      ...(pkg ? { package: pkg } : {}),
      warnings,
      ...(retrieval ? { retrieval } : {}),
      authority_verified: false,
      final_output_approved: false,
    };
  }
  private async guarded<T>(operation: () => Promise<T>): Promise<T> {
    if (this.openUntil > Date.now() || this.probing)
      throw new Error("circuit_open");
    const probe = this.openUntil !== 0;
    if (probe) this.probing = true;
    try {
      const value = await operation();
      this.failures = 0;
      this.openUntil = 0;
      return value;
    } catch (error) {
      if (++this.failures >= this.threshold || probe)
        this.openUntil = Date.now() + this.recoveryMs;
      throw error;
    } finally {
      if (probe) this.probing = false;
    }
  }
  async evidence(
    workflow: IntegrationWorkflow,
    context: Omit<Rag24Context, "application_id" | "domain_pack_version">,
    query: string,
    searchMode: "hybrid" | "exact" | "semantic" = "hybrid",
    allowExternalProcessing = false,
  ): Promise<IntegrationResult> {
    if (this.stage === "disabled")
      return this.result(workflow, "disabled", "integration_disabled");
    const client = this.client;
    if (!client)
      return this.result(
        workflow,
        "unavailable",
        "integration_configuration_unavailable",
      );
    if (!workflows[this.options.applicationId].includes(workflow))
      return this.result(workflow, "disabled", "unsupported_workflow");
    const searchOnly = workflow === "search" || workflow === "legal_research";
    if (this.stage === "search_pilot" && !searchOnly)
      return this.result(workflow, "disabled", "workflow_not_enabled");
    const capturedRevision = this.rolloutRevision;
    const ctx = {
      ...context,
      application_id: this.options.applicationId,
      domain_pack_version: this.options.domainPackVersion,
      task_id: workflow,
    };
    try {
      const data = await this.guarded(async () => {
        const request = {
          context: ctx,
          query,
          search_mode: searchMode,
          allow_external_processing: allowExternalProcessing,
        };
        const data = searchOnly
          ? await client.retrieve(request)
          : await client.evidencePackage(request);
        const day = ctx.as_of || `${ctx.reporting_period}-12-31`;
        if (
          !Array.isArray(data.evidence) ||
          !data.evidence.every(
            (e) =>
              e &&
              typeof e.id === "string" &&
              typeof e.source_id === "string" &&
              typeof e.title === "string" &&
              e.title.length > 0 &&
              typeof e.text === "string" &&
              e.text.length > 0 &&
              e.location &&
              Object.keys(e.location).length > 0 &&
              typeof e.original_url === "string" &&
              Number.isInteger(e.source_version) &&
              e.source_version > 0 &&
              typeof e.source_hash === "string" &&
              e.source_status === "approved" &&
              e.applicable === true &&
              /^\d{4}-\d{2}-\d{2}$/.test(e.effective_from) &&
              e.effective_from <= day &&
              (e.effective_to === null ||
                (/^\d{4}-\d{2}-\d{2}$/.test(e.effective_to) &&
                  e.effective_to >= day)),
          )
        )
          throw new Error("Invalid evidence response");
        if (!searchOnly) {
          const pkg = data as EvidencePackage;
          if (
            pkg.context?.application_id !== ctx.application_id ||
            pkg.context?.entity_id !== ctx.entity_id ||
            pkg.context?.domain_pack_version !== ctx.domain_pack_version ||
            pkg.context?.reporting_period !== ctx.reporting_period ||
            !["ready", "blocked"].includes(pkg.readiness)
          )
            throw new Error("Invalid package context");
        }
        return data;
      });
      // A rollback that occurred while the request was in flight must also suppress its result.
      if (this.rolloutRevision !== capturedRevision)
        return this.result(workflow, "disabled", "rollout_changed");
      const pkg = searchOnly ? undefined : (data as EvidencePackage);
      const retrieval = "retrieval" in data ? data.retrieval : data;
      const warnings = retrieval?.warnings || [];
      const missing = !data.evidence.length || pkg?.readiness === "blocked";
      return this.result(
        workflow,
        missing ? "missing_evidence" : "evidence_available",
        missing ? "support_incomplete" : "requires_claim_and_human_review",
        data.evidence,
        pkg,
        warnings,
        retrieval,
      );
    } catch {
      return this.result(
        workflow,
        "unavailable",
        "evidence_service_unavailable",
      );
    }
  }
  async verifyAuthority(
    result: IntegrationResult,
    claims: Claim[],
  ): Promise<{
    authority_supported: boolean;
    final_output_approved: false;
    reason: string;
  }> {
    const blocked = (reason: string) => ({
      authority_supported: false,
      final_output_approved: false as const,
      reason,
    });
    const pkg = result.package;
    const client = this.client;
    const capturedRevision = this.rolloutRevision;
    if (!client) return blocked("integration_configuration_unavailable");
    if (
      this.stage !== "workflows" ||
      result.status !== "evidence_available" ||
      !pkg ||
      pkg.context.application_id !== this.options.applicationId ||
      !claims.length ||
      claims.some(
        (c) =>
          c.category !== "regulatory" ||
          !c.citation_ids?.length ||
          c.calculation_id,
      )
    )
      return blocked("authority_not_verified");
    try {
      const check = await this.guarded(() => client.verify(pkg.id, claims));
      const supported =
        this.stage === "workflows" &&
        this.rolloutRevision === capturedRevision &&
        check.package_id === pkg.id &&
        check.finalization_allowed === true &&
        check.snapshot_ready === true &&
        check.readiness === "ready" &&
        check.claims?.length === claims.length &&
        check.claims.every(
          (c, i) =>
            c.status === "verified" &&
            c.text === claims[i].text &&
            c.category === "regulatory",
        );
      this.emit(
        pkg.context.task_id || "authority_check",
        supported ? "supported" : "missing_evidence",
        "authority_check",
      );
      return {
        authority_supported: supported,
        final_output_approved: false,
        reason: supported
          ? "evidence_supported_human_approval_required"
          : "authority_not_verified",
      };
    } catch {
      this.emit(
        "authority_check",
        "unavailable",
        "evidence_service_unavailable",
      );
      return blocked("evidence_service_unavailable");
    }
  }
}
