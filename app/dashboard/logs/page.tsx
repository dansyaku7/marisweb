"use client";

import React, { useEffect, useState } from "react";
import {
  BellRing, Loader2, Search, CheckCircle2,
  XCircle, Clock, Send, Building2
} from "lucide-react";

interface EmailLog {
  id: string;
  status: "PENDING" | "SENT" | "FAILED" | "BOUNCED";
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  company: { name: string; emailPic: string };
  equipment: { name: string; expiryDate: string };
}

export default function NotificationLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");
    if (storedUser) setUserRole(JSON.parse(storedUser).role);
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) throw new Error("Gagal memuat riwayat notifikasi");
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusUI = (status: string) => {
    switch (status) {
      case "SENT":    return { label: "Terkirim", variant: "sent",    icon: CheckCircle2 };
      case "FAILED":  return { label: "Gagal",    variant: "failed",  icon: XCircle };
      case "BOUNCED": return { label: "Ditolak",  variant: "bounced", icon: XCircle };
      default:        return { label: "Antrean",  variant: "pending", icon: Clock };
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

        .lg-root * { box-sizing: border-box; }
        .lg-root { font-family: 'Syne', sans-serif; }

        @keyframes lg-fadeup {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lg-spin { to { transform: rotate(360deg); } }

        .lg-inner {
          padding: 28px 20px;
          max-width: 1280px;
          margin: 0 auto;
          animation: lg-fadeup 0.4s ease both;
        }
        @media (min-width: 768px)  { .lg-inner { padding: 40px 32px; } }
        @media (min-width: 1024px) { .lg-inner { padding: 48px 48px; } }

        /* ---- PAGE HEADER ---- */
        .lg-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #C8F135;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 8px;
        }
        .lg-page-title {
          font-size: clamp(20px, 3.5vw, 28px);
          font-weight: 700;
          color: #F0F0F0;
          margin: 0 0 6px 0;
          line-height: 1.1;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .lg-title-icon {
          width: 36px; height: 36px;
          background: rgba(200,241,53,0.08);
          border: 1px solid rgba(200,241,53,0.15);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #C8F135;
          flex-shrink: 0;
        }
        .lg-page-desc { font-size: 13px; color: #444; margin: 0; max-width: 520px; line-height: 1.6; }

        .lg-divider {
          height: 1px;
          background: linear-gradient(90deg, #C8F135 0%, transparent 60%);
          margin: 24px 0 28px;
          opacity: 0.1;
        }

        /* ---- ERROR BAR ---- */
        .lg-error-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(248,113,113,0.07);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 10px;
          padding: 13px 16px;
          margin-bottom: 24px;
          font-size: 13px;
          color: #F87171;
          font-weight: 600;
        }

        /* ---- TABLE CARD ---- */
        .lg-card {
          background: #111;
          border: 1px solid #1C1C1C;
          border-radius: 16px;
          overflow: hidden;
        }

        /* Toolbar */
        .lg-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 20px;
          background: #0D0D0D;
          border-bottom: 1px solid #181818;
          flex-wrap: wrap;
        }
        .lg-search-wrap {
          position: relative;
          flex: 1;
          min-width: 180px;
          max-width: 360px;
        }
        .lg-search-icon {
          position: absolute;
          left: 11px; top: 50%;
          transform: translateY(-50%);
          color: #2D2D2D;
          pointer-events: none;
        }
        .lg-search-input {
          width: 100%;
          padding: 9px 14px 9px 34px;
          background: #141414;
          border: 1px solid #222;
          border-radius: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          color: #D0D0D0;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          caret-color: #C8F135;
        }
        .lg-search-input::placeholder { color: #2A2A2A; }
        .lg-search-input:focus {
          border-color: rgba(200,241,53,0.3);
          box-shadow: 0 0 0 3px rgba(200,241,53,0.06);
        }
        .lg-log-count {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #2D2D2D;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          white-space: nowrap;
        }
        .lg-log-count strong { color: #C8F135; }

        /* Table */
        .lg-table-scroll { overflow-x: auto; }
        .lg-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .lg-table thead tr { border-bottom: 1px solid #181818; }
        .lg-table thead th {
          padding: 12px 20px;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #2D2D2D;
          font-weight: 500;
          background: #0D0D0D;
          white-space: nowrap;
        }
        .lg-table tbody tr {
          border-bottom: 1px solid #161616;
          transition: background 0.12s;
        }
        .lg-table tbody tr:last-child { border-bottom: none; }
        .lg-table tbody tr:hover { background: #141414; }
        .lg-table td { padding: 14px 20px; vertical-align: middle; }

        /* Status badges */
        .lg-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 7px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        .lg-badge.sent    { background: rgba(52,211,153,0.08);  border-color: rgba(52,211,153,0.18);  color: #34D399; }
        .lg-badge.failed  { background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.18); color: #F87171; }
        .lg-badge.bounced { background: rgba(251,146,60,0.08);  border-color: rgba(251,146,60,0.18);  color: #FB923C; }
        .lg-badge.pending { background: rgba(255,255,255,0.03); border-color: #222;                   color: #444; }

        .lg-error-msg {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #7A3535;
          margin-top: 5px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Cell text styles */
        .lg-company-name {
          font-size: 13px;
          font-weight: 600;
          color: #AAA;
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 3px;
        }
        .lg-email {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #3A3A3A;
        }
        .lg-eq-name {
          font-size: 13px;
          font-weight: 500;
          color: #999;
        }
        .lg-eq-expiry {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #2D2D2D;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .lg-sent-date {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #555;
          text-align: right;
          white-space: nowrap;
        }
        .lg-sent-time {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #2D2D2D;
          text-align: right;
          margin-top: 3px;
          white-space: nowrap;
        }

        /* Empty / loading state */
        .lg-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 72px 20px;
          text-align: center;
        }
        .lg-empty-icon {
          width: 60px; height: 60px;
          background: rgba(255,255,255,0.02);
          border: 1px solid #1E1E1E;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px;
          color: #222;
        }
        .lg-empty-title { font-size: 15px; font-weight: 700; color: #2D2D2D; margin: 0 0 6px 0; }
        .lg-empty-desc  { font-size: 12px; color: #252525; margin: 0; max-width: 320px; line-height: 1.6; }
        .lg-spinner { animation: lg-spin 1s linear infinite; }
      `}</style>

      <div className="lg-root" style={{ background: "#0A0A0A", minHeight: "100vh" }}>
        <div className="lg-inner">

          {/* ---- PAGE HEADER ---- */}
          <p className="lg-eyebrow">// Notification Audit Trail</p>
          <h1 className="lg-page-title">
            <span className="lg-title-icon"><BellRing size={18} /></span>
            Log Notifikasi Peringatan
          </h1>
          <p className="lg-page-desc">
            Jejak audit pengiriman email otomatis sistem peringatan batas kedaluwarsa alat berat.
          </p>
          <div className="lg-divider" />

          {/* ---- ERROR ---- */}
          {errorMsg && (
            <div className="lg-error-bar">
              <XCircle size={15} style={{ flexShrink: 0 }} />
              {errorMsg}
            </div>
          )}

          {/* ---- TABLE CARD ---- */}
          <div className="lg-card">

            {/* Toolbar */}
            <div className="lg-toolbar">
              <div className="lg-search-wrap">
                <Search size={14} className="lg-search-icon" />
                <input
                  type="text"
                  placeholder="Cari perusahaan atau nama alat..."
                  className="lg-search-input"
                />
              </div>
              <span className="lg-log-count">
                Terakhir: <strong>{logs.length}</strong> Log
              </span>
            </div>

            {/* Table */}
            <div className="lg-table-scroll">
              <table className="lg-table">
                <thead>
                  <tr>
                    <th>Status Pengiriman</th>
                    <th>Penerima & Perusahaan</th>
                    <th>Peringatan Alat</th>
                    <th style={{ textAlign: "right" }}>Waktu Eksekusi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="lg-empty">
                          <Loader2 size={28} className="lg-spinner" style={{ color: "#C8F135", marginBottom: 12 }} />
                          <p className="lg-empty-desc">Memuat riwayat notifikasi...</p>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="lg-empty">
                          <div className="lg-empty-icon"><Send size={26} /></div>
                          <p className="lg-empty-title">Belum ada aktivitas email</p>
                          <p className="lg-empty-desc">
                            Sistem belum pernah mengirimkan peringatan kedaluwarsa apa pun.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const ui = getStatusUI(log.status);
                      const Icon = ui.icon;
                      return (
                        <tr key={log.id}>

                          {/* Status */}
                          <td>
                            <span className={`lg-badge ${ui.variant}`}>
                              <Icon size={11} />
                              {ui.label}
                            </span>
                            {log.errorMessage && (
                              <p className="lg-error-msg" title={log.errorMessage}>
                                {log.errorMessage}
                              </p>
                            )}
                          </td>

                          {/* Penerima */}
                          <td>
                            {userRole === "SUPERADMIN" && (
                              <p className="lg-company-name">
                                <Building2 size={13} style={{ color: "#2D2D2D", flexShrink: 0 }} />
                                {log.company.name}
                              </p>
                            )}
                            <p className="lg-email">{log.company.emailPic}</p>
                          </td>

                          {/* Alat */}
                          <td>
                            <p className="lg-eq-name">{log.equipment.name}</p>
                            <p className="lg-eq-expiry">
                              Habis: {new Date(log.equipment.expiryDate).toLocaleDateString("id-ID")}
                            </p>
                          </td>

                          {/* Waktu */}
                          <td>
                            <p className="lg-sent-date">
                              {log.sentAt
                                ? new Date(log.sentAt).toLocaleDateString("id-ID", {
                                    day: "2-digit", month: "short", year: "numeric",
                                  })
                                : "—"
                              }
                            </p>
                            <p className="lg-sent-time">
                              {log.sentAt
                                ? new Date(log.sentAt).toLocaleTimeString("id-ID", {
                                    hour: "2-digit", minute: "2-digit",
                                  })
                                : "Menunggu antrean"
                              }
                            </p>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}