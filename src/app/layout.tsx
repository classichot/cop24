import type { Metadata } from "next";
import { Archivo, Chakra_Petch } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/state/AppState";
import { AppShell } from "@/components/AppShell";

const archivo = Archivo({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-archivo", display: "swap" });
const chakra = Chakra_Petch({ subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-chakra", display: "swap" });

export const metadata: Metadata = {
  title: "COP24 — Compliance ERP",
  description: "COP24 is the horizontal compliance engine of the 24 series: one Compliance Universe, Applicability, Obligation Register, Evidence Pipeline, Calendar, Control Testing, Gap & Remediation, Regulatory Change, Audit Trail and Execution Engine — shared by ESG24, TP24, GMT24, TRADE24 and ACC24.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${archivo.variable} ${chakra.variable}`}>
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
