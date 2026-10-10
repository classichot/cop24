import { t } from "../i18n-text";
import type { LText } from "../types";
import type { RewriteContract, SemanticChange, SemanticChangeKind } from "./types";

/**
 * §10 Protected rewriting. Exact-text diffs are not enough: "may" → "will" changes meaning.
 * This detects the semantic changes the standard requires to be flagged, in Thai and English.
 */

const NUM = /-?\d[\d,]*(?:\.\d+)?/g;
const DATE = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\s+(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}/gu;
const UNIT = /\b(?:MWp|kWp|MW|kW|kVA|MWh|kV|dB\(A\)|mg\/L|THB|%|เมกะวัตต์|กิโลโวลต์|เดซิเบลเอ|ไร่|เมตร|กิโลเมตร)/gu;

/** Word classes whose substitution is material. */
const CLASSES: { kind: SemanticChangeKind; groups: string[][] }[] = [
  { kind: "modality", groups: [["may", "might", "could", "อาจ", "อาจจะ"], ["will", "shall", "จะ", "แน่นอน"]] },
  { kind: "obligation", groups: [["should", "ควร"], ["must", "shall", "ต้อง", "จะต้อง"]] },
  { kind: "status", groups: [["proposed", "planned", "draft", "เสนอ", "มีแผน", "ตามแผน", "ร่าง"], ["completed", "achieved", "implemented", "approved", "ดำเนินการแล้ว", "เสร็จแล้ว", "อนุมัติแล้ว", "ได้รับความเห็นชอบ"]] },
  { kind: "negation", groups: [["not", "no", "never", "ไม่", "ยังไม่", "ไม่ได้"], []] },
];

const tokensOf = (s: string, re: RegExp) => (s.match(re) ?? []).map((x) => x.replace(/,/g, ""));
const has = (s: string, w: string) => (/^[a-z]/i.test(w) ? new RegExp(`\\b${w}\\b`, "i").test(s) : s.includes(w));

function multisetDiff(a: string[], b: string[]) {
  const left = [...a];
  const added: string[] = [];
  for (const x of b) { const i = left.indexOf(x); if (i >= 0) left.splice(i, 1); else added.push(x); }
  return { removed: left, added };
}

export function semanticDiff(before: string, after: string): SemanticChange[] {
  const out: SemanticChange[] = [];
  for (const [kind, re] of [["number", NUM], ["date", DATE], ["unit", UNIT]] as const) {
    const { removed, added } = multisetDiff(tokensOf(before, re), tokensOf(after, re));
    if (removed.length || added.length) out.push({ kind, before: removed.join(", ") || "—", after: added.join(", ") || "—", material: true });
  }
  for (const { kind, groups } of CLASSES) {
    const [weak, strong] = groups;
    const weakB = weak.filter((w) => has(before, w)), weakA = weak.filter((w) => has(after, w));
    const strongB = strong.filter((w) => has(before, w)), strongA = strong.filter((w) => has(after, w));
    if (kind === "negation") {
      if (weakB.length !== weakA.length) out.push({ kind, before: weakB.join(" ") || "—", after: weakA.join(" ") || "—", material: true });
      continue;
    }
    // weak word removed and a strong word introduced = strengthening (e.g. proposed → completed)
    const lostWeak = weakB.filter((w) => !weakA.includes(w));
    const gainedStrong = strongA.filter((w) => !strongB.includes(w));
    if (lostWeak.length && gainedStrong.length) out.push({ kind, before: lostWeak.join(", "), after: gainedStrong.join(", "), material: true });
  }
  const causalB = /เนื่องจาก|เพราะ|ส่งผลให้|because|due to|caused by|driven by/iu.test(before);
  const causalA = /เนื่องจาก|เพราะ|ส่งผลให้|because|due to|caused by|driven by/iu.test(after);
  if (!causalB && causalA) out.push({ kind: "causal", before: "—", after: t("เพิ่มข้อความระบุสาเหตุ", "causal claim introduced").en, material: true });
  return out;
}

/** Validate a rewrite against its contract (§10). Any material change needs explicit acceptance. */
export function checkRewrite(before: string, after: string, c: RewriteContract, approvedFactTexts: string[] = []): { passed: boolean; changes: SemanticChange[]; reasons: LText[]; batchSafe: boolean } {
  const changes = semanticDiff(before, after);
  const reasons: LText[] = [];
  for (const w of c.lockedWording) {
    if (before.includes(w) && !after.includes(w)) {
      changes.push({ kind: "locked-wording", before: w, after: "—", material: true });
      reasons.push(t(`ถ้อยคำที่ล็อกไว้ถูกเปลี่ยน: “${w}”`, `Locked wording changed: “${w}”`));
    }
  }
  for (const f of approvedFactTexts) {
    if (before.includes(f) && !after.includes(f)) {
      changes.push({ kind: "fact-removed", before: f, after: "—", material: true });
      reasons.push(t("ข้อเท็จจริงที่อนุมัติแล้วหายไป", "An approved fact was removed"));
    }
  }
  if (c.maxLength && after.length > c.maxLength) reasons.push(t("ยาวเกินกำหนดในสัญญาการเขียนใหม่", "Exceeds the rewrite contract's length limit"));
  const material = changes.filter((x) => x.material);
  if (material.length) reasons.push(t(`มีการเปลี่ยนความหมาย ${material.length} จุด — ต้องให้ผู้ตรวจยอมรับทีละรายการ`, `${material.length} semantic change(s) — reviewer must accept each`));
  return { passed: reasons.length === 0, changes, reasons, batchSafe: material.length === 0 && reasons.length === 0 };
}
