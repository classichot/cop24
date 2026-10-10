import { t } from "../i18n-text";
import type { LText } from "../types";
import { analyze, readiness } from "./analyze";
import { audit, ingest, now } from "./control";
import { canSend, draftRequest, type Recipient } from "./requests";
import type { AgentMission, IngestionState, MissionAuthorization, MissionStep, MissionStepKind, ParsedDocument, Phase, ReportKind } from "./types";

/**
 * COP-DI-10 AI Handoff mission engine — an executable, checkpointed state machine, not advice.
 * Each step is idempotent and resumable from `cursor`; the whole mission is plain data, so the
 * same runner works in the browser (IndexedDB) and in a backend worker (PostgreSQL + queue).
 * External actions run only inside the authorisation the user granted; revocation stops them.
 */

const STEP_TITLES: Record<MissionStepKind, LText> = {
  "determine-report": t("ระบุรายงานเป้าหมายและข้อผูกพัน", "Determine target report and obligations"),
  "discover-sources": t("ค้นหาข้อมูลและแหล่งที่ได้รับอนุญาต", "Discover existing data and authorised sources"),
  "plan-collection": t("วางแผนการรวบรวมข้อมูล", "Create the collection plan"),
  "identify-owners": t("ระบุเจ้าของเอกสารและผู้รับที่อนุญาต", "Identify owners and approved recipients"),
  "collect-authorized": t("ดึงข้อมูลจากแหล่งที่อนุญาต", "Collect from authorised sources"),
  "prepare-requests": t("ร่างคำขอเอกสารที่ขาด", "Draft missing-evidence requests"),
  "send-approved-requests": t("ส่งคำขอที่ได้รับอนุมัติ", "Send approved requests"),
  "track-responses": t("ติดตามการตอบกลับและลิงก์อัปโหลด", "Track responses and upload links"),
  "ingest-returned": t("นำเข้าเอกสารที่ได้รับกลับมา", "Ingest returned documents"),
  validate: t("ตรวจสอบและกระทบยอดข้อมูลใหม่", "Validate and reconcile new data"),
  escalate: t("ส่งเรื่องที่แก้ไม่ได้ให้คนตัดสิน", "Escalate exceptions to humans"),
  package: t("ส่งชุดข้อมูลที่ตรวจแล้วให้ระบบรายงาน", "Hand the verified package to report generation"),
};
const ORDER = Object.keys(STEP_TITLES) as MissionStepKind[];

/** Deterministic parse of the instruction — no model needed to read the target. */
export function parseInstruction(text: string, fallbackYear: number): { report: ReportKind; year: number; phase?: Phase } {
  const s = text.toLowerCase();
  const report: ReportKind = /monitor|ติดตาม|ผลการปฏิบัติตาม/u.test(s) ? "monitoring" : /final|ขั้นสุดท้าย/u.test(s) ? "final" : "preliminary";
  const y = s.match(/\b(20\d{2}|25\d{2})\b/);
  const year = y ? (Number(y[1]) > 2400 ? Number(y[1]) - 543 : Number(y[1])) : fallbackYear;
  const phase: Phase | undefined = /construction|ก่อสร้าง/u.test(s) ? "construction" : /operation|ดำเนินการ/u.test(s) ? "operation" : undefined;
  return { report, year, phase };
}

export function planMission(s: IngestionState, instruction: string, createdBy: string): AgentMission {
  const target = parseInstruction(instruction, s.context.year);
  const m: AgentMission = {
    id: `MSN-${Date.now().toString(36)}`, tenantId: s.tenantId, projectId: s.projectId, instruction, target,
    status: "awaiting-authorization", steps: ORDER.map((kind) => ({ kind, title: STEP_TITLES[kind], status: "pending", attempts: 0 } as MissionStep)),
    cursor: 0, spentTHB: 0, log: [], createdAt: now(), updatedAt: now(),
  };
  s.missions.push(m);
  audit(s, { actor: createdBy, actorKind: "human", action: "plan-mission", object: m.id, detail: instruction, result: "ok" });
  return m;
}

export function authorize(s: IngestionState, missionId: string, a: Omit<MissionAuthorization, "grantedAt">) {
  const m = s.missions.find((x) => x.id === missionId)!;
  m.authorization = { ...a, grantedAt: now() };
  m.status = "running";
  audit(s, { actor: a.grantedBy, actorKind: "human", action: "authorize-mission", object: m.id, detail: `sources ${a.sources.join(",")} · recipients ${a.recipients.length} · send ${a.externalActions.sendRequests} · limit ${a.spendLimitTHB} THB`, result: "ok" });
}

export function revoke(s: IngestionState, missionId: string, by: string) {
  const m = s.missions.find((x) => x.id === missionId)!;
  if (m.authorization) m.authorization.revokedAt = now();
  m.status = "paused";
  audit(s, { actor: by, actorKind: "human", action: "revoke-mission-authorization", object: m.id, result: "ok" });
}

export const pause = (s: IngestionState, id: string, by: string) => control(s, id, by, "paused");
export const resume = (s: IngestionState, id: string, by: string) => control(s, id, by, "running");
export const cancel = (s: IngestionState, id: string, by: string) => control(s, id, by, "cancelled");
function control(s: IngestionState, id: string, by: string, status: AgentMission["status"]) {
  const m = s.missions.find((x) => x.id === id)!;
  if (status === "running" && m.authorization?.revokedAt) throw new Error("authorisation was revoked — grant it again before resuming");
  if (m.status === "cancelled" || m.status === "completed") return;
  m.status = status;
  m.updatedAt = now();
  audit(s, { actor: by, actorKind: "human", action: `mission-${status}`, object: id, result: "ok" });
}

export interface MissionEnv {
  /** Authorised sources the runner may read (connector adapters). Returns new parsed documents. */
  collect: (sourceId: string) => Promise<ParsedDocument[]> | ParsedDocument[];
  /** Directory of people/roles who own evidence types. */
  owners: (evidenceTypeId: string) => Recipient | undefined;
  /** Delivers an approved message; the browser build has no mailer, so it only records intent. */
  deliver?: (requestId: string) => Promise<boolean> | boolean;
  /** Documents returned through upload links since the last run. */
  returned: () => Promise<ParsedDocument[]> | ParsedDocument[];
  costPerDocumentTHB?: number;
}

const log = (s: IngestionState, m: AgentMission, agent: string, action: string, result: "ok" | "blocked" | "failed" | "info", detail?: string) => {
  m.log.push({ at: now(), agent, action, result, detail });
  audit(s, { actor: `${agent}`, actorKind: "agent", action, object: m.id, detail, result: result === "failed" ? "failed" : result === "blocked" ? "rejected" : "ok" });
};

/**
 * Run the mission from its checkpoint until it completes, pauses, waits for responses or is
 * blocked. Safe to call repeatedly (e.g. by a backend scheduler).
 */
export async function runMission(s: IngestionState, missionId: string, env: MissionEnv): Promise<AgentMission> {
  const m = s.missions.find((x) => x.id === missionId)!;
  if (m.status !== "running" && m.status !== "waiting-for-responses") return m;
  const auth = m.authorization;
  if (!auth || auth.revokedAt) {
    m.status = "paused";
    log(s, m, "Mission", "run", "blocked", "no valid authorisation");
    return m;
  }
  m.status = "running";
  while (m.cursor < m.steps.length && m.status === "running") {
    const step = m.steps[m.cursor];
    step.status = "running";
    step.startedAt ??= now();
    step.attempts++;
    try {
      const outcome = await runStep(s, m, step.kind, env);
      if (outcome === "wait") { step.status = "running"; m.status = "waiting-for-responses"; break; }
      step.status = outcome === "skip" ? "skipped" : "done";
      step.endedAt = now();
      m.cursor++;
    } catch (e) {
      step.status = step.attempts >= 3 ? "failed" : "pending";
      log(s, m, "Mission", step.kind, "failed", (e as Error).message);
      if (step.attempts >= 3) { m.status = "failed"; break; }
    }
    m.updatedAt = now();
  }
  if (m.cursor >= m.steps.length && m.status === "running") {
    m.status = "completed";
    const r = readiness(s);
    m.outcome = t(`พร้อม ${r.pct}% · ยืนยันแล้ว ${r.verified} · ต้องตรวจ ${r.review} · ขาด ${r.missing} — ส่งต่อให้ผู้ตรวจเฉพาะข้อยกเว้น`, `${r.pct}% ready · ${r.verified} verified · ${r.review} need review · ${r.missing} missing — exceptions handed to reviewers`);
  }
  return m;
}

async function runStep(s: IngestionState, m: AgentMission, kind: MissionStepKind, env: MissionEnv): Promise<"done" | "skip" | "wait"> {
  const auth = m.authorization!;
  switch (kind) {
    case "determine-report": {
      s.context = { ...s.context, report: m.target.report, year: m.target.year, periodFrom: `${m.target.year}-01-01`, periodTo: `${m.target.year}-12-31`, phase: m.target.phase ?? s.context.phase, dueDate: m.target.report === "monitoring" ? `${m.target.year + 1}-01-31` : s.context.dueDate };
      analyze(s);
      log(s, m, "Project Recognition Agent", kind, "ok", `${m.target.report} ${m.target.year} · ${s.checklist.filter((c) => c.level !== "not-applicable").length} applicable evidence items (${s.checklist.filter((c) => c.level === "mandatory").length} mandatory)`);
      return "done";
    }
    case "discover-sources": {
      const usable = s.sources.filter((x) => auth.sources.includes(x.id) && !x.revokedAt);
      log(s, m, "Discovery Agent", kind, "ok", `${usable.length} authorised source(s); ${s.documents.length} document(s) already held — not requested again`);
      return "done";
    }
    case "plan-collection": {
      log(s, m, "Compliance Mapping Agent", kind, "ok", `${s.missing.length} missing item(s): ${s.missing.map((x) => `${x.evidenceTypeId}→${x.collectionMethod}`).join(", ") || "none"}`);
      return "done";
    }
    case "identify-owners": {
      const unknown = s.missing.filter((x) => !env.owners(x.evidenceTypeId)).length;
      log(s, m, "Collection Agent", kind, unknown ? "info" : "ok", unknown ? `${unknown} item(s) have no owner on file — escalated` : "every item has an owner");
      return "done";
    }
    case "collect-authorized": {
      let got = 0;
      for (const src of auth.sources) {
        const conn = s.sources.find((x) => x.id === src);
        if (!conn || conn.revokedAt || conn.tenantId !== s.tenantId) { log(s, m, "Discovery Agent", kind, "blocked", `source ${src} not usable`); continue; }
        const docs = await env.collect(src);
        const cost = (env.costPerDocumentTHB ?? 0) * docs.length;
        if (m.spentTHB + cost > auth.spendLimitTHB) { log(s, m, "Discovery Agent", kind, "blocked", `spend limit ${auth.spendLimitTHB} THB would be exceeded`); m.status = "paused"; return "done"; }
        m.spentTHB += cost;
        ingest(s, docs, "Discovery Agent", src);
        got += docs.length;
      }
      analyze(s);
      log(s, m, "Discovery Agent", kind, "ok", `${got} file(s) read from authorised sources`);
      return got ? "done" : "skip";
    }
    case "prepare-requests": {
      let n = 0;
      for (const item of s.missing.filter((x) => x.status === "open" && x.collectionMethod !== "reuse-prior" && x.collectionMethod !== "authorized-source")) {
        if (item.requestId && s.requests.some((r) => r.id === item.requestId && r.status !== "cancelled")) continue; // never ask twice
        const to = env.owners(item.evidenceTypeId);
        if (!to) continue;
        draftRequest(s, item, to);
        n++;
      }
      log(s, m, "Collection Agent", kind, "ok", `${n} request draft(s) prepared`);
      return "done";
    }
    case "send-approved-requests": {
      let sent = 0, held = 0, pending = 0;
      for (const r of s.requests.filter((x) => x.status === "approved" || x.status === "awaiting-approval")) {
        const ok = canSend(r, auth.externalActions.sendRequests, auth.recipients);
        if (!ok.ok) { held++; log(s, m, "Collection Agent", "send-request", "blocked", `${r.id}: ${ok.reason}`); continue; }
        const delivered = env.deliver ? await env.deliver(r.id) : false;
        if (delivered) { r.status = "sent"; r.sentAt = now(); r.deliveryPending = false; sent++; s.missing.find((x) => x.id === r.missingId)!.status = "requested"; }
        else { r.status = "approved"; r.deliveryPending = true; pending++; log(s, m, "Collection Agent", "send-request", "info", `${r.id}: approved; no mailer connected in this build — delivery pending`); }
      }
      log(s, m, "Collection Agent", kind, held ? "info" : "ok", `${sent} sent · ${pending} approved, awaiting manual send · ${held} held for approval or out of scope`);
      return "done";
    }
    case "track-responses": {
      const outstanding = s.requests.filter((r) => r.status === "sent").length;
      const unsent = s.requests.filter((r) => r.status === "approved" && r.deliveryPending).length;
      log(s, m, "Collection Agent", kind, "ok", `${outstanding} outstanding response(s)${unsent ? ` · ${unsent} approved request(s) still to be sent by a person` : ""}`);
      return "done";
    }
    case "ingest-returned": {
      const docs = await env.returned();
      if (!docs.length) {
        const waiting = s.requests.some((r) => r.status === "sent" || (r.status === "approved" && r.deliveryPending));
        log(s, m, "Collection Agent", kind, "info", waiting ? "waiting for responses — the mission resumes when files arrive" : "nothing returned");
        return waiting ? "wait" : "skip";
      }
      const linkSrc = s.sources.find((x) => x.kind === "upload-link") ?? { id: "SRC-UPLOAD-LINKS" };
      if (!s.sources.some((x) => x.id === linkSrc.id)) s.sources.push({ id: linkSrc.id, kind: "upload-link", label: "Secure upload links", readOnly: true, authorizedBy: auth.grantedBy, authorizedAt: now(), tenantId: s.tenantId });
      ingest(s, docs, "Collection Agent", linkSrc.id);
      analyze(s);
      // a request is answered only when its missing item is now covered — a returned file never closes other requests
      const open = (r: (typeof s.requests)[number]) => r.status === "sent" || (r.status === "approved" && !!r.deliveryPending);
      let answered = 0;
      for (const r of s.requests.filter(open)) if (!s.missing.some((x) => x.id === r.missingId)) { r.status = "responded"; r.deliveryPending = false; answered++; }
      const still = s.requests.filter(open);
      log(s, m, "Collection Agent", kind, "ok", `${docs.length} returned file(s) ingested · ${answered} request(s) answered${still.length ? ` · still waiting on ${still.map((r) => r.id).join(", ")}` : ""}`);
      return still.length ? "wait" : "done";
    }
    case "validate": {
      analyze(s);
      log(s, m, "Validation Agent", kind, "ok", `${s.findings.filter((f) => f.status === "open").length} open finding(s)`);
      return "done";
    }
    case "escalate": {
      const crit = s.findings.filter((f) => f.status === "open" && (f.severity === "critical" || f.severity === "major"));
      log(s, m, "Exception Agent", kind, crit.length ? "info" : "ok", crit.length ? `${crit.length} exception(s) routed to human review: ${crit.slice(0, 4).map((f) => f.code).join(", ")}` : "no exceptions");
      return "done";
    }
    case "package": {
      const r = readiness(s);
      log(s, m, "Report Handoff Agent", kind, "ok", `package for 24ReportCore: ${r.verified + r.received}/${r.applicable} evidence items available · unresolved items stay marked as gaps`);
      return "done";
    }
  }
}
