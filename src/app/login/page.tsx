"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/state/AppState";
import { HostDesk } from "@/components/auth/HostDesk";
import { AiReadyBadge } from "@/components/ux/AiStatus";
import { startDemo } from "@/components/ux/DemoTour";
import { LOGIN_ROLES } from "@/data/login-roles";
import { allowedRoles, currentSession, fmtDate, gateFromUrl, saveSession, serverAuth, signIn, type Gate, type Role } from "@/lib/access";

/**
 * Sign-in gate (ACC24 model, COP24 colours): four role workspaces for anyone with credentials,
 * a demo path for guests holding a minted link, and the host desk that mints, sends and revokes links.
 */
const sessionExpiry = () => new Date(Date.now() + 12 * 3600_000).toISOString();

export default function LoginPage() {
  const { L, tx, setRole } = useApp();
  const router = useRouter();
  const [gate, setGate] = useState<Gate | null>(null);
  const [server, setServer] = useState(false);
  const [role, setRoleSel] = useState<Role>("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [host, setHost] = useState(false);
  const [next, setNext] = useState("/");

  useEffect(() => {
    queueMicrotask(() => {
      const raw = gateFromUrl();
      const n = new URLSearchParams(location.search).get("next");
      if (n && n.startsWith("/") && !n.startsWith("//")) setNext(n);
      serverAuth().then((s) => {
        setServer(s.configured);
        // with a backend configured, only signed links are accepted
        setGate(raw && raw.ok && s.configured && !raw.signed ? { ok: false, reason: tx("ลิงก์นี้ไม่ได้ลงนามโดยโต๊ะผู้ดูแลของ COP24 ขอลิงก์ใหม่จากผู้ดูแล", "This link was not signed by the COP24 host desk. Ask your host for a new one.") } : raw);
        if (raw?.ok && raw.invite) setRoleSel(allowedRoles(raw.invite.mode)[0]);
      });
      if (currentSession() && !raw) router.replace(n && n.startsWith("/") ? n : "/");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- read the URL once on arrival

  const guest = gate?.ok ? gate.invite : undefined;
  const allowed = guest ? allowedRoles(guest.mode) : LOGIN_ROLES.map((r) => r.id);
  const r = LOGIN_ROLES.find((x) => x.id === role)!;

  const enter = (token?: string, demo = false) => {
    // "Watch the demo" signs in the same way, then demo mode takes over from the home page
    if (demo) startDemo();
    saveSession({ email: email || guest?.email || r.persona.email, role, name: guest?.guest || r.persona.name, expires: guest?.expires ?? sessionExpiry(), token, demo: guest ? { id: guest.id, guest: guest.guest, org: guest.org } : undefined });
    setRole(role);
    router.replace(next);
  };

  return (
    <div className="login">
      <div className="login-main">
        <div className="login-brand">
          <span className="login-wordmark">COP24</span>
          <span className="brand-square" style={{ width: 14, height: 14 }} aria-hidden="true" />
          <AiReadyBadge />
          <span className="login-meta">
            <span className="login-kicker">{tx("ระบบปฏิบัติตาม CoP ด้วย AI · ระเบียบ กกพ. 2565 + 2567", "AI CoP Compliance OS · ERC rules 2565 + 2567")}</span>
            <button type="button" className="btn btn-secondary btn-sm btn-plain" onClick={() => setHost(true)}>{tx("โต๊ะผู้ดูแล", "Host desk")}</button>
          </span>
        </div>
        <div style={{ marginTop: 28, maxWidth: 840 }}>
          <h1 className="login-title">{tx("แผนกปฏิบัติตาม CoP เสมือนของคุณ", "Your virtual CoP compliance department.")}</h1>
          <p className="login-lead">
            {tx("บอกเราเกี่ยวกับโรงไฟฟ้าของคุณ วางเอกสาร แล้วให้ทีม AI ของ COP24 เตรียม ตรวจ และรวบรวมรายงานให้พร้อมยื่น กกพ. — คุณแค่ตัดสินใจและอนุมัติ", "Tell us about your power plants, drop your documents, and let COP24's AI team prepare, check and assemble ERC-ready reports — you only decide and approve.")}
          </p>
        </div>
        {gate && (
          <div className={`login-gate ${gate.ok ? "ok" : "bad"}`}>
            {gate.ok && gate.invite ? (
              <><b>{tx(`สิทธิ์เดโมสำหรับ ${gate.invite.guest}`, `Demo access for ${gate.invite.guest}`)}{gate.invite.org ? " · " + gate.invite.org.replace(/.$/, "") : ""}.</b> {gate.invite.mode === "all" ? tx("ทั้ง 4 บทบาท", "All four roles") : L(LOGIN_ROLES.find((x) => x.id === gate.invite!.mode)!.name)} · {tx("ใช้ได้ถึง", "valid until")} {fmtDate(gate.invite.expires)} ({gate.daysLeft} {tx("วัน", gate.daysLeft === 1 ? "day" : "days")} {tx("ที่เหลือ", "left")}) · {tx("ลิงก์", "link")} {gate.invite.id}. {tx("เลือกบทบาทด้านล่างแล้วเข้าใช้ — ไม่ต้องใช้รหัสผ่าน", "Pick a role below and enter — no password needed.")}</>
            ) : (
              <><b>{tx("ใช้ลิงก์เดโมนี้ไม่ได้", "This demo link cannot be used.")}</b> {gate.reason}</>
            )}
          </div>
        )}
        <div className="hr" style={{ margin: "28px 0" }} />
        <div className="label" style={{ marginBottom: 10 }}>{tx("เลือกพื้นที่ทำงานตามบทบาท", "Choose your workspace role")}</div>
        <div className="login-roles">
          {LOGIN_ROLES.map((x) => {
            const on = x.id === role, locked = !allowed.includes(x.id);
            return (
              <button key={x.id} type="button" className={`login-role${on ? " on" : ""}`} disabled={locked} onClick={() => !locked && setRoleSel(x.id)} aria-pressed={on}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span className="login-role-code">{tx("บทบาท", "ROLE")} {x.code}</span>
                  <span className={`tag ${on ? "st-warn" : "tag-neutral"}`}>{locked ? tx("ไม่อยู่ในเดโมนี้", "Not in this demo") : L(x.tag)}</span>
                </div>
                <div className="login-role-name">{L(x.name)}</div>
                <div className="login-role-desc">{L(x.desc)}</div>
                <div className="login-role-incl">{x.includes.map((i) => <div key={i.en}><span className={`login-dot${on ? " on" : ""}`} />{L(i)}</div>)}</div>
                <div className="login-persona">
                  <span className="login-avatar">{x.persona.initials}</span>
                  <span><b>{x.persona.name}</b><div className="muted tiny">{x.persona.role}</div></span>
                </div>
              </button>
            );
          })}
        </div>
        {gate && !gate.ok ? (
          <div className="login-form muted small">{tx("ปิดการเข้าใช้สำหรับลิงก์เดโมที่ไม่ถูกต้องหรือหมดอายุ ติดต่อผู้ดูแล COP24 เพื่อขอลิงก์ใหม่ หรือเปิด", "Sign-in is disabled for an invalid or expired demo link. Contact your COP24 host for a fresh link, or open")} <a href="/login">{tx("หน้าเข้าสู่ระบบปกติ", "the standard sign-in")}</a>.</div>
        ) : (
          <form className="login-form" onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const demo = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("data-demo") === "1";
            if (guest) return enter(gate?.signed ? gate.token : undefined, demo);
            if (!server) return enter(undefined, demo);
            setBusy(true);
            const res = await signIn(email || r.persona.email, password, role);
            setBusy(false);
            if (res.ok === false) { setError(res.reason === "wrong_password" ? tx("อีเมลและรหัสผ่านไม่ตรงกัน", "That email and password do not match.") : res.reason === "rate_limited" ? (res.message ?? tx("ลองมากเกินไป รอ 1 นาที", "Too many attempts — wait a minute.")) : tx("ติดต่อบริการเข้าสู่ระบบไม่ได้", "The sign-in service cannot be reached.")); return; }
            enter(res.token, demo);
          }}>
            <div className="field" style={{ flex: 1, minWidth: 220, margin: 0 }}>
              <label>{tx("อีเมล", "Email")}</label>
              <input key={r.id + (guest?.id ?? "")} className="input" type="email" autoComplete="username" defaultValue={guest?.email || (server ? "" : r.persona.email)} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.co.th" />
            </div>
            {!guest && (
              <div className="field" style={{ flex: 1, minWidth: 180, margin: 0 }}>
                <label>{tx("รหัสผ่าน", "Password")}</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder={server ? tx("รหัสผ่านพื้นที่ทำงาน", "Workspace password") : tx("รหัสใดก็ได้ (เดโม)", "Any password (demo)")} />
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ minHeight: 36 }}>{busy ? tx("กำลังเข้าสู่ระบบ…", "Signing in…") : guest ? tx(`เข้าเดโมในชื่อ ${guest.guest} · ${L(r.name)}`, `Enter demo as ${guest.guest} · ${L(r.name)}`) : tx(`เข้าสู่ระบบในบทบาท ${L(r.name)}`, `Sign in as ${L(r.name)}`)}</button>
            <button className="btn btn-secondary btn-plain login-demo" type="submit" data-demo="1" disabled={busy} style={{ minHeight: 36 }} title={tx("เข้าสู่ระบบแล้วให้ทัวร์นำชมพาดูทุกขั้นตอน", "Sign in, then a guided tour walks you through every step")}>▶ {tx("ดูเดโมนำชม", "Watch the demo")}</button>
            {error && <div className="ink-bad small" style={{ width: "100%" }}>{error}</div>}
            <div className="muted tiny" style={{ width: "100%" }}>{guest ? tx(`ลิงก์เดโม ${guest.id} · หมดอายุ ${fmtDate(guest.expires)} · คุณใช้งานในชื่อ ${r.persona.name}`, `Demo link ${guest.id} · expires ${fmtDate(guest.expires)} · you work as ${r.persona.name}, ${r.persona.role}.`) : server ? tx(`รหัสผ่านตรวจโดยเซิร์ฟเวอร์ COP24 · คุณใช้งานในชื่อ ${r.persona.name}`, `Password checked by the COP24 server · you work as ${r.persona.name}, ${r.persona.role}.`) : tx(`สภาพแวดล้อมเดโม — ยังไม่มีการยืนยันตัวตนจริง คุณเข้าใช้ในชื่อ ${r.persona.name}`, `Demo environment — no real authentication yet. You sign in as ${r.persona.name}, ${r.persona.role}.`)}</div>
          </form>
        )}
      </div>
      <div className="login-foot">
        <span>COP24 · {tx("ระบบปฏิบัติตาม CoP ด้วย AI", "AI CoP Compliance OS")}</span>
        <span>{tx("เจ้าของ · ที่ปรึกษา · ผู้บริหาร · ผู้ให้ข้อมูล", "Owner · Advisor · Executive · Contributor")}</span>
        <span style={{ marginLeft: "auto" }}>{tx("ส่วนหนึ่งของระบบนิเวศ 24: ESG24 · ACC24 · TP24 · GMT24 · TRADE24", "Part of the 24 ecosystem: ESG24 · ACC24 · TP24 · GMT24 · TRADE24")}</span>
      </div>
      {host && <HostDesk onClose={() => setHost(false)} />}
    </div>
  );
}
