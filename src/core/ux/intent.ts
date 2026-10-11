import { t } from "../i18n-text";
import type { LText } from "../types";
import { MISSIONS, missionById, viewMission, type MissionView, type UxMission } from "./catalog";
import type { UxContext } from "./context";

/**
 * §3 24 Copilot — intent detection and context analysis.
 * Deterministic and explainable (`intent-rules@1`): every recommendation lists the words that
 * triggered it, so "Why did AI choose this?" always has an answer. A language model can be
 * placed in front of this through the same Understanding shape; the rules stay as the fallback
 * and as the test oracle.
 */
export const INTENT_VERSION = "intent-rules@1";

export interface EntityRef { id: string; names: string[] }

export interface Understanding {
  goal: string;
  /** missions ranked by fit; empty when nothing matched */
  missions: { view: MissionView; score: number; cues: string[] }[];
  confidence: "high" | "medium" | "low";
  entityId?: string;
  report?: "preliminary" | "final" | "monitoring";
  /** CE year */
  year?: number;
  /** what COP24 understood, in one sentence */
  summary: LText;
  /** asked when the goal is too vague to act on */
  clarify?: LText;
  dontKnow: boolean;
}

const REPORT_CUES: [RegExp, Understanding["report"]][] = [
  [/ขั้นสุดท้าย|final/iu, "final"],
  [/ติดตามผล|monitoring|รายปี|ประจำปี|annual/iu, "monitoring"],
  [/ขั้นต้น|preliminary/iu, "preliminary"],
];

const thaiDigits = (s: string) => s.replace(/[๐-๙]/g, (d) => String("๐๑๒๓๔๕๖๗๘๙".indexOf(d)));

function findYear(s: string): number | undefined {
  const m = thaiDigits(s).match(/(?:ปี|year|fy)?\s*(25[5-9]\d|20[2-4]\d)/iu);
  if (!m) return undefined;
  const y = Number(m[1]);
  return y > 2400 ? y - 543 : y;
}

function findEntity(s: string, entities: EntityRef[]): string | undefined {
  const norm = thaiDigits(s).toLowerCase().replace(/\s+/g, "");
  // longest name first so "ลพบุรี 2" is not read as "ลพบุรี"
  const pairs = entities.flatMap((e) => e.names.map((n) => ({ id: e.id, n: thaiDigits(n).toLowerCase().replace(/\s+/g, "") }))).sort((a, b) => b.n.length - a.n.length);
  return pairs.find((p) => p.n.length >= 3 && norm.includes(p.n))?.id;
}

export function understand(goal: string, ctx: UxContext, entities: EntityRef[] = []): Understanding {
  const text = goal.trim();
  const dontKnow = (missionById("start")!.cues[0].re).test(text);
  const scored = MISSIONS.map((m) => {
    const cues: string[] = [];
    let score = 0;
    for (const c of m.cues) {
      const hit = text.match(c.re);
      if (hit) { score += c.w; cues.push(hit[0]); }
    }
    if (score > 0 && m.roles.includes(ctx.role)) score += 0.5;
    return { m, score, cues };
  }).filter((x) => x.score > 0);

  // "I don't know where to start" wins outright; it is a request for guidance, not a task
  if (dontKnow) {
    const start = scored.find((x) => x.m.id === "start");
    if (start) start.score += 10;
  }
  scored.sort((a, b) => b.score - a.score);

  const report = REPORT_CUES.find(([re]) => re.test(text))?.[1];
  const year = findYear(text);
  // an entity named in the goal is reported back; the caller switches the active entity and re-asks
  const entityId = findEntity(text, entities);
  const missions = scored.slice(0, 3).map((x) => ({ view: viewMission(x.m, ctx), score: x.score, cues: x.cues }));

  const top = scored[0]?.score ?? 0;
  const second = scored[1]?.score ?? 0;
  const confidence: Understanding["confidence"] = top >= 5 && top - second >= 2 ? "high" : top >= 3 ? "medium" : "low";

  const lead = missions[0]?.view.mission;
  const summary = !text
    ? t("บอกเป้าหมายเป็นภาษาธรรมดา เช่น “เตรียมรายงาน CoP ขั้นต้นของลพบุรี 1”", "Say your goal in plain words, e.g. “prepare the preliminary CoP report for Lopburi 1”")
    : lead
      ? describe(lead, ctx, report, year)
      : t("ยังไม่แน่ใจว่าคุณต้องการทำอะไร", "I'm not sure yet what you want to do");
  const clarify = !text ? undefined
    : !lead ? t("ลองบอกผลลัพธ์ที่ต้องการ เช่น รายงานที่ต้องยื่น เอกสารที่ต้องส่ง หรือคำถามเรื่องกฎหมาย — หรือเลือก “ไม่รู้ว่าต้องเริ่มตรงไหน”", "Try naming the outcome — a report to file, documents to send, or a question about the rules — or choose “I don't know where to start”.")
      : confidence === "low" ? t("ใช่สิ่งนี้หรือไม่? ถ้าไม่ใช่ ลองเลือกจากภารกิจด้านล่าง", "Is this it? If not, pick from the missions below.")
        : undefined;
  return { goal: text, missions, confidence, entityId, report, year, summary, clarify, dontKnow };
}

function describe(m: UxMission, ctx: UxContext, report?: Understanding["report"], year?: number): LText {
  const rTh = report === "final" ? "ขั้นสุดท้าย" : report === "monitoring" ? "ติดตามผลรายปี" : report === "preliminary" ? "ขั้นต้น" : "";
  const rEn = report === "final" ? "final" : report === "monitoring" ? "annual monitoring" : report === "preliminary" ? "preliminary" : "";
  const extraTh = [rTh && `รายงาน${rTh}`, year && `ปี ${year + 543}`].filter(Boolean).join(" ");
  const extraEn = [rEn && `${rEn} report`, year && `FY${year}`].filter(Boolean).join(", ");
  return t(
    `คุณต้องการ: ${m.outcome.th}${extraTh ? ` (${extraTh})` : ""} — สำหรับ${ctx.entityName.th}`,
    `You want: ${m.outcome.en}${extraEn ? ` (${extraEn})` : ""} — for ${ctx.entityName.en}`,
  );
}
