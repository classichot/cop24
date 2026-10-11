"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/state/AppState";
import { AppChip, Cells, PageHead, Stat, Tag } from "@/components/ui";
import { APPS, DOMAINS } from "@/packs";
import type { AppId } from "@/core/types";

const CAPABILITIES = [
  { th: "Compliance Universe", en: "Compliance Universe", href: "/universe" },
  { th: "Applicability Engine", en: "Applicability Engine", href: "/start" },
  { th: "Obligation Register", en: "Obligation Register", href: "/obligations" },
  { th: "Evidence Pipeline", en: "Evidence Pipeline", href: "/evidence" },
  { th: "Compliance Calendar", en: "Compliance Calendar", href: "/calendar" },
  { th: "Control Testing", en: "Control Testing", href: "/controls" },
  { th: "Gap & Remediation", en: "Gap & Remediation", href: "/gaps" },
  { th: "Regulatory Change Monitor", en: "Regulatory Change Monitor", href: "/changes" },
  { th: "Audit Trail", en: "Audit Trail", href: "/audit" },
  { th: "Execution Engine", en: "Execution Engine", href: "/missions" },
];

export default function PacksPage() {
  const { L, tx, snap, data, fd } = useApp();
  const [view, setView] = useState<AppId>("esg24");
  const app = APPS.find((a) => a.id === view)!;
  const appInst = snap.instances.filter((i) => i.app === view);
  const appGaps = snap.gaps.filter((g) => appInst.some((i) => i.key === g.key) && g.status !== "closed");
  const appEvents = snap.calendar.filter((e) => appInst.some((i) => i.packId === e.packId)).slice(0, 4);

  return (
    <div className="page page-wide">
      <PageHead explain={["rulepack"]} kicker={tx("แพ็กและแอป 24 / PACKS & 24 APPS", "Packs & 24 apps")} title={tx("เครื่องยนต์เดียว หลายแอป — ESG24 คือ COP24 ที่ใส่ชุด ESG", "One engine, many apps — ESG24 is COP24 wearing an ESG skin")} lead={tx("ชุดกฎ (pack) คือความรู้เฉพาะโดเมน: เกณฑ์การบังคับใช้ ข้อผูกพัน แบบรายงาน แอป 24 แต่ละตัวนำแพ็กของตนมาวางบนเครื่องยนต์ COP24 แล้วใส่ UI การคำนวณ และภารกิจเฉพาะทางของตัวเอง ลูกค้า ESG24 จึงเห็นความสามารถร่วมทั้ง 10 อย่างในเวอร์ชัน ESG โดยไม่รู้สึกว่าต้องซื้ออีกผลิตภัณฑ์", "A pack is domain knowledge: applicability criteria, obligations and report templates. Each 24 app brings its packs to the COP24 engine and adds its own UI, calculations and missions — so an ESG24 customer sees all ten shared capabilities in ESG form without feeling they need another product.")} />

      <h3 style={{ margin: "26px 0 10px", fontSize: 21 }}>{tx("ชุดกฎที่ติดตั้งในผู้เช่านี้", "Packs installed in this tenant")}</h3>
      <div className="table-wrap">
        <table className="table" style={{ minWidth: 900 }}>
          <thead><tr><th style={{ width: 90 }}>{tx("แอป", "App")}</th><th>{tx("ชุดกฎ", "Pack")}</th><th style={{ width: 120 }}>{tx("โดเมน", "Domain")}</th><th style={{ width: 150 }}>{tx("หน่วยงานกำกับ", "Authority")}</th><th style={{ width: 90 }}>{tx("เวอร์ชัน", "Version")}</th><th style={{ width: 90 }}>{tx("ข้อผูกพัน", "Obligations")}</th><th style={{ width: 150 }}>{tx("สถานะในผู้เช่า", "Tenant status")}</th></tr></thead>
          <tbody>
            {data.packs.map((p) => {
              const a = APPS.find((x) => x.id === p.app)!;
              const ents = data.entities.filter((e) => snap.applicability.some((r) => r.packId === p.id && r.entityId === e.id && r.applicable));
              return (
                <tr key={p.id}>
                  <td style={{ verticalAlign: "top" }}><AppChip app={a.name} accent={a.accent} /></td>
                  <td style={{ verticalAlign: "top", lineHeight: 1.4 }}><div style={{ fontWeight: 600 }}>{L(p.name)}</div><div className="muted tiny">{p.id} · {L(p.source)}</div></td>
                  <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(DOMAINS.find((d) => d.id === p.domain)!.short)}</td>
                  <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(p.authority)}</td>
                  <td className="code" style={{ verticalAlign: "top" }}>{p.version}<div className="muted tiny" style={{ fontFamily: "var(--font-body)" }}>{fd(p.effectiveFrom)}</div></td>
                  <td style={{ verticalAlign: "top", fontSize: 13, textAlign: "center" }}>{p.obligationCount}</td>
                  <td style={{ verticalAlign: "top" }}>{ents.length ? <Tag k="ok">{tx("บังคับใช้", "In force")} · {ents.length} {tx("หน่วยงาน", "entities")}</Tag> : <Tag k="cond">{tx("เฝ้าดู · ยังไม่เข้าเกณฑ์", "Monitored · below threshold")}</Tag>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <hr className="hr" style={{ margin: "30px 0 18px" }} />
      <div className="section-head">
        <h3>{tx("ประสบการณ์ COP24 ภายในแอป 24 แต่ละตัว", "The COP24 experience inside each 24 app")}</h3>
        <div className="seg">
          {APPS.filter((a) => a.id !== "cop24").map((a) => (
            <label key={a.id} className="seg-opt"><input type="radio" name="appview" checked={view === a.id} onChange={() => setView(a.id)} />{a.name}</label>
          ))}
        </div>
      </div>
      <p className="text-muted small" style={{ margin: "6px 0 14px" }}>{tx("ด้านล่างคือหน้าจอ “หน้าหลัก” ที่ลูกค้าของแอปนั้นเห็น — ข้อมูลจาก Snapshot เดียวกัน กรองตามแพ็กของแอป และย้อมสีตามแบรนด์ของแอป", "Below is the home screen that app's customer sees — the same snapshot, filtered to the app's packs, tinted in the app's brand.")}</p>

      <div className={`theme-${view}`} style={{ border: "2px solid var(--color-divider)", background: "var(--color-bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", borderBottom: "2px solid var(--color-divider)" }}>
          <span className="heading" style={{ fontSize: 18 }}>{app.name}</span>
          <span className="brand-sub">{L(app.tagline)}</span>
          <span className="muted tiny" style={{ marginLeft: "auto" }}>powered by COP24 Core · {tx("ชุดกฎ", "packs")} {data.packs.filter((p) => p.app === view).length}</span>
        </div>
        {appInst.length ? (
          <div style={{ padding: 18 }}>
            <Cells min={150}>
              <Stat label={tx("ข้อผูกพันที่มีผล", "Obligations in force")} value={appInst.length} size="md" />
              <Stat label={tx("หลักฐานครบ", "Evidence complete")} value={appInst.filter((i) => i.status === "ok").length} size="md" color="var(--st-ok)" />
              <Stat label={tx("ช่องว่างเปิดอยู่", "Open gaps")} value={appGaps.length} size="md" color={appGaps.length ? "var(--st-bad)" : undefined} />
              <Stat label={tx("กฎที่เปลี่ยน", "Rule changes")} value={snap.impacts.filter((i) => data.packs.find((p) => p.id === i.change.packId)!.app === view).length} size="md" />
            </Cells>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, marginTop: 18 }}>
              <div>
                <div className="label" style={{ marginBottom: 8 }}>{tx("ทะเบียนข้อผูกพัน (มุมมองแอป)", "Obligation Register (app view)")}</div>
                <div style={{ borderTop: "2px solid var(--color-divider)" }}>
                  {appInst.slice(0, 5).map((i) => (
                    <div key={i.key} className="list-item" style={{ padding: "9px 0" }}>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{L(i.obligation.title)}</div><div className="muted tiny">{i.obligation.id} · {fd(i.nextDue)}</div></div>
                      <Tag k={i.status}>{L(i.statusLabel)}</Tag>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 8 }}>{tx("ปฏิทินและสิ่งที่ควรทำต่อไป", "Calendar & next action")}</div>
                <div style={{ borderTop: "2px solid var(--color-divider)" }}>
                  {appEvents.map((e) => <div key={e.id} className="list-item" style={{ padding: "9px 0" }}><span className="code" style={{ width: 86, flex: "none" }}>{e.date}</span><span style={{ fontSize: 13, flex: 1 }}>{L(e.label)}</span><Tag k={e.status}>{e.kind}</Tag></div>)}
                </div>
                {appGaps[0] && <div className="callout" style={{ marginTop: 12, padding: 14 }}><div className="callout-kicker">Next Best Action</div><div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>{L(appGaps[0].remediation)}</div><div className="tiny" style={{ marginTop: 4, color: "var(--color-accent-800)" }}>{L(appGaps[0].cause)}</div></div>}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 28 }} className="muted small">{tx(`${app.name} ยังไม่มีข้อผูกพันที่บังคับใช้กับผู้เช่านี้ — แพ็กถูกติดตั้งในโหมดเฝ้าดู และจะเปิดใช้ทันทีเมื่อโปรไฟล์หน่วยงานเข้าเกณฑ์ (เช่น รายได้กลุ่มถึง 750 ล้านยูโร)`, `${app.name} has no obligations in force for this tenant — its packs are installed in monitor mode and switch on the moment an entity profile crosses the threshold (e.g. group revenue reaches EUR 750m).`)}</div>
        )}
      </div>

      <hr className="hr" style={{ margin: "30px 0 18px" }} />
      <h3 style={{ margin: "0 0 12px", fontSize: 21 }}>{tx("ความสามารถร่วม 10 อย่างที่ทุกแอปได้รับจาก COP24", "The ten shared capabilities every app inherits from COP24")}</h3>
      <Cells min={210}>
        {CAPABILITIES.map((c, i) => (
          <Link key={c.en} href={c.href} className="tile tile-sm">
            <span className="tile-num">{String(i + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{L(c)}</span>
            <span className="muted tiny">{tx("เวอร์ชัน ESG / TP / GMT ของหน้าจอเดียวกัน", "ESG / TP / GMT versions of the same screen")}</span>
          </Link>
        ))}
      </Cells>
    </div>
  );
}
