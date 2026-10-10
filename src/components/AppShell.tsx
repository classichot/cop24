"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useApp, type Mode, type Role } from "@/state/AppState";
import { Seg, Tag } from "./ui";
import { USER } from "@/data/tenant";

interface NavItem { href: string; th: string; en: string; sub?: string }

const NAV_MAIN: NavItem[] = [
  { href: "/", th: "หน้าหลัก · ถาม 24", en: "Home · ASK 24" },
  { href: "/ingest", th: "เตรียมข้อมูล · นำเข้าครั้งเดียว", en: "Data preparation" },
  { href: "/missions", th: "ภารกิจของฉัน", en: "My missions" },
  { href: "/start", th: "เริ่มต้นใช้งาน", en: "Easy Start" },
];
const NAV_WORK: NavItem[] = [
  { href: "/evidence", th: "ศูนย์ควบคุมเอกสาร", en: "Document Control" },
  { href: "/factory", th: "สร้างรายงานอัตโนมัติ", en: "Report Factory" },
  { href: "/calendar", th: "ปฏิทินการปฏิบัติตาม", en: "Compliance Calendar" },
  { href: "/gaps", th: "ช่องว่างและการแก้ไข", en: "Gaps & Remediation" },
];
const NAV_REPORT: NavItem[] = [
  { href: "/studio", th: "สตูดิโอรายงาน", en: "Report Studio" },
  { href: "/preflight", th: "ตรวจก่อนยื่น", en: "Preflight" },
  { href: "/report-quality", th: "มาตรฐานคุณภาพรายงาน", en: "Report Quality" },
  { href: "/xray", th: "เอกซเรย์รายงานเดิม", en: "Compliance X-Ray" },
  { href: "/portfolio", th: "พอร์ตโฟลิโอหลายหน่วยงาน", en: "Portfolio" },
];
const NAV_ENGINE: NavItem[] = [
  { href: "/universe", th: "จักรวาลการปฏิบัติตาม", en: "Compliance Universe" },
  { href: "/obligations", th: "ทะเบียนข้อผูกพัน", en: "Obligation Register" },
  { href: "/corpus", th: "คลังกฎหมาย", en: "Legal Corpus" },
  { href: "/controls", th: "ทดสอบการควบคุม", en: "Control Testing" },
  { href: "/changes", th: "ติดตามกฎที่เปลี่ยน", en: "Regulatory Change" },
  { href: "/audit", th: "ร่องรอยการตรวจสอบ", en: "Audit Trail" },
  { href: "/packs", th: "แพ็กและแอป 24", en: "Packs & 24 apps" },
  { href: "/engine", th: "เครื่องยนต์หลัก COP24", en: "COP24 Core Engine" },
];

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  const path = usePathname();
  const { L } = useApp();
  return (
    <>
      <div className="nav-group">{title}</div>
      {items.map((it) => {
        const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`nav-btn${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
            {L({ th: it.th, en: it.en })}
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, setLang, role, setRole, mode, setMode, showAll, setShowAll, entityId, setEntityId, data, L, tx, snap } = useApp();
  const advancedOpen = mode !== "easy" || showAll;
  const entity = data.entities.find((e) => e.id === entityId) ?? data.entities[0];
  const instCount = snap.instances.filter((i) => i.entityId === entity.id).length;
  const packCount = new Set(snap.instances.filter((i) => i.entityId === entity.id).map((i) => i.packId)).size;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <Link href="/" className="brand-mark">COP24</Link>
          <div className="brand-sub">{tx("Compliance ERP · เครื่องยนต์ร่วมของ 24 Series", "Compliance ERP · the 24 Series engine")}</div>
        </div>
        <div className="hdr-group">
          <span className="hdr-label">{tx("บทบาท", "Role")}</span>
          <Seg<Role> name="role" value={role} onChange={setRole} options={[
            { v: "owner", label: tx("เจ้าของงาน", "Owner") },
            { v: "consultant", label: tx("ที่ปรึกษา", "Advisor") },
            { v: "exec", label: tx("ผู้บริหาร", "Executive") },
          ]} />
        </div>
        <div className="hdr-group">
          <span className="hdr-label">{tx("โหมด", "Mode")}</span>
          <Seg<Mode> name="mode" value={mode} onChange={setMode} options={[
            { v: "easy", label: tx("ง่าย", "Easy") },
            { v: "professional", label: tx("มืออาชีพ", "Pro") },
            { v: "agi", label: "AGI" },
          ]} />
        </div>
        <div className="hdr-group">
          <Seg<"th" | "en"> name="lang" value={lang} onChange={setLang} options={[{ v: "th", label: "ไทย" }, { v: "en", label: "EN" }]} />
        </div>
        <div className="hdr-user">
          <div className="avatar">{USER.initials}</div>
          <div style={{ fontSize: 12, lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600 }}>{L(USER.name)}</div>
            <div className="muted tiny">{L(USER.org)}</div>
          </div>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidenav">
          <NavGroup title={tx("หลัก", "Main")} items={NAV_MAIN} />
          <NavGroup title={tx("งานของฉัน", "My work")} items={NAV_WORK} />
          {advancedOpen ? (
            <>
              <NavGroup title={tx("รายงานและการตรวจสอบ", "Reports & assurance")} items={NAV_REPORT} />
              <NavGroup title={tx("เครื่องยนต์การปฏิบัติตาม", "Compliance engine")} items={NAV_ENGINE} />
            </>
          ) : (
            <div style={{ padding: "18px 18px 0" }}>
              <button className="btn btn-secondary" onClick={() => setShowAll(true)} style={{ width: "100%", justifyContent: "flex-start", fontSize: 12 }}>{tx("ทุกโมดูล ▾", "All modules ▾")}</button>
              <div className="muted tiny" style={{ marginTop: 8, lineHeight: 1.5 }}>{tx("โหมดง่ายซ่อนเครื่องมือระดับผู้เชี่ยวชาญไว้ ฟังก์ชันไม่ได้ถูกตัดออก", "Easy mode hides expert tools; nothing is removed.")}</div>
            </div>
          )}
          <div className="nav-project">
            <div className="label" style={{ marginBottom: 8 }}>{tx("หน่วยงานที่เปิดอยู่", "Active entity")}</div>
            <select className="input" value={entityId} onChange={(e) => setEntityId(e.target.value)} style={{ fontSize: 13, fontWeight: 600, minHeight: 34 }}>
              {data.entities.map((e) => <option key={e.id} value={e.id}>{L(e.name)}</option>)}
            </select>
            <div className="muted tiny" style={{ marginTop: 6 }}>{L(entity.sector)}</div>
            <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Tag k="info">{packCount} {tx("ชุดกฎ", "packs")}</Tag>
              <Tag k="ok">{instCount} {tx("ข้อผูกพัน", "obligations")}</Tag>
            </div>
          </div>
        </nav>
        <main className="main">{children}</main>
      </div>

      <footer className="app-footer">
        <span className="heading" style={{ fontSize: 13 }}>COP24</span>
        <span className="muted small" style={{ flex: 1, minWidth: 220, lineHeight: 1.5 }}>
          {tx("ต้นแบบเชิงแนวคิด · ข้อมูลทั้งหมดเป็นตัวอย่างสมมติ · COP24 เป็นชั้นเตรียมและตรวจสอบก่อนยื่น ไม่ได้ยื่นรายงานเข้าระบบของหน่วยงานกำกับแทนผู้ประกอบการ", "Conceptual prototype · all data is illustrative · COP24 prepares and checks before filing; it does not file with regulators on your behalf.")}
        </span>
        <span className="section-tag">24 Series Universal UX Standard</span>
      </footer>
    </div>
  );
}
