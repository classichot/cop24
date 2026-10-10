"use client";

import { useApp } from "@/state/AppState";
import { Callout, PageHead, Tag } from "@/components/ui";
import { describeKind, upcoming } from "@/core/calendar";
import { TODAY, daysUntil, monthName } from "@/core/dates";
import { DOMAINS } from "@/packs";

export default function CalendarPage() {
  const { L, tx, snap, data, entityId, fd, lang } = useApp();
  const entity = data.entities.find((e) => e.id === entityId)!;
  const events = snap.calendar.filter((e) => e.entityId === entityId);
  const next90 = upcoming(events, 90);
  const inst = snap.instances.filter((i) => i.entityId === entityId);
  const curMonth = Number(TODAY.slice(5, 7)) - 1;
  const monthsFrom = Array.from({ length: 12 }, (_, i) => (curMonth + i) % 12);
  const yearFor = (m: number, i: number) => Number(TODAY.slice(0, 4)) + (curMonth + i >= 12 ? 1 : 0);
  const eventsIn = (m: number, y: number) => events.filter((e) => Number(e.date.slice(5, 7)) - 1 === m && Number(e.date.slice(0, 4)) === y);
  const domainName = (id: string) => L(DOMAINS.find((d) => d.id === id)!.short);
  const register = inst.filter((i) => i.obligation.frequency !== "once");

  return (
    <div className="page page-wide">
      <PageHead kicker={tx("ปฏิทินการปฏิบัติตาม / COMPLIANCE CALENDAR", "Compliance Calendar")} title={tx("ทุกกำหนดเวลาของทุกโดเมน บนเส้นเวลาเดียว", "Every deadline in every domain, on one timeline")} lead={tx("Workflow & Execution Engine แปลงทุกข้อผูกพันที่มีความถี่เป็นเหตุการณ์ที่มีวันที่ ผู้รับผิดชอบ และหลักฐานที่ต้องเก็บ — ภาษี CoP PDPA แรงงาน 56-1 อยู่บนปฏิทินเดียวกัน ไม่ใช่ 5 สเปรดชีต", "The Workflow & Execution Engine turns every recurring obligation into a dated event with an owner and required evidence — tax, CoP, PDPA, labour and 56-1 share one calendar, not five spreadsheets.")} />

      <div className="panel" style={{ marginTop: 22, overflowX: "auto" }}>
        <div className="label" style={{ letterSpacing: ".12em", marginBottom: 12 }}>{tx("12 เดือนข้างหน้า", "Next 12 months")} · {L(entity.name)}</div>
        <div style={{ display: "flex", gap: 2, minWidth: 620 }}>
          {monthsFrom.map((m, i) => {
            const y = yearFor(m, i);
            const evs = eventsIn(m, y);
            const subs = evs.filter((e) => e.kind === "submission" || e.kind === "hearing").length;
            const samp = evs.filter((e) => e.kind !== "submission" && e.kind !== "hearing").length;
            const cls = subs ? "month month-win" : samp ? "month month-sample" : "month";
            return (
              <div key={`${y}-${m}`} className={`${cls}${i === 0 ? " month-today" : ""}`}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{monthName(m, lang)}{m === 0 ? ` ${lang === "th" ? y + 543 : y}` : ""}</div>
                <div style={{ fontSize: 9, letterSpacing: ".06em", textTransform: "uppercase", marginTop: 3, lineHeight: 1.3 }}>{subs ? `${subs} ${tx("ยื่น", "file")}` : ""}{subs && samp ? " · " : ""}{samp ? `${samp} ${tx("งาน", "tasks")}` : ""}</div>
              </div>
            );
          })}
        </div>
        <div className="small muted-7" style={{ marginTop: 12, lineHeight: 1.6 }}>{tx("COP24 ตรวจสอบกำหนดเวลานี้กับเงื่อนไขในใบอนุญาตและรอบปีบัญชีของแต่ละหน่วยงานเสมอ ไม่ได้ใช้ปฏิทินมาตรฐานโดยอัตโนมัติ", "COP24 always checks these dates against each entity's licence conditions and fiscal year — it never applies a standard calendar blindly.")}</div>
      </div>

      <div className="row" style={{ alignItems: "baseline", gap: 12, marginTop: 30 }}>
        <h3 style={{ margin: 0, fontSize: 22 }}>{tx("ครบกำหนดใน 90 วัน", "Due within 90 days")}</h3>
        <span className="muted small">{next90.length} {tx("เหตุการณ์", "events")} · {new Set(next90.map((e) => e.domain)).size} {tx("โดเมน", "domains")}</span>
      </div>
      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table className="table" style={{ minWidth: 760 }}>
          <thead><tr><th style={{ width: 120 }}>{tx("วันที่", "Date")}</th><th style={{ width: 70 }}>{tx("อีก", "In")}</th><th>{tx("เหตุการณ์", "Event")}</th><th style={{ width: 120 }}>{tx("ประเภท", "Kind")}</th><th style={{ width: 110 }}>{tx("โดเมน", "Domain")}</th><th style={{ width: 170 }}>{tx("ข้อผูกพัน", "Obligation")}</th><th style={{ width: 120 }}>{tx("สถานะ", "Status")}</th></tr></thead>
          <tbody>
            {next90.map((e) => (
              <tr key={e.id}>
                <td style={{ fontWeight: 600 }}>{fd(e.date)}</td>
                <td className="muted small">{daysUntil(e.date)} {tx("วัน", "d")}</td>
                <td style={{ lineHeight: 1.4 }}>{L(e.label)}</td>
                <td className="muted-7" style={{ fontSize: 13 }}>{L(describeKind(e.kind))}</td>
                <td className="muted-7" style={{ fontSize: 13 }}>{domainName(e.domain)}</td>
                <td className="code">{e.obligationId ?? "—"}</td>
                <td><Tag k={e.status}>{e.status === "ok" ? tx("พร้อม", "Ready") : e.status === "bad" ? tx("เสี่ยง", "At risk") : e.status === "warn" ? tx("ต้องติดตาม", "Watch") : tx("ตามแผน", "Planned")}</Tag></td>
              </tr>
            ))}
            {!next90.length && <tr><td colSpan={7} className="muted">{tx("ไม่มีเหตุการณ์ใน 90 วัน", "Nothing due in 90 days")}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ alignItems: "baseline", gap: 12, marginTop: 30 }}>
        <h3 style={{ margin: 0, fontSize: 22 }}>{tx("ทะเบียนมาตรการต่อหลักฐาน", "Measure-to-evidence register")}</h3>
        <span className="muted small">{register.length} {tx("มาตรการที่เกิดซ้ำ", "recurring measures")} · {register.filter((r) => r.status === "ok").length} {tx("หลักฐานครบ", "evidenced")} · {register.filter((r) => r.status === "bad").length} {tx("ขาด", "missing")}</span>
      </div>
      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table className="table" style={{ minWidth: 860 }}>
          <thead><tr><th style={{ width: "26%" }}>{tx("มาตรการ / ข้อผูกพัน", "Measure / obligation")}</th><th style={{ width: "15%" }}>{tx("ผู้รับผิดชอบ", "Owner")}</th><th style={{ width: "11%" }}>{tx("ความถี่", "Frequency")}</th><th>{tx("หลักฐานที่ต้องมี", "Required evidence")}</th><th style={{ width: "13%" }}>{tx("ปลายทางในรายงาน", "Report destination")}</th><th style={{ width: 110 }}>{tx("ถัดไป", "Next")}</th><th style={{ width: 110 }}>{tx("สถานะ", "Status")}</th></tr></thead>
          <tbody>
            {register.map((r) => (
              <tr key={r.key}>
                <td style={{ verticalAlign: "top", lineHeight: 1.45 }}><div style={{ fontWeight: 600 }}>{L(r.obligation.title)}</div><div className="code muted">{r.obligation.id}</div></td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(r.obligation.ownerRole)}</td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(r.obligation.dueRule)}</td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.5 }}>{r.obligation.evidenceRequired.map((e) => L(e)).join(" + ")}</td>
                <td className="muted" style={{ verticalAlign: "top", fontSize: 12 }}>{L(r.obligation.reportDest) || "—"}</td>
                <td style={{ verticalAlign: "top", fontSize: 13 }}>{fd(r.nextDue)}</td>
                <td style={{ verticalAlign: "top" }}><Tag k={r.status}>{L(r.statusLabel)}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 22, maxWidth: 760 }}>
        <Callout bar kicker={tx("ยกยอดอัตโนมัติ · Smart Carry Forward", "Smart Carry Forward")}>
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>{tx("รายงานรอบถัดไปจะดึงข้อมูลที่ได้รับความเห็นชอบแล้วมาตั้งต้นให้เอง และทำเครื่องหมายเฉพาะส่วนที่ข้อเท็จจริงเปลี่ยนไป ผลตรวจวัดจะถูกจัดเป็นตารางและกราฟเทียบย้อนหลังอย่างน้อยสามปีตามที่ระเบียบกำหนด — ใช้ได้กับ CoP รอบปี, 56-1 และ ภ.ง.ด.50 เหมือนกัน", "The next period's report starts from already-approved data and flags only what changed. Monitoring results are tabulated and charted against at least three prior years as the regulation requires — the same for the annual CoP report, 56-1 and PND.50.")}</div>
        </Callout>
      </div>
    </div>
  );
}
