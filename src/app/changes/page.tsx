"use client";

import Link from "next/link";
import { useApp } from "@/state/AppState";
import { AppChip, Cells, PageHead, Stat, Tag } from "@/components/ui";
import { APPS } from "@/packs";
import { daysUntil } from "@/core/dates";

export default function ChangesPage() {
  const { L, tx, snap, data, fd } = useApp();
  const impacts = snap.impacts;
  return (
    <div className="page page-mid">
      <PageHead explain={["reg-change"]} kicker={tx("ติดตามกฎที่เปลี่ยน / REGULATORY CHANGE MONITOR", "Regulatory Change Monitor")} title={tx("กฎเปลี่ยน → ข้อผูกพันเปลี่ยน → บทที่ต้องแก้ → ใครต้องทำ", "A rule changes → obligations change → chapters to fix → who must act")} lead={tx("Regulatory Change Engine รับประกาศจากทุกหน่วยงานกำกับ แล้วกระจายผลกระทบลงทะเบียนข้อผูกพัน รายงานที่กำลังร่าง และหน่วยงานที่เกี่ยวข้อง — ESG24 เห็นเฉพาะประกาศของ ก.ล.ต. และ อบก. COP24 เห็นทั้งหมด", "The Regulatory Change Engine ingests notices from every regulator and propagates impact into the Obligation Register, in-flight reports and affected entities. ESG24 sees only SEC and TGO notices; COP24 sees them all.")} />

      <Cells min={170} style={{ marginTop: 22 }}>
        <Stat label={tx("การเปลี่ยนแปลงที่ติดตาม", "Changes tracked")} value={impacts.length} size="md" />
        <Stat label={tx("ใหม่ · ยังไม่ประเมิน", "New · unassessed")} value={impacts.filter((i) => i.change.status === "new").length} size="md" color="var(--st-bad)" />
        <Stat label={tx("ข้อผูกพันที่กระทบ", "Obligations affected")} value={impacts.reduce((n, i) => n + i.obligations.length, 0)} size="md" />
        <Stat label={tx("ข้อผูกพันใหม่ที่เสนอ", "New obligations proposed")} value={impacts.reduce((n, i) => n + (i.change.newObligations?.length ?? 0), 0)} size="md" color="var(--color-accent-700)" />
      </Cells>

      <div style={{ marginTop: 24, borderTop: "2px solid var(--color-divider)" }}>
        {impacts.map((im) => {
          const pack = data.packs.find((p) => p.id === im.change.packId)!;
          const app = APPS.find((a) => a.id === pack.app)!;
          const k = im.change.status === "new" ? "bad" : im.change.status === "assessed" ? "warn" : "ok";
          return (
            <div key={im.change.id} style={{ borderBottom: "1px solid var(--color-divider)", padding: "18px 0" }}>
              <div className="row row-center" style={{ gap: 10 }}>
                <Tag k={k}>{im.change.status === "new" ? tx("ใหม่", "New") : im.change.status === "assessed" ? tx("ประเมินแล้ว", "Assessed") : tx("นำไปใช้แล้ว", "Applied")}</Tag>
                <AppChip app={app.name} accent={app.accent} />
                <span className="muted small">{im.change.id} · {L(im.change.authority)} · {tx("ประกาศ", "published")} {fd(im.change.publishedOn)} · {tx("มีผล", "effective")} {fd(im.change.effectiveOn)} ({daysUntil(im.change.effectiveOn)} {tx("วัน", "days")})</span>
              </div>
              <div className="heading" style={{ fontSize: 18, marginTop: 8, lineHeight: 1.3 }}>{L(im.change.title)}</div>
              <div className="small muted-7" style={{ marginTop: 4, lineHeight: 1.6 }}>{L(im.change.summary)}</div>
              <Cells min={180} thin style={{ marginTop: 12 }}>
                <div className="cell cell-bg cell-tight"><div className="label-9">{tx("ความรุนแรง", "Severity")}</div><Tag k={im.severity === "material" ? "bad" : im.severity === "major" ? "warn" : "info"} style={{ marginTop: 4 }}>{im.severity}</Tag></div>
                <div className="cell cell-bg cell-tight"><div className="label-9">{tx("ข้อผูกพันที่กระทบ", "Obligations hit")}</div><div className="code" style={{ marginTop: 4, lineHeight: 1.5 }}>{Array.from(new Set(im.obligations.map((o) => o.obligation.id))).join(", ") || "—"}</div></div>
                <div className="cell cell-bg cell-tight"><div className="label-9">{tx("หน่วยงาน", "Entities")}</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{im.entities.map((e) => L(data.entities.find((x) => x.id === e)!.name)).join(", ") || "—"}</div></div>
                <div className="cell cell-bg cell-tight"><div className="label-9">{tx("บทที่ต้องแก้", "Chapters to revise")}</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{im.chapters.length ? im.chapters.map((c) => `${c.reportId} › ${c.chapterId}`).join(", ") : "—"}</div></div>
              </Cells>
              {im.change.newObligations?.map((o) => (
                <div key={o.id} className="callout-bar" style={{ marginTop: 12 }}>
                  <div className="callout-kicker">{tx("ข้อผูกพันใหม่ที่เครื่องยนต์เสนอให้เพิ่มลงทะเบียน", "New obligation the engine proposes to add to the register")}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{o.id} · {L(o.title)}</div>
                  <div className="small muted-7" style={{ marginTop: 3, lineHeight: 1.55 }}>{L(o.summary)} · {L(o.dueRule)} · {tx("เจ้าของ", "owner")}: {L(o.ownerRole)}</div>
                  <div className="row" style={{ marginTop: 10 }}>
                    <button className="btn btn-primary btn-sm">{tx("ยอมรับและเพิ่มลงทะเบียน", "Accept into register")}</button>
                    <Link href="/gaps" className="btn btn-secondary btn-sm" style={{ background: "var(--color-bg)" }}>{tx("ดูช่องว่างที่เปิดไว้", "See the gap opened")}</Link>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
