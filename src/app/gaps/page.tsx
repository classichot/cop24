"use client";

import { useState } from "react";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, Seg, Stat, Tag } from "@/components/ui";
import { DOMAINS } from "@/packs";
import type { Gap, Severity, Status } from "@/core/types";

export default function GapsPage() {
  const { L, tx, snap, data, fd } = useApp();
  const [sev, setSev] = useState<"all" | Severity>("all");
  const [source, setSource] = useState<"all" | Gap["source"]>("all");
  const open = snap.gaps.filter((g) => g.status !== "closed");
  const rows = open.filter((g) => (sev === "all" || g.severity === sev) && (source === "all" || g.source === source));
  const sevK = (s: Severity): Status => (s === "material" ? "bad" : s === "major" ? "warn" : "info");
  const sevLabel = (s: Severity) => (s === "material" ? tx("สาระสำคัญ", "Material") : s === "major" ? tx("สำคัญ", "Major") : tx("ทั่วไป", "Minor"));
  const srcLabel = (s: Gap["source"]) => ({ evidence: tx("หลักฐาน", "Evidence"), control: tx("การควบคุม", "Control"), change: tx("กฎเปลี่ยน", "Change"), preflight: tx("ตรวจก่อนยื่น", "Preflight") })[s];

  return (
    <div className="page page-wide">
      <PageHead explain={["material-gap"]} interpret="gaps" kicker={tx("ช่องว่างและการแก้ไข / GAP & REMEDIATION", "Gap & Remediation")} title={tx("ช่องว่างถูกค้นพบ ไม่ได้ถูกพิมพ์ — และไม่หายไปเองจนกว่าจะมีคนปิด", "Gaps are derived, not typed — and never vanish until a person closes them")} lead={tx("ทุกช่องว่างมาจากเครื่องยนต์ใดเครื่องยนต์หนึ่ง: หลักฐานที่ไม่ผ่านชั้นใดชั้นหนึ่ง การควบคุมที่ล้มเหลว กฎที่เปลี่ยน หรือการตรวจก่อนยื่น แต่ละรายการมีสาเหตุ แนวทางแก้ เจ้าของ และกำหนดเสร็จ", "Every gap comes from an engine: evidence failing a layer, a failed control, a regulatory change or a preflight check. Each carries a cause, a remediation, an owner and a due date.")} />

      <Cells min={150} style={{ marginTop: 22 }}>
        <Stat label={tx("เปิดอยู่", "Open")} value={open.length} size="md" />
        <Stat label={tx("สาระสำคัญ", "Material")} value={open.filter((g) => g.severity === "material").length} size="md" color="var(--st-bad)" />
        <Stat label={tx("กำลังแก้ไข", "In progress")} value={open.filter((g) => g.status === "in-progress").length} size="md" color="var(--st-warn)" />
        <Stat label={tx("จากหลักฐาน / การควบคุม", "From evidence / controls")} value={`${open.filter((g) => g.source === "evidence").length} / ${open.filter((g) => g.source === "control").length}`} size="md" />
      </Cells>

      <div className="row row-center" style={{ gap: 12, marginTop: 22 }}>
        <Seg<"all" | Severity> name="sev" value={sev} onChange={setSev} options={[{ v: "all", label: tx("ทุกระดับ", "All severities") }, { v: "material", label: tx("สาระสำคัญ", "Material") }, { v: "major", label: tx("สำคัญ", "Major") }, { v: "minor", label: tx("ทั่วไป", "Minor") }]} />
        <Seg<"all" | Gap["source"]> name="src" value={source} onChange={setSource} options={[{ v: "all", label: tx("ทุกที่มา", "All sources") }, { v: "evidence", label: tx("หลักฐาน", "Evidence") }, { v: "control", label: tx("การควบคุม", "Control") }, { v: "change", label: tx("กฎเปลี่ยน", "Change") }, { v: "preflight", label: tx("ตรวจก่อนยื่น", "Preflight") }]} />
        <button className="btn btn-primary" style={{ marginLeft: "auto" }}>{tx("ให้ AI ร่างแผนแก้ไขทั้งชุด →", "Let AI draft the whole remediation plan →")}</button>
      </div>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="table" style={{ minWidth: 980 }}>
          <thead><tr><th style={{ width: 70 }}>{tx("รหัส", "ID")}</th><th style={{ width: 100 }}>{tx("ระดับ", "Severity")}</th><th>{tx("สาเหตุ", "Cause")}</th><th>{tx("แนวทางแก้ไข", "Remediation")}</th><th style={{ width: 140 }}>{tx("ข้อผูกพัน", "Obligation")}</th><th style={{ width: 130 }}>{tx("เจ้าของ", "Owner")}</th><th style={{ width: 100 }}>{tx("กำหนด", "Due")}</th><th style={{ width: 100 }}>{tx("ที่มา", "Source")}</th></tr></thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id}>
                <td className="code" style={{ verticalAlign: "top", fontWeight: 600 }}>{g.id}<div className="muted tiny" style={{ fontFamily: "var(--font-body)" }}>{g.status === "in-progress" ? tx("กำลังแก้", "In progress") : tx("เปิด", "Open")}</div></td>
                <td style={{ verticalAlign: "top" }}><Tag k={sevK(g.severity)}>{sevLabel(g.severity)}</Tag></td>
                <td style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.55 }}>{L(g.cause)}</td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.55 }}>{L(g.remediation)}</td>
                <td style={{ verticalAlign: "top" }}><div className="code">{g.obligationId}</div><div className="muted tiny">{L(data.entities.find((e) => e.id === g.entityId)!.name)} · {L(DOMAINS.find((d) => d.id === g.domain)!.short)}</div></td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(g.owner)}</td>
                <td style={{ verticalAlign: "top", fontSize: 13 }}>{fd(g.due)}</td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{srcLabel(g.source)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
