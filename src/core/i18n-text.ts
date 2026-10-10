import type { Lang, LText } from "./types";

/** Build a bilingual string. */
export const t = (th: string, en: string): LText => ({ th, en });

/** Pick a language from a bilingual string. */
export const pick = (text: LText | string | undefined, lang: Lang): string => {
  if (text === undefined) return "";
  if (typeof text === "string") return text;
  return text[lang] ?? text.en;
};
