"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { currentSession, serverAuth, signOut, type Session } from "@/lib/access";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useApp, type Mode, type Role, type Theme } from "@/state/AppState";
import { Seg, Tag } from "./ui";
import { CopilotProvider, useCopilot } from "./ux/Copilot";
import { ComplexityGuard } from "./ux/ComplexityGuard";
import { NextStepBar } from "./ux/parts";
import { Paul } from "./ux/Paul";
import { AiReadyBadge } from "./ux/AiStatus";
import { USER } from "@/data/tenant";

interface NavItem { href: string; th: string; en: string; sub?: string }

/** §18 primary navigation — what normal users need. Ask 24 opens the Copilot. */
const NAV_PRIMARY: NavItem[] = [
  { href: "/", th: "หน้าหลัก", en: "Home" },
  { href: "#ask", th: "ถาม 24 · Copilot", en: "Ask 24 · Copilot" },
  { href: "/missions", th: "ภารกิจของฉัน", en: "My missions" },
  { href: "/my-work", th: "งานของฉัน", en: "My work" },
  { href: "/outputs", th: "รายงานและผลลัพธ์", en: "Reports & outputs" },
  // AGI mode is a primary capability, so it stays visible in Easy mode too
  { href: "/agi", th: "AGI · แคตตาล็อกภารกิจ 108", en: "AGI · Mission catalog (108)" },
];
/** All modules — the complete professional application, grouped. */
const NAV_WORK: NavItem[] = [
  { href: "/ingest", th: "เตรียมข้อมูล · นำเข้าครั้งเดียว", en: "Data preparation" },
  { href: "/start", th: "เริ่มต้นใช้งาน", en: "Easy Start" },
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
  { href: "/ux-standard", th: "มาตรฐาน UX 24 Series", en: "24 UX Standard" },
  { href: "/feedback", th: "ข้อเสนอแนะและการปรับปรุง", en: "Feedback & improvements" },
  { href: "/host-desk", th: "โต๊ะผู้ดูแลเดโม", en: "Host desk" },
];

/** Every menu item keeps a fixed number from its place in the full menu, so Easy mode never renumbers. */
const NAV_ORDER = [...NAV_PRIMARY, ...NAV_WORK, ...NAV_REPORT, ...NAV_ENGINE].map((it) => it.href);
const navNum = (href: string) => String(NAV_ORDER.indexOf(href) + 1).padStart(2, "0");

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  const path = usePathname();
  const { L } = useApp();
  const copilot = useCopilot();
  return (
    <>
      <div className="nav-group">{title}</div>
      {items.map((it) => {
        if (it.href === "#ask") {
          return <button key={it.href} type="button" className="nav-btn nav-ask" title={L({ th: it.th, en: it.en })} onClick={() => copilot.open()}><span className="nav-line"><span className="nav-num">{navNum(it.href)}</span><span className="nav-label">{L({ th: it.th, en: it.en })}</span></span> <span className="kbd-hint">Ctrl K</span></button>;
        }
        const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`nav-btn${active ? " active" : ""}`} aria-current={active ? "page" : undefined} title={L({ th: it.th, en: it.en })}>
            <span className="nav-line"><span className="nav-num">{navNum(it.href)}</span><span className="nav-label">{L({ th: it.th, en: it.en })}</span></span>
          </Link>
        );
      })}
    </>
  );
}

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
);

/** Pages that render without the app chrome and without sign-in. */
const PUBLIC_PAGES = ["/login"];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const isPublic = PUBLIC_PAGES.includes(path);
  useEffect(() => {
    queueMicrotask(() => {
      const s = currentSession();
      setSession(s);
      if (!s && !isPublic) router.replace(`/login?next=${encodeURIComponent(path + location.search)}`);
      // once real auth is switched on, a demo-era session without a signed token must sign in again
      if (s && !s.token && !isPublic) serverAuth().then((c) => { if (c.configured) { signOut(); setSession(null); router.replace("/login"); } });
    });
  }, [path, isPublic, router]);
  if (isPublic) return <>{children}</>;
  // the sign-in gate: nothing of the workspace renders until a session exists
  if (!session) return <div className="gate-wait" aria-busy="true"><span className="brand-square" aria-hidden="true" /> COP24</div>;
  return <CopilotProvider><Shell session={session} onSignOut={() => { signOut(); setSession(null); router.replace("/login"); }}>{children}</Shell><Paul /></CopilotProvider>;
}

function CopilotButton() {
  const { tx } = useApp();
  const copilot = useCopilot();
  return (
    <button type="button" className="btn btn-primary copilot-trigger" onClick={() => copilot.open()} title={tx("เปิด 24 Copilot (Ctrl+K)", "Open 24 Copilot (Ctrl+K)")}>
      <span aria-hidden="true">✦</span> 24 Copilot <span className="kbd-hint">Ctrl K</span>
    </button>
  );
}

const NAV_KEY = "cop24.nav.v1";
const NAV_MIN = 180, NAV_MAX = 420, NAV_DEFAULT = 232;

/** The left menu: drag its edge to resize, or collapse it to the numbered rail. Remembered per browser. */
function useAdjustableNav() {
  const [width, setWidth] = useState(NAV_DEFAULT);
  const [collapsed, setCollapsed] = useState(false);
  const drag = useRef<{ x: number; w: number } | null>(null);
  useEffect(() => {
    queueMicrotask(() => {
      try { const v = JSON.parse(localStorage.getItem(NAV_KEY) ?? "{}") as { width?: number; collapsed?: boolean }; if (v.width) setWidth(Math.min(NAV_MAX, Math.max(NAV_MIN, v.width))); if (v.collapsed) setCollapsed(true); } catch {}
    });
  }, []);
  const save = (w: number, c: boolean) => { try { localStorage.setItem(NAV_KEY, JSON.stringify({ width: w, collapsed: c })); } catch {} };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, w: collapsed ? NAV_MIN : width };
    if (collapsed) setCollapsed(false);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setWidth(Math.min(NAV_MAX, Math.max(NAV_MIN, drag.current.w + e.clientX - drag.current.x)));
  };
  const onPointerUp = () => { if (drag.current) { drag.current = null; save(width, false); } };
  const toggle = () => { const c = !collapsed; setCollapsed(c); save(width, c); };
  const reset = () => { setWidth(NAV_DEFAULT); setCollapsed(false); save(NAV_DEFAULT, false); };
  const nudge = (d: number) => { const w = Math.min(NAV_MAX, Math.max(NAV_MIN, width + d)); setWidth(w); save(w, collapsed); };
  return { width, collapsed, toggle, reset, nudge, handle: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}

function Shell({ children, session, onSignOut }: { children: ReactNode; session: Session; onSignOut: () => void }) {
  const { lang, setLang, role, setRole, mode, setMode, theme, setTheme, showAll, setShowAll, entityId, setEntityId, data, L, tx, snap } = useApp();
  const advancedOpen = mode !== "easy" || showAll;
  const entity = data.entities.find((e) => e.id === entityId) ?? data.entities[0];
  const instCount = snap.instances.filter((i) => i.entityId === entity.id).length;
  const packCount = new Set(snap.instances.filter((i) => i.entityId === entity.id).map((i) => i.packId)).size;
  const nav = useAdjustableNav();

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <Link href="/" className="brand-mark"><span className="brand-square" aria-hidden="true" />COP24</Link>
          <AiReadyBadge />
          <div className="brand-sub">{tx("Compliance ERP · เครื่องยนต์ร่วมของ 24 Series", "Compliance ERP · the 24 Series engine")}</div>
        </div>
        <CopilotButton />
        <div className="hdr-group">
          <span className="hdr-label">{tx("บทบาท", "Role")}</span>
          <Seg<Role> name="role" value={role} onChange={setRole} options={[
            { v: "owner", label: tx("เจ้าของงาน", "Owner") },
            { v: "consultant", label: tx("ที่ปรึกษา", "Advisor") },
            { v: "exec", label: tx("ผู้บริหาร", "Executive") },
            { v: "contributor", label: tx("ผู้ให้ข้อมูล", "Contributor") },
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
        <div className="hdr-group theme-toggle" title={tx("สลับโหมดสว่าง / มืด", "Switch light / dark mode")}>
          <Seg<Theme> name="theme" value={theme} onChange={setTheme} options={[
            { v: "light", label: <><SunIcon /><span className="sr-only">{tx("สว่าง", "Light")}</span></> },
            { v: "dark", label: <><MoonIcon /><span className="sr-only">{tx("มืด", "Dark")}</span></> },
          ]} />
        </div>
        <div className="hdr-user">
          <div className="avatar">{(session.name || L(USER.name)).split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</div>
          <div style={{ fontSize: 12, lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600 }}>{session.name || L(USER.name)}</div>
            <div className="muted tiny">{session.demo ? tx(`เดโม ${session.demo.id} · ถึง ${session.expires.slice(0, 10)}`, `Demo ${session.demo.id} · until ${session.expires.slice(0, 10)}`) : session.email}</div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onSignOut} title={tx("ออกจากระบบ", "Sign out")}>{tx("ออก", "Sign out")}</button>
        </div>
      </header>

      <div className="app-body">
        <nav className={`sidenav${nav.collapsed ? " collapsed" : ""}`} style={{ "--nav-w": `${nav.width}px` } as CSSProperties}>
          <button type="button" className="nav-toggle" onClick={nav.toggle} aria-expanded={!nav.collapsed} title={nav.collapsed ? tx("ขยายเมนู", "Expand menu") : tx("ย่อเมนู", "Collapse menu")}>
            <span aria-hidden="true">{nav.collapsed ? "»" : "«"}</span><span className="nav-label">{tx("ย่อเมนู", "Collapse menu")}</span>
          </button>
          <NavGroup title={tx("หลัก", "Main")} items={NAV_PRIMARY} />
          {advancedOpen ? (
            <>
              <div className="nav-group nav-all">{tx("ทุกโมดูล", "All modules")}{mode === "easy" && <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 6, padding: "0 4px", fontSize: 10 }} onClick={() => setShowAll(false)}>{tx("ซ่อน", "hide")}</button>}</div>
              <NavGroup title={tx("งานและข้อมูล", "Work & data")} items={NAV_WORK} />
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
          <div
            className="nav-resize"
            role="separator"
            aria-orientation="vertical"
            aria-label={tx("ลากเพื่อปรับความกว้างเมนู (ดับเบิลคลิกเพื่อคืนค่า)", "Drag to resize the menu (double-click to reset)")}
            aria-valuemin={NAV_MIN}
            aria-valuemax={NAV_MAX}
            aria-valuenow={nav.collapsed ? 56 : nav.width}
            tabIndex={0}
            title={tx("ลากเพื่อปรับความกว้าง · ดับเบิลคลิกเพื่อคืนค่า", "Drag to resize · double-click to reset")}
            onDoubleClick={nav.reset}
            onKeyDown={(e) => { if (e.key === "ArrowLeft") nav.nudge(-16); if (e.key === "ArrowRight") nav.nudge(16); }}
            {...nav.handle}
          />
        </nav>
        <main className="main">
          <ComplexityGuard />
          <NextStepBar />
          {children}
        </main>
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
