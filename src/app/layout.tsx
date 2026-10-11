import type { Metadata, Viewport } from "next";
import { Archivo, Chakra_Petch } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/state/AppState";
import { THEME_KEY } from "@/state/theme";
import { AppShell } from "@/components/AppShell";

const archivo = Archivo({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-archivo", display: "swap" });
const chakra = Chakra_Petch({ subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-chakra", display: "swap" });

export const metadata: Metadata = {
  title: "COP24 — Compliance ERP",
  description: "COP24 is the horizontal compliance engine of the 24 series: one Compliance Universe, Applicability, Obligation Register, Evidence Pipeline, Calendar, Control Testing, Gap & Remediation, Regulatory Change, Audit Trail and Execution Engine — shared by ESG24, TP24, GMT24, TRADE24 and ACC24.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

// Runs before first paint: the saved theme, or the operating-system setting when nothing is saved.
const THEME_SCRIPT = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem(${JSON.stringify(THEME_KEY)})}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${archivo.variable} ${chakra.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
