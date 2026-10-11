import { t } from "../i18n-text";
import type { LText } from "../types";
import { conditionImpact, determineRoute, monitoringPeriods, RULESET_2567 } from "./regulatory";
import type { MeasureResult, ReportSection, RunnerCtx, SiteInput, SiteMeasurement, TaskOutput } from "./types";

/**
 * Deterministic task runners — the work each agent actually performs on a site's evidence.
 * Calculations, thresholds and compliance determinations are computed, never estimated by a
 * model (REQ-AGI-006), and no runner can produce a measurement, approval or completed activity
 * that is not in the evidence (non-negotiable principle 3).
 */

export type RunnerKey = "applicability" | "template" | "cycle" | "obligations" | "collect" | "missing" | "request" | "consistency" | "labs" | "measures" | "exceedance" | "trend" | "draft" | "qa" | "package" | "capa" | "dispatch" | "inspection" | "permit-change" | "plan" | "consolidate" | "queue";

const n = (x: number, th: string, en: string) => t(`${x} ${th}`, `${x} ${en}`);

function exceeds(m: SiteMeasurement): boolean {
  if (m.state !== "value" || m.value === null || !m.limit) return false;
  return (m.limit.max !== undefined && m.value > m.limit.max) || (m.limit.min !== undefined && m.value < m.limit.min);
}

/** REQ-GOV-001 — a measure passes only on verified evidence; missing, conflicting or unreviewed is “unverified”, never compliant. */
export function measureResults(site: SiteInput): { id: string; title: LText; result: MeasureResult; evidence: string[]; reason: LText }[] {
  return site.measures.map((m) => {
    if (!m.applies) return { id: m.id, title: m.title, result: "not-applicable" as MeasureResult, evidence: [], reason: t("ไม่เข้าข่ายสำหรับโครงการนี้", "Not applicable to this project") };
    const ev = site.evidence.filter((e) => e.measureId === m.id);
    const linked = site.measurements.filter((x) => x.param && measureTopic(x.param) === m.topic && x.period === String(site.year));
    if (linked.some(exceeds)) return { id: m.id, title: m.title, result: "potentially-noncompliant", evidence: ev.map((e) => e.id), reason: t("มีค่าตรวจวัดเกินเกณฑ์ที่ใช้บังคับ", "A measurement exceeds the applicable limit") };
    if (!ev.length) return { id: m.id, title: m.title, result: "unverified", evidence: [], reason: t("ไม่มีหลักฐาน", "No evidence") };
    const bad = ev.find((e) => e.status !== "verified" && e.status !== "not-applicable");
    if (bad) return { id: m.id, title: m.title, result: "unverified", evidence: ev.map((e) => e.id), reason: bad.status === "missing" ? t("หลักฐานขาด", "Evidence missing") : bad.status === "conflicting" ? t("หลักฐานขัดแย้งกัน", "Evidence conflicts") : t("หลักฐานรอการตรวจ", "Evidence awaiting review") };
    return { id: m.id, title: m.title, result: "compliant", evidence: ev.map((e) => e.id), reason: t("มีหลักฐานที่ยืนยันแล้ว", "Verified evidence") };
  });
}

function siteReview(s: SiteInput) {
  return s.evidence.filter((e) => (e.status === "needs-review" || e.status === "conflicting") && s.measures.some((m) => m.id === e.measureId && m.applies))
    .map((e) => ({ title: e.status === "conflicting" ? t(`แก้ความขัดแย้งของหลักฐาน: ${e.title.th}`, `Resolve conflicting evidence: ${e.title.en}`) : t(`ตรวจและยืนยันหลักฐาน: ${e.title.th}`, `Review and confirm evidence: ${e.title.en}`), work: "human" as const, owner: t("ผู้ตรวจหลักฐาน", "Evidence reviewer") }));
}

export function measureTopic(param: string): string {
  if (/leq|lmax|l90|ldn|noise/i.test(param)) return "noise";
  if (/pm|tsp|no2|so2|air|dust/i.test(param)) return "air";
  if (/ph|bod|cod|tss|tds|oil/i.test(param)) return "water";
  return "general";
}

export const RUNNERS: Record<RunnerKey, (site: SiteInput, ctx: RunnerCtx) => TaskOutput> = {
  applicability: (s) => {
    const d = determineRoute(s.profile);
    if (d.route !== "cop") return { summary: d.reason, block: t(`เส้นทางกำกับคือ ${d.route.toUpperCase()} — ไม่สร้างรายงาน CoP อัตโนมัติ ต้องให้ผู้เชี่ยวชาญยืนยันเส้นทาง`, `The regulatory route is ${d.route.toUpperCase()} — no CoP report is generated automatically; an expert must confirm the route`), findings: [{ kind: "route", severity: "material", text: d.reason }], data: { route: d.route, ruleset: d.rulesetVersion } };
    return { summary: d.reason, data: { route: d.route, checklist: d.checklist, ruleset: d.rulesetVersion, unresolved: d.unresolved.map((u) => u.en) } };
  },
  template: (s) => {
    const tpl = RULESET_2567.templates[s.profile.technology];
    return { summary: tpl.checklist ? t(`ใช้แบบตรวจสอบ ${tpl.checklist}${tpl.note ? ` — ${tpl.note.th}` : ""}`, `Using checklist ${tpl.checklist}${tpl.note ? ` — ${tpl.note.en}` : ""}`) : tpl.note!, data: { checklist: tpl.checklist } };
  },
  cycle: (s) => {
    const { periods, cite } = monitoringPeriods(s.profile, s.year);
    return { summary: t(`${periods.length} รอบรายงานในปี ${s.year + 543} · ${cite.clause} ระเบียบ CoP 2565`, `${periods.length} reporting period(s) in ${s.year} · ${cite.sourceId} ${cite.clause}`), data: { periods } };
  },
  obligations: (s) => ({ summary: n(s.measures.filter((m) => m.applies).length, "มาตรการที่ใช้บังคับในทะเบียนของโครงการ", "measures apply in the project's controlling register"), data: { measures: s.measures.length } }),
  collect: (s) => {
    const c = (st: string) => s.evidence.filter((e) => e.status === st).length;
    return { summary: t(`หลักฐาน ${s.evidence.length} รายการ: ยืนยันแล้ว ${c("verified")} · รอตรวจ ${c("needs-review")} · ขาด ${c("missing")} · ขัดแย้ง ${c("conflicting")}`, `${s.evidence.length} evidence records: ${c("verified")} verified · ${c("needs-review")} need review · ${c("missing")} missing · ${c("conflicting")} conflicting`) };
  },
  missing: (s) => {
    const miss = s.measures.filter((m) => m.applies && m.mandatory && !s.evidence.some((e) => e.measureId === m.id && e.status !== "missing"));
    // a missing record for a measure already listed above is the same gap — ask once
    const missEv = s.evidence.filter((e) => e.status === "missing" && !miss.some((m) => m.id === e.measureId));
    const items = [...miss.map((m) => m.title), ...missEv.map((e) => e.title)];
    return {
      summary: items.length ? n(items.length, "รายการหลักฐานที่ขาด — สร้างงานขอเอกสารแล้ว", "missing evidence item(s) — collection tasks created") : t("ไม่มีหลักฐานที่ขาด", "No missing evidence"),
      findings: items.map((x) => ({ kind: "missing-evidence" as const, severity: "major" as const, text: t(`ขาด: ${x.th}`, `Missing: ${x.en}`) })),
      humanTasks: items.map((x) => ({ title: t(`ส่งหลักฐาน: ${x.th}`, `Provide evidence: ${x.en}`), work: "human" as const, owner: t("ผู้รับผิดชอบไซต์", "Site owner") })),
      data: { missing: items.length },
    };
  },
  request: (s, ctx) => {
    const missing = Number((ctx.prior.missing?.data as { missing?: number } | undefined)?.missing ?? 0);
    if (!missing) return { summary: t("ไม่มีคำขอที่ต้องส่ง", "No requests to send") };
    if (ctx.autonomy === "draft") return { summary: n(missing, "คำขอถูกร่างไว้ — ผู้ใช้เป็นผู้ส่ง (โหมดร่าง)", "request(s) drafted — the user sends them (Draft autonomy)") };
    return { summary: n(missing, "คำขอภายในถูกส่งตามสิทธิ์ที่อนุมัติ — คำขอถึงบุคคลภายนอกต้องอนุมัติทุกครั้ง", "internal request(s) sent within approved permissions — external requests always need approval"), data: { sent: missing } };
  },
  consistency: (s) => {
    const vals = [...new Set(s.capacityClaims.map((c) => c.valueMW))];
    if (vals.length <= 1) return { summary: t("ข้อมูลกำลังผลิตตรงกันทุกเอกสาร", "Capacity is consistent across documents") };
    const text = t(`กำลังผลิตไม่ตรงกัน: ${s.capacityClaims.map((c) => `${c.valueMW} MW (${c.source})`).join(" · ")}`, `Capacity conflict: ${s.capacityClaims.map((c) => `${c.valueMW} MW (${c.source})`).join(" · ")}`);
    return { summary: text, findings: [{ kind: "conflict", severity: "material", text }], humanTasks: [{ title: t("ตัดสินกำลังผลิตที่ถูกต้องพร้อมเหตุผล", "Decide the correct capacity, with a reason"), work: "human", owner: t("วิศวกรโครงการ", "Project engineer") }] };
  },
  labs: (s, ctx) => {
    const issues = s.labs.filter((l) => !l.accreditationNo || !l.validUntil || l.validUntil < ctx.today);
    return {
      summary: issues.length ? n(issues.length, "ห้องปฏิบัติการยังยืนยันไม่ได้ — ผลที่อ้างอิงไม่ถือว่ายืนยันแล้ว", "laboratory(ies) cannot be validated — their results are not treated as verified") : n(s.labs.length, "ห้องปฏิบัติการผ่านการตรวจคุณสมบัติ", "laboratory(ies) validated"),
      findings: issues.map((l) => ({ kind: "lab-unverified" as const, severity: "major" as const, text: !l.accreditationNo ? t(`${l.name}: ไม่มีเลขทะเบียนห้องปฏิบัติการ`, `${l.name}: no accreditation number`) : t(`${l.name}: ทะเบียนหมดอายุหรือไม่ระบุวันหมดอายุ`, `${l.name}: accreditation expired or undated`), source: RULESET_2567.labRule.clause })),
      humanTasks: issues.map((l) => ({ title: t(`ขอหนังสือรับรองห้องปฏิบัติการ ${l.name}`, `Obtain ${l.name}'s accreditation certificate`), work: "third-party-lab" as const, owner: t(l.name, l.name) })),
    };
  },
  measures: (s) => {
    const r = measureResults(s);
    const c = (k: MeasureResult) => r.filter((x) => x.result === k).length;
    return {
      summary: t(`ผลรายมาตรการ: ยืนยันแล้ว ${c("compliant")} · อาจไม่เป็นไปตาม ${c("potentially-noncompliant")} · ยังยืนยันไม่ได้ ${c("unverified")} · ไม่เข้าข่าย ${c("not-applicable")}`, `By measure: ${c("compliant")} compliant · ${c("potentially-noncompliant")} potentially non-compliant · ${c("unverified")} unverified · ${c("not-applicable")} not applicable`),
      findings: r.filter((x) => x.result === "unverified").map((x) => ({ kind: "unverified-measure" as const, severity: "major" as const, text: t(`${x.title.th}: ${x.reason.th} — ไม่ระบุว่าปฏิบัติตามแล้ว`, `${x.title.en}: ${x.reason.en} — not asserted as compliant`), measureId: x.id })),
      // evidence that exists but is unreviewed or conflicting needs a person — it cannot quietly pass
      humanTasks: siteReview(s),
      deliverable: { id: "results-matrix", kind: "register", title: t("ตารางผลการปฏิบัติตามรายมาตรการ", "CoP compliance results matrix"), rows: r.map((x) => ({ measure: x.title.en, result: x.result, evidence: x.evidence.join(", ") || "—", reason: x.reason.en })) },
    };
  },
  exceedance: (s) => {
    const cur = s.measurements.filter((m) => m.period === String(s.year));
    const ex = cur.filter(exceeds);
    return {
      summary: ex.length ? n(ex.length, "ค่าเกินเกณฑ์ (เปรียบเทียบแบบกำหนดแน่นอน)", "exceedance(s), deterministic comparison") : n(cur.length, "ค่าตรวจวัดไม่เกินเกณฑ์ที่ใช้บังคับ", "measurement(s) within applicable limits"),
      findings: ex.map((m) => ({ kind: "exceedance" as const, severity: "material" as const, text: t(`${m.param} ${m.station} = ${m.value} ${m.unit} เกินเกณฑ์ ${m.limit?.max ?? m.limit?.min} (${m.limit?.standard}${m.limit?.verified ? "" : " · เกณฑ์ยังไม่ยืนยัน"})`, `${m.param} at ${m.station} = ${m.value} ${m.unit} exceeds ${m.limit?.max ?? m.limit?.min} (${m.limit?.standard}${m.limit?.verified ? "" : " · limit unverified"})`), source: m.source })),
    };
  },
  trend: (s) => {
    const need = RULESET_2567.historyYears;
    const years = [...new Set(s.historyYears)].sort();
    const want = Array.from({ length: need }, (_, i) => s.year - need + 1 + i);
    const missing = want.filter((y) => !years.includes(y));
    return {
      summary: t(`แนวโน้มจากข้อมูลจริง ${years.length} ปี (${years.map((y) => y + 543).join(", ") || "—"})${missing.length ? ` — ไม่มีข้อมูลปี ${missing.map((y) => y + 543).join(", ")} จึงไม่แสดง` : ""}`, `Trend from ${years.length} year(s) of actual data (${years.join(", ") || "—"})${missing.length ? ` — no data for ${missing.join(", ")}, so those years are not shown` : ""}`),
      findings: missing.length ? [{ kind: "history-gap" as const, severity: "minor" as const, text: t(`การเปรียบเทียบ ${need} ปีขาดข้อมูลปี ${missing.map((y) => y + 543).join(", ")}`, `The ${need}-year comparison lacks ${missing.join(", ")}`) }] : [],
      data: { years, missing },
    };
  },
  draft: (s, ctx) => {
    const r = measureResults(s);
    const ex = s.measurements.filter((m) => m.period === String(s.year) && exceeds(m));
    const trend = ctx.prior.trend?.data as { years: number[]; missing: number[] } | undefined;
    const sections: ReportSection[] = [
      { id: "s1", title: t("1. ข้อมูลโครงการและรอบรายงาน", "1. Project and reporting period"), text: t(`${s.name.th} · ${s.profile.technology} · ${s.profile.capacityMW} MW · ระยะ${s.profile.stage} · รอบปี ${s.year + 543}`, `${s.name.en} · ${s.profile.technology} · ${s.profile.capacityMW} MW · ${s.profile.stage} stage · year ${s.year}`), sources: ["licence"], status: "supported" },
      ...r.filter((x) => x.result !== "not-applicable").map((x, i): ReportSection => x.result === "compliant"
        ? { id: `m${i}`, title: x.title, text: t(`ดำเนินการตามมาตรการแล้ว ตามหลักฐาน ${x.evidence.join(", ")}`, `Implemented, per evidence ${x.evidence.join(", ")}`), sources: x.evidence, status: "supported" }
        : x.result === "potentially-noncompliant"
          ? { id: `m${i}`, title: x.title, text: t(`พบค่าเกินเกณฑ์ (ดูบทข้อยกเว้น) — ต้องอธิบายการแก้ไขตามจริง`, `An exceedance was found (see exceptions) — the corrective action must be described as it actually happened`), sources: x.evidence, status: "supported" }
          : { id: `m${i}`, title: x.title, text: t(`[ยังไม่มีหลักฐานยืนยัน — ${x.reason.th} — ไม่ระบุว่าปฏิบัติตามแล้ว]`, `[No verified evidence — ${x.reason.en} — not stated as implemented]`), sources: [], status: "blocked" }),
      { id: "ex", title: t("ข้อยกเว้นและการแก้ไข", "Exceptions and corrective actions"), text: ex.length ? t(ex.map((m) => `${m.param} ${m.station} ${m.value} ${m.unit}`).join("; "), ex.map((m) => `${m.param} at ${m.station} ${m.value} ${m.unit}`).join("; ")) : t("ไม่พบค่าเกินเกณฑ์ในรอบนี้", "No exceedance this period"), sources: ex.map((m) => m.source), status: "supported" },
      { id: "trend", title: t("การเปรียบเทียบย้อนหลัง", "Historical comparison"), text: trend ? t(`ข้อมูลที่มี: ${trend.years.map((y) => y + 543).join(", ")}${trend.missing.length ? ` · ไม่มีข้อมูล: ${trend.missing.map((y) => y + 543).join(", ")}` : ""}`, `Available: ${trend.years.join(", ")}${trend.missing.length ? ` · no data: ${trend.missing.join(", ")}` : ""}`) : t("[ยังไม่ได้วิเคราะห์แนวโน้ม]", "[Trend not analysed]"), sources: [], status: trend && trend.years.length ? "supported" : "blocked" },
    ];
    return { summary: t(`ร่าง ${sections.length} บท จากข้อมูลที่ยืนยันแล้ว · ${sections.filter((x) => x.status === "blocked").length} บทถูกกั้นเพราะยังไม่มีหลักฐาน`, `${sections.length} sections drafted from verified data · ${sections.filter((x) => x.status === "blocked").length} blocked for lack of evidence`), deliverable: { id: "report", kind: "report", title: t(`รายงานผลการปฏิบัติตาม CoP ปี ${s.year + 543} — ร่าง`, `CoP Monitoring Report ${s.year} — draft`), sections } };
  },
  qa: (s, ctx) => {
    const draft = ctx.prior.draft?.deliverable;
    const problems: LText[] = [];
    for (const sec of draft?.sections ?? []) {
      if (sec.status === "supported" && !sec.sources.length && sec.id !== "trend" && sec.id !== "ex") problems.push(t(`${sec.title.th}: ไม่มีแหล่งอ้างอิง`, `${sec.title.en}: no source`));
      if (sec.status === "blocked" && /ดำเนินการตามมาตรการแล้ว|Implemented/.test(sec.text.en + sec.text.th)) problems.push(t(`${sec.title.th}: อ้างว่าปฏิบัติตามโดยไม่มีหลักฐาน`, `${sec.title.en}: asserts compliance without evidence`));
    }
    const blocked = (draft?.sections ?? []).filter((x) => x.status === "blocked").length;
    return {
      summary: problems.length ? n(problems.length, "ปัญหาจากการตรวจคุณภาพ", "QA problem(s)") : t(`ผ่าน QA: ทุกข้อความที่ระบุว่าปฏิบัติตามมีแหล่งอ้างอิง · ${blocked} บทถูกกั้นอย่างเปิดเผย`, `QA passed: every compliance statement is sourced · ${blocked} section(s) openly blocked`),
      findings: problems.map((p) => ({ kind: "qa" as const, severity: "material" as const, text: p })),
      data: { passed: problems.length === 0, blocked },
    };
  },
  package: () => ({
    summary: t("ชุดเอกสารพร้อมยื่น (เตรียมแล้ว ยังไม่ได้ยื่น) — ต้องมีผู้ลงนามรับรองและการยื่นโดยผู้มีอำนาจ", "Submission package prepared (not filed) — needs a certifying signature and filing by an authorised person"),
    deliverable: { id: "package", kind: "package", title: t("ชุดเอกสารยื่น", "Submission package"), rows: [{ item: "Report (approved version)", status: "prepared" }, { item: "Evidence index & annexes", status: "prepared" }, { item: "Certifying signature", status: "human" }, { item: "ERC filing", status: "human — authenticated submission required" }] },
  }),
  capa: (s) => {
    const ex = s.measurements.filter((m) => m.period === String(s.year) && exceeds(m));
    const unverified = measureResults(s).filter((x) => x.result === "unverified");
    const rows = [
      ...ex.map((m) => ({ obligation: m.limit?.standard ?? "-", finding: `${m.param} ${m.station} ${m.value} ${m.unit}`, severity: "material", action: "Investigate cause; add noise barrier or adjust operations; re-measure by an eligible lab", owner: "Site environmental unit", status: "proposed" })),
      ...unverified.map((x) => ({ obligation: x.id, finding: `${x.title.en}: ${x.reason.en}`, severity: "major", action: "Provide the implementation evidence or implement the measure", owner: "Site owner", status: "proposed" })),
    ];
    return { summary: n(rows.length, "รายการแก้ไขที่เสนอ (รออนุมัติ)", "corrective action(s) proposed — awaiting approval"), deliverable: { id: "capa", kind: "capa", title: t("แผนปฏิบัติการแก้ไข (CAPA)", "Corrective action plan (CAPA)"), rows } };
  },
  dispatch: (s, ctx) => {
    const rows = ctx.prior.capa?.deliverable?.rows ?? [];
    return { summary: ctx.autonomy === "draft" ? n(rows.length, "งานแก้ไขพร้อมมอบหมาย — ผู้ใช้เป็นผู้มอบหมาย", "task(s) ready — the user assigns them") : n(rows.length, "งานแก้ไขถูกมอบหมายแล้ว และรอหลักฐานการดำเนินการจริง", "task(s) assigned and awaiting real completion evidence"), humanTasks: rows.map((r) => ({ title: t(`ดำเนินการแก้ไข: ${r.finding}`, `Carry out: ${r.finding}`), work: /lab/i.test(String(r.action)) ? "third-party-lab" as const : "human" as const, owner: t(String(r.owner), String(r.owner)), verify: true })) };
  },
  inspection: (s) => {
    const r = measureResults(s);
    return { summary: t("ชุดเตรียมรับการตรวจพร้อม — รวมใบอนุญาต รายงาน หลักฐาน และรายการค้าง", "Inspection pack assembled — licence, reports, evidence and open items"), deliverable: { id: "inspection", kind: "package", title: t("ชุดเตรียมรับการตรวจ กกพ.", "ERC inspection readiness pack"), rows: r.map((x) => ({ measure: x.title.en, result: x.result, evidence: x.evidence.join(", ") || "—" })) } };
  },
  "permit-change": (s) => {
    const conds = s.profile.permitConditions ?? [];
    const impacts = conds.map((c) => ({ c, ...conditionImpact(c.text) }));
    return { summary: conds.length ? t(`${conds.length} เงื่อนไขเฉพาะโครงการ กระทบ ${[...new Set(impacts.flatMap((i) => i.topics))].join(", ") || "—"}`, `${conds.length} project condition(s) affect ${[...new Set(impacts.flatMap((i) => i.topics))].join(", ") || "—"}`) : t("ไม่มีเงื่อนไขเฉพาะเพิ่มเติม", "No additional project conditions"), findings: impacts.filter((i) => i.topics.length).map((i) => ({ kind: "permit-change" as const, severity: "major" as const, text: t(`เงื่อนไข ${i.c.id} กระทบ: ${i.sections.map((x) => x.th).join(", ")}`, `Condition ${i.c.id} affects: ${i.sections.map((x) => x.en).join(", ")}`) })), data: { impacts: impacts.map((i) => ({ id: i.c.id, topics: i.topics })) } };
  },
  plan: (s) => {
    const { periods } = monitoringPeriods(s.profile, s.year);
    return { summary: t("แผนการปฏิบัติตามหลัก: ข้อผูกพัน ผู้รับผิดชอบ และกำหนดเวลา", "Master compliance plan: obligations, owners and timeline"), deliverable: { id: "plan", kind: "plan", title: t("แผนการปฏิบัติตามหลักของโครงการ", "Master compliance plan"), rows: [...s.measures.filter((m) => m.applies).map((m) => ({ item: m.title.en, source: m.source, owner: "Site owner" })), ...periods.map((p) => ({ item: `Monitoring report ${p.from}–${p.to}`, source: "ข้อ 21", owner: "Regulatory affairs", due: p.due }))] } };
  },
  consolidate: () => ({ summary: t("รวมผลทุกไซต์", "Consolidated across sites") }),
  queue: (s) => {
    const { periods } = monitoringPeriods(s.profile, s.year);
    return { summary: t("คิวงานต่อเนื่อง: รอบรายงาน คำขอหลักฐาน และประเด็นค้าง", "Ongoing work queue: report cycles, evidence requests and open issues"), deliverable: { id: "queue", kind: "queue", title: t("คิวงานการปฏิบัติตาม", "Compliance work queue"), rows: periods.map((p) => ({ item: `Draft monitoring report for ${p.from}–${p.to}`, trigger: "deadline", due: p.due, autonomy: "supervised" })) } };
  },
};
