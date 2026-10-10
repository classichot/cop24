"use client";

import { Fragment, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/state/AppState";
import { AppChip, PageHead, Seg, Tag } from "@/components/ui";
import { APPS, DOMAINS } from "@/packs";
import type { Status } from "@/core/types";

function Register() {
  const { L, tx, snap, data, fd } = useApp();
  const sp = useSearchParams();
  const [entity, setEntity] = useState(sp.get("entity") ?? "all");
  const [domain, setDomain] = useState(sp.get("domain") ?? "all");
  const [app, setApp] = useState(sp.get("app") ?? "all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [openKey, setOpenKey] = useState("");

  const rows = snap.instances.filter((i) => (entity === "all" || i.entityId === entity) && (domain === "all" || i.domain === domain) && (app === "all" || i.app === app) && (status === "all" || i.status === status));
  const counts = (k: Status) => snap.instances.filter((i) => i.status === k).length;
  const sevLabel = (s: string) => (s === "material" ? tx("สาระสำคัญ", "Material") : s === "major" ? tx("สำคัญ", "Major") : tx("ทั่วไป", "Minor"));

  return (
    <div className="page page-wide">
      <PageHead kicker={tx("ทะเบียนข้อผูกพัน / OBLIGATION REGISTER", "Obligation Register")} title={tx("หนึ่งแถวต่อหนึ่งหน้าที่ มีเจ้าของ ความถี่ หลักฐาน และสถานะ", "One row per duty, with an owner, frequency, evidence and status")} lead={tx("Regulation / Obligation Engine สร้างทะเบียนนี้จากชุดกฎที่ Applicability Engine ตัดสินว่าบังคับใช้ — ไม่ใช่สเปรดชีตที่ใครพิมพ์เอง สถานะทุกแถวมาจาก Evidence Engine", "The Regulation / Obligation Engine builds this register from the packs the Applicability Engine says bind — nobody types it in. Every row's status comes from the Evidence Engine.")} />

      <div className="row row-center" style={{ gap: 12, marginTop: 22 }}>
        <select className="input" value={entity} onChange={(e) => setEntity(e.target.value)} style={{ maxWidth: 240 }}><option value="all">{tx("ทุกหน่วยงาน", "All entities")}</option>{data.entities.map((e) => <option key={e.id} value={e.id}>{L(e.name)}</option>)}</select>
        <select className="input" value={domain} onChange={(e) => setDomain(e.target.value)} style={{ maxWidth: 220 }}><option value="all">{tx("ทุกโดเมน", "All domains")}</option>{DOMAINS.map((d) => <option key={d.id} value={d.id}>{L(d.name)}</option>)}</select>
        <select className="input" value={app} onChange={(e) => setApp(e.target.value)} style={{ maxWidth: 160 }}><option value="all">{tx("ทุกแอป", "All apps")}</option>{APPS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <Seg<"all" | Status> name="st" value={status} onChange={setStatus} options={[{ v: "all", label: `${tx("ทั้งหมด", "All")} ${snap.instances.length}` }, { v: "ok", label: `${tx("ครบ", "Met")} ${counts("ok")}` }, { v: "warn", label: `${tx("ต้องตรวจ", "Review")} ${counts("warn")}` }, { v: "bad", label: `${tx("ขาด", "Missing")} ${counts("bad")}` }, { v: "cond", label: `${tx("ยังไม่ผูก", "Unbound")} ${counts("cond")}` }]} />
      </div>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="table" style={{ minWidth: 960 }}>
          <thead><tr><th style={{ width: 160 }}>{tx("รหัส", "ID")}</th><th>{tx("ข้อผูกพัน", "Obligation")}</th><th style={{ width: 150 }}>{tx("หน่วยงาน", "Entity")}</th><th style={{ width: 110 }}>{tx("โดเมน", "Domain")}</th><th style={{ width: 150 }}>{tx("ผู้รับผิดชอบ", "Owner")}</th><th style={{ width: 110 }}>{tx("ความถี่", "Frequency")}</th><th style={{ width: 110 }}>{tx("ถัดไป", "Next due")}</th><th style={{ width: 90 }}>{tx("หลักฐาน", "Evidence")}</th><th style={{ width: 120 }}>{tx("สถานะ", "Status")}</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const appDef = APPS.find((a) => a.id === r.app)!;
              const open = openKey === r.key;
              return (
                <Fragment key={r.key}>
                  <tr onClick={() => setOpenKey(open ? "" : r.key)} style={{ cursor: "pointer" }}>
                    <td style={{ verticalAlign: "top" }}><div className="code" style={{ fontWeight: 600 }}>{r.obligation.id}</div><AppChip app={appDef.name} accent={appDef.accent} /></td>
                    <td style={{ verticalAlign: "top", lineHeight: 1.4 }}><div style={{ fontWeight: 600 }}>{L(r.obligation.title)}</div><div className="muted tiny">{sevLabel(r.obligation.severity)} · {r.packId} · {L(r.obligation.dueRule)}</div></td>
                    <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(data.entities.find((e) => e.id === r.entityId)!.name)}</td>
                    <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(DOMAINS.find((d) => d.id === r.domain)!.short)}</td>
                    <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(r.obligation.ownerRole)}</td>
                    <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{r.obligation.frequency}</td>
                    <td style={{ verticalAlign: "top", fontSize: 13 }}>{fd(r.nextDue)}</td>
                    <td style={{ verticalAlign: "top", fontSize: 13, textAlign: "center" }}>{r.evidence.filter((e) => e.layers.every((m) => m === 1)).length} / {r.evidence.length}</td>
                    <td style={{ verticalAlign: "top" }}><Tag k={r.status}>{L(r.statusLabel)}</Tag></td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={9} style={{ background: "var(--color-surface)", borderLeft: "3px solid var(--color-accent)", padding: "14px 18px" }}>
                        <div style={{ fontSize: 13, lineHeight: 1.7 }}>{L(r.obligation.summary)}</div>
                        <div className="small muted-7" style={{ marginTop: 6 }}><strong>{tx("หลักฐานที่ต้องมี", "Required evidence")}:</strong> {r.obligation.evidenceRequired.map((e) => L(e)).join(" · ")}{r.obligation.reportDest ? <> · <strong>{tx("ปลายทาง", "Destination")}:</strong> {L(r.obligation.reportDest)}</> : null}</div>
                        <div className="small muted-7" style={{ marginTop: 4 }}><strong>{tx("หลักฐานที่ผูกแล้ว", "Bound evidence")}:</strong> {r.evidence.length ? r.evidence.map((e) => `${e.id} ${L(e.name)} (${L(e.statusLabel)})`).join(" · ") : tx("ยังไม่มี", "none")}</div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ObligationsPage() {
  return <Suspense fallback={null}><Register /></Suspense>;
}
