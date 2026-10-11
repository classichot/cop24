/**
 * The left-menu order. Menu numbers (01, 02 …) come from this list, and Paul uses the same list
 * when it tells people where to click — a test keeps it identical to the menu in AppShell.
 */
export const NAV_ORDER = [
  "/", "#ask", "/missions", "/my-work", "/outputs", "/agi",
  "/ingest", "/start", "/evidence", "/factory", "/calendar", "/gaps",
  "/studio", "/preflight", "/report-quality", "/xray", "/portfolio",
  "/universe", "/obligations", "/corpus", "/controls", "/changes", "/audit", "/packs", "/engine", "/ux-standard", "/feedback", "/host-desk",
];
export const navNumber = (href: string) => { const i = NAV_ORDER.indexOf(href); return i < 0 ? "" : String(i + 1).padStart(2, "0"); };
