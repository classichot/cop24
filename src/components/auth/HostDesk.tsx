"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/state/AppState";
import { DEFAULT_DAYS, HOST_PIN, MAX_DAYS, fmtDate, lineShare, linkFor, loadInvites, mailto, mint, mintRemote, revoke, status, unlockRemote, type DemoMode, type Invite } from "@/lib/access";
import { LOGIN_ROLES } from "@/data/login-roles";

/**
 * Host desk (ACC24 model): unlock with the host PIN, mint time-limited demo links (max 45 days),
 * send them by email or LINE, and revoke them. With DEMO_SECRET + HOST_PIN on the server every link
 * is signed and opens live AI; without them the prototype PIN mints local, unsigned links.
 */
const expiryIn = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export function HostDesk({ onClose, variant = "drawer" }: { onClose?: () => void; variant?: "drawer" | "page" }) {
  const { L, tx } = useApp();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [serverDesk, setServerDesk] = useState(false);
  const [pinError, setPinError] = useState("");
  const [mintError, setMintError] = useState("");
  const [list, setList] = useState<Invite[]>([]);
  useEffect(() => { queueMicrotask(() => setList(loadInvites())); }, []);
  const [f, setF] = useState({ guest: "", org: "", email: "", mode: "all" as DemoMode, days: DEFAULT_DAYS, note: "" });
  const [minted, setMinted] = useState<Invite | null>(null);
  const [copied, setCopied] = useState(false);
  const days = Math.max(1, Math.min(MAX_DAYS, f.days || DEFAULT_DAYS));
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: k === "days" ? Number(e.target.value) : e.target.value });

  const doMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.guest.trim()) return;
    setMintError("");
    try {
      const inv = serverDesk ? await mintRemote(pin, { ...f, days }) : mint({ ...f, days });
      setMinted(inv); setList(loadInvites()); setCopied(false);
    } catch (err) { setMintError(tx("เซิร์ฟเวอร์สร้างลิงก์ไม่ได้", "The server could not mint this link") + ` (${(err as Error).message}).`); }
  };
  const copy = async (inv: Invite) => { try { await navigator.clipboard.writeText(linkFor(inv)); setCopied(true); } catch { setCopied(false); } };

  const body = (
    <>
      <div className="hd-head">
        <div>
          <div className="card-kicker">{tx("โต๊ะผู้ดูแลเดโม", "Host desk")} <span className="muted">· {tx("Host desk", "โต๊ะผู้ดูแลเดโม")}</span></div>
          <h4 style={{ margin: "4px 0 0" }}>{tx("สร้างและส่งลิงก์เดโม", "Mint and send demo links")}</h4>
          <div className="muted small" style={{ marginTop: 2 }}>{tx(`ทุกลิงก์หมดอายุอัตโนมัติ · สูงสุด ${MAX_DAYS} วัน · เพิกถอนได้ที่นี่`, `Every link expires automatically · maximum ${MAX_DAYS} days · revocable here`)}</div>
        </div>
        {onClose && <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label={tx("ปิด", "Close")}>✕</button>}
      </div>
      {!unlocked ? (
        <form className="hd-body" onSubmit={async (e) => {
          e.preventDefault(); setPinError("");
          const r = await unlockRemote(pin);
          if (r === "ok") { setServerDesk(true); setUnlocked(true); }
          else if (r === "wrong") setPinError(tx("PIN ไม่ถูกต้อง", "That PIN does not match."));
          else if (pin === HOST_PIN) { setServerDesk(false); setUnlocked(true); }
          else setPinError(tx("PIN ไม่ถูกต้อง", "That PIN does not match."));
        }}>
          <div className="field" style={{ maxWidth: 260 }}><label>{tx("PIN ผู้ดูแล", "Host PIN")}</label><input className="input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder={tx("ใส่ PIN ผู้ดูแล", "Enter the host PIN")} autoFocus /></div>
          <div className="row row-center" style={{ gap: 10, marginTop: 12 }}><button className="btn btn-primary" type="submit">{tx("ปลดล็อก", "Unlock")}</button>{pinError && <span className="ink-bad small">{pinError}</span>}</div>
          <div className="muted tiny" style={{ marginTop: 14, lineHeight: 1.6 }}>{tx("เมื่อเซิร์ฟเวอร์ตั้งค่าแล้ว PIN คือ HOST_PIN ในสภาพแวดล้อมของเซิร์ฟเวอร์ และทุกลิงก์ถูกลงนาม หากยังไม่ตั้งค่า (ต้นแบบ) PIN host24 จะสร้างลิงก์ที่ไม่ได้ลงนาม เปิดเดโมได้แต่ใช้ AI จริงไม่ได้", "When the COP24 server is configured, the PIN is the HOST_PIN set in the server environment and every link is signed. Without it (prototype), the PIN host24 mints unsigned links that open the demo but cannot use live AI.")}</div>
        </form>
      ) : (
        <div className="hd-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <form onSubmit={doMint} className="hd-grid">
            <div className="field"><label>{tx("ชื่อผู้เข้าชม", "Guest name")}</label><input className="input" value={f.guest} onChange={set("guest")} placeholder={tx("เช่น คุณสมชาย", "e.g. Khun Somchai")} /></div>
            <div className="field"><label>{tx("บริษัท / หน่วยงาน", "Company / firm")}</label><input className="input" value={f.org} onChange={set("org")} placeholder={tx("เช่น บจ. โซลาร์สยาม", "e.g. Siam Solar Co., Ltd.")} /></div>
            <div className="field"><label>{tx("อีเมล (สำหรับส่ง)", "Email (for sending)")}</label><input className="input" type="email" value={f.email} onChange={set("email")} placeholder="guest@example.co.th" /></div>
            <div className="field"><label>{tx("สิทธิ์บทบาท", "Role access")}</label>
              <select className="input" value={f.mode} onChange={set("mode")}>
                <option value="all">{tx("ทั้ง 4 บทบาท", "All four roles")}</option>
                {LOGIN_ROLES.map((x) => <option key={x.id} value={x.id}>{L(x.name)} {tx("เท่านั้น", "only")}</option>)}
              </select>
            </div>
            <div className="field"><label>{tx(`อายุลิงก์ · วัน (สูงสุด ${MAX_DAYS})`, `Valid for · days (max ${MAX_DAYS})`)}</label>
              <div className="row row-center" style={{ gap: 10 }}><input type="range" min={1} max={MAX_DAYS} value={days} onChange={set("days")} style={{ flex: 1 }} /><input className="input" type="number" min={1} max={MAX_DAYS} value={days} onChange={set("days")} style={{ width: 72, textAlign: "right" }} /></div>
              <div className="muted tiny" style={{ marginTop: 4 }}>{tx("หมดอายุ", "Expires")} {fmtDate(expiryIn(days))}{f.days > MAX_DAYS ? tx(` · จำกัดที่ ${MAX_DAYS}`, ` · capped at ${MAX_DAYS}`) : ""}</div>
            </div>
            <div className="field"><label>{tx("ข้อความถึงผู้เข้าชม (ไม่บังคับ)", "Note to guest (optional)")}</label><input className="input" value={f.note} onChange={set("note")} placeholder={tx("เช่น เริ่มจาก ภารกิจ F01", "e.g. Start with mission F01")} /></div>
            <div className="row row-center" style={{ gridColumn: "1 / -1", gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={!f.guest.trim()}>{tx("สร้างลิงก์เดโม", "Mint demo link")}</button>
              <span className={`tag ${serverDesk ? "st-ok" : "tag-outline"}`}>{serverDesk ? tx("ลงนามโดยเซิร์ฟเวอร์ · AI จริง", "Signed by server · live AI") : tx("ลิงก์ในเครื่อง · AI ออฟไลน์", "Local link · AI offline")}</span>
              {mintError && <span className="ink-bad small">{mintError}</span>}
            </div>
          </form>
          {minted && (
            <div className="hd-minted">
              <div className="row" style={{ justifyContent: "space-between", gap: 10, alignItems: "baseline" }}><b>{tx("สร้างลิงก์แล้ว", "Link minted")} · {minted.id}</b><span className="muted small">{minted.guest}{minted.org ? " · " + minted.org : ""} · {minted.mode === "all" ? tx("ทุกบทบาท", "all roles") : minted.mode} · {minted.days} {tx("วัน", "days")} · {tx("หมดอายุ", "expires")} {fmtDate(minted.expires)}</span></div>
              <input className="input" readOnly value={linkFor(minted)} onFocus={(e) => e.currentTarget.select()} style={{ marginTop: 8, fontSize: 12 }} />
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => copy(minted)}>{copied ? tx("คัดลอกแล้ว", "Copied") : tx("คัดลอกลิงก์", "Copy link")}</button>
                <a className="btn btn-secondary btn-sm btn-plain" href={mailto(minted, linkFor(minted))}>{tx("ส่งทางอีเมล", "Send by email")}</a>
                <a className="btn btn-secondary btn-sm btn-plain" href={lineShare(linkFor(minted))} target="_blank" rel="noreferrer">{tx("ส่งทาง LINE", "Send via LINE")}</a>
                <a className="btn btn-ghost btn-sm" href={linkFor(minted)} target="_blank" rel="noreferrer">{tx("เปิดในมุมผู้เข้าชม", "Open as the guest")}</a>
              </div>
            </div>
          )}
          <div>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 10 }}><h5 style={{ margin: 0 }}>{tx("ทะเบียนลิงก์", "Minted links")}</h5><span className="muted small">{list.filter((i) => status(i).startsWith("Active")).length} {tx("ใช้งานอยู่", "active")} · {list.length} {tx("ทั้งหมด", "total")}</span></div>
            <div className="hr" style={{ margin: "8px 0 0" }} />
            {list.length === 0 && <div className="muted small" style={{ padding: "12px 0" }}>{tx("ยังไม่มีลิงก์ในเครื่องนี้", "No links minted yet on this device.")}</div>}
            {list.map((i) => {
              const st = status(i);
              return (
                <div key={i.id} className="hd-row">
                  <span><b>{i.guest}</b>{i.org ? " · " + i.org : ""}<div className="muted">{i.id} · {i.mode === "all" ? tx("ทุกบทบาท", "all roles") : i.mode} · {tx("ออก", "issued")} {fmtDate(i.issued)} · {tx("หมดอายุ", "expires")} {fmtDate(i.expires)} · <span className={st.startsWith("Active") ? "ink-ok" : "ink-bad"}>{st}</span></div></span>
                  <span className="row" style={{ gap: 6 }}>
                    {st.startsWith("Active") && <button type="button" className="btn btn-secondary btn-sm btn-plain" onClick={() => { setMinted(i); setCopied(false); }}>{tx("แสดง", "Show")}</button>}
                    {st.startsWith("Active") && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { revoke(i.id); setList(loadInvites()); if (minted?.id === i.id) setMinted(null); }}>{tx("เพิกถอน", "Revoke")}</button>}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="muted tiny" style={{ lineHeight: 1.6 }}>{tx(`นโยบาย: ลิงก์ใช้เพื่อเดโมเท่านั้น จำกัด ${MAX_DAYS} วัน ผูกกับบทบาทที่เลือก และเพิกถอนได้ การเพิกถอนตรวจกับทะเบียนในเครื่องนี้ ในระบบจริงต้องตรวจที่เซิร์ฟเวอร์ทุกครั้งที่เปิด`, `Policy: links are single-purpose demo access, capped at ${MAX_DAYS} days, tied to the roles you choose, and revocable. Revocation is checked against this device's register; in production it is checked server-side on every open.`)}</div>
        </div>
      )}
    </>
  );

  if (variant === "page") return <section className="hd-page">{body}</section>;
  return (
    <>
      <div className="hd-backdrop" onClick={onClose} />
      <aside className="hd-drawer" role="dialog" aria-label={tx("โต๊ะผู้ดูแลเดโม", "Host desk")}>{body}</aside>
    </>
  );
}
