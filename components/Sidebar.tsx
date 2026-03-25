"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Wrench,
  BellRing, LogOut, X, AlertTriangle, Loader2,
  LetterText
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<{ role?: string; companyName?: string } | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");
    if (storedUser) {
      try { setUserProfile(JSON.parse(storedUser)); }
      catch (e) { console.error(e); }
    }
  }, []);

  const isSuperAdmin = userProfile?.role === "SUPERADMIN";

  const MENU_ITEMS = [
    { name: "Dashboard",           href: "/dashboard",              icon: LayoutDashboard, show: true },
    { name: "Manajemen Klien",     href: "/dashboard/companies",    icon: Building2,       show: isSuperAdmin },
    { name: "Data Alat & Inspeksi",href: "/dashboard/equipments",   icon: Wrench,          show: true },
    { name: "Log Notifikasi",      href: "/dashboard/logs",         icon: BellRing,        show: true },
    { name: "Email Templates",     href: "/dashboard/settings",     icon: LetterText,       show: isSuperAdmin },
  ];

  const handleLogoutAction = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("userProfile");
      router.replace("/");
    } catch (error) {
      console.error("Gagal logout:", error);
      setIsLoggingOut(false);
    }
  };

  const initials = userProfile?.companyName
    ? userProfile.companyName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "MT";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

        /* ---- SIDEBAR BASE ---- */
        .sb-root {
          font-family: 'Syne', sans-serif;
          position: fixed;
          inset-y: 0;
          left: 0;
          z-index: 30;
          width: 268px;
          background: #FFFFFF;
          border-right: 1.5px solid #EAE7DF;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 4px 0 32px rgba(0,0,0,0.07);
        }
        .sb-root.open  { transform: translateX(0); }
        @media (min-width: 1024px) {
          .sb-root {
            position: static;
            transform: none !important;
            box-shadow: none;
          }
        }

        /* Grid texture */
        .sb-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(240,165,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(240,165,0,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* Glow orb top */
        .sb-orb {
          position: absolute;
          top: -60px;
          left: -60px;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(240,165,0,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ---- HEADER ---- */
        .sb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          height: 68px;
          border-bottom: 1.5px solid #EAE7DF;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          background: #FFFFFF;
        }

        .sb-logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sb-logo-mark {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sb-logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .sb-logo-name {
          font-size: 16px;
          font-weight: 800;
          color: #1A1A1A;
          letter-spacing: -0.02em;
        }
        .sb-logo-sub {
          font-family: 'DM Mono', monospace;
          font-weight: 500;
          font-size: 9px;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          margin-top: 2px;
          opacity: 0.9;
        }

        .sb-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          background: #F5F3EE;
          border: 1.5px solid #E5E2D8;
          border-radius: 8px;
          cursor: pointer;
          color: #AAAAAA;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .sb-close-btn:hover { color: #1A1A1A; border-color: #C8C0B0; background: #EDEAE3; }
        @media (min-width: 1024px) { .sb-close-btn { display: none; } }

        /* ---- USER CARD ---- */
        .sb-user-card {
          margin: 16px 16px 0;
          background: #FAFAF7;
          border: 1.5px solid #EAE7DF;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start; /* ✅ FIX: ganti center → flex-start agar avatar tetap di atas saat nama wrap */
          gap: 12px;
          position: relative;
          z-index: 1;
          overflow: hidden;
        }
        .sb-user-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px; height: 100%;
          background: #F0A500;
          opacity: 0.5;
          border-radius: 12px 0 0 12px;
        }

        .sb-avatar {
          width: 38px; height: 38px;
          background: rgba(240,165,0,0.1);
          border: 1.5px solid rgba(240,165,0,0.22);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          color: #C87A00;
          flex-shrink: 0;
          margin-top: 2px; /* ✅ sedikit turun supaya sejajar dengan teks pertama */
        }

        .sb-user-info { flex: 1; min-width: 0; }
        .sb-user-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #BBBBBB;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 3px;
        }

        /* ✅ FIX UTAMA: hapus nowrap + ellipsis, biarkan wrap */
        .sb-user-name {
          font-size: 13px;
          font-weight: 700;
          color: #1A1A1A;
          white-space: normal;
          word-break: break-word;
          line-height: 1.35;
        }

        .sb-role-badge {
          display: inline-flex;
          align-items: center;
          margin-top: 5px;
          background: rgba(240,165,0,0.08);
          border: 1px solid rgba(240,165,0,0.2);
          border-radius: 999px;
          padding: 2px 8px;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #C87A00;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
        }
        .sb-role-badge.admin {
          background: rgba(200,100,0,0.08);
          border-color: rgba(200,100,0,0.2);
          color: #A05000;
        }

        /* ---- SECTION DIVIDER ---- */
        .sb-section-label {
          padding: 20px 20px 8px;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #CCCCCC;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          position: relative;
          z-index: 1;
          font-weight: 500;
        }

        /* ---- NAV ---- */
        .sb-nav {
          padding: 4px 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }
        .sb-nav::-webkit-scrollbar { width: 0; }

        .sb-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #AAAAAA;
          text-decoration: none;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          position: relative;
          cursor: pointer;
          border: 1.5px solid transparent;
        }
        .sb-nav-item:hover {
          background: #F5F3EE;
          color: #555550;
          border-color: #EAE7DF;
        }
        .sb-nav-item.active {
          background: rgba(240,165,0,0.08);
          border-color: rgba(240,165,0,0.2);
          color: #C87A00;
        }
        .sb-nav-item.active .sb-nav-icon { color: #F0A500; }
        .sb-nav-item:not(.active) .sb-nav-icon { color: #CCCCCC; }
        .sb-nav-item:hover:not(.active) .sb-nav-icon { color: #999990; }

        .sb-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 2px;
          background: #F0A500;
          border-radius: 0 2px 2px 0;
        }

        .sb-nav-label { flex: 1; }

        .sb-active-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #F0A500;
          flex-shrink: 0;
          animation: sb-pulse 2s ease-in-out infinite;
        }
        @keyframes sb-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        /* ---- FOOTER / LOGOUT ---- */
        .sb-footer {
          padding: 12px 12px 16px;
          border-top: 1.5px solid #EAE7DF;
          position: relative;
          z-index: 1;
          background: #FFFFFF;
        }

        .sb-logout-btn {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px;
          border-radius: 10px;
          background: rgba(220,60,60,0.05);
          border: 1.5px solid rgba(220,60,60,0.12);
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #C07070;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .sb-logout-btn:hover {
          background: rgba(220,60,60,0.1);
          border-color: rgba(220,60,60,0.25);
          color: #DC3C3C;
        }

        /* ---- BACKDROP ---- */
        .sb-backdrop {
          position: fixed;
          inset: 0;
          z-index: 20;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(4px);
          transition: opacity 0.3s;
        }
        .sb-backdrop.visible { opacity: 1; pointer-events: auto; }
        .sb-backdrop.hidden  { opacity: 0; pointer-events: none; }
        @media (min-width: 1024px) { .sb-backdrop { display: none; } }

        /* ---- LOGOUT MODAL ---- */
        .sb-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .sb-modal-bg {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(6px);
        }
        .sb-modal {
          position: relative;
          background: #FFFFFF;
          border: 1.5px solid #EAE7DF;
          border-radius: 20px;
          width: 100%;
          max-width: 360px;
          padding: 32px 28px;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0,0,0,0.12);
        }
        .sb-modal-icon {
          width: 60px; height: 60px;
          background: rgba(220,60,60,0.07);
          border: 1.5px solid rgba(220,60,60,0.15);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #DC3C3C;
        }
        .sb-modal-title {
          font-size: 18px;
          font-weight: 900;
          color: #1A1A1A;
          margin: 0 0 8px 0;
        }
        .sb-modal-desc {
          font-size: 13px;
          color: #AAAAAA;
          font-weight: 600;
          margin: 0;
          line-height: 1.6;
        }
        .sb-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 28px;
        }
        .sb-btn-cancel {
          flex: 1;
          padding: 12px;
          background: #F5F3EE;
          border: 1.5px solid #E5E2D8;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #888880;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .sb-btn-cancel:hover:not(:disabled) { background: #EDEAE3; color: #333; }
        .sb-btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

        .sb-btn-confirm {
          flex: 1;
          padding: 12px;
          background: rgba(220,60,60,0.08);
          border: 1.5px solid rgba(220,60,60,0.2);
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #DC3C3C;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.2s, border-color 0.2s;
        }
        .sb-btn-confirm:hover:not(:disabled) {
          background: rgba(220,60,60,0.14);
          border-color: rgba(220,60,60,0.35);
        }
        .sb-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes sb-spin { to { transform: rotate(360deg); } }
        .sb-spin { animation: sb-spin 1s linear infinite; }
      `}</style>

      {/* BACKDROP (mobile) */}
      <div
        className={`sb-backdrop ${isOpen ? "visible" : "hidden"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`sb-root ${isOpen ? "open" : ""}`}>
        <div className="sb-grid" />
        <div className="sb-orb" />

        {/* ---- HEADER ---- */}
        <div className="sb-header">
          <div className="sb-logo-wrap">
            <div className="sb-logo-mark">
              <img
                src="/images/marusindologo.png"
                alt="MARIS"
                style={{ width: 28, height: 28, objectFit: "contain" }}
              />
            </div>
            <div className="sb-logo-text">
              <span className="sb-logo-name">MARIS</span>
              <span className="sb-logo-sub">Enterprise</span>
            </div>
          </div>
          <button className="sb-close-btn" onClick={() => setIsOpen(false)} aria-label="Tutup sidebar">
            <X size={16} />
          </button>
        </div>

        {/* ---- USER CARD ---- */}
        <div className="sb-user-card">
          <div className="sb-avatar">{initials}</div>
          <div className="sb-user-info">
            <p className="sb-user-label">Akses Login</p>
            <p className="sb-user-name">{userProfile?.companyName || "Memuat..."}</p>
            <div className={`sb-role-badge ${isSuperAdmin ? "admin" : ""}`}>
              {isSuperAdmin ? "Super Admin" : "Client Akses"}
            </div>
          </div>
        </div>

        {/* ---- SECTION LABEL ---- */}
        <div className="sb-section-label">// Navigasi</div>

        {/* ---- NAV ---- */}
        <nav className="sb-nav">
          {MENU_ITEMS.filter((item) => item.show).map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={idx}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`sb-nav-item ${isActive ? "active" : ""}`}
              >
                <item.icon size={17} className="sb-nav-icon" />
                <span className="sb-nav-label">{item.name}</span>
                {isActive && <span className="sb-active-dot" />}
              </Link>
            );
          })}
        </nav>

        {/* ---- FOOTER / LOGOUT ---- */}
        <div className="sb-footer">
          <button className="sb-logout-btn" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={15} />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ---- LOGOUT MODAL ---- */}
      {showLogoutModal && (
        <div className="sb-modal-overlay">
          <div
            className="sb-modal-bg"
            onClick={() => !isLoggingOut && setShowLogoutModal(false)}
          />
          <div className="sb-modal">
            <div className="sb-modal-icon">
              <AlertTriangle size={26} />
            </div>
            <h3 className="sb-modal-title">Konfirmasi Keluar</h3>
            <p className="sb-modal-desc">
              Anda yakin ingin mengakhiri sesi M-Track Anda?
            </p>
            <div className="sb-modal-actions">
              <button
                className="sb-btn-cancel"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                Batal
              </button>
              <button
                className="sb-btn-confirm"
                onClick={handleLogoutAction}
                disabled={isLoggingOut}
              >
                {isLoggingOut
                  ? <Loader2 size={16} className="sb-spin" />
                  : "Ya, Keluar"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}