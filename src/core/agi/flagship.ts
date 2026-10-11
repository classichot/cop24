import { t } from "../i18n-text";
import type { LText } from "../types";
import type { AgentId } from "./agents";
import type { Mode } from "./catalog";
import type { RunnerKey } from "./runners";
import type { WorkType } from "./types";

/**
 * §5 Flagship end-to-end missions, each a composition of catalog building blocks, defined with
 * every field REQ-AGI-004 requires. All seven run on the one engine in engine.ts.
 */

export type Phase = "scope" | "evidence" | "execute" | "verify" | "approve";
export type Gate = "approval" | "certification" | "submission";
export type Tier = "deterministic" | "economy" | "standard" | "frontier";

export interface TaskDef {
  id: string;
  title: LText;
  agent: AgentId;
  phase: Phase;
  deps: string[];
  blocks: string[]; // COP-xxx building blocks
  work: WorkType;
  runner?: RunnerKey;
  gate?: Gate;
  /** sends something outside the AI (request, assignment) — Draft autonomy turns it into a user action */
  action?: boolean;
  tier: Tier;
}

export interface FlagshipDef {
  id: string;
  title: LText;
  goal: LText;
  completion: LText;
  applicability: LText;
  inputs: LText[];
  evidence: LText[];
  defaultMode: Mode;
  multiSiteMode: Mode;
  defaultAutonomy: "draft" | "supervised" | "autopilot";
  tasks: TaskDef[];
  deliverables: LText[];
  validations: LText[];
  approvals: LText[];
  costCapTHB: number;
  priority: "P0" | "P1" | "P2";
}

const T = (id: string, th: string, en: string, agent: AgentId, phase: Phase, deps: string[], blocks: string[], extra: Partial<TaskDef> = {}): TaskDef => ({ id, title: t(th, en), agent, phase, deps, blocks, work: "ai-digital", runner: id as RunnerKey, tier: "deterministic", ...extra });
const gate = (id: string, th: string, en: string, agent: AgentId, deps: string[], g: Gate, work: WorkType, blocks: string[]): TaskDef => ({ id, title: t(th, en), agent, phase: "approve", deps, blocks, work, gate: g, tier: "deterministic" });

const scope = [
  T("applicability", "ระบุเส้นทางกำกับ (CoP / EIA / EHIA)", "Determine the regulatory route (CoP / EIA / EHIA)", "regulatory", "scope", [], ["COP-002", "COP-003", "COP-005"]),
  T("template", "เลือกแบบรายงานและแบบตรวจสอบที่ถูกฉบับ", "Select the correct report template and checklist", "regulatory", "scope", ["applicability"], ["COP-016", "COP-010"]),
  T("permit-change", "รวมเงื่อนไขเฉพาะของใบอนุญาต", "Apply project-specific permit conditions", "permit", "scope", ["applicability"], ["COP-013", "COP-006"]),
];

export const FLAGSHIPS: FlagshipDef[] = [
  {
    id: "F01", priority: "P0",
    title: t("จัดทำรายงานผลการปฏิบัติตาม CoP ประจำรอบ", "Prepare my annual CoP report"),
    goal: t("รายงานผลการปฏิบัติตาม CoP ที่พร้อมยื่น พร้อมทะเบียนหลักฐาน ตาราง ภาคผนวก และรายการข้อยกเว้น", "A submission-ready CoP Monitoring Report with evidence register, tables, annexes and exception register"),
    completion: t("ร่างผ่าน QA อิสระ ผู้ใช้อนุมัติในสตูดิโอ และชุดเอกสารพร้อมยื่น — หรือจบแบบ “ติดขัด/ต้องให้คนดำเนินการ” พร้อมรายการค้าง", "Draft passes independent QA, is approved in Studio and the package is ready — or ends Blocked / Needs Human Action with the open items listed"),
    applicability: t("โรงไฟฟ้าภายใต้ CoP ในระยะก่อสร้าง ดำเนินการ หรือรื้อถอน", "CoP plants in construction, operation or decommissioning"),
    inputs: [t("ใบอนุญาตและเงื่อนไข", "Licence and conditions"), t("ผลตรวจวัดของรอบนี้", "This period's monitoring results"), t("รายงานรอบก่อน", "Previous reports")],
    evidence: [t("หลักฐานการดำเนินการตามทุกมาตรการที่ใช้บังคับ", "Implementation evidence for every applicable measure"), t("ผลแล็บจากห้องปฏิบัติการที่ขึ้นทะเบียน", "Results from a registered laboratory")],
    defaultMode: "T", multiSiteMode: "W", defaultAutonomy: "supervised", costCapTHB: 500,
    tasks: [
      ...scope,
      T("cycle", "กำหนดรอบรายงานและกำหนดส่ง (ข้อ 21)", "Set the reporting period and due date (clause 21)", "permit", "scope", ["applicability"], ["COP-015", "COP-055"]),
      T("collect", "รวบรวมหลักฐานของรอบรายงาน", "Collect the period's evidence", "evidence", "evidence", ["template"], ["COP-019", "COP-021", "COP-023", "COP-082"]),
      T("missing", "ตรวจหาหลักฐานที่ขาด", "Detect missing evidence", "evidence", "evidence", ["collect"], ["COP-026", "COP-074"]),
      T("request", "ขอเอกสารที่ขาดผ่านช่องทางที่อนุญาต", "Request missing records through approved channels", "evidence", "evidence", ["missing"], ["COP-020"], { action: true }),
      T("consistency", "ตรวจความขัดแย้งระหว่างเอกสาร", "Cross-document consistency check", "engineering", "execute", ["collect"], ["COP-024", "COP-050"]),
      T("labs", "ตรวจคุณสมบัติห้องปฏิบัติการ", "Validate laboratory reports", "measurement", "execute", ["collect"], ["COP-064"]),
      T("measures", "ตรวจการปฏิบัติตามรายมาตรการ", "Measure-by-measure compliance audit", "auditor", "execute", ["collect", "permit-change"], ["COP-073", "COP-083"]),
      T("exceedance", "ตรวจค่าเกินเกณฑ์", "Detect exceedances", "environment", "execute", ["collect"], ["COP-075", "COP-065", "COP-066", "COP-067"]),
      T("trend", "วิเคราะห์แนวโน้มย้อนหลัง", "Analyse historical trends", "measurement", "execute", ["collect"], ["COP-084"]),
      T("draft", "ร่างรายงานและภาคผนวกจากข้อมูลที่ยืนยัน", "Draft the report and annexes from verified data", "writer", "execute", ["measures", "exceedance", "trend", "labs", "consistency"], ["COP-085", "COP-086", "COP-087"], { tier: "frontier" }),
      T("qa", "ตรวจคุณภาพอิสระ (ข้อเท็จจริง กฎ ตัวเลข)", "Independent factual, regulatory and numerical QA", "qa", "verify", ["draft"], ["COP-088"], { tier: "standard" }),
      gate("studio", "ผู้ใช้ตรวจและอนุมัติในสตูดิโอรายงาน", "User reviews and approves in Report Studio", "lead", ["qa"], "approval", "human", ["COP-089"]),
      T("package", "จัดชุดเอกสารพร้อมยื่น", "Assemble the submission-ready package", "submission", "approve", ["studio"], ["COP-090"]),
      gate("certify", "ผู้มีคุณวุฒิลงนามรับรอง", "Qualified signatory certifies", "submission", ["package"], "certification", "licensed-professional", ["COP-090"]),
    ],
    deliverables: [t("รายงานผลการปฏิบัติตาม CoP", "CoP Monitoring Report"), t("ทะเบียนหลักฐานและตารางผลรายมาตรการ", "Evidence register and results matrix"), t("ทะเบียนข้อยกเว้น", "Exception register"), t("รายการตรวจก่อนยื่น", "Submission checklist")],
    validations: [t("ไม่มีมาตรการใดผ่านโดยไม่มีหลักฐานยืนยัน", "No measure passes without verified evidence"), t("ค่าเกินเกณฑ์คำนวณแบบกำหนดแน่นอน", "Exceedances computed deterministically"), t("ทุกข้อความมีแหล่งอ้างอิง", "Every statement sourced"), t("แนวโน้มแสดงเฉพาะปีที่มีข้อมูล", "Trends show only years with data")],
    approvals: [t("อนุมัติร่างในสตูดิโอ", "Approve the draft in Studio"), t("ลงนามรับรองโดยผู้มีคุณวุฒิ", "Qualified certification"), t("การยื่นต่อ กกพ. โดยผู้มีอำนาจ", "Filing with the ERC by an authorised person")],
  },
  {
    id: "F02", priority: "P0",
    title: t("เตรียมคำขอ CoP สำหรับโครงการใหม่", "Prepare a new CoP application"),
    goal: t("ชุดรายงาน CoP ขั้นต้น/ขั้นสุดท้ายที่ต้องใช้ แผนโครงการ ตารางมาตรการ และรายการตรวจก่อนยื่น", "The required Preliminary/Final CoP packages, project plan, measures tables and filing checklists"),
    completion: t("เส้นทางยืนยันแล้ว แผนหลักและชุดขั้นต้นพร้อม และงานรับฟังความคิดเห็นถูกติดตามเป็นงานจริง", "Route confirmed, master plan and preliminary package ready, consultation tracked as real-world work"),
    applicability: t("โครงการใหม่ ขยาย หรือเปลี่ยนเทคโนโลยี", "New, expansion or technology-change projects"),
    inputs: [t("เอกสารโครงการและแบบ", "Project documents and drawings")], evidence: [t("ข้อมูลพื้นฐานจากการตรวจวัดจริง", "Actual baseline measurements")],
    defaultMode: "T", multiSiteMode: "W", defaultAutonomy: "supervised", costCapTHB: 800,
    tasks: [
      ...scope,
      T("plan", "จัดทำแผนการปฏิบัติตามหลัก", "Create the master compliance plan", "lead", "scope", ["template", "permit-change"], ["COP-009", "COP-004"]),
      T("collect", "นำเข้าเอกสารและข้อมูลหลักโครงการ", "Ingest documents and plant master data", "evidence", "evidence", ["plan"], ["COP-001", "COP-019", "COP-022"]),
      T("missing", "ตรวจหาเอกสารที่ขาด", "Detect missing documents", "evidence", "evidence", ["collect"], ["COP-026"]),
      T("consistency", "กระทบยอดข้อมูลโครงการ", "Reconcile project data", "engineering", "execute", ["collect"], ["COP-024", "COP-050"]),
      T("labs", "ตรวจผลแล็บพื้นฐาน", "Review baseline laboratory evidence", "measurement", "execute", ["collect"], ["COP-047", "COP-064"]),
      gate("consultation", "จัดรับฟังความคิดเห็นผู้มีส่วนได้เสีย (งานภาคสนาม)", "Hold the stakeholder consultation (field work)", "community", ["plan"], "approval", "human", ["COP-042", "COP-044"]),
      T("draft", "ร่างรายงานขั้นต้นจากหลักฐาน", "Draft the preliminary report from evidence", "writer", "execute", ["consistency", "labs", "missing"], ["COP-037"], { tier: "frontier" }),
      T("qa", "ตรวจความครบถ้วนรายงานขั้นต้น", "Preliminary completeness review", "qa", "verify", ["draft"], ["COP-040", "COP-052"], { tier: "standard" }),
      gate("studio", "อนุมัติร่าง", "Approve the draft", "lead", ["qa"], "approval", "human", ["COP-089"]),
      T("package", "จัดชุดยื่นขั้นต้น", "Assemble the preliminary package", "submission", "approve", ["studio"], ["COP-041", "COP-054"]),
    ],
    deliverables: [t("แผนการปฏิบัติตามหลัก", "Master compliance plan"), t("ร่างรายงานขั้นต้น", "Preliminary report draft"), t("ชุดยื่นขั้นต้น", "Preliminary package")],
    validations: [t("ยืนยันเส้นทาง CoP ก่อนร่าง", "Route confirmed before drafting"), t("ห้ามสร้างผลการรับฟังความคิดเห็น", "Consultation outcomes are never generated")],
    approvals: [t("ผู้ใช้อนุมัติร่าง", "User approves the draft"), t("การรับฟังความคิดเห็นจริง", "The real consultation")],
  },
  {
    id: "F03", priority: "P0",
    title: t("ตรวจว่าโรงไฟฟ้าปฏิบัติตามหรือไม่", "Check whether my plant complies"),
    goal: t("ผลประเมินรายมาตรการ: ปฏิบัติตาม อาจไม่ปฏิบัติตาม ยังยืนยันไม่ได้ และไม่เข้าข่าย พร้อมแหล่งอ้างอิงและลำดับความเสี่ยง", "Compliant, potentially non-compliant, unverified and not-applicable items with sources and risk ranking"),
    completion: t("ทุกมาตรการที่ใช้บังคับมีผลประเมินพร้อมเหตุผล", "Every applicable measure has a result and a reason"),
    applicability: t("โรงไฟฟ้าทุกแห่งที่มีทะเบียนมาตรการ", "Any plant with a measures register"),
    inputs: [t("ทะเบียนมาตรการและหลักฐาน", "Measures register and evidence")], evidence: [t("หลักฐานรายมาตรการ", "Evidence per measure")],
    defaultMode: "S", multiSiteMode: "W", defaultAutonomy: "draft", costCapTHB: 150,
    tasks: [
      ...scope,
      T("obligations", "สร้างเมทริกซ์ข้อผูกพัน", "Build the obligation matrix", "regulatory", "scope", ["applicability"], ["COP-011"]),
      T("collect", "รวบรวมหลักฐาน", "Collect evidence", "evidence", "evidence", ["obligations"], ["COP-019", "COP-025"]),
      T("missing", "ตรวจหาหลักฐานที่ขาด", "Detect missing evidence", "evidence", "evidence", ["collect"], ["COP-026"]),
      T("consistency", "ตรวจความขัดแย้ง", "Consistency check", "engineering", "execute", ["collect"], ["COP-024"]),
      T("labs", "ตรวจห้องปฏิบัติการ", "Validate laboratories", "measurement", "execute", ["collect"], ["COP-064"]),
      T("exceedance", "ตรวจค่าเกินเกณฑ์", "Detect exceedances", "environment", "execute", ["collect"], ["COP-075"]),
      T("measures", "ประเมินรายมาตรการ", "Assess every measure", "auditor", "verify", ["collect", "exceedance", "labs", "permit-change"], ["COP-073", "COP-063"]),
    ],
    deliverables: [t("ผลการประเมินการปฏิบัติตาม", "Compliance assessment"), t("รายการช่องว่างและลำดับความเสี่ยง", "Gaps and risk ranking")],
    validations: [t("แยก “พบการละเมิด” ออกจาก “ยังยืนยันไม่ได้”", "A detected violation is kept apart from an unverified status")],
    approvals: [],
  },
  {
    id: "F04", priority: "P1",
    title: t("แก้ปัญหาการปฏิบัติตามของฉัน", "Fix my compliance problems"),
    goal: t("CAPA ที่อนุมัติแล้ว งานที่มอบหมาย และหลักฐานการปิดที่ตรวจยืนยันโดยอิสระ", "Approved CAPA, assigned work and independently verified closure evidence"),
    completion: t("ทุกปัญหามีการแก้ไขที่อนุมัติ มอบหมาย และปิดด้วยหลักฐานที่ผ่านการตรวจ — งานภาคสนามที่ยังไม่เสร็จทำให้ภารกิจติดขัดอย่างเปิดเผย", "Every failure has an approved, assigned action closed with verified evidence — unfinished field work leaves the mission openly blocked"),
    applicability: t("มีข้อค้นพบที่ยืนยันแล้ว", "Verified findings exist"),
    inputs: [t("ข้อค้นพบ", "Findings")], evidence: [t("หลักฐานการดำเนินการแก้ไขจริง", "Actual completion evidence")],
    defaultMode: "T", multiSiteMode: "W", defaultAutonomy: "supervised", costCapTHB: 300,
    tasks: [
      T("applicability", "ยืนยันเส้นทางกำกับ", "Confirm the regulatory route", "regulatory", "scope", [], ["COP-002"]),
      T("exceedance", "ยืนยันค่าเกินเกณฑ์", "Confirm exceedances", "environment", "evidence", ["applicability"], ["COP-075"]),
      T("measures", "ยืนยันมาตรการที่ยังไม่ผ่าน", "Confirm failing measures", "auditor", "evidence", ["applicability"], ["COP-073"]),
      T("capa", "จัดทำแผนแก้ไข (CAPA)", "Prepare the corrective action plan", "corrective", "execute", ["exceedance", "measures"], ["COP-078"], { tier: "standard" }),
      gate("approve-capa", "อนุมัติแผนแก้ไข", "Approve the CAPA", "lead", ["capa"], "approval", "human", ["COP-078"]),
      T("dispatch", "มอบหมายงานแก้ไข", "Dispatch corrective work", "corrective", "execute", ["approve-capa"], ["COP-079"], { action: true }),
    ],
    deliverables: [t("CAPA", "CAPA"), t("ตัวติดตามการดำเนินการ", "Execution tracker"), t("บันทึกการตรวจยืนยัน", "Verification records")],
    validations: [t("ปิดได้เมื่อมีหลักฐานและผู้ตรวจอิสระเท่านั้น", "Closure only with evidence and an independent verifier")],
    approvals: [t("อนุมัติ CAPA", "Approve the CAPA")],
  },
  {
    id: "F05", priority: "P1",
    title: t("เตรียมรับการตรวจของ กกพ.", "Prepare for an ERC inspection"),
    goal: t("ชุดเตรียมรับการตรวจและรายการค้าง", "Inspection readiness pack and outstanding-items checklist"),
    completion: t("ชุดเตรียมรับการตรวจครบ และรายการค้างระบุผู้รับผิดชอบ", "Pack assembled and every open item has an owner"),
    applicability: t("โรงไฟฟ้าที่ดำเนินการแล้ว", "Operating plants"),
    inputs: [t("ใบอนุญาต รายงานเดิม หลักฐาน", "Licence, past reports, evidence")], evidence: [t("หลักฐานการดำเนินการ", "Implementation evidence")],
    defaultMode: "T", multiSiteMode: "W", defaultAutonomy: "draft", costCapTHB: 200,
    tasks: [
      ...scope,
      T("collect", "รวบรวมหลักฐานและรายงานเดิม", "Collect evidence and past reports", "evidence", "evidence", ["template"], ["COP-019", "COP-027"]),
      T("missing", "รายการค้าง", "Outstanding items", "evidence", "evidence", ["collect"], ["COP-026"]),
      T("measures", "ตรวจรายมาตรการ", "Measure-by-measure check", "auditor", "execute", ["collect", "permit-change"], ["COP-073", "COP-091"]),
      T("inspection", "ประกอบชุดเตรียมรับการตรวจ", "Assemble the inspection pack", "submission", "verify", ["measures", "missing"], ["COP-096"]),
    ],
    deliverables: [t("ชุดเตรียมรับการตรวจ", "Inspection readiness pack"), t("รายการค้าง", "Outstanding items")],
    validations: [t("แสดงรายการค้างตามจริง ไม่ซ่อน", "Open items shown, not hidden")],
    approvals: [],
  },
  {
    id: "F06", priority: "P2",
    title: t("จัดการโรงไฟฟ้าทั้งหมดของฉัน", "Manage all my power plants"),
    goal: t("รายงานแยกรายไซต์ แดชบอร์ดรวม ปฏิทิน และทะเบียนข้อยกเว้นของกลุ่ม", "Site reports, a consolidated dashboard, calendar and group exception register"),
    completion: t("ทุกไซต์มีผลของตัวเอง แยกข้อมูลกัน และมีการตรวจไขว้ระหว่างทีม", "Every site has its own result, data kept separate, cross-team verification done"),
    applicability: t("กลุ่มที่มีหลายโรงไฟฟ้า", "Groups with several plants"),
    inputs: [t("ข้อมูลทุกไซต์", "Every site's data")], evidence: [t("หลักฐานรายไซต์", "Per-site evidence")],
    defaultMode: "W", multiSiteMode: "W", defaultAutonomy: "supervised", costCapTHB: 2000,
    tasks: [
      T("applicability", "ระบุเส้นทางกำกับรายไซต์", "Route per site", "regulatory", "scope", [], ["COP-002"]),
      T("cycle", "รอบรายงานรายไซต์", "Reporting cycle per site", "permit", "scope", ["applicability"], ["COP-015"]),
      T("collect", "รวบรวมหลักฐานรายไซต์", "Collect evidence per site", "evidence", "evidence", ["applicability"], ["COP-019"]),
      T("missing", "หลักฐานที่ขาดรายไซต์", "Missing evidence per site", "evidence", "evidence", ["collect"], ["COP-026"]),
      T("labs", "ตรวจห้องปฏิบัติการ", "Validate laboratories", "measurement", "execute", ["collect"], ["COP-064"]),
      T("measures", "ตรวจรายมาตรการ", "Measure audit", "auditor", "execute", ["collect"], ["COP-073"]),
      T("exceedance", "ค่าเกินเกณฑ์", "Exceedances", "environment", "execute", ["collect"], ["COP-075"]),
      T("trend", "แนวโน้ม", "Trends", "measurement", "execute", ["collect"], ["COP-084"]),
      T("draft", "ร่างรายงานรายไซต์", "Draft each site report", "writer", "execute", ["measures", "exceedance", "trend", "labs"], ["COP-101"], { tier: "frontier" }),
      T("qa", "QA รายไซต์", "QA per site", "qa", "verify", ["draft"], ["COP-088"], { tier: "standard" }),
    ],
    deliverables: [t("รายงานรายไซต์", "Individual site reports"), t("แดชบอร์ดรวม", "Consolidated dashboard"), t("ทะเบียนข้อยกเว้นของกลุ่ม", "Group exception register")],
    validations: [t("ข้อมูลแต่ละไซต์แยกกัน", "Site data kept separate"), t("ตรวจไขว้ข้อค้นพบที่ขัดแย้ง", "Conflicting findings cross-checked")],
    approvals: [t("อนุมัติรายไซต์ที่จุดอนุมัติกลาง", "Per-site approval at the central gate")],
  },
  {
    id: "F07", priority: "P2",
    title: t("ให้ COP24 ดูแลงาน CoP แทน", "Take over my CoP administration"),
    goal: t("คิวงานต่อเนื่อง: ปฏิทิน คำขอหลักฐาน ร่างรายงานตามรอบ และประเด็นค้าง", "An ongoing queue: calendar, evidence requests, scheduled drafts and open issues"),
    completion: t("คิวงานถูกสร้างและทริกเกอร์ทำงานภายใต้สิทธิ์ที่อนุมัติ", "Queue created; triggers act within approved permissions"),
    applicability: t("หลังตั้งค่าโครงการและอนุมัติสิทธิ์", "After onboarding and permission approval"),
    inputs: [t("สิทธิ์ที่อนุมัติ", "Approved permissions")], evidence: [],
    defaultMode: "T", multiSiteMode: "W", defaultAutonomy: "supervised", costCapTHB: 1000,
    tasks: [
      ...scope,
      T("plan", "แผนหลักและผู้รับผิดชอบ", "Master plan and owners", "lead", "scope", ["template", "permit-change"], ["COP-009"]),
      T("queue", "สร้างคิวงานและทริกเกอร์", "Create the work queue and triggers", "lead", "execute", ["plan"], ["COP-055", "COP-017", "COP-106"]),
      gate("permissions", "อนุมัติสิทธิ์การทำงานต่อเนื่อง", "Approve standing permissions", "lead", ["queue"], "approval", "formal-approval", ["COP-106"]),
    ],
    deliverables: [t("คิวงานการปฏิบัติตาม", "Compliance work queue"), t("บันทึกที่ตรวจสอบได้", "Auditable records")],
    validations: [t("เริ่มแบบมีผู้กำกับ (Supervised) เสมอ", "Starts Supervised")],
    approvals: [t("สิทธิ์การทำงานต่อเนื่อง", "Standing permissions")],
  },
];

export const flagshipById = (id: string) => FLAGSHIPS.find((f) => f.id === id);
