import type { Recipient } from "@/core/ingest/requests";

/**
 * Evidence owners for the demo tenant (illustrative people; *.example addresses never deliver).
 * In production this comes from the tenant's directory with role-based access.
 */
export const OWNERS: Record<string, Recipient> = {
  "ET-LICENCE": { name: "สมชาย ใจดี", role: "ฝ่ายกำกับดูแลกิจการ", email: "somchai@lgp.example", external: false, language: "th" },
  "ET-LOCATION-CERT": { name: "สมชาย ใจดี", role: "ฝ่ายกำกับดูแลกิจการ", email: "somchai@lgp.example", external: false, language: "th" },
  "ET-SITE-PLAN": { name: "วิชัย วิศวกร", role: "วิศวกรโครงการ", email: "wichai@lgp.example", external: false, language: "th" },
  "ET-ENG-DESIGN": { name: "วิชัย วิศวกร", role: "วิศวกรโครงการ", email: "wichai@lgp.example", external: false, language: "th" },
  "ET-NOISE-BASELINE": { name: "พรทิพย์ สิ่งแวดล้อม", role: "หน่วยสิ่งแวดล้อมประจำไซต์", email: "porntip@lgp.example", external: false, language: "th" },
  "ET-WATER-OPS": { name: "พรทิพย์ สิ่งแวดล้อม", role: "หน่วยสิ่งแวดล้อมประจำไซต์", email: "porntip@lgp.example", external: false, language: "th" },
  "ET-PHOTOS": { name: "พรทิพย์ สิ่งแวดล้อม", role: "หน่วยสิ่งแวดล้อมประจำไซต์", email: "porntip@lgp.example", external: false, language: "th" },
  "ET-LAB-ACCRED": { name: "Envirolab Co., Ltd.", role: "Laboratory provider", email: "reports@envirolab.example", external: true, language: "en" },
  "ET-AIR-CONSTRUCTION": { name: "Envirolab Co., Ltd.", role: "Laboratory provider", email: "reports@envirolab.example", external: true, language: "en" },
  "ET-NOISE-CONSTRUCTION": { name: "Envirolab Co., Ltd.", role: "Laboratory provider", email: "reports@envirolab.example", external: true, language: "en" },
  "ET-SOIL": { name: "ที่ปรึกษาสิ่งแวดล้อมไทย", role: "ที่ปรึกษาสิ่งแวดล้อม", email: "cop@thai-env-consult.example", external: true, language: "th" },
  "ET-PREPARER": { name: "ที่ปรึกษาสิ่งแวดล้อมไทย", role: "ที่ปรึกษาสิ่งแวดล้อม", email: "cop@thai-env-consult.example", external: true, language: "th" },
  "ET-MEASURES-TABLE": { name: "ที่ปรึกษาสิ่งแวดล้อมไทย", role: "ที่ปรึกษาสิ่งแวดล้อม", email: "cop@thai-env-consult.example", external: true, language: "th" },
  "ET-HEARING": { name: "อรุณี ชุมชน", role: "ฝ่ายชุมชนสัมพันธ์", email: "arunee@lgp.example", external: false, language: "th" },
  "ET-COMPLAINTS": { name: "อรุณี ชุมชน", role: "ฝ่ายชุมชนสัมพันธ์", email: "arunee@lgp.example", external: false, language: "th" },
  "ET-WASTE": { name: "ประเสริฐ ปฏิบัติการ", role: "ฝ่ายปฏิบัติการโรงไฟฟ้า", email: "prasert@lgp.example", external: false, language: "th" },
  "ET-OHS": { name: "กมล ความปลอดภัย", role: "จป. วิชาชีพ", email: "kamol@lgp.example", external: false, language: "th" },
  "ET-HISTORY": { name: "สมชาย ใจดี", role: "ฝ่ายกำกับดูแลกิจการ", email: "somchai@lgp.example", external: false, language: "th" },
};
