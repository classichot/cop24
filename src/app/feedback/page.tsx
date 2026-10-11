"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/state/AppState";
import { Cells, PageHead, SectionHead, Stat, Tag } from "@/components/ui";
import { UX_TEST_LABEL } from "@/core/ux/acceptance";
import type { Status } from "@/core/types";
import { loadFeedback, onFeedbackChange, updateFeedback, type FeedbackItem } from "@/lib/feedback";

const SEV: Record<string, number> = { high: 3, medium: 2, low: 1 };
const TONE: Record<string, Status> = { bug: "bad", content: "warn", confusing: "warn", idea: "info", praise: "ok" };

/**
 * Feedback & improvements — everything people told Paul, triaged and grouped by screen into an
 * improvement backlog (most reported × most severe first), so feedback actually changes COP24.
 */
export default function FeedbackPage() {
  const { tx, L, fd } = useApp();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(loadFeedback());
    queueMicrotask(sync);
    return onFeedbackChange(sync);
  }, []);

  const open = items.filter((f) => f.status === "open");
  const byScreen = new Map<string, FeedbackItem[]>();
  for (const f of open) byScreen.set(f.triage.route, [...(byScreen.get(f.triage.route) ?? []), f]);
  const backlog = [...byScreen.entries()]
    .map(([route, list]) => ({ route, screen: list[0].triage.screen, list, weight: list.reduce((a, f) => a + SEV[f.triage.severity], 0) }))
    .sort((a, b) => b.weight - a.weight);
  const count = (c: string) => open.filter((f) => f.triage.category === c).length;

  const exportMd = () => {
    const md = ["# COP24 feedback backlog", "", ...backlog.flatMap((b) => [`## ${b.screen} (${b.route}) — weight ${b.weight}`, ...b.list.map((f) => `- [${f.triage.category}/${f.triage.severity}] ${f.text.replace(/\n/g, " ")} (${f.at.slice(0, 10)})`), ""])].join("\n");
    void navigator.clipboard?.writeText(md);
  };

  return (
    <div className="page page-mid">
      <PageHead kicker={tx("ข้อเสนอแนะและการปรับปรุง / FEEDBACK", "Feedback & improvements")} title={tx("สิ่งที่ผู้ใช้บอก Paul — กลายเป็นรายการปรับปรุง", "What people told Paul — turned into improvements")} lead={tx("ทุกข้อเสนอแนะถูกจัดหมวด ให้ระดับความสำคัญ และผูกกับหน้าจอและการทดสอบ UX ที่เกี่ยวข้อง แล้วเรียงเป็นรายการปรับปรุงตามจำนวนครั้งและความรุนแรง", "Every piece of feedback is categorised, given a severity and tied to its screen and UX test, then ranked into an improvement backlog by how often and how badly it hurts.")} />

      <Cells min={130} style={{ marginTop: 18 }}>
        <Stat label={tx("เปิดอยู่", "Open")} value={open.length} sub={tx(`ทั้งหมด ${items.length}`, `${items.length} total`)} />
        <Stat label={tx("ปัญหาการทำงาน", "Bugs")} value={count("bug")} />
        <Stat label={tx("ใช้ยาก", "Confusing")} value={count("confusing")} />
        <Stat label={tx("ไอเดีย", "Ideas")} value={count("idea")} />
        <Stat label={tx("เนื้อหากฎหมาย", "Legal content")} value={count("content")} />
      </Cells>

      {!items.length && (
        <div className="dashed" style={{ marginTop: 20 }}>
          <div className="heading" style={{ fontSize: 17 }}>{tx("ยังไม่มีข้อเสนอแนะ", "No feedback yet")}</div>
          <p className="muted small" style={{ margin: "6px 0 0" }}>{tx("กดปุ่ม “ถาม Paul” มุมขวาล่าง แล้วเลือก “3 · ข้อเสนอแนะ” หรือพิมพ์ปัญหา/ไอเดียได้เลย Paul จะจัดหมวดและบันทึกที่นี่", "Press “Ask Paul” at the bottom right, choose “3 · Feedback”, or just type a problem or idea. Paul triages it and lists it here.")}</p>
        </div>
      )}

      {backlog.length > 0 && (
        <>
          <hr className="hr hr-section" />
          <SectionHead title={tx("รายการปรับปรุง เรียงตามผลกระทบ", "Improvement backlog, by impact")} tag={<button type="button" className="btn btn-ghost btn-sm" onClick={exportMd}>{tx("คัดลอกเป็น Markdown", "Copy as Markdown")}</button>} note={tx("น้ำหนัก = ผลรวมความรุนแรงของรายการที่เปิดอยู่ในหน้านั้น", "Weight = the summed severity of open items on that screen.")} />
          {backlog.map((b) => (
            <div key={b.route} className="panel" style={{ marginBottom: 12 }}>
              <div className="row row-center" style={{ justifyContent: "space-between" }}>
                <div><Link href={b.route} className="heading" style={{ fontSize: 16 }}>{b.screen}</Link> <span className="muted tiny code">{b.route}</span></div>
                <Tag k={b.weight >= 5 ? "bad" : b.weight >= 3 ? "warn" : "info"}>{tx(`น้ำหนัก ${b.weight}`, `weight ${b.weight}`)}</Tag>
              </div>
              <div className="worklist" style={{ marginTop: 10 }}>
                {b.list.map((f) => (
                  <div key={f.id} className="list-item">
                    <Tag k={TONE[f.triage.category]}>{f.triage.category}</Tag>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14 }}>{f.text}</div>
                      <div className="muted tiny" style={{ marginTop: 3 }}>{fd(f.at.slice(0, 10))} · {f.triage.severity} · {f.role}{f.triage.uxTest ? ` · ${tx("การทดสอบ UX", "UX test")}: ${L(UX_TEST_LABEL[f.triage.uxTest].name)}` : ""} · {f.forwarded ? (f.url ? <a href={f.url} target="_blank" rel="noreferrer">{tx("ส่งถึงทีมแล้ว", "sent to the team")}</a> : tx("ส่งถึงทีมแล้ว", "sent to the team")) : tx("เก็บในเบราว์เซอร์นี้", "kept in this browser")}</div>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm btn-plain" onClick={() => updateFeedback(f.id, { status: "done" })}>{tx("ปรับปรุงแล้ว", "Mark improved")}</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {items.some((f) => f.status === "done") && (
        <>
          <hr className="hr hr-section" />
          <SectionHead title={tx("ปรับปรุงแล้ว", "Improved")} />
          <div className="worklist">
            {items.filter((f) => f.status === "done").map((f) => (
              <div key={f.id} className="list-item"><Tag k="ok">✓</Tag><div style={{ flex: 1 }} className="small">{f.text}</div><button type="button" className="btn btn-ghost btn-sm" onClick={() => updateFeedback(f.id, { status: "open" })}>{tx("เปิดใหม่", "Reopen")}</button></div>
            ))}
          </div>
        </>
      )}

      <p className="muted tiny" style={{ marginTop: 20 }}>{tx("ข้อเสนอแนะเก็บในเบราว์เซอร์นี้ และส่งเป็น GitHub issue ให้ทีมพัฒนาเมื่อผู้ดูแลตั้งค่า GITHUB_FEEDBACK_TOKEN และ GITHUB_FEEDBACK_REPO", "Feedback is kept in this browser, and sent to the development team as a GitHub issue once an administrator sets GITHUB_FEEDBACK_TOKEN and GITHUB_FEEDBACK_REPO.")}</p>
    </div>
  );
}
