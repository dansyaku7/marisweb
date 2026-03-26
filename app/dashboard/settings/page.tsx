"use client";

import React, { useEffect, useState } from "react";
import {
  Settings, Mail, Globe, Building2,
  Loader2, AlertTriangle, ShieldCheck, FileCheck, MailWarning
} from "lucide-react";
import EmailTemplateEditor from "@/components/settings/EmailTemplateEditor";

interface Company { id: string; name: string; }

// Tipe Template yang didukung sistem sekarang
type TemplateType = "EXPIRED_SINGLE" | "EXPIRED_BULK" | "READY_SINGLE" | "READY_BULK";

export default function SettingsPage() {
  const [userRole, setUserRole]     = useState<string | null>(null);
  const [companies, setCompanies]   = useState<Company[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  
  // Kita ganti Tab-nya jadi lebih spesifik ke fungsinya
  const [activeTab, setActiveTab]   = useState<"EXPIRED" | "READY">("EXPIRED");

  useEffect(() => {
    const stored = localStorage.getItem("userProfile");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    setUserRole(parsed.role);
    if (parsed.role === "SUPERADMIN") fetchCompanies();
    else setIsLoading(false);
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      if (res.ok) setCompanies(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // ── Guard: bukan SUPERADMIN ──
  if (!isLoading && userRole !== "SUPERADMIN") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#FAFAF8",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "rgba(220,60,60,0.07)", border: "1.5px solid rgba(220,60,60,0.18)",
            display: "flex", alignItems: "center", justify_content: "center",
            margin: "0 auto 16px", color: "#DC3C3C",
          }}>
            <AlertTriangle size={24} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", margin: "0 0 6px" }}>Akses Ditolak</p>
          <p style={{ fontSize: 13, color: "#1A1A1A", margin: 0 }}>Halaman ini hanya untuk Administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .st-root * { box-sizing: border-box; }
        .st-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @keyframes st-fadeup { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes st-spin   { to { transform: rotate(360deg); } }

        .st-inner { padding:28px 20px; max-width:960px; margin:0 auto; animation: st-fadeup 0.4s ease both; }
        @media (min-width:768px)  { .st-inner { padding:40px 32px; } }
        @media (min-width:1024px) { .st-inner { padding:48px 48px; } }

        .st-eyebrow    { font-size:10px; font-weight:500; color:#C87A00; text-transform:uppercase; letter-spacing:0.14em; margin-bottom:8px; }
        .st-page-title { font-size:clamp(20px,3.5vw,26px); font-weight:700; color:#1A1A1A; margin:0 0 6px; line-height:1.15; display:flex; align-items:center; gap:12px; }
        .st-title-icon { width:36px; height:36px; background:rgba(240,165,0,0.08); border:1.5px solid rgba(240,165,0,0.18); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#C87A00; flex-shrink:0; }
        .st-page-desc  { font-size:13px; color:#1A1A1A; margin:0; } /* UBAH KE ITEM */
        .st-divider    { height:1px; background:linear-gradient(90deg,#F0A500 0%,transparent 60%); margin:24px 0 28px; opacity:0.2; }

        .st-section       { background:#FFFFFF; border:1.5px solid #E8E4DC; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.05); margin-bottom:24px; }
        .st-section-header{ padding:16px 20px; background:#FAFAF7; border-bottom:1px solid #F0EDE4; display:flex; align-items:center; gap:10px; }
        .st-section-icon  { width:30px; height:30px; background:rgba(240,165,0,0.08); border:1.5px solid rgba(240,165,0,0.18); border-radius:8px; display:flex; align-items:center; justify-content:center; color:#C87A00; flex-shrink:0; }
        .st-section-title { font-size:13px; font-weight:600; color:#1A1A1A; } /* UBAH KE ITEM */
        .st-section-desc  { font-size:11px; color:#1A1A1A; margin-top:1px; } /* UBAH KE ITEM */
        .st-section-body  { padding:20px; }

        .st-tab-bar  { display:flex; gap:6px; background:#F5F3EE; padding:5px; border-radius:10px; border:1.5px solid #EAE7DF; margin-bottom:20px; }
        .st-tab-btn  { flex:1; padding:10px; font-size:12px; font-weight:500; border-radius:7px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:0.2s; border:none; background:transparent; color:#1A1A1A; font-family:inherit; } /* UBAH KE ITEM */
        .st-tab-btn.active { background:#FFFFFF; color:#C87A00; border:1.5px solid rgba(240,165,0,0.25); box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        
        .st-grid-editors { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 1280px) { .st-grid-editors { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div className="st-root" style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div className="st-inner">

          {/* ── Page header ── */}
          <p className="st-eyebrow">// Configuration</p>
          <h1 className="st-page-title">
            <span className="st-title-icon"><Settings size={18} /></span>
            Pengaturan Sistem
          </h1>
          <p className="st-page-desc">Konfigurasi template email notifikasi dan preferensi sistem.</p>
          <div className="st-divider" />

          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 10, color: "#1A1A1A" }}> {/* UBAH KE ITEM */}
              <Loader2 size={20} style={{ animation: "st-spin 1s linear infinite", color: "#F0A500" }} />
              <span style={{ fontSize: 13 }}>Memuat data...</span>
            </div>
          ) : (
            <>
              {/* ── TAB PILIHAN URUSAN ── */}
              <div className="st-tab-bar">
                <button 
                  className={`st-tab-btn ${activeTab === "EXPIRED" ? "active" : ""}`}
                  onClick={() => setActiveTab("EXPIRED")}
                >
                  <MailWarning size={13} />
                  Peringatan Expired
                </button>
                <button 
                  className={`st-tab-btn ${activeTab === "READY" ? "active" : ""}`}
                  onClick={() => setActiveTab("READY")}
                >
                  <FileCheck size={13} />
                  Notif Dokumen Ready
                </button>
              </div>

              {/* ── EDITOR TEMPLATE ── */}
              {activeTab === "EXPIRED" ? (
                <div className="st-grid-editors">
                  <EmailTemplateEditor
                    type="EXPIRED_SINGLE"
                    label="Peringatan (Per Alat)"
                    description="Kirim link per alat yang hampir kedaluwarsa."
                    companies={companies}
                  />
                  <EmailTemplateEditor
                    type="EXPIRED_BULK"
                    label="Peringatan (Massal)"
                    description="Kirim ringkasan banyak alat yang kedaluwarsa sekaligus."
                    companies={companies}
                  />
                </div>
              ) : (
                <div className="st-grid-editors">
                  <EmailTemplateEditor
                    type="READY_SINGLE"
                    label="Dokumen Ready (Per Alat)"
                    description="Beritahu klien bahwa Suket/Laporan alat ini sudah siap."
                    companies={companies}
                  />
                  <EmailTemplateEditor
                    type="READY_BULK"
                    label="Dokumen Ready (Massal)"
                    description="Kirim daftar alat yang dokumennya baru saja selesai diupload."
                    companies={companies}
                  />
                </div>
              )}

              {/* ── SECTION: Placeholder Variabel ── */}
              <div className="st-section" style={{ marginTop: 24 }}>
                <div className="st-section-header">
                  <span className="st-section-icon"><Globe size={14} /></span>
                  <p className="st-section-title">Variabel Magic Link</p>
                </div>
                <div className="st-section-body">
                   <p style={{ fontSize: 12, color: "#1A1A1A", marginBottom: 12 }}> {/* UBAH KE ITEM */}
                     Gunakan variabel di bawah ini di dalam template agar link otomatis ter-generate:
                   </p>
                   <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <code>{`{{link_alat}}`}</code>
                      <code>{`{{nama_klien}}`}</code>
                      <code>{`{{nama_alat}}`}</code>
                   </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}