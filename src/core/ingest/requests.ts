import { contentHash } from "../report/hash";
import { addDays } from "../dates";
import { audit, now } from "./control";
import type { DataRequest, IngestionState, MissingEvidence } from "./types";

/**
 * COP-DI-11 Evidence Request Assistant. Drafts are personalised and explain what, why, period,
 * format, deadline and a scoped upload link. Nothing external is sent without approval under
 * the mission's authorisation policy.
 */
export interface Recipient { name: string; role: string; email?: string; external: boolean; language: "th" | "en" }

const fmtTH = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return `${d}/${m}/${y + 543}`; };

export function draftRequest(s: IngestionState, m: MissingEvidence, to: Recipient): DataRequest {
  const token = contentHash(`${s.tenantId}:${s.projectId}:${m.id}:${to.name}`);
  const period = `${fmtTH(s.context.periodFrom)} – ${fmtTH(s.context.periodTo)}`;
  const link = { token, scope: `upload:${s.projectId}:${m.evidenceTypeId}`, expiresAt: addDays(m.deadline, 7) };
  const url = `https://cop24.vercel.app/upload/${token}`;
  const th = {
    subject: `ขอเอกสาร: ${m.missing.th} — ${s.profile?.name.value ?? s.projectId}`,
    body: `เรียน คุณ${to.name} (${to.role})\n\nเพื่อจัดทำ${s.context.report === "monitoring" ? "รายงานผลการปฏิบัติตามประมวลหลักการปฏิบัติ" : s.context.report === "final" ? "รายงาน CoP ขั้นสุดท้าย" : "รายงาน CoP ขั้นต้น"} ประจำปี ${s.context.year + 543} ขอความอนุเคราะห์ส่ง:\n• ${m.missing.th}\n\nเหตุที่ต้องใช้: ${m.requirement.th} (อ้างอิง ${m.reference.sourceId}${m.reference.clause ? " " + m.reference.clause : ""})\nช่วงเวลาที่ต้องการ: ${period}\nรูปแบบ: ไฟล์ต้นฉบับ (PDF/Excel/ภาพถ่าย) ที่มีลายมือชื่อหรือผู้รับรองตามปกติ\nกำหนดส่ง: ${fmtTH(m.deadline)}\n\nอัปโหลดผ่านลิงก์ที่ปลอดภัย (เฉพาะรายการนี้ ไม่ต้องมีบัญชี ใช้ได้ถึง ${fmtTH(link.expiresAt)}):\n${url}\n\nหากยังไม่มีเอกสารนี้ กรุณาตอบกลับเพื่อบันทึกเหตุผลไว้ในรายงาน\n\nขอบคุณครับ/ค่ะ`,
  };
  const en = {
    subject: `Evidence request: ${m.missing.en} — ${s.profile?.name.value ?? s.projectId}`,
    body: `Dear ${to.name} (${to.role}),\n\nFor the ${s.context.year} ${s.context.report === "monitoring" ? "CoP monitoring report" : `${s.context.report} CoP report`}, please provide:\n• ${m.missing.en}\n\nWhy it is needed: ${m.requirement.en} (ref. ${m.reference.sourceId}${m.reference.clause ? " " + m.reference.clause : ""})\nPeriod: ${s.context.periodFrom} – ${s.context.periodTo}\nFormat: the original signed or certified file (PDF, Excel or photos)\nDeadline: ${m.deadline}\n\nUpload through this secure link (this item only, no account needed, valid until ${link.expiresAt}):\n${url}\n\nIf the document does not exist yet, please reply so the reason can be recorded.\n\nThank you.`,
  };
  const msg = to.language === "th" ? th : en;
  const req: DataRequest = { id: `REQ-${m.evidenceTypeId.slice(3)}-${s.requests.length + 1}`, missingId: m.id, recipient: { name: to.name, role: to.role, email: to.email, external: to.external }, language: to.language, subject: msg.subject, body: msg.body, deadline: m.deadline, uploadLink: link, status: "awaiting-approval" };
  s.requests.push(req);
  m.requestId = req.id;
  audit(s, { actor: "Collection Agent", actorKind: "agent", action: "draft-request", object: req.id, detail: `${m.evidenceTypeId} → ${to.name} (${to.external ? "external" : "internal"})`, result: "ok" });
  return req;
}

/**
 * Approval is per request unless the mission policy pre-approves internal recipients.
 * External messages always need explicit approval. Sending is recorded; delivery itself is done
 * by the backend mailer, which is not connected in this build (status stays "approved").
 */
export function approveRequest(s: IngestionState, requestId: string, by: string) {
  const r = s.requests.find((x) => x.id === requestId);
  if (!r) throw new Error(`unknown request ${requestId}`);
  r.status = "approved";
  r.approvedBy = by;
  s.approvals.push({ id: `APR-${s.approvals.length + 1}`, subject: { kind: "request", id: r.id }, decision: "approve", by, at: now() });
  audit(s, { actor: by, actorKind: "human", action: "approve-request", object: r.id, detail: r.recipient.external ? "external recipient" : "internal recipient", result: "ok" });
}

export function canSend(r: DataRequest, policy: "never" | "each-approval" | "pre-approved-internal" | undefined, allowedRecipients: string[]): { ok: boolean; reason: string } {
  const listed = allowedRecipients.includes(r.recipient.email ?? r.recipient.name) || allowedRecipients.includes(r.recipient.role);
  if (!listed) return { ok: false, reason: "recipient not in the mission's authorised recipient scope" };
  if (!policy || policy === "never") return { ok: false, reason: "mission policy does not allow sending" };
  if (r.recipient.external && r.status !== "approved") return { ok: false, reason: "external message needs explicit approval" };
  if (policy === "each-approval" && r.status !== "approved") return { ok: false, reason: "each request needs approval under this policy" };
  return { ok: true, reason: r.status === "approved" ? "approved" : "pre-approved internal recipient" };
}
