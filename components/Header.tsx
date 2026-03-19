"use client";

import React, { useEffect, useState, useRef } from "react";
import { Menu, ChevronDown, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface HeaderProps {
  setSidebarOpen: (val: boolean) => void;
}

const PAGE_META: Record<string, { title: string; sub: string }> = {
  "/dashboard/companies":  { title: "Manajemen Klien",      sub: "Client Management" },
  "/dashboard/equipments": { title: "Data Alat & Inspeksi", sub: "Equipment & Inspection" },
  "/dashboard/logs":       { title: "Log Notifikasi",        sub: "Notification Logs" },
  "/dashboard":            { title: "Dashboard Overview",    sub: "Live Monitoring" },
};

export default function Header({ setSidebarOpen }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const getPageTitle = () => {
    if (pathname.includes("/companies"))  return PAGE_META["/dashboard/companies"];
    if (pathname.includes("/equipments")) return PAGE_META["/dashboard/equipments"];
    if (pathname.includes("/logs"))       return PAGE_META["/dashboard/logs"];
    return PAGE_META["/dashboard"];
  };

  const pageMeta = getPageTitle();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("userProfile");
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); }
        catch (e) { console.error(e); }
      }
    }
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("userProfile");
      router.replace("/");
    } catch (error) {
      console.error("Logout gagal:", error);
      setIsLoggingOut(false);
    }
  };

  const initials = user?.companyName
    ? user.companyName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "MT";

  const isSuperAdmin = user?.role === "SUPERADMIN";

  return (
    <>
      <style>{`
        .hd-root * { box-sizing: border-box; }
        .hd-root {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: sticky;
          top: 0;
          z-index: 20;
          height: 68px;
          background: rgba(255,255,255,0.95);
          border-bottom: 1.5px solid #EAE7DF;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          gap: 12px;
        }
        @media (min-width: 768px) { .hd-root { padding: 0 32px; } }

        /* ---- LEFT ---- */
        .hd-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .hd-hamburger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          background: #F5F3EE;
          border: 1.5px solid #E5E2D8;
          border-radius: 9px;
          cursor: pointer;
          color: #AAAAAA;
          flex-shrink: 0;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .hd-hamburger:hover {
          color: #C87A00;
          border-color: rgba(240,165,0,0.3);
          background: rgba(240,165,0,0.05);
        }
        @media (min-width: 1024px) { .hd-hamburger { display: none; } }

        .hd-sep {
          width: 1px;
          height: 24px;
          background: #E8E4DC;
          flex-shrink: 0;
        }
        @media (max-width: 1023px) { .hd-sep { display: none; } }

        .hd-title-wrap {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .hd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 3px;
        }
        .hd-breadcrumb-slash {
          font-size: 11px;
          color: #CCCCCC;
        }
        .hd-breadcrumb-item {
          font-size: 10px;
          font-weight: 500;
          color: #BBBBBB;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .hd-breadcrumb-item.active { color: #C87A00; font-weight: 600; }

        .hd-page-title {
          font-size: clamp(15px, 2.5vw, 17px);
          font-weight: 700;
          color: #1A1A1A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1;
          margin: 0;
        }

        /* ---- RIGHT ---- */
        .hd-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        /* Live badge */
        .hd-live-badge {
          display: none;
          align-items: center;
          gap: 6px;
          background: rgba(240,165,0,0.07);
          border: 1px solid rgba(240,165,0,0.15);
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 10px;
          font-weight: 500;
          color: #C87A00;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        @media (min-width: 640px) { .hd-live-badge { display: flex; } }
        .hd-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #F0A500;
          animation: hd-blink 2s ease-in-out infinite;
        }
        @keyframes hd-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }

        /* Profile button */
        .hd-profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px 6px 6px;
          background: #FAFAF7;
          border: 1.5px solid #E8E4DC;
          border-radius: 12px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          position: relative;
        }
        .hd-profile-btn:hover,
        .hd-profile-btn.open {
          background: #F5F2EA;
          border-color: rgba(240,165,0,0.3);
        }

        .hd-avatar {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .hd-avatar.client { background: rgba(240,165,0,0.1); border: 1.5px solid rgba(240,165,0,0.2); color: #C87A00; }
        .hd-avatar.admin  { background: rgba(180,90,0,0.1);  border: 1.5px solid rgba(180,90,0,0.2);  color: #A05000; }

        .hd-user-text {
          display: none;
          flex-direction: column;
          text-align: left;
        }
        @media (min-width: 480px) { .hd-user-text { display: flex; } }

        .hd-user-name {
          font-size: 13px;
          font-weight: 600;
          color: #1A1A1A;
          max-width: 130px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1;
          margin-bottom: 3px;
        }
        .hd-user-role {
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .hd-user-role.client { color: #C87A00; }
        .hd-user-role.admin  { color: #A05000; }

        .hd-chevron {
          color: #CCCCCC;
          transition: transform 0.25s, color 0.2s;
          flex-shrink: 0;
        }
        .hd-chevron.open { transform: rotate(180deg); color: #F0A500; }

        /* ---- DROPDOWN ---- */
        .hd-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 240px;
          background: #FFFFFF;
          border: 1.5px solid #EAE7DF;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0,0,0,0.1);
          animation: hd-drop 0.18s ease both;
          transform-origin: top right;
          z-index: 50;
        }
        @keyframes hd-drop {
          from { opacity: 0; transform: scale(0.96) translateY(-6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .hd-dd-header {
          padding: 16px 18px 14px;
          border-bottom: 1px solid #F0EDE4;
          background: #FAFAF7;
        }
        .hd-dd-label {
          font-size: 9px;
          font-weight: 500;
          color: #CCCCCC;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 6px;
        }
        .hd-dd-company {
          font-size: 13px;
          font-weight: 600;
          color: #1A1A1A;
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hd-dd-email {
          font-size: 11px;
          color: #AAAAAA;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hd-dd-role-badge {
          display: inline-flex;
          margin-top: 8px;
          background: rgba(240,165,0,0.08);
          border: 1px solid rgba(240,165,0,0.18);
          border-radius: 999px;
          padding: 2px 9px;
          font-size: 9px;
          font-weight: 500;
          color: #C87A00;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .hd-dd-role-badge.admin {
          background: rgba(160,80,0,0.07);
          border-color: rgba(160,80,0,0.15);
          color: #A05000;
        }

        .hd-dd-body { padding: 8px; }

        .hd-dd-logout {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 9px;
          background: transparent;
          border: 1px solid transparent;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          color: #C08080;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          text-align: left;
        }
        .hd-dd-logout:hover {
          background: rgba(220,60,60,0.06);
          border-color: rgba(220,60,60,0.14);
          color: #DC3C3C;
        }
        .hd-dd-logout-icon {
          width: 30px; height: 30px;
          background: rgba(220,60,60,0.06);
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C08080;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .hd-dd-logout:hover .hd-dd-logout-icon {
          background: rgba(220,60,60,0.12);
          color: #DC3C3C;
        }

        /* ---- MODAL ---- */
        .hd-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .hd-modal-bg {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.25);
          backdrop-filter: blur(6px);
        }
        .hd-modal {
          position: relative;
          background: #FFFFFF;
          border: 1.5px solid #EAE7DF;
          border-radius: 20px;
          width: 100%;
          max-width: 360px;
          padding: 32px 28px;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0,0,0,0.12);
          animation: hd-modal-in 0.2s ease both;
        }
        @keyframes hd-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .hd-modal-icon-wrap {
          width: 56px; height: 56px;
          background: rgba(220,60,60,0.07);
          border: 1.5px solid rgba(220,60,60,0.15);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          color: #DC3C3C;
        }
        .hd-modal-title {
          font-size: 17px;
          font-weight: 700;
          color: #1A1A1A;
          margin: 0 0 8px 0;
        }
        .hd-modal-desc {
          font-size: 13px;
          color: #AAAAAA;
          font-weight: 400;
          line-height: 1.65;
          margin: 0;
        }
        .hd-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
        }
        .hd-btn-cancel {
          flex: 1;
          padding: 11px;
          background: #F5F3EE;
          border: 1.5px solid #E5E2D8;
          border-radius: 10px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          color: #888880;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .hd-btn-cancel:hover:not(:disabled) { background: #EDEAE3; color: #333; }
        .hd-btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

        .hd-btn-confirm {
          flex: 1;
          padding: 11px;
          background: rgba(220,60,60,0.07);
          border: 1.5px solid rgba(220,60,60,0.18);
          border-radius: 10px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: #DC3C3C;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.15s, border-color 0.15s;
        }
        .hd-btn-confirm:hover:not(:disabled) {
          background: rgba(220,60,60,0.12);
          border-color: rgba(220,60,60,0.3);
        }
        .hd-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes hd-spin { to { transform: rotate(360deg); } }
        .hd-spin { animation: hd-spin 1s linear infinite; }
      `}</style>

      <header className="hd-root">

        {/* ---- LEFT ---- */}
        <div className="hd-left">
          <button
            className="hd-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="hd-sep" />

          <div className="hd-title-wrap">
            <div className="hd-breadcrumb">
              <span className="hd-breadcrumb-item">MARIS</span>
              <span className="hd-breadcrumb-slash">/</span>
              <span className="hd-breadcrumb-item active">{pageMeta.sub}</span>
            </div>
            <h1 className="hd-page-title">{pageMeta.title}</h1>
          </div>
        </div>

        {/* ---- RIGHT ---- */}
        <div className="hd-right">

          <div className="hd-live-badge">
            <span className="hd-live-dot" />
            Live
          </div>

          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              className={`hd-profile-btn ${isDropdownOpen ? "open" : ""}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
            >
              <div className={`hd-avatar ${isSuperAdmin ? "admin" : "client"}`}>
                {initials}
              </div>
              <div className="hd-user-text">
                <span className="hd-user-name">{user?.companyName || "Memuat..."}</span>
                <span className={`hd-user-role ${isSuperAdmin ? "admin" : "client"}`}>
                  {isSuperAdmin ? "Administrator" : "Akses Klien"}
                </span>
              </div>
              <ChevronDown size={14} className={`hd-chevron ${isDropdownOpen ? "open" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="hd-dropdown">
                <div className="hd-dd-header">
                  <p className="hd-dd-label">// Sesi Aktif</p>
                  <p className="hd-dd-company">{user?.companyName || "—"}</p>
                  {user?.email && <p className="hd-dd-email">{user.email}</p>}
                  <div className={`hd-dd-role-badge ${isSuperAdmin ? "admin" : ""}`}>
                    {isSuperAdmin ? "Super Admin" : "Client Akses"}
                  </div>
                </div>
                <div className="hd-dd-body">
                  <button
                    className="hd-dd-logout"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowLogoutModal(true);
                    }}
                  >
                    <span className="hd-dd-logout-icon"><LogOut size={14} /></span>
                    Keluar Sistem
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ---- LOGOUT MODAL ---- */}
      {showLogoutModal && (
        <div className="hd-modal-overlay">
          <div
            className="hd-modal-bg"
            onClick={() => !isLoggingOut && setShowLogoutModal(false)}
          />
          <div className="hd-modal">
            <div className="hd-modal-icon-wrap">
              <AlertTriangle size={24} />
            </div>
            <h3 className="hd-modal-title">Akhiri Sesi?</h3>
            <p className="hd-modal-desc">
              Anda akan keluar dari M-Track. Anda harus memasukkan kredensial lagi untuk memantau data.
            </p>
            <div className="hd-modal-actions">
              <button
                className="hd-btn-cancel"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                Batal
              </button>
              <button
                className="hd-btn-confirm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut
                  ? <Loader2 size={16} className="hd-spin" />
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