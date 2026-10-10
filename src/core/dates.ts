/** The demo tenant is frozen at this date so every derived deadline is deterministic. */
export const TODAY = "2026-10-11";

export const addDays = (iso: string, days: number): string => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round((Date.parse(toIso + "T00:00:00Z") - Date.parse(fromIso + "T00:00:00Z")) / 86_400_000);

export const daysUntil = (iso: string, today = TODAY): number => daysBetween(today, iso);

/** Buddhist-era year used in Thai UI (พ.ศ. = ค.ศ. + 543). */
export const beYear = (iso: string): number => Number(iso.slice(0, 4)) + 543;

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const monthName = (i: number, lang: "th" | "en") => (lang === "th" ? TH_MONTHS[i] : EN_MONTHS[i]);

export const fmtDate = (iso: string | null, lang: "th" | "en"): string => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return lang === "th" ? `${d} ${TH_MONTHS[m - 1]} ${y + 543}` : `${d} ${EN_MONTHS[m - 1]} ${y}`;
};
