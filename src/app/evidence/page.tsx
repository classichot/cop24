"use client";

import { useState } from "react";
import { useApp } from "@/state/AppState";
import { Bar, Cells, LayerCell, PageHead, Seg, Stat, Tag } from "@/components/ui";
import { scoreEvidence } from "@/core/evidence";
import type { Status } from "@/core/types";

type Filter = "all" | "ok" | "warn" | "bad";

export default function EvidencePage() {
  const { L, tx, data, entityId, fd } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const items = data.evidence.filter((e) => e.entityId === entityId);
  const required = entityId === "lopburi-1" ? 52 : items.length;
  const score = scoreEvidence(items, required);
  const view = filter === "all" ? items : items.filter((d) => d.status === filter || (filter === "bad" && d.status === "cond"));
  const count = (k: Status[]) => items.filter((d) => k.includes(d.status)).length;
  const missing = items.find((e) => e.layers[0] === -1 && e.requestedOn);

  return (
    <div className="page page-wide">
      <PageHead kicker={tx("ศูนย์ควบคุมเอกสาร / DOCUMENT CONTROL CENTER", "Document Control Center")} title={tx("ความพร้อมของหลักฐาน", "Evidence readiness")} lead={tx("การมีไฟล์อยู่ไม่เท่ากับการปฏิบัติตามข้อกำหนด Evidence Engine แยกการประเมินเป็นสามชั้น และจะไม่นับเอกสารที่อัปโหลดเข้ามาว่าเป็นหลักฐานที่ใช้ได้โดยอัตโนมัติ", "Having a file is not compliance. The Evidence Engine scores every item on three layers and never counts an upload as acceptable evidence automatically.")} />

      <Cells min={200} style={{ marginTop: 22 }}>
        <div className="cell" style={{ padding: 20 }}>
          <div className="label">{tx("ความพร้อมโดยรวม", "Overall readiness")}</div>
          <div className="stat-value stat-value-lg" style={{ color: "var(--color-accent-700)" }}>{score.readiness}%</div>
          <Bar pct={score.readiness} className="bar" />
        </div>
        <Stat label={tx("1 · มีเอกสารหรือไม่", "1 · Exists?")} value={`${score.exists} / ${score.required}`} size="md" sub={<span className="muted-7 small">{tx("นับเฉพาะรายการที่ชุดกฎของหน่วยงานนี้บังคับ", "Only items the entity's packs require")}</span>} />
        <Stat label={tx("2 · ใช้ได้จริงหรือไม่", "2 · Valid?")} value={`${score.valid} / ${score.exists}`} size="md" sub={<span className="muted-7 small">{tx("ลงนามครบ ยังไม่หมดอายุ ตรงรอบรายงานและตรงหน่วยงาน", "Signed, unexpired, right period, right entity")}</span>} />
        <Stat label={tx("3 · พิสูจน์ข้อผูกพันได้หรือไม่", "3 · Proves?")} value={`${score.proves} / ${score.valid}`} size="md" sub={<span className="muted-7 small">{tx("เนื้อหาในเอกสารรองรับข้อผูกพันที่อ้างถึงจริง", "Content actually supports the cited obligation")}</span>} />
      </Cells>

      <div className="row row-center" style={{ gap: 12, marginTop: 26 }}>
        <Seg<Filter> name="df" value={filter} onChange={setFilter} options={[
          { v: "all", label: `${tx("ทั้งหมด", "All")} ${items.length}` },
          { v: "ok", label: `${tx("ยอมรับแล้ว", "Accepted")} ${count(["ok"])}` },
          { v: "warn", label: `${tx("ต้องตรวจ", "Review")} ${count(["warn"])}` },
          { v: "bad", label: `${tx("ขาด / ใช้ไม่ได้", "Missing / invalid")} ${count(["bad", "cond"])}` },
        ]} />
        <button className="btn btn-primary" style={{ marginLeft: "auto" }}>{tx("ให้ AI ไล่ตามเอกสารที่ขาด →", "Let AI chase the missing items →")}</button>
      </div>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="table" style={{ minWidth: 820 }}>
          <thead><tr>
            <th style={{ width: "30%" }}>{tx("เอกสาร", "Document")}</th>
            <th>{tx("ใช้พิสูจน์อะไร", "What it proves")}</th>
            <th style={{ width: 150 }}>{tx("ข้อผูกพัน", "Obligation")}</th>
            <th style={{ width: 60 }}>{tx("มี", "Exists")}</th>
            <th style={{ width: 60 }}>{tx("ใช้ได้", "Valid")}</th>
            <th style={{ width: 70 }}>{tx("พิสูจน์", "Proves")}</th>
            <th style={{ width: 120 }}>{tx("สถานะ", "Status")}</th>
          </tr></thead>
          <tbody>
            {view.map((d) => (
              <tr key={d.id}>
                <td style={{ verticalAlign: "top" }}><div style={{ fontWeight: 600, lineHeight: 1.4 }}>{L(d.name)}</div><div className="muted tiny" style={{ marginTop: 2 }}>{L(d.meta)} · {L(d.source)}</div></td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.5 }}>{L(d.purpose)}</td>
                <td className="code" style={{ verticalAlign: "top", lineHeight: 1.5 }}>{d.obligationIds.map((o) => <div key={o}>{o}</div>)}</td>
                <td style={{ verticalAlign: "top", textAlign: "center" }}><LayerCell m={d.layers[0]} /></td>
                <td style={{ verticalAlign: "top", textAlign: "center" }}><LayerCell m={d.layers[1]} /></td>
                <td style={{ verticalAlign: "top", textAlign: "center" }}><LayerCell m={d.layers[2]} /></td>
                <td style={{ verticalAlign: "top" }}><Tag k={d.status}>{L(d.statusLabel)}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missing && (
        <>
          <hr className="hr" style={{ margin: "30px 0 20px" }} />
          <h3 style={{ margin: "0 0 4px", fontSize: 22 }}>{tx("คำขอเอกสารที่ AI ร่างให้", "AI-drafted evidence request")}</h3>
          <p className="text-muted small" style={{ margin: "0 0 14px" }}>{tx("เขียนเป็นภาษาที่คนหน้างานอ่านแล้วรู้ว่าต้องส่งอะไร ไม่ใช่รหัสเอกสารที่ไม่มีใครเข้าใจ", "Written so the person on site knows exactly what to send — not a document code nobody understands.")}</p>
          <div className="panel panel-framed" style={{ padding: 20, maxWidth: 760 }}>
            <div className="row muted small" style={{ gap: 10, borderBottom: "1px solid var(--color-divider)", paddingBottom: 10 }}>
              <span>{tx("ถึง: หัวหน้าหน่วยสิ่งแวดล้อมประจำไซต์ (คุณพรทิพย์)", "To: Site environmental lead (Khun Porntip)")}</span><span>·</span><span>{tx("กำหนดส่ง", "Due")}: {fd("2026-10-22")}</span><span>·</span><span>{tx("อ้างอิง", "Ref")}: {missing.obligationIds[0]}</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.75, marginTop: 14 }}>
              {tx("ขอความอนุเคราะห์ส่งผลตรวจวิเคราะห์คุณภาพน้ำใต้ดินของรอบรายงานนี้ โดยขอให้แนบ ", "Please send this period's groundwater quality analysis, attaching ")}<strong>{tx("รายงานผลจากห้องปฏิบัติการฉบับเต็ม", "the full laboratory report")}</strong>{tx(" ที่ระบุ ", " stating ")}<strong>{tx("วันที่เก็บตัวอย่าง จุดเก็บตัวอย่าง และวิธีวิเคราะห์", "sampling date, sampling points and analytical method")}</strong>{tx(" รวมถึงหนังสือรับรองห้องปฏิบัติการที่ยังไม่หมดอายุ หากยังไม่ได้เก็บตัวอย่างในรอบนี้ กรุณาแจ้งกลับเพื่อให้เราปรับแผนการติดตามตรวจสอบและบันทึกเหตุผลไว้ในรายงาน", ", plus a current laboratory accreditation. If no sample was taken this period, please tell us so we can adjust the monitoring plan and record the reason in the report.")}
            </div>
            <div className="row" style={{ marginTop: 16 }}>
              <button className="btn btn-primary">{tx("ส่งคำขอ", "Send request")}</button>
              <button className="btn btn-secondary">{tx("แก้ข้อความ", "Edit")}</button>
              <button className="btn btn-secondary">{tx("ให้ AI ค้นหาในไฟล์ที่เชื่อมไว้ก่อน", "Let AI search connected files first")}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
