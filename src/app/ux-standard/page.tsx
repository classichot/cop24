"use client";

import Link from "next/link";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, SectionHead, Tag } from "@/components/ui";
import { SCREENS, UX_TESTS, UX_TEST_LABEL, evaluate, type Verdict } from "@/core/ux/acceptance";
import { MISSIONS } from "@/core/ux/catalog";
import { GLOSSARY_IDS } from "@/core/ux/guidance";

const mark: Record<Verdict, { g: string; k: "ok" | "warn" | "bad" }> = { yes: { g: "✓", k: "ok" }, partial: { g: "~", k: "warn" }, no: { g: "✕", k: "bad" } };

/** The 24 Series Universal UX Standard as applied to COP24 — principles, components and the §21 register. */
export default function UxStandardPage() {
  const { L, tx } = useApp();
  const results = SCREENS.map(evaluate);
  const complete = results.filter((r) => r.complete).length;
  const components: [string, string, string][] = [
    ["24 Copilot", tx("ปุ่มบนหัวทุกหน้า · Ctrl+K · ช่องบนหน้าหลัก", "Header on every screen · Ctrl+K · home Section A"), "/"],
    [tx("รับเป้าหมาย · การ์ดเป้าหมาย", "Goal Intake · Goal Cards"), tx("Copilot · ตามบทบาท + “ไม่รู้ว่าต้องเริ่มตรงไหน”", "Copilot · by role + “I don't know where to start”"), "/"],
    [tx("แนะนำภารกิจ · การ์ดภารกิจ", "Mission Recommendation · Mission Card"), tx("หน้าหลัก ส่วน C · ภารกิจของฉัน", "Home Section C · My missions"), "/missions"],
    [tx("เส้นทางภารกิจ · ไทม์ไลน์", "Guided Journey · Mission Timeline"), tx("ภารกิจที่เปิดอยู่", "An open mission"), "/missions?m=prelim-cop"],
    ["Next Best Action", tx("แถบ “ต่อไป” บนทุกหน้า · หน้าหลัก ส่วน B", "“Next” strip on every screen · home Section B"), "/my-work"],
    ["Explain This", tx(`${GLOSSARY_IDS.length} คำ อธิบายจากข้อมูลจริง`, `${GLOSSARY_IDS.length} terms, explained from live data`), "/preflight"],
    [tx("ทำเอง | แนะนำฉัน | ทำให้ฉัน", "Do It Myself | Guide Me | Do It For Me"), tx("Copilot และทุกภารกิจ", "Copilot and every mission"), "/missions?m=close-evidence"],
    [tx("ตัวบอก AI กำลังทำงาน", "AI Working indicator"), tx("เส้นทางภารกิจ", "Mission journey"), "/missions?m=prelim-cop&assist=for-me"],
    [tx("การอนุมัติโดยมนุษย์", "Human Approval"), tx("งานของฉัน — ตัดสินค่าที่ขัดแย้งพร้อมเหตุผล", "My work — decide conflicts with a reason"), "/my-work"],
    [tx("คำขอข้อมูลที่ขาด", "Missing Data Request"), tx("งานของฉัน · เตรียมข้อมูล", "My work · Data preparation"), "/ingest"],
    [tx("ความพร้อมข้อมูล · ความคืบหน้า", "Data Readiness · Progress"), tx("การ์ดภารกิจ · เส้นทาง", "Mission card · journey"), "/missions"],
    ["Complexity Guard", tx("แถบช่วยเหลือที่ปิดได้ เมื่อพบสัญญาณว่าผู้ใช้ติดขัด", "A dismissible help strip when struggle signals appear"), "/ux-standard#guard"],
    [tx("ตัวแปลผลลัพธ์", "AI Result Interpreter"), tx("ความพร้อม · ประตู · ช่องว่าง · การควบคุม · ข้อความ", "Readiness · gate · gaps · controls · claims"), "/gaps"],
    [tx("การตั้งค่าขั้นสูง", "Advanced Settings"), tx("เตรียมข้อมูล (OCR และเวอร์ชันกฎ)", "Data preparation (OCR and rule versions)"), "/ingest"],
    [tx("แดชบอร์ดตามบทบาท", "Role-based dashboard"), tx("เจ้าของงาน · ที่ปรึกษา · ผู้บริหาร · ผู้ให้ข้อมูล", "Owner · Advisor · Executive · Contributor"), "/"],
    [tx("ศูนย์ข้อยกเว้น", "Notification / Exception Center"), tx("งานของฉัน", "My work"), "/my-work"],
  ];
  return (
    <div className="page page-wide">
      <PageHead kicker={tx("มาตรฐาน UX 24 SERIES", "24 Series Universal UX Standard")} title={tx("อย่าให้ผู้ใช้ต้องเรียนรู้ซอฟต์แวร์ ให้ซอฟต์แวร์เรียนรู้ว่าผู้ใช้ต้องการอะไร", "Don't ask the user to learn the software. Let the software learn what the user is trying to achieve.")} lead={tx("ซับซ้อนข้างใต้ เรียบง่ายข้างบน — COP24 ใช้มาตรฐานนี้ทั้งระบบ: เป้าหมาย → AI เข้าใจ → ภารกิจ → ทำตามเส้นทาง → ตรวจ → ผลลัพธ์", "Complex underneath, simple on top. COP24 applies the standard end to end: Goal → AI understands → Mission → Guided execution → Review → Outcome.")} />

      <Cells min={200} style={{ marginTop: 20 }}>
        {[
          [tx("ชั้นประสบการณ์", "Experience layer"), tx("Copilot · โหมดง่าย · เส้นทาง · หน้าหลัก A–E", "Copilot · Easy mode · Journey · Home A–E"), "src/components/ux"],
          [tx("ชั้นจัดการภารกิจ", "Mission orchestration"), tx(`เจตนา → ภารกิจ → แผน · ${MISSIONS.length} ภารกิจ`, `Intent → Mission → Plan · ${MISSIONS.length} missions`), "src/core/ux"],
          [tx("บริการของแอป", "Application services"), tx("โมดูลเดิมทั้งหมด ไม่ต้องสร้างใหม่", "Every existing module, unchanged"), "src/app/*"],
          [tx("ชั้น AI / AGI", "AI / AGI layer"), tx("เอเจนต์เดียว · ทีม · ฝูง", "Single · Team · Swarm"), "/missions"],
          [tx("ข้อมูลและหลักฐาน", "Data + evidence"), tx("สแนปช็อต · หลักฐาน 3 ชั้น · การนำเข้า", "Snapshot · 3-layer evidence · ingestion"), "src/core"],
        ].map(([a, b, c]) => (
          <div key={a} className="cell"><div className="label">{a}</div><div style={{ fontWeight: 600, marginTop: 4 }}>{b}</div><div className="code muted tiny" style={{ marginTop: 6 }}>{c}</div></div>
        ))}
      </Cells>

      <hr className="hr hr-section" />
      <SectionHead title={tx("ทะเบียนการทดสอบการยอมรับ (§21)", "Acceptance register (§21)")} tag={tx(`ผ่าน ${complete}/${results.length} หน้าจอ`, `${complete}/${results.length} screens UX-complete`)} note={tx("ทุกหน้าจอบันทึกชั้นความสามารถและชั้นประสบการณ์ (§22) ชุดทดสอบจะล้มเหลวถ้ามีหน้าใหม่ที่ไม่ได้ลงทะเบียน หรืออ้างว่าใช้คอมโพเนนต์ที่หน้านั้นไม่ได้ใช้จริง · ✓ ผ่าน · ~ บางส่วน · ✕ ไม่ผ่าน", "Every screen records its capability and experience layers (§22). The test suite fails if a new screen is not registered, or claims a component it does not use. ✓ yes · ~ partial · ✕ no")} />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{tx("หน้าจอ", "Screen")}</th>
              <th>{tx("ชั้นประสบการณ์", "Experience layer")}</th>
              {UX_TESTS.map((k) => <th key={k} title={L(UX_TEST_LABEL[k].q)} style={{ textAlign: "center" }}>{L(UX_TEST_LABEL[k].name).replace(/^ทดสอบ/, "")}</th>)}
              <th>{tx("ผล", "Result")}</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ spec, complete: ok }) => (
              <tr key={spec.route}>
                <td style={{ verticalAlign: "top", minWidth: 170 }}><Link href={spec.route}>{L(spec.name)}</Link><div className="muted tiny">{spec.tier === "primary" ? tx("เมนูหลัก", "Primary") : tx("ทุกโมดูล", "All modules")}</div></td>
                <td style={{ verticalAlign: "top", fontSize: 12.5, minWidth: 260 }}>{L(spec.experience)}<div className="muted tiny" style={{ marginTop: 3 }}>{tx("ความสามารถ", "Capability")}: {L(spec.capability)}</div>{spec.note && <div className="muted tiny" style={{ marginTop: 3 }}>{L(spec.note)}</div>}</td>
                {UX_TESTS.map((k) => { const m = mark[spec.tests[k]]; return <td key={k} style={{ textAlign: "center", verticalAlign: "top" }}><span className={`mark st-${m.k}`} title={L(UX_TEST_LABEL[k].q)}>{m.g}</span></td>; })}
                <td style={{ verticalAlign: "top" }}><Tag k={ok ? "ok" : "bad"}>{ok ? tx("ครบ", "UX-complete") : tx("ไม่ครบ", "Incomplete")}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="hr hr-section" />
      <SectionHead title={tx("คอมโพเนนต์หลัก 24 (§17)", "24 Core UX Components (§17)")} note={tx("สร้างครั้งเดียวใน src/components/ux และใช้ซ้ำทุกหน้า — แอป 24 ตัวอื่นใช้ชุดเดียวกันได้", "Built once in src/components/ux and reused on every screen — other 24 apps can use the same set.")} />
      <div className="worklist">
        {components.map(([name, where, href]) => (
          <div key={name} className="list-item"><b style={{ minWidth: 240 }}>{name}</b><span className="muted small" style={{ flex: 1 }}>{where}</span><Link href={href} className="btn btn-ghost btn-sm">{tx("ดู", "See")} →</Link></div>
        ))}
      </div>

      <hr className="hr hr-section" />
      <div id="guard">
        <SectionHead title="Complexity Guard (§11)" note={tx("สังเกตเฉพาะในเบราว์เซอร์นี้ระหว่างการใช้งาน ไม่ส่งไปที่ใด: กลับไปมา เปิดหลายหน้าเร็ว กลับมาหน้าเดิม หยุดนาน เปิดปิดการตั้งค่าขั้นสูง ค้นหาไม่พบ ข้อมูลผิดซ้ำ และขอความช่วยเหลือซ้ำ — แล้วเสนอ “แนะนำฉัน” หรือ “ทำให้ฉัน” สำหรับภารกิจที่น่าจะกำลังทำ ปิดได้ทุกครั้ง", "Observed only in this browser session and never sent anywhere: backtracking, rapid navigation, repeat visits, long pauses, advanced-settings toggling, empty searches, repeated errors and repeated help. It then offers “Guide me” or “Do it for me” for the mission you seem to be doing, and can always be dismissed.")} />
      </div>
    </div>
  );
}
