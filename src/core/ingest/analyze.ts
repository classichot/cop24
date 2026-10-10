import { t } from "../i18n-text";
import { addDays } from "../dates";
import { audit } from "./control";
import { cleanText } from "./normalize";
import { EVIDENCE_TYPES, RULESET_VERSION, STANDARDS, type RegulationVersion } from "./rules";
import type { ChecklistItem, Document, EvidenceLink, ExtractedField, IngestionState, MissingEvidence, ProfileValue, ProjectMasterProfile, ValidationFinding } from "./types";

/**
 * COP-DI-01 profile, 02 checklist, 06 mapping, 07 prior reports, 08 validation, 09 missing evidence.
 * Recomputed from the state on every change; deterministic for the same inputs.
 */

const active = (s: IngestionState) => s.documents.filter((d) => d.documentStatus === "active");
const fieldsOf = (s: IngestionState, key: string, docs = active(s)) => s.fields.filter((f) => f.key === key && docs.some((d) => d.id === f.locator.documentId));

function vote<T extends string | number>(fields: ExtractedField[]): ProfileValue<T> {
  const vals = fields.filter((f) => f.normalized !== undefined && f.state === "value");
  if (!vals.length) return { status: "unknown", sources: [] };
  const verified = vals.find((f) => f.confidence.approval === "approved" || f.confidence.approval === "corrected");
  if (verified) return { value: verified.normalized as T, status: "verified", sources: [verified.id] };
  const counts = new Map<string, ExtractedField[]>();
  for (const f of vals) counts.set(String(f.normalized), [...(counts.get(String(f.normalized)) ?? []), f]);
  const ranked = [...counts.entries()].sort((a, b) => b[1].length - a[1].length);
  const value = ranked[0][1][0].normalized as T;
  return { value, status: ranked.length > 1 ? "conflict" : "suggested", sources: ranked.flatMap(([, fs]) => fs.map((f) => f.id)), alternatives: ranked.length > 1 ? ranked.slice(1).map(([, fs]) => fs[0].normalized as T) : undefined };
}

/** COP-DI-01. Suggestions only: an ambiguous project is never concluded in or out of scope. */
export function recognize(s: IngestionState): ProjectMasterProfile {
  // licence and own-project documents carry identity; prior reports and foreign plants do not override it
  const own = active(s).filter((d) => !isOtherEntity(s, d));
  const pick = (key: string) => fieldsOf(s, key, own.filter((d) => d.categories.some((c) => c.category === "licence"))).length ? fieldsOf(s, key, own.filter((d) => d.categories.some((c) => c.category === "licence"))) : fieldsOf(s, key, own);
  const tech = vote<string>(pick("project.technology"));
  const profile: ProjectMasterProfile = {
    projectId: s.projectId,
    name: vote(pick("project.name")),
    owner: vote(pick("project.owner")),
    location: vote(pick("site.location")),
    coordinates: vote(pick("site.coordinates")),
    technology: tech,
    capacityAcMW: vote(fieldsOf(s, "capacity.ac", own)),
    capacityDcMWp: vote(fieldsOf(s, "capacity.dc", own)),
    licenceNumber: vote(pick("licence.number")),
    licenceValidUntil: vote(fieldsOf(s, "validity.until", own.filter((d) => d.categories.some((c) => c.category === "licence")))),
    phase: vote(pick("project.phase")),
    framework: tech.value ? { value: `ERC CoP — ${tech.value}`, status: "suggested", sources: tech.sources } : { status: "unknown", sources: [] },
    priorReports: active(s).filter((d) => d.categories.some((c) => c.category === "cop-report")).map((d) => ({ documentId: d.id, kind: d.copSubtype, period: d.period?.to?.slice(0, 4) })),
  };
  return profile;
}

/** A document that names another plant's licence or project belongs elsewhere (COP-DI-08 "incorrect plant"). */
function isOtherEntity(s: IngestionState, d: Document): boolean {
  const own = s.profile?.licenceNumber.value;
  const lic = s.fields.find((f) => f.key === "licence.number" && f.locator.documentId === d.id);
  if (own && lic && lic.normalized !== own) return true;
  const name = s.profile?.name.value;
  const pj = s.fields.find((f) => f.key === "project.name" && f.locator.documentId === d.id);
  return !!(name && pj && pj.normalized && normalizeName(String(pj.normalized)) !== normalizeName(String(name)) && !d.categories.some((c) => c.category === "cop-report"));
}
const normalizeName = (n: string) => cleanText(n).replace(/\s+/g, "").replace(/[()]/g, "").toLowerCase();

/** COP-DI-06: one document can support many obligations and sections. Version-stamped. */
function mapEvidence(s: IngestionState): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  for (const d of active(s)) {
    if (isOtherEntity(s, d)) continue;
    const text = s.fields.filter((f) => f.locator.documentId === d.id).map((f) => f.locator.excerpt).join("\n") + "\n" + d.title;
    for (const et of EVIDENCE_TYPES) {
      if (!d.categories.some((c) => et.categories.includes(c.category))) continue;
      if (et.match && !et.match.test(text)) continue;
      if (et.id === "ET-HISTORY" && !(d.copSubtype === "monitoring" || /monitor|ผลการปฏิบัติตาม/iu.test(text))) continue;
      const historical = !!d.period?.to && Number(d.period.to.slice(0, 4)) < s.context.year;
      links.push({
        id: `LNK-${d.id.slice(4, 12)}-${et.id}`, evidenceTypeId: et.id, documentId: d.id,
        fieldIds: s.fields.filter((f) => f.locator.documentId === d.id).map((f) => f.id),
        obligationIds: [et.clause.sourceId + (et.clause.clause ? `#${et.clause.clause}` : "")], reportSections: et.reportSections,
        period: et.refresh === "standing" ? "standing" : historical || et.id === "ET-HISTORY" ? "historical" : "current",
        status: "proposed", ruleVersion: RULESET_VERSION,
      });
    }
  }
  return links;
}

/** COP-DI-02 dynamic checklist. */
function buildChecklist(s: IngestionState, reg: RegulationVersion): ChecklistItem[] {
  const hasPrior = active(s).some((d) => d.copSubtype === "monitoring" || d.categories.some((c) => c.category === "cop-report"));
  const tech = s.context.tech ?? (s.profile?.technology.value as string | undefined);
  return EVIDENCE_TYPES.map((et) => {
    const a = et.applies({ report: s.context.report, phase: s.context.phase, tech, reg, hasPrior });
    const links = s.links.filter((l) => l.evidenceTypeId === et.id);
    const current = links.filter((l) => l.period !== "historical" || et.id === "ET-HISTORY");
    const docs = current.map((l) => l.documentId);
    const blocking = s.findings.some((f) => f.status === "open" && (f.severity !== "minor") && (f.evidenceTypeId === et.id || f.documentIds.some((id) => docs.includes(id))));
    const allApproved = docs.length > 0 && current.every((l) => l.status === "accepted");
    let status: ChecklistItem["status"] = a.level === "not-applicable" ? "not-applicable" : !docs.length ? (links.length ? "historical-only" : "missing") : blocking ? "needs-review" : allApproved ? "verified" : "received";
    if (et.requiredMeasurements && docs.length && status !== "not-applicable") {
      const have = new Set(s.measurements.filter((m) => docs.includes(m.sourceDocumentId) && m.periodLabel === "current").map((m) => `${m.medium}.${m.parameter}`));
      if (et.requiredMeasurements.some((k) => !have.has(k)) && status !== "missing") status = "needs-review";
    }
    const nextAction: ChecklistItem["nextAction"] = status === "not-applicable" ? "none" : status === "missing" ? (et.method === "reuse-prior" ? "reuse" : et.method === "authorized-source" ? "ai-collect" : "request") : status === "historical-only" ? "request" : status === "needs-review" ? "review" : status === "received" ? "verify" : "none";
    return {
      evidenceTypeId: et.id, label: et.label, why: et.why, clause: et.clause, level: a.level, naReason: a.reason, status, documentIds: docs,
      responsible: et.owner, period: et.refresh === "standing" ? "standing" : { from: s.context.periodFrom, to: s.context.periodTo }, nextAction, reportSections: et.reportSections,
    };
  });
}

/** COP-DI-08. Deterministic checks; AI may explain, never edits source data. */
function validate(s: IngestionState): ValidationFinding[] {
  const out: ValidationFinding[] = s.findings.filter((f) => f.code === "duplicate");
  const F = (f: Omit<ValidationFinding, "id" | "status">) => out.push({ ...f, id: `FND-${f.code}-${out.length + 1}`, status: "open" });
  const ctx = s.context;

  for (const d of s.documents) {
    const sig = (d as Document & { signals?: { hasSignature: boolean; pageNumbers: { page: number; n: number; of: number }[]; instructionLike: string[] } }).signals;
    if (d.extractionStatus === "needs-ocr" || d.extractionStatus === "failed") F({ level: "document", code: "unreadable", severity: "major", title: t("อ่านเอกสารไม่ได้", "Unreadable document"), detail: t(`${d.title}: ไม่มีชั้นข้อความที่ใช้ได้ — ต้องทำ OCR หรือขอไฟล์ต้นฉบับ`, `${d.title}: no usable text layer — run OCR or request the original`), documentIds: [d.id], fieldIds: [], suggestedAction: t("ทำ OCR (ไทย+อังกฤษ) แล้วให้ผู้ตรวจยืนยันค่าสำคัญ", "Run Thai+English OCR and have a reviewer confirm critical values") });
    if (d.documentStatus === "superseded") F({ level: "document", code: "superseded", severity: "minor", title: t("มีฉบับใหม่กว่า", "Superseded version"), detail: t(`${d.title} ถูกแทนที่ด้วย ${d.supersededBy} — ไม่ใช้เป็นหลักฐาน แต่เก็บประวัติไว้`, `${d.title} is superseded by ${d.supersededBy} — not used as evidence, history kept`), documentIds: [d.id], fieldIds: [], suggestedAction: t("ใช้ฉบับล่าสุด", "Use the latest revision") });
    if (d.documentStatus !== "active") continue;
    if (d.validUntil && d.validUntil < ctx.periodTo) F({ level: "document", code: "expired", severity: d.categories.some((c) => c.category === "lab-report") ? "major" : "critical", title: t("เอกสารหมดอายุภายในรอบรายงาน", "Expired within the reporting period"), detail: t(`${d.title} หมดอายุ ${d.validUntil} ก่อนสิ้นรอบ ${ctx.periodTo}`, `${d.title} expires ${d.validUntil}, before the period end ${ctx.periodTo}`), documentIds: [d.id], fieldIds: s.fields.filter((f) => f.key === "validity.until" && f.locator.documentId === d.id).map((f) => f.id), evidenceTypeId: d.categories.some((c) => c.category === "lab-report") ? "ET-LAB-ACCRED" : undefined, suggestedAction: t("ขอฉบับที่ยังมีผลจากผู้ออกเอกสาร", "Request a valid version from the issuer") });
    if (isOtherEntity(s, d)) F({ level: "document", code: "other-entity", severity: "major", title: t("เอกสารเป็นของโรงไฟฟ้าอื่น", "Belongs to another plant"), detail: t(`${d.title} ระบุโครงการ/ใบอนุญาตที่ไม่ใช่ของโครงการนี้ — ไม่นำไปใช้`, `${d.title} names a project or licence that is not this one — excluded`), documentIds: [d.id], fieldIds: [], suggestedAction: t("ย้ายไปยังโครงการที่ถูกต้องหรือลบออกจากชุดนี้", "Move to the correct project or remove it from this set") });
    if (sig?.pageNumbers.length) {
      const of = Math.max(...sig.pageNumbers.map((p) => p.of));
      const seen = new Set(sig.pageNumbers.map((p) => p.n));
      const gaps = Array.from({ length: of }, (_, i) => i + 1).filter((n) => !seen.has(n));
      if (gaps.length && of <= 300) F({ level: "document", code: "missing-pages", severity: "major", title: t("หน้าเอกสารไม่ครบ", "Missing pages"), detail: t(`${d.title}: ไม่พบหน้า ${gaps.slice(0, 8).join(", ")} จาก ${of}`, `${d.title}: pages ${gaps.slice(0, 8).join(", ")} of ${of} not found`), documentIds: [d.id], fieldIds: [], suggestedAction: t("ขอไฟล์ฉบับสมบูรณ์", "Request the complete file") });
    }
    const needsSig = d.categories.some((c) => ["lab-report", "consultant-qualification", "licence"].includes(c.category));
    if (needsSig && sig && !sig.hasSignature) F({ level: "document", code: "no-signature", severity: "minor", title: t("ไม่พบการลงนาม", "No signature found"), detail: t(`${d.title}: ไม่พบคำว่า ลงชื่อ/ลงนาม — ต้องตรวจกับต้นฉบับ`, `${d.title}: no signature block detected — check the original`), documentIds: [d.id], fieldIds: [], suggestedAction: t("ผู้ตรวจยืนยันการลงนามจากต้นฉบับ", "Reviewer confirms the signature on the original") });
    if (sig?.instructionLike.length) F({ level: "document", code: "embedded-instruction", severity: "minor", title: t("พบข้อความลักษณะคำสั่งในเอกสาร", "Instruction-like text in a document"), detail: t(`ถือเป็นเนื้อหา ไม่ปฏิบัติตาม: “${sig.instructionLike[0]}”`, `Treated as content and not obeyed: “${sig.instructionLike[0]}”`), documentIds: [d.id], fieldIds: [], suggestedAction: t("ไม่ต้องทำอะไร — การควบคุมยังทำงานตามปกติ", "No action — controls remain active") });
  }

  // data: capacity conflicts across documents
  const caps = s.fields.filter((f) => f.key === "capacity.ac" && f.state === "value" && active(s).some((d) => d.id === f.locator.documentId && !isOtherEntity(s, d)));
  const capVals = [...new Set(caps.map((f) => Number(f.normalized)))];
  if (capVals.length > 1) F({ level: "data", code: "capacity-conflict", severity: "critical", title: t("กำลังผลิตติดตั้งไม่ตรงกัน", "Conflicting installed capacity"), detail: t(`พบ ${capVals.join(" / ")} MW ในเอกสารต่างฉบับ — ไม่เลือกค่าใดค่าหนึ่งให้เอง`, `Found ${capVals.join(" / ")} MW across documents — no value is picked automatically`), documentIds: [...new Set(caps.map((f) => f.locator.documentId))], fieldIds: caps.map((f) => f.id), suggestedAction: t("วิศวกรโครงการยืนยันจากใบอนุญาต", "Project engineer confirms against the licence") });

  // data + compliance on measurements
  for (const m of s.measurements) {
    const doc = s.documents.find((d) => d.id === m.sourceDocumentId);
    if (!doc || doc.documentStatus !== "active" || isOtherEntity(s, doc)) continue;
    const key = `${m.medium}.${m.parameter}`;
    const std = STANDARDS.find((x) => x.key === key);
    if (std && m.state === "value" && m.unit && std.unit && m.unit !== std.unit) F({ level: "data", code: "unit-mismatch", severity: "major", title: t("หน่วยไม่ตรงกับมาตรฐาน", "Unit mismatch"), detail: t(`${key} = ${m.value} ${m.unit} แต่มาตรฐานใช้ ${std.unit}`, `${key} = ${m.value} ${m.unit} but the standard uses ${std.unit}`), documentIds: [doc.id], fieldIds: [m.fieldId], suggestedAction: t("ตรวจหน่วยกับรายงานห้องปฏิบัติการ", "Check the unit on the laboratory report") });
    if (m.state === "unclear") F({ level: "data", code: "unclear-value", severity: "major", title: t("อ่านค่าไม่ชัด", "Unclear value"), detail: t(`${key}: “${s.fields.find((f) => f.id === m.fieldId)?.raw}” — ต้องตรวจกับต้นฉบับ ไม่เติมค่าเอง`, `${key}: “${s.fields.find((f) => f.id === m.fieldId)?.raw}” — check the source; nothing is filled in`), documentIds: [doc.id], fieldIds: [m.fieldId], suggestedAction: t("ตรวจแบบเทียบกับต้นฉบับ", "Side-by-side review") });
    if (m.date && m.periodLabel === "current" && (m.date < ctx.periodFrom || m.date > ctx.periodTo)) F({ level: "data", code: "out-of-period", severity: "major", title: t("วันที่ตรวจวัดอยู่นอกรอบรายงาน", "Measurement date outside the period"), detail: t(`${key} วันที่ ${m.date}`, `${key} dated ${m.date}`), documentIds: [doc.id], fieldIds: [m.fieldId], suggestedAction: t("ยืนยันรอบของผลตรวจวัด", "Confirm which period the result belongs to") });
    if (std && m.state === "value" && m.value !== null && m.periodLabel === "current" && (m.unit === std.unit || !std.unit)) {
      const over = (std.limitMax !== undefined && m.value > std.limitMax) || (std.limitMin !== undefined && m.value < std.limitMin);
      if (over) {
        const corrective = active(s).some((d) => d.id !== doc.id && /มาตรการแก้ไข(?!ผลกระทบ)|corrective action|สอบสวนสาเหตุ/iu.test(d.textSample ?? ""));
        F({ level: "compliance", code: "exceedance", severity: corrective ? "major" : "critical", title: t("เกินค่ามาตรฐาน (ชั่วคราว)", "Exceeds standard (provisional)"), detail: t(`${key} สถานี ${m.station ?? "?"} = ${m.value} ${m.unit ?? ""} เทียบ ${std.limitMin !== undefined ? std.limitMin + "–" : "≤ "}${std.limitMax} ${std.unit} · ${std.source.th}${std.verified ? "" : " (ค่ามาตรฐานรอยืนยัน)"}${corrective ? "" : " · ไม่พบหลักฐานมาตรการแก้ไข"}`, `${key} station ${m.station ?? "?"} = ${m.value} ${m.unit ?? ""} vs ${std.limitMin !== undefined ? std.limitMin + "–" : "≤ "}${std.limitMax} ${std.unit} · ${std.source.en}${std.verified ? "" : " (standard value pending verification)"}${corrective ? "" : " · no corrective-action evidence found"}`), documentIds: [doc.id], fieldIds: [m.fieldId], suggestedAction: t("ขอผลการสอบสวนสาเหตุและหลักฐานมาตรการแก้ไข", "Request the root-cause investigation and corrective-action evidence") });
      }
    }
  }
  // station mismatch: same parameter, stations named in this period not seen in prior reports
  const priorStations = new Set(s.measurements.filter((m) => m.periodLabel === "historical" && m.station).map((m) => `${m.medium}:${m.station}`));
  if (priorStations.size) {
    for (const m of s.measurements.filter((x) => x.periodLabel === "current" && x.station)) {
      if (!priorStations.has(`${m.medium}:${m.station}`) && s.measurements.some((h) => h.periodLabel === "historical" && h.medium === m.medium)) {
        F({ level: "data", code: "station-mismatch", severity: "minor", title: t("ชื่อสถานีไม่ตรงกับรอบก่อน", "Station differs from prior periods"), detail: t(`${m.medium} สถานี “${m.station}” ไม่พบในรายงานรอบก่อน — อาจเปลี่ยนจุดตรวจวัด`, `${m.medium} station “${m.station}” not in prior reports — the monitoring point may have moved`), documentIds: [m.sourceDocumentId], fieldIds: [m.fieldId], suggestedAction: t("ยืนยันพิกัดจุดตรวจวัด", "Confirm the station location") });
        break;
      }
    }
  }
  // compliance: noise baseline duration (form §3.1.1) — deterministic from distinct dates
  const noiseDocs = s.links.filter((l) => l.evidenceTypeId === "ET-NOISE-BASELINE" && l.period !== "historical").map((l) => l.documentId);
  if (noiseDocs.length) {
    const days = new Set(s.measurements.filter((m) => noiseDocs.includes(m.sourceDocumentId) && m.medium === "noise" && m.date).map((m) => m.date)).size;
    const stations = new Set(s.measurements.filter((m) => noiseDocs.includes(m.sourceDocumentId) && m.medium === "noise" && m.station).map((m) => m.station)).size;
    if (days < 5 || stations < 2) F({ level: "compliance", code: "noise-baseline-insufficient", severity: "major", title: t("ข้อมูลเสียงพื้นฐานไม่ครบเกณฑ์", "Baseline noise below the form's criterion"), detail: t(`พบ ${days} วัน ${stations} สถานี — แบบฟอร์มข้อ 3.1.1 กำหนด ≥ 5 วัน ≥ 2 สถานี ครอบคลุมวันทำการและวันหยุด`, `Found ${days} day(s) at ${stations} station(s) — form §3.1.1 requires ≥5 days at ≥2 stations covering workdays and holidays`), documentIds: noiseDocs, fieldIds: [], evidenceTypeId: "ET-NOISE-BASELINE", suggestedAction: t("นัดตรวจวัดเพิ่มให้ครบเกณฑ์", "Schedule additional measurement days") });
  }
  return out;
}

/** COP-DI-09 Missing Evidence Register with the easiest resolution first. */
function missingRegister(s: IngestionState): MissingEvidence[] {
  const prevOpen = new Map(s.missing.map((m) => [m.evidenceTypeId, m]));
  return s.checklist
    .filter((c) => (c.level === "mandatory" || c.level === "conditional") && (c.status === "missing" || c.status === "historical-only"))
    .map((c) => {
      const et = EVIDENCE_TYPES.find((e) => e.id === c.evidenceTypeId)!;
      const prior = s.links.find((l) => l.evidenceTypeId === c.evidenceTypeId && l.period === "historical");
      const priorDoc = prior && s.documents.find((d) => d.id === prior.documentId);
      const priorStillValid = priorDoc && et.refresh === "standing" && (!priorDoc.validUntil || priorDoc.validUntil >= s.context.periodTo);
      // reuse is only offered when a still-valid prior document actually exists
      const method: MissingEvidence["collectionMethod"] = priorStillValid ? "reuse-prior" : et.method === "reuse-prior" ? "internal-request" : et.method;
      const days = c.level === "mandatory" ? 45 : 60;
      const existing = prevOpen.get(c.evidenceTypeId);
      return {
        id: existing?.id ?? `MIS-${c.evidenceTypeId.slice(3)}`, evidenceTypeId: c.evidenceTypeId, requirement: c.why, reference: c.clause, missing: c.label,
        importance: c.level === "mandatory" ? (et.reportSections.some((r) => r === "cover" || r.startsWith("3")) ? "critical" : "high") : "medium",
        consequence: c.level === "mandatory" ? t("รายงานส่วนนี้ไม่ครบ — ประตูคุณภาพ “ข้อกำหนด” ไม่ผ่าน", "This part of the report is incomplete — the requirements gate fails") : t("ต้องยืนยันว่าไม่เกี่ยวข้อง หรือจัดหาหลักฐาน", "Confirm it does not apply, or provide the evidence"),
        owner: c.responsible, deadline: addDays(s.context.dueDate, -days),
        collectionMethod: method,
        recommendation: method === "reuse-prior" ? t(`ใช้ ${priorDoc!.title} ที่ยังมีผล — ยืนยันว่าไม่มีการเปลี่ยนแปลง`, `Reuse ${priorDoc!.title}, still valid — confirm nothing changed`) : method === "authorized-source" ? t("ให้ AI ดึงจากแหล่งที่อนุญาตแล้ว", "Let AI fetch it from an authorised source") : method === "declaration" ? t("ผู้มีอำนาจกรอกแบบรับรองตนเอง", "Authorised person completes the self-certification") : method === "supplier-request" ? t("ส่งคำขอไปยังผู้ให้บริการพร้อมลิงก์อัปโหลด", "Send a request with an upload link to the supplier") : t("ส่งคำขอภายในพร้อมลิงก์อัปโหลด", "Send an internal request with an upload link"),
        status: existing?.status === "requested" ? "requested" : "open", requestId: existing?.requestId,
      };
    });
}

/** Recompute every derived view. Approved snapshots are never modified — changes become proposals. */
export function analyze(s: IngestionState, reg: RegulationVersion = "2565+2567"): IngestionState {
  s.profile = recognize(s);
  const accepted = new Map(s.links.filter((l) => l.status !== "proposed").map((l) => [l.id, l.status]));
  s.links = mapEvidence(s).map((l) => ({ ...l, status: accepted.get(l.id) ?? l.status }));
  s.findings = validate(s).map((f) => {
    const prev = s.findings.find((p) => p.code === f.code && p.documentIds.join() === f.documentIds.join() && p.fieldIds.join() === f.fieldIds.join());
    return prev && prev.status !== "open" ? { ...f, status: prev.status } : f;
  });
  s.checklist = buildChecklist(s, reg);
  s.missing = missingRegister(s);
  for (const doc of s.documents) {
    const open = s.findings.filter((f) => f.status === "open" && f.documentIds.includes(doc.id));
    doc.validationStatus = doc.documentStatus !== "active" ? doc.validationStatus : open.some((f) => f.severity === "critical") ? "invalid" : open.length ? "issues" : "valid";
  }
  for (const snap of s.approvedSnapshots) {
    const changed = s.fields.filter((f) => !snap.fieldIds.includes(f.id) && s.links.some((l) => l.fieldIds.includes(f.id)));
    if (changed.length && !s.proposedUpdates.some((p) => p.snapshotId === snap.id && p.fieldIds.length === changed.length)) {
      s.proposedUpdates.push({ snapshotId: snap.id, fieldIds: changed.map((f) => f.id), reason: "new ingested evidence after approval" });
    }
  }
  audit(s, { actor: "Validation Agent", actorKind: "agent", action: "analyze", object: s.projectId, detail: `${s.links.length} links · ${s.findings.filter((f) => f.status === "open").length} open findings · ${s.missing.length} missing · rules ${RULESET_VERSION}`, result: "ok" });
  return s;
}

/** Readiness = applicable checklist items verified or received without blocking issues. */
export function readiness(s: IngestionState) {
  const applicable = s.checklist.filter((c) => c.level === "mandatory" || c.level === "conditional");
  const verified = applicable.filter((c) => c.status === "verified").length;
  const received = applicable.filter((c) => c.status === "received").length;
  const review = applicable.filter((c) => c.status === "needs-review").length;
  const missing = applicable.filter((c) => c.status === "missing" || c.status === "historical-only").length;
  const fieldsReview = s.fields.filter((f) => f.confidence.approval === "pending" && (f.confidence.extraction < 0.8 || f.state === "unclear" || f.key.startsWith("capacity") || f.key.startsWith("measurement"))).length;
  return { applicable: applicable.length, verified, received, review, missing, fieldsReview, pct: applicable.length ? Math.round(((verified + received * 0.5) / applicable.length) * 100) : 0 };
}
