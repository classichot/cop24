"use client";

import { useApp } from "@/state/AppState";
import { Cells, PageHead, Stat, Tag } from "@/components/ui";

export default function ControlsPage() {
  const { L, tx, snap, fd } = useApp();
  const s = snap.controlStats;
  return (
    <div className="page page-wide">
      <PageHead explain={["control-test"]} interpret="controls" kicker={tx("ทดสอบการควบคุม / CONTROL TESTING", "Control Testing")} title={tx("ข้อผูกพันถูกปฏิบัติเพราะมีการควบคุม ไม่ใช่เพราะมีคนจำได้", "Obligations are met because a control runs, not because someone remembered")} lead={tx("Control / Test Engine ผูกการควบคุมเข้ากับข้อผูกพัน แล้วบันทึกผลทดสอบว่าการควบคุมทำงานจริงหรือไม่ — ประสิทธิผลคำนวณจากผลทดสอบล่าสุดเสมอ ไม่มีใครตั้งค่าเองได้ และการควบคุมที่ล้มเหลวจะเปิดช่องว่างโดยอัตโนมัติ", "The Control / Test Engine binds controls to obligations and records whether each control actually operated. Effectiveness is always derived from the latest test — nobody can set it by hand — and a failed control opens a gap automatically.")} />

      <Cells min={150} style={{ marginTop: 22 }}>
        <Stat label={tx("การควบคุมทั้งหมด", "Controls")} value={s.total} size="md" sub={`${s.automated} ${tx("อัตโนมัติ", "automated")}`} />
        <Stat label={tx("ประสิทธิผล", "Effectiveness")} value={`${s.effectiveness}%`} size="md" color="var(--color-accent-700)" />
        <Stat label={tx("มีประสิทธิผล", "Effective")} value={s.effective} size="md" color="var(--st-ok)" />
        <Stat label={tx("พบข้อยกเว้น", "Exceptions")} value={s.exceptions} size="md" color="var(--st-warn)" />
        <Stat label={tx("ไม่มีประสิทธิผล", "Failed")} value={s.failed} size="md" color="var(--st-bad)" />
      </Cells>

      <div className="table-wrap" style={{ marginTop: 20 }}>
        <table className="table" style={{ minWidth: 900 }}>
          <thead><tr><th style={{ width: 70 }}>{tx("รหัส", "ID")}</th><th>{tx("การควบคุม", "Control")}</th><th style={{ width: 170 }}>{tx("ข้อผูกพัน", "Obligations")}</th><th style={{ width: 140 }}>{tx("ผู้รับผิดชอบ", "Owner")}</th><th style={{ width: 100 }}>{tx("ประเภท", "Type")}</th><th style={{ width: 110 }}>{tx("ทดสอบล่าสุด", "Last test")}</th><th>{tx("ผลทดสอบ", "Finding")}</th><th style={{ width: 120 }}>{tx("สถานะ", "Status")}</th></tr></thead>
          <tbody>
            {snap.controls.map((v) => (
              <tr key={v.control.id}>
                <td className="code" style={{ verticalAlign: "top", fontWeight: 600 }}>{v.control.id}</td>
                <td style={{ verticalAlign: "top", lineHeight: 1.4 }}><div style={{ fontWeight: 600 }}>{L(v.control.name)}</div><div className="muted tiny">{v.control.frequency} · {v.control.automated ? tx("อัตโนมัติ", "automated") : tx("ด้วยมือ", "manual")}</div></td>
                <td className="code" style={{ verticalAlign: "top", lineHeight: 1.5 }}>{v.control.obligationIds.map((o) => <div key={o}>{o}</div>)}</td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{L(v.control.owner)}</td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13 }}>{v.control.type}</td>
                <td style={{ verticalAlign: "top", fontSize: 13 }}>{v.lastTest ? fd(v.lastTest.date) : "—"}</td>
                <td className="muted-7" style={{ verticalAlign: "top", fontSize: 13, lineHeight: 1.5 }}>{v.lastTest ? <>{L(v.lastTest.note)} <span className="muted tiny">· {L(v.lastTest.tester)}</span></> : "—"}</td>
                <td style={{ verticalAlign: "top" }}><Tag k={v.status}>{L(v.label)}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="note note-warn" style={{ marginTop: 22, maxWidth: 760, fontSize: 13 }}>{tx("ตัวอย่างการต่อสายข้ามโดเมน: C-01 (ตรวจวันหมดอายุหนังสือรับรองห้องปฏิบัติการ) ล้มเหลว → Evidence Engine ทำให้ผลวิเคราะห์ 3 ฉบับใช้ไม่ได้ → Gap Engine เปิดช่องว่าง → Preflight ชั้นที่ 3 ไม่ผ่าน → Next Best Action ชี้ไปที่หลักฐานนั้น ทั้งหมดนี้เกิดขึ้นในเครื่องยนต์เดียวกันที่ ESG24 ใช้กับหนังสือรับรองผู้ทวนสอบ GHG", "How it chains across domains: C-01 (lab accreditation expiry check) fails → the Evidence Engine invalidates 3 analyses → the Gap Engine opens a gap → Preflight layer 3 fails → Next Best Action points at that evidence. The same engine does this for GHG verifier accreditation in ESG24.")}</div>
    </div>
  );
}
