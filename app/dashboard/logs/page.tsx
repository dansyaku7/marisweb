"use client";

import React, { useEffect, useState } from "react";
import {
  BellRing, Loader2, Search, CheckCircle2,
  XCircle, Clock, Send, Building2, ChevronLeft, ChevronRight
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

const LOGS_PER_PAGE = 10;

export default function NotificationLogsPage() {
  const [logs, setLogs]         = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");
    if (storedUser) setUserRole(JSON.parse(storedUser).role);
    fetchLogs();
  }, []);

  // Reset ke page 1 kalau search berubah
  useEffect(() => { setCurrentPage(1); }, [searchText]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) throw new Error("Gagal memuat riwayat notifikasi");
      setLogs(await res.json());
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

  // ── Derived ──
  const filteredLogs = logs.filter((log) => {
    const t = searchText.toLowerCase();
    return (
      log.company.name.toLowerCase().includes(t) ||
      log.company.emailPic.toLowerCase().includes(t) ||
      log.equipment.name.toLowerCase().includes(t)
    );
  });

  const totalPages     = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE));
  const paginatedLogs  = filteredLogs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE
  );

  return (
    <>
      <style>{`
        .lg-root * { box-sizing: border-box; }
        .lg-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        @keyframes lg-fadeup { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lg-spin { to { transform: rotate(360deg); } }

        .lg-inner { padding: 28px 20px; max-width: 1280px; margin: 0 auto; animation: lg-fadeup 0.4s ease both; }
        @media (min-width: 768px)  { .lg-inner { padding: 40px 32px; } }
        @media (min-width: 1024px) { .lg-inner { padding: 48px 48px; } }

        .lg-eyebrow { font-size: 10px; font-weight: 500; color: #C87A00; text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 8px; }
        .lg-page-title { font-size: clamp(20px, 3.5vw, 26px); font-weight: 700; color: #1A1A1A; margin: 0 0 6px; line-height: 1.15; display: flex; align-items: center; gap: 12px; }
        .lg-title-icon { width: 36px; height: 36px; background: rgba(240,165,0,0.08); border: 1.5px solid rgba(240,165,0,0.18); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #C87A00; flex-shrink: 0; }
        .lg-page-desc { font-size: 13px; color: #AAAAAA; margin: 0; max-width: 520px; line-height: 1.6; }
        .lg-divider { height: 1px; background: linear-gradient(90deg, #F0A500 0%, transparent 60%); margin: 24px 0 28px; opacity: 0.2; }

        .lg-error-bar { display: flex; align-items: center; gap: 10px; background: rgba(220,60,60,0.06); border: 1px solid rgba(220,60,60,0.15); border-radius: 10px; padding: 13px 16px; margin-bottom: 24px; font-size: 13px; color: #DC3C3C; }

        .lg-card { background: #FFFFFF; border: 1.5px solid #E8E4DC; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }

        .lg-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 20px; background: #FAFAF7; border-bottom: 1px solid #F0EDE4; flex-wrap: wrap; }
        .lg-search-wrap { position: relative; flex: 1; min-width: 180px; max-width: 360px; }
        .lg-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #CCCCCC; pointer-events: none; }
        .lg-search-input { width: 100%; padding: 9px 14px 9px 34px; background: #FFFFFF; border: 1.5px solid #E5E2D8; border-radius: 8px; font-family: inherit; font-size: 13px; color: #1A1A1A; outline: none; transition: 0.2s; caret-color: #F0A500; }
        .lg-search-input::placeholder { color: #CCCCCC; }
        .lg-search-input:focus { border-color: rgba(240,165,0,0.35); box-shadow: 0 0 0 3px rgba(240,165,0,0.08); }

        .lg-log-count { font-size: 11px; color: #AAAAAA; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }
        .lg-log-count strong { color: #C87A00; font-weight: 600; }

        .lg-table-scroll { overflow-x: auto; }
        .lg-table { width: 100%; border-collapse: collapse; text-align: left; }
        .lg-table thead tr { border-bottom: 1px solid #F0EDE4; }
        .lg-table thead th { padding: 12px 20px; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: #AAAAAA; background: #FAFAF7; white-space: nowrap; }
        .lg-table tbody tr { border-bottom: 1px solid #F5F3EE; transition: 0.12s; }
        .lg-table tbody tr:last-child { border-bottom: none; }
        .lg-table tbody tr:hover td { background: #FDFCF8; }
        .lg-table td { padding: 14px 20px; vertical-align: middle; }

        .lg-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 7px; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; border: 1px solid transparent; }
        .lg-badge.sent    { background: rgba(34,160,100,0.07);  border-color: rgba(34,160,100,0.18);  color: #22A064; }
        .lg-badge.failed  { background: rgba(220,60,60,0.07);   border-color: rgba(220,60,60,0.18);   color: #DC3C3C; }
        .lg-badge.bounced { background: rgba(234,120,40,0.07);  border-color: rgba(234,120,40,0.18);  color: #EA7828; }
        .lg-badge.pending { background: #F5F3EE; border-color: #E5E2D8; color: #AAAAAA; }

        .lg-error-msg { font-size: 10px; color: #DC9090; margin-top: 5px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace; }

        .lg-company-name { font-size: 13px; font-weight: 600; color: #1A1A1A; display: flex; align-items: center; gap: 7px; margin-bottom: 3px; }
        .lg-email        { font-size: 11px; color: #AAAAAA; font-family: monospace; }
        .lg-eq-name      { font-size: 13px; font-weight: 500; color: #333330; }
        .lg-eq-expiry    { font-size: 10px; color: #BBBBBB; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.06em; font-family: monospace; }
        .lg-sent-date    { font-size: 12px; color: #555550; text-align: right; white-space: nowrap; font-family: monospace; }
        .lg-sent-time    { font-size: 10px; color: #BBBBBB; text-align: right; margin-top: 3px; white-space: nowrap; font-family: monospace; }

        .lg-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 72px 20px; text-align: center; }
        .lg-empty-icon  { width: 60px; height: 60px; background: #F5F3EE; border: 1.5px solid #E5E2D8; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; color: #CCCCCC; }
        .lg-empty-title { font-size: 15px; font-weight: 600; color: #555550; margin: 0 0 6px; }
        .lg-empty-desc  { font-size: 12px; color: #AAAAAA; margin: 0; max-width: 320px; line-height: 1.6; }
        .lg-spinner { animation: lg-spin 1s linear infinite; }

        .lg-pag-bar  { padding: 12px 20px; border-top: 1px solid #F0EDE4; background: #FAFAF7; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .lg-pag-info { font-size: 10px; color: #AAAAAA; font-family: monospace; white-space: nowrap; }
        .lg-pag-btns { display: flex; gap: 6px; }
        .lg-pag-btn  { padding: 5px 12px; font-size: 11px; font-weight: 500; border-radius: 7px; background: #FFFFFF; border: 1.5px solid #E5E2D8; color: #888880; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: 0.15s; font-family: monospace; }
        .lg-pag-btn:hover:not(:disabled) { background: rgba(240,165,0,0.07); border-color: rgba(240,165,0,0.25); color: #C87A00; }
        .lg-pag-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>

      <div className="lg-root" style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div className="lg-inner">

          <p className="lg-eyebrow">// Notification Audit Trail</p>
          <h1 className="lg-page-title">
            <span className="lg-title-icon"><BellRing size={18} /></span>
            Log Notifikasi Peringatan
          </h1>
          <p className="lg-page-desc">
            Jejak audit pengiriman email otomatis sistem peringatan batas kedaluwarsa alat berat.
          </p>
          <div className="lg-divider" />

          {errorMsg && (
            <div className="lg-error-bar">
              <XCircle size={15} style={{ flexShrink: 0 }} /> {errorMsg}
            </div>
          )}

          <div className="lg-card">
            {/* Toolbar */}
            <div className="lg-toolbar">
              <div className="lg-search-wrap">
                <Search size={14} className="lg-search-icon" />
                <input
                  type="text"
                  placeholder="Cari perusahaan atau nama alat..."
                  className="lg-search-input"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <span className="lg-log-count">
                Total: <strong>{filteredLogs.length}</strong> log
                {searchText && logs.length !== filteredLogs.length && (
                  <span style={{ color: "#CCCCCC" }}> dari {logs.length}</span>
                )}
              </span>
            </div>

            {/* Tabel */}
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
                    <tr><td colSpan={4}>
                      <div className="lg-empty">
                        <Loader2 size={28} className="lg-spinner" style={{ color: "#F0A500", marginBottom: 12 }} />
                        <p className="lg-empty-desc">Memuat riwayat notifikasi...</p>
                      </div>
                    </td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan={4}>
                      <div className="lg-empty">
                        <div className="lg-empty-icon"><Send size={26} /></div>
                        <p className="lg-empty-title">
                          {searchText ? "Tidak ada hasil pencarian" : "Belum ada aktivitas email"}
                        </p>
                        <p className="lg-empty-desc">
                          {searchText
                            ? `Tidak ditemukan log yang cocok dengan "${searchText}".`
                            : "Sistem belum pernah mengirimkan peringatan kedaluwarsa apa pun."}
                        </p>
                      </div>
                    </td></tr>
                  ) : paginatedLogs.map((log) => {
                    const ui   = getStatusUI(log.status);
                    const Icon = ui.icon;
                    return (
                      <tr key={log.id}>
                        <td>
                          <span className={`lg-badge ${ui.variant}`}>
                            <Icon size={11} /> {ui.label}
                          </span>
                          {log.errorMessage && (
                            <p className="lg-error-msg" title={log.errorMessage}>
                              {log.errorMessage}
                            </p>
                          )}
                        </td>
                        <td>
                          {userRole === "SUPERADMIN" && (
                            <p className="lg-company-name">
                              <Building2 size={13} style={{ color: "#CCCCCC", flexShrink: 0 }} />
                              {log.company.name}
                            </p>
                          )}
                          <p className="lg-email">{log.company.emailPic}</p>
                        </td>
                        <td>
                          <p className="lg-eq-name">{log.equipment.name}</p>
                          <p className="lg-eq-expiry">
                            Habis: {new Date(log.equipment.expiryDate).toLocaleDateString("id-ID")}
                          </p>
                        </td>
                        <td>
                          <p className="lg-sent-date">
                            {log.sentAt
                              ? new Date(log.sentAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </p>
                          <p className="lg-sent-time">
                            {log.sentAt
                              ? new Date(log.sentAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                              : "Menunggu antrean"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination — selalu tampil kalau ada data */}
            {!isLoading && filteredLogs.length > 0 && (
              <div className="lg-pag-bar">
                <span className="lg-pag-info">
                  {`${(currentPage - 1) * LOGS_PER_PAGE + 1}–${Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} / ${filteredLogs.length} log`}
                </span>
                <div className="lg-pag-btns">
                  <button
                    className="lg-pag-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft size={12} /> Prev
                  </button>
                  <button
                    className="lg-pag-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}