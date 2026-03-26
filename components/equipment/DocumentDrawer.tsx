"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, FolderOpen, AlertTriangle, ShieldCheck, Clock, FileUp, Loader2 } from "lucide-react";
import DocumentTimeline from "./DocumentTimeline";
import LaporanSection from "./LaporanSection";

// ============================================================
// TIPE DATA
// ============================================================
interface Suket {
  id: string;
  period: string;
  fileUrl: string;
  createdAt: string;
}

interface Laporan {
  id: string;
  period: string;
  fileUrl: string;
  createdAt?: string;
}

interface Equipment {
  id: string;
  name: string;
  permitNumber: string;
  serialNumber: string;
  location: string | null;
  inspectionDate: string;
  expiryDate: string;
  isProsesDinas?: boolean;
  suket?: Suket[];
  laporan?: Laporan[];
}

interface DocumentDrawerProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: string | null;
  onDocumentSaved?: () => void;
}

// ============================================================
// LOADING OVERLAY — hanya nutup area drawer
// ============================================================
function ProcessingOverlay({ isVisible }: { isVisible: boolean }) {
  const [loadingText, setLoadingText] = useState("Menyiapkan dokumen...");

  useEffect(() => {
    if (isVisible) {
      const texts = [
        "Sedang mengunggah berkas...",
        "Menghubungkan ke server...",
        "Menyimpan informasi periode...",
        "Sinkronisasi data alat...",
      ];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingText(texts[i % texts.length]);
        i++;
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10,          // <-- absolute, bukan fixed
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(5px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "drawerFadeIn 0.3s ease-out",
      borderRadius: "inherit",
    }}>
      <div style={{ position: "relative", width: 120, height: 120, marginBottom: 32 }}>
        <svg style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} width="120" height="120">
          <circle cx="60" cy="60" r="54" fill="transparent" stroke="#E5E2D8" strokeWidth="4" />
          <circle className="loading-circle" cx="60" cy="60" r="54" fill="transparent" stroke="#F0A500" strokeWidth="4" strokeLinecap="round" strokeDasharray="339" strokeDashoffset="339" />
        </svg>
        <div style={{
          position: "absolute", inset: 15,
          background: "linear-gradient(135deg, #F0A500, #C87A00)",
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#FFFFFF", boxShadow: "0 10px 20px rgba(240, 165, 0, 0.3)"
        }}>
          <FileUp size={32} className="float-anim" />
        </div>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", margin: "0 0 8px 0" }}>Memproses Dokumen</h2>
      <p style={{ fontSize: 14, color: "#1A1A1A", opacity: 0.7, margin: 0, textAlign: "center" }}>{loadingText}</p>
    </div>
  );
}

// ============================================================
// PREVIEW MODAL
// ============================================================
function PreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  const getPreviewUrl = (u: string) => {
    if (u.includes("drive.google.com") || u.includes("docs.google.com")) {
      const match = u.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return u;
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div style={{
        background: "#1A1A1A", border: "1.5px solid #333", borderRadius: 16,
        width: "100%", maxWidth: 880, height: "82vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid #2A2A2A",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: "#1A1A1A", fontFamily: "monospace" }}>Preview Dokumen</span>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer"
              style={{
                fontSize: 11, padding: "5px 12px", borderRadius: 7,
                background: "rgba(240,165,0,0.12)", color: "#F0A500",
                border: "1px solid rgba(240,165,0,0.25)", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 5, fontWeight: 500,
                fontFamily: "inherit",
              }}>Buka di Tab Baru</a>
            <button onClick={onClose}
              style={{
                padding: "5px 10px", borderRadius: 7, background: "#2A2A2A",
                border: "1px solid #3A3A3A", color: "#1A1A1A", cursor: "pointer", display: "flex", alignItems: "center",
              }}><X size={14} /></button>
          </div>
        </div>
        <iframe src={getPreviewUrl(url)} style={{ flex: 1, border: "none", background: "#111" }} title="Preview" />
      </div>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================
function StatusBadge({ expiryDate }: { expiryDate: string }) {
  const diffDays = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0;
  const isWarning = !isExpired && diffDays <= 60;
  const color  = isExpired ? "#DC3C3C" : isWarning ? "#C87A00" : "#22A064";
  const bg     = isExpired ? "rgba(220,60,60,0.07)"  : isWarning ? "rgba(240,165,0,0.08)"  : "rgba(34,160,100,0.07)";
  const border = isExpired ? "rgba(220,60,60,0.18)"  : isWarning ? "rgba(240,165,0,0.2)"   : "rgba(34,160,100,0.18)";
  const label  = isExpired ? "Kedaluwarsa" : isWarning ? "Warning" : "Aman";
  const Icon   = isExpired || isWarning ? AlertTriangle : ShieldCheck;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 10, fontWeight: 500, padding: "3px 9px",
      borderRadius: 999, border: `1px solid ${border}`,
      background: bg, color, textTransform: "uppercase", letterSpacing: "0.06em",
    }}><Icon size={10} />{label} ({isExpired ? `Lewat ${Math.abs(diffDays)}hr` : `${diffDays}hr`})</span>
  );
}

// ============================================================
// DOCUMENT DRAWER UTAMA
// ============================================================
export default function DocumentDrawer({
  equipment, isOpen, onClose, userRole, onDocumentSaved,
}: DocumentDrawerProps) {
  const [previewUrl, setPreviewUrl]               = useState<string | null>(null);
  const [isSubmittingSuket, setIsSubmittingSuket] = useState(false);
  const [isDeletingSuketId, setIsDeletingSuketId] = useState<string | null>(null);
  const [isSubmittingLaporan, setIsSubmittingLaporan] = useState(false);
  const [isDeletingLaporanId, setIsDeletingLaporanId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg]               = useState<string | null>(null);
  const [isTogglingDinas, setIsTogglingDinas]     = useState(false);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const isProcessing = isSubmittingSuket || isSubmittingLaporan;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isProcessing && !isDeletingSuketId && !isDeletingLaporanId) onClose();
  };

  const handleUploadSuket = async (data: { mode: "link" | "upload"; url?: string; file?: File; period?: string; }) => {
    if (!equipment) return;
    if (!data.period?.trim()) return alert("Periode suket wajib diisi.");
    setIsSubmittingSuket(true);
    try {
      let finalUrl = data.url || "";
      if (data.mode === "upload" && data.file) {
        const form = new FormData();
        form.append("file", data.file);
        const res  = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal upload file.");
        finalUrl = json.url;
      }
      const res  = await fetch(`/api/equipments/${equipment.id}/suket`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: data.period, fileUrl: finalUrl }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan suket.");
      setSuccessMsg("Suket berhasil disimpan.");
      onDocumentSaved?.();
    } catch (err: any) { alert(err.message); } finally { setIsSubmittingSuket(false); }
  };

  const handleDeleteSuket = async (suketId: string) => {
    if (!equipment) return;
    if (!window.confirm("Yakin ingin menghapus dokumen suket ini?")) return;
    setIsDeletingSuketId(suketId);
    try {
      const res = await fetch(`/api/equipments/${equipment.id}/suket?suketId=${suketId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus suket.");
      setSuccessMsg("Suket berhasil dihapus.");
      onDocumentSaved?.();
    } catch (err: any) { alert(err.message); } finally { setIsDeletingSuketId(null); }
  };

  const handleUploadLaporan = async (data: { mode: "link" | "upload"; url?: string; file?: File; period?: string; }) => {
    if (!equipment) return;
    if (!data.period?.trim()) return alert("Periode laporan wajib diisi.");
    setIsSubmittingLaporan(true);
    try {
      let finalUrl = data.url || "";
      if (data.mode === "upload" && data.file) {
        const form = new FormData();
        form.append("file", data.file);
        const res  = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal upload file.");
        finalUrl = json.url;
      }
      const res  = await fetch(`/api/equipments/${equipment.id}/laporan`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: data.period, fileUrl: finalUrl }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan laporan.");
      setSuccessMsg("Laporan berhasil disimpan.");
      onDocumentSaved?.();
    } catch (err: any) { alert(err.message); } finally { setIsSubmittingLaporan(false); }
  };

  const handleDeleteLaporan = async (laporanId: string) => {
    if (!equipment) return;
    if (!window.confirm("Yakin ingin menghapus laporan ini?")) return;
    setIsDeletingLaporanId(laporanId);
    try {
      const res = await fetch(`/api/equipments/${equipment.id}/laporan?laporanId=${laporanId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus laporan.");
      setSuccessMsg("Laporan berhasil dihapus.");
      onDocumentSaved?.();
    } catch (err: any) { alert(err.message); } finally { setIsDeletingLaporanId(null); }
  }; = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!equipment) return;
    const newVal = e.target.checked;
    setIsTogglingDinas(true);
    try {
      const res = await fetch(`/api/equipments/${equipment.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isProsesDinas: newVal })
      });
      if (!res.ok) throw new Error("Gagal update status proses dinas");
      setSuccessMsg(`Proses Dinas ${newVal ? "Aktif" : "Nonaktif"}.`);
      onDocumentSaved?.();
    } catch (error: any) { alert(error.message); } finally { setIsTogglingDinas(false); }
  };

  if (!isOpen || !equipment) return null;
  const suketList   = equipment.suket   ?? [];
  const laporanList = equipment.laporan ?? [];
  const hasDocs     = suketList.length > 0 || laporanList.length > 0;

  return (
    <>
      {/* Backdrop — tetap full screen */}
      <div
        onClick={handleOverlayClick}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)",
          animation: "drawerFadeIn 0.2s ease",
        }}
      />

      {/* Drawer — position: relative supaya overlay absolute terkurung di sini */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "100%", maxWidth: 480,
        background: "#FFFFFF", borderLeft: "1.5px solid #EAE7DF",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.1)",
        animation: "drawerSlideIn 0.25s cubic-bezier(0.32,0.72,0,1)",
        // ↓ Dua baris ini yang bikin overlay terkurung di dalam drawer
        position: "fixed" as any,
        overflow: "hidden",
      }}>

        {/* Loading overlay — sekarang absolute, cuma nutup area drawer */}
        <ProcessingOverlay isVisible={isProcessing} />

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0EDE4", background: "#FAFAF7", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: hasDocs ? "rgba(34,160,100,0.08)" : "rgba(240,165,0,0.08)",
                border: `1.5px solid ${hasDocs ? "rgba(34,160,100,0.2)" : "rgba(240,165,0,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: hasDocs ? "#22A064" : "#C87A00",
              }}><FolderOpen size={18} /></div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>Kelola Dokumen</p>
                <p style={{ fontSize: 11, color: "#1A1A1A", margin: "3px 0 0", fontFamily: "monospace" }}>{equipment.permitNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: 8, borderRadius: 8, flexShrink: 0,
                background: "#F5F3EE", border: "1.5px solid #E5E2D8",
                color: "#1A1A1A", cursor: "pointer", display: "flex", alignItems: "center", transition: "0.15s",
              }}
            ><X size={16} /></button>
          </div>

          <div style={{ marginTop: 14, padding: "12px 16px", background: "#FFFFFF", border: "1.5px solid #EAE7DF", borderRadius: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{equipment.name}</span>
              <StatusBadge expiryDate={equipment.expiryDate} />
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontSize: 11, color: "#1A1A1A", fontFamily: "monospace" }}>Lokasi: {equipment.location || "N/A"}</span>
              <span style={{ fontSize: 11, color: "#1A1A1A", fontFamily: "monospace" }}>Habis: {new Date(equipment.expiryDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>

            {userRole === "SUPERADMIN" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed #EAE7DF", marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={14} color="#3B82F6" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>Status Proses Dinas</span>
                </div>
                <label style={{ display: "flex", alignItems: "center", cursor: isTogglingDinas ? "wait" : "pointer", position: "relative" }}>
                  <input
                    type="checkbox"
                    checked={equipment.isProsesDinas || false}
                    onChange={handleToggleProsesDinas}
                    disabled={isTogglingDinas}
                    style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                  />
                  <div style={{ width: 40, height: 22, borderRadius: 20, background: equipment.isProsesDinas ? "#3B82F6" : "#E5E2D8", transition: "0.3s", position: "relative", opacity: isTogglingDinas ? 0.6 : 1 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FFF", position: "absolute", top: 2, left: equipment.isProsesDinas ? 20 : 2, transition: "0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }} />
                  </div>
                </label>
              </div>
            )}
          </div>

          {successMsg && (
            <div style={{ marginTop: 10, padding: "9px 14px", borderRadius: 9, background: "rgba(34,160,100,0.07)", border: "1px solid rgba(34,160,100,0.2)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#22A064", fontWeight: 500, animation: "drawerFadeIn 0.2s ease" }}>
              <ShieldCheck size={13} /> {successMsg}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 28 }}>
          <DocumentTimeline
            suketList={suketList}
            userRole={userRole}
            isSubmitting={isSubmittingSuket}
            isDeletingId={isDeletingSuketId}
            onUpload={handleUploadSuket}
            onPreview={setPreviewUrl}
            onDelete={handleDeleteSuket}
          />
          <div style={{ height: 1, background: "linear-gradient(90deg, #F0A500 0%, transparent 60%)", opacity: 0.15 }} />
          <LaporanSection
            laporanList={laporanList}
            userRole={userRole}
            isSubmitting={isSubmittingLaporan}
            isDeletingId={isDeletingLaporanId}
            onUpload={handleUploadLaporan}
            onPreview={setPreviewUrl}
            onDelete={handleDeleteLaporan}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid #F0EDE4", background: "#FAFAF7", flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: "#1A1A1A", margin: 0, fontFamily: "monospace", textAlign: "center" }}>
            {userRole === "SUPERADMIN" ? "SUPERADMIN · Akses penuh" : "USER · Hanya melihat & unduh"}
          </p>
        </div>
      </div>

      {previewUrl && <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}

      <style>{`
        @keyframes drawerFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes drawerSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes progress { 0% { stroke-dashoffset: 339; } 50% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
        @keyframes floating { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .loading-circle { animation: progress 3s ease-in-out infinite; }
        .float-anim { animation: floating 2s ease-in-out infinite; }
      `}</style>
    </>
  );
}