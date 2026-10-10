"use client";

import Link from "next/link";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, Stat, Tag } from "@/components/ui";
import { APPS, DOMAINS } from "@/packs";
import type { Status } from "@/core/types";

export default function UniversePage() {
  const { L, tx, snap, data } = useApp();
  const entities = data.entities;
  const cellFor = (domainId: string, entityId: string) => {
    const inst = snap.instances.filter((i) => i.domain === domainId && i.entityId === entityId);
    const packs = new Set(inst.map((i) => i.packId));
    const gaps = snap.gaps.filter((g) => g.domain === domainId && g.entityId === entityId && g.status !== "closed");
    const material = gaps.filter((g) => g.severity === "material").length;
    const k: Status = !inst.length ? "info" : material ? "bad" : gaps.length ? "warn" : "ok";
    return { inst, packs, gaps, material, k };
  };
  const installed = data.packs.length;
  const inForce = new Set(snap.instances.map((i) => i.packId)).size;
  const monitored = data.packs.filter((p) => !snap.instances.some((i) => i.packId === p.id));

  return (
    <div className="page page-wide">
      <PageHead kicker={tx("จักรวาลการปฏิบัติตาม / COMPLIANCE UNIVERSE", "Compliance Universe")} title={tx("ทุกกฎหมายที่บังคับใช้กับทั้งกลุ่ม ในแผนที่เดียว", "Every law that binds the group, on one map")} lead={tx("13 โดเมน × ทุกหน่วยงาน Applicability Engine ตัดสินแต่ละช่องว่ามีชุดกฎใดบังคับใช้ และ Gap Engine ระบายสีตามช่องว่างที่เปิดอยู่ — นี่คือสิ่งที่ ESG24 เห็นเฉพาะคอลัมน์ ESG ส่วน COP24 เห็นทั้งแผ่น", "13 domains × every entity. The Applicability Engine decides which packs bind each cell; the Gap Engine colours it by open gaps. ESG24 sees only the ESG column; COP24 sees the whole sheet.")} />

      <Cells min={170} style={{ marginTop: 22 }}>
        <Stat label={tx("โดเมนที่ครอบคลุม", "Domains covered")} value={DOMAINS.length} size="md" />
        <Stat label={tx("ชุดกฎที่ติดตั้ง", "Packs installed")} value={installed} size="md" sub={`${inForce} ${tx("บังคับใช้", "in force")} · ${monitored.length} ${tx("เฝ้าดู", "monitored")}`} />
        <Stat label={tx("ข้อผูกพันที่มีผล", "Obligations in force")} value={snap.instances.length} size="md" sub={tx("ตัวอย่างจากชุดกฎ (ชุดเต็มรวม 278 ข้อ)", "demo subset (full packs total 278)")} />
        <Stat label={tx("ช่องว่างเปิดอยู่", "Open gaps")} value={snap.gaps.filter((g) => g.status !== "closed").length} size="md" color="var(--st-bad)" sub={`${snap.gaps.filter((g) => g.severity === "material" && g.status !== "closed").length} ${tx("สาระสำคัญ", "material")}`} />
      </Cells>

      <div style={{ marginTop: 24, overflowX: "auto" }}>
        <div className="heat" style={{ gridTemplateColumns: `180px repeat(${entities.length}, minmax(190px, 1fr))`, minWidth: 180 + entities.length * 190 }}>
          <div className="heat-cell" style={{ background: "var(--color-bg)", minHeight: 0, justifyContent: "center" }}><span className="label">{tx("โดเมน", "Domain")}</span></div>
          {entities.map((e) => <div key={e.id} className="heat-cell" style={{ background: "var(--color-bg)", minHeight: 0 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{L(e.name)}</span><span className="muted tiny">{L(e.sector)}</span></div>)}
          {DOMAINS.map((d) => (
            <div key={d.id} style={{ display: "contents" }}>
              <div className="heat-cell" style={{ background: "var(--color-bg)" }}><span style={{ fontSize: 13, fontWeight: 600 }}>{L(d.name)}</span><span className="muted tiny">{data.packs.filter((p) => p.domain === d.id).length} {tx("ชุดกฎ", "packs")}</span></div>
              {entities.map((e) => {
                const c = cellFor(d.id, e.id);
                return (
                  <Link key={e.id} href={c.inst.length ? `/obligations?domain=${d.id}&entity=${e.id}` : "/packs"} className={`heat-cell${c.inst.length ? "" : " na"}`}>
                    {c.inst.length ? (
                      <>
                        <Tag k={c.k}>{c.k === "ok" ? tx("ครบ", "Met") : c.k === "warn" ? `${c.gaps.length} ${tx("ช่องว่าง", "gaps")}` : `${c.material} ${tx("สาระสำคัญ", "material")}`}</Tag>
                        <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{c.inst.length} {tx("ข้อผูกพัน", "obligations")}</span>
                        <span className="muted tiny">{Array.from(c.packs).join(", ")}</span>
                      </>
                    ) : (
                      <span className="muted tiny">{tx("ไม่บังคับใช้", "Not applicable")}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <hr className="hr" style={{ margin: "30px 0 18px" }} />
      <h3 style={{ margin: "0 0 12px", fontSize: 21 }}>{tx("ใครใช้คอลัมน์ไหน — แอป 24 บนเครื่องยนต์เดียวกัน", "Who uses which column — the 24 apps on one engine")}</h3>
      <Cells min={200}>
        {APPS.map((a) => {
          const packs = data.packs.filter((p) => p.app === a.id);
          const doms = Array.from(new Set(packs.map((p) => p.domain)));
          return (
            <div key={a.id} className="cell" style={{ borderTop: `4px solid ${a.accent}` }}>
              <div className="heading" style={{ fontSize: 18 }}>{a.name}</div>
              <div className="small muted-7" style={{ lineHeight: 1.5, marginTop: 2 }}>{L(a.tagline)}</div>
              <div className="muted tiny" style={{ marginTop: 8 }}>{a.id === "cop24" ? tx("ทุกโดเมน · เครื่องยนต์ + แพ็กทั่วไป", "All domains · engine + general packs") : doms.length ? doms.map((x) => L(DOMAINS.find((d) => d.id === x)!.short)).join(" · ") : tx("ยังไม่มีแพ็ก", "No packs yet")} · {packs.length} {tx("ชุดกฎ", "packs")}</div>
              <Tag k={a.status === "core" ? "ok" : a.status === "live" ? "ok" : "cond"} style={{ marginTop: 8 }}>{a.status === "core" ? tx("เครื่องยนต์หลัก", "Core engine") : a.status === "live" ? tx("ใช้งานบน COP24 แล้ว", "Running on COP24") : tx("แผนงาน", "Planned")}</Tag>
            </div>
          );
        })}
      </Cells>
    </div>
  );
}
