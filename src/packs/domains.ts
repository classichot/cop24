import { t } from "@/core/i18n-text";
import type { AppId, Domain, LText } from "@/core/types";

/** The Compliance Universe — every domain COP24 is designed to cover. */
export const DOMAINS: Domain[] = [
  { id: "corporate", name: t("กฎหมายบริษัทและทะเบียนธุรกิจ", "Corporate & company registry"), short: t("บริษัท", "Corporate") },
  { id: "tax", name: t("ภาษีอากร", "Tax"), short: t("ภาษี", "Tax") },
  { id: "labour", name: t("แรงงานและความปลอดภัย", "Labour & safety"), short: t("แรงงาน", "Labour") },
  { id: "privacy", name: t("ข้อมูลส่วนบุคคล / PDPA", "Privacy / PDPA"), short: t("PDPA", "PDPA") },
  { id: "environmental", name: t("สิ่งแวดล้อม", "Environmental"), short: t("สิ่งแวดล้อม", "Environment") },
  { id: "licensing", name: t("ใบอนุญาตและการกำกับกิจการ", "Licensing & sector regulators"), short: t("ใบอนุญาต", "Licensing") },
  { id: "governance", name: t("การกำกับดูแลกิจการ", "Governance"), short: t("กำกับดูแล", "Governance") },
  { id: "industry", name: t("มาตรฐานเฉพาะอุตสาหกรรม", "Industry-specific"), short: t("อุตสาหกรรม", "Industry") },
  { id: "cyber", name: t("ความมั่นคงปลอดภัยไซเบอร์", "Cybersecurity"), short: t("ไซเบอร์", "Cyber") },
  { id: "trade", name: t("การค้าระหว่างประเทศ / FTA", "Trade / FTA"), short: t("การค้า", "Trade") },
  { id: "financial", name: t("การรายงานทางการเงิน", "Financial reporting"), short: t("การเงิน", "Financial") },
  { id: "esg", name: t("ESG และความยั่งยืน", "ESG & sustainability"), short: t("ESG", "ESG") },
  { id: "policy", name: t("นโยบายภายในองค์กร", "Internal policy"), short: t("นโยบาย", "Policy") },
];

export const APPS: { id: AppId; name: string; tagline: LText; accent: string; status: "core" | "live" | "planned" }[] = [
  { id: "cop24", name: "COP24", tagline: t("Compliance ERP — ชั้นเครื่องยนต์ร่วมของทั้ง 24 series", "Compliance ERP — the common engine of the 24 series"), accent: "#f5c518", status: "core" },
  { id: "esg24", name: "ESG24", tagline: t("ESG Compliance & Sustainability OS — ขับเคลื่อนด้วย COP24", "ESG Compliance & Sustainability OS — powered by COP24"), accent: "#2f8f5b", status: "live" },
  { id: "tp24", name: "TP24", tagline: t("Transfer Pricing — เอกสารและการเปิดเผยราคาโอน", "Transfer pricing documentation & disclosure"), accent: "#1b3a8c", status: "live" },
  { id: "gmt24", name: "GMT24", tagline: t("Pillar Two / Global Minimum Tax", "Pillar Two / global minimum tax"), accent: "#6b3fa0", status: "planned" },
  { id: "trade24", name: "TRADE24", tagline: t("การค้าระหว่างประเทศ ถิ่นกำเนิดสินค้า และ FTA", "Trade, origin & FTA compliance"), accent: "#b8651b", status: "planned" },
  { id: "acc24", name: "ACC24", tagline: t("บัญชีและภาษีตามรอบ", "Accounting & periodic tax compliance"), accent: "#4a5660", status: "planned" },
];
