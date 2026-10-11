import { t } from "../i18n-text";
import type { LText } from "../types";

/** REQ-AGI-003 — the specialist agent library. Each agent is bound to the COP24 engines it may use. */
export type AgentId = "lead" | "regulatory" | "permit" | "evidence" | "environment" | "engineering" | "gis" | "measurement" | "community" | "auditor" | "corrective" | "writer" | "qa" | "submission" | "cost";

export interface AgentDef { id: AgentId; name: LText; job: LText; engines: string[]; canAct: boolean }

export const AGENTS: AgentDef[] = [
  { id: "lead", name: t("หัวหน้าภารกิจ", "Mission Lead Agent"), job: t("วางแผน ประสานงาน มอบหมาย และปิดภารกิจ", "Planning, coordination, delegation and completion"), engines: ["mission"], canAct: true },
  { id: "regulatory", name: t("เอเจนต์กฎระเบียบ กกพ.", "ERC Regulatory Agent"), job: t("ข้อกำหนด CoP ที่ใช้บังคับและการตีความ พร้อมอ้างอิง", "Applicable CoP provisions and interpretations, cited"), engines: ["applicability", "corpus"], canAct: false },
  { id: "permit", name: t("เอเจนต์ใบอนุญาต", "Permit & Licensing Agent"), job: t("เงื่อนไขใบอนุญาต การแก้ไข และกำหนดเวลา", "Permit conditions, amendments and deadlines"), engines: ["register", "calendar"], canAct: false },
  { id: "evidence", name: t("เอเจนต์หลักฐาน", "Evidence Agent"), job: t("นำเข้า จัดหมวด และติดตามแหล่งที่มาของเอกสาร", "Document ingestion, classification and source tracking"), engines: ["ingest", "evidence"], canAct: true },
  { id: "environment", name: t("ผู้เชี่ยวชาญสิ่งแวดล้อม", "Environmental Specialist"), job: t("มาตรการสิ่งแวดล้อม การติดตาม และผลกระทบ", "Environmental controls, monitoring and impacts"), engines: ["ingest", "controls"], canAct: false },
  { id: "engineering", name: t("เอเจนต์วิศวกรรม", "Engineering Agent"), job: t("ตรวจเอกสารและหลักฐานทางเทคนิค", "Technical documents and engineering evidence checks"), engines: ["ingest"], canAct: false },
  { id: "gis", name: t("เอเจนต์ GIS", "GIS Agent"), job: t("ขอบเขตพื้นที่ การใช้ที่ดิน และผู้รับผลกระทบที่อ่อนไหว", "Site boundaries, land use and sensitive receptors"), engines: [], canAct: false },
  { id: "measurement", name: t("เอเจนต์ผลตรวจวัด", "Measurement Agent"), job: t("ข้อมูลห้องปฏิบัติการ ข้อกำหนดการเก็บตัวอย่าง และผล", "Laboratory data, sampling requirements and results"), engines: ["ingest"], canAct: false },
  { id: "community", name: t("เอเจนต์ชุมชน", "Community Agent"), job: t("การรับฟังความคิดเห็น ข้อร้องเรียน และการตอบกลับ", "Stakeholder consultation, complaints and responses"), engines: ["ingest"], canAct: false },
  { id: "auditor", name: t("ผู้ตรวจการปฏิบัติตาม", "Compliance Auditor"), job: t("ตรวจความสอดคล้องรายข้อผูกพัน", "Obligation-by-obligation conformity verification"), engines: ["gaps", "controls"], canAct: false },
  { id: "corrective", name: t("เอเจนต์แก้ไขปัญหา", "Corrective Action Agent"), job: t("วางแผนการแก้ไขและติดตามความคืบหน้า", "Remediation planning and progress monitoring"), engines: ["gaps"], canAct: true },
  { id: "writer", name: t("ผู้เขียนรายงาน", "Regulatory Report Writer"), job: t("รายงานภาษาไทยระดับมืออาชีพและภาคผนวก", "Professional Thai reports and appendices"), engines: ["report"], canAct: false },
  { id: "qa", name: t("ผู้ตรวจคุณภาพอิสระ", "Independent QA Agent"), job: t("ตรวจข้อเท็จจริง กฎระเบียบ ตัวเลข และความครบถ้วน", "Factual, regulatory, numerical and completeness review"), engines: ["report", "preflight"], canAct: false },
  { id: "submission", name: t("เอเจนต์จัดชุดยื่น", "Submission Agent"), job: t("เตรียมชุดเอกสารยื่นและบันทึกการยื่น — ไม่ยื่นแทน", "Prepares filing packages and records — never files on its own"), engines: ["preflight"], canAct: false },
  { id: "cost", name: t("ผู้ควบคุมค่าใช้จ่าย AI", "Mission Cost Governor"), job: t("ประมาณการค่าใช้จ่าย สิทธิ์เครื่องมือ และวงเงิน AI", "Cost estimation, tool permissions and AI spending control"), engines: ["mission"], canAct: false },
];

export const agentById = (id: AgentId) => AGENTS.find((a) => a.id === id)!;
