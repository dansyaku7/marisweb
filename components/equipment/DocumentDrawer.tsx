"use client";

import React, { useEffect, useState } from "react";
import { X, FolderOpen, AlertTriangle, ShieldCheck, Clock, FileUp, Link as LinkIcon, Trash2, Loader2 } from "lucide-react";
import DocumentTimeline from "./DocumentTimeline";
import LaporanSection from "./LaporanSection";
import UploadForm from "./UploadForm";

// ============================================================
// TIPE DATA
// ============================================================
interface Suket {
  id: string;
  period: string;
  fileUrl: string;
  documentType?: "link" | "upload";
  createdAt: string;
}

interface Laporan {
  id: string;
  period: string;
  fileUrl: string;
  documentType?: "link" | "upload";
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
// HELPER: Cek apakah dokumen ini Link atau File
// ============================================================
const isCloudLink = (url: string, type?: string) => {
  // FIX: Pastikan cek type dari DB pakai toUpperCase biar sinkron dengan enum Prisma
  if (type) return type.toUpperCase() === "LINK";
  const u = url ? url.toLowerCase() : "";
  return u.includes("drive.google.com") || u.includes("docs.google.com") || u.includes("dropbox.com") || u.includes("sharepoint");
};

// ============================================================
// LOADING OVERLAY
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
      position: "absolute", inset: 0, zIndex: 10,
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
          <span style={{ fontSize: 12, color: "#FFFFFF", fontFamily: "monospace" }}>Preview Dokumen</span>
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
                border: "1px solid #3A3A3A", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center",
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
  
  // State untuk form input Link di Section 3
  const [activeLinkForm, setActiveLinkForm]       = useState<"suket" | "laporan" | null>(null);

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
        body: JSON.stringify({ 
          period: data.period, 
          fileUrl: finalUrl,
          documentType: data.mode 
        }),
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
        body: JSON.stringify({ 
          period: data.period, 
          fileUrl: finalUrl,
          documentType: data.mode 
        }),
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
  };

  const handleToggleProsesDinas = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  
  // STRATEGI: Pisahkan data menjadi File vs Link
  const suketUploads   = suketList.filter(s => !isCloudLink(s.fileUrl, s.documentType));
  const laporanUploads = laporanList.filter(l => !isCloudLink(l.fileUrl, l.documentType));

  // Gabungkan semua yang berupa link untuk dirender di Section 3
  const combinedLinks = [
    ...suketList.filter(s => isCloudLink(s.fileUrl, s.documentType)).map(s => ({
      ...s, docTypeLabel: "Suket", isDeleting: isDeletingSuketId === s.id, onDelete: () => handleDeleteSuket(s.id)
    })),
    ...laporanList.filter(l => isCloudLink(l.fileUrl, l.documentType)).map(l => ({
      ...l, docTypeLabel: "Laporan", isDeleting: isDeletingLaporanId === l.id, onDelete: () => handleDeleteLaporan(l.id)
    }))
  ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <>
      <div
        onClick={handleOverlayClick}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)",
          animation: "drawerFadeIn 0.2s ease",
        }}
      />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "100%", maxWidth: 480,
        background: "#FFFFFF", borderLeft: "1.5px solid #EAE7DF",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.1)",
        animation: "drawerSlideIn 0.25s cubic-bezier(0.32,0.72,0,1)",
        overflow: "hidden",
      }}>

        <ProcessingOverlay isVisible={isProcessing} />

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0EDE4", background: "#FAFAF7", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: "rgba(240,165,0,0.08)", border: "1.5px solid rgba(240,165,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#C87A00",
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

        {/* Content Area - DIBAGI 3 (Sesuai Kebutuhan) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 36 }}>
          
          {/* ── 1. SURAT KETERANGAN (KHUSUS FILE) ── */}
          <DocumentTimeline
            suketList={suketUploads}
            title="1. Surat Keterangan"
            emptyText="Belum ada file suket yang diupload."
            buttonText="Upload File Suket"
            forcedMode="upload"
            userRole={userRole}
            isSubmitting={isSubmittingSuket}
            isDeletingId={isDeletingSuketId}
            onUpload={handleUploadSuket}
            onPreview={setPreviewUrl}
            onDelete={handleDeleteSuket}
          />
          
          {/* ── 2. LAPORAN TAHUNAN (KHUSUS FILE) ── */}
          <LaporanSection
            laporanList={laporanUploads}
            title="2. Laporan Tahunan"
            emptyText="Belum ada file laporan yang diupload."
            buttonText="Upload File Laporan"
            forcedMode="upload"
            userRole={userRole}
            isSubmitting={isSubmittingLaporan}
            isDeletingId={isDeletingLaporanId}
            onUpload={handleUploadLaporan}
            onPreview={setPreviewUrl}
            onDelete={handleDeleteLaporan}
          />

          <div style={{ height: 1.5, background: "linear-gradient(90deg, #EAE7DF 0%, transparent 80%)", opacity: 0.6 }} />

          {/* ── 3. LINK GOOGLE DRIVE (GABUNGAN SUKET & LAPORAN) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, background: "rgba(59,130,246,0.08)", border: "1.5px solid rgba(59,130,246,0.18)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }}>
                  <LinkIcon size={14} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#555550" }}>
                  3. Link Google Drive
                </span>
              </div>

              {userRole === "SUPERADMIN" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setActiveLinkForm(activeLinkForm === 'suket' ? null : 'suket')} style={{ fontSize: 10, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: activeLinkForm === 'suket' ? "rgba(59,130,246,0.1)" : "#F5F3EE", border: `1px solid ${activeLinkForm === 'suket' ? "rgba(59,130,246,0.3)" : "#E5E2D8"}`, color: activeLinkForm === 'suket' ? "#3B82F6" : "#888880", cursor: "pointer", transition: "0.15s" }}>
                    + Link Suket
                  </button>
                  <button onClick={() => setActiveLinkForm(activeLinkForm === 'laporan' ? null : 'laporan')} style={{ fontSize: 10, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: activeLinkForm === 'laporan' ? "rgba(59,130,246,0.1)" : "#F5F3EE", border: `1px solid ${activeLinkForm === 'laporan' ? "rgba(59,130,246,0.3)" : "#E5E2D8"}`, color: activeLinkForm === 'laporan' ? "#3B82F6" : "#888880", cursor: "pointer", transition: "0.15s" }}>
                    + Link Laporan
                  </button>
                </div>
              )}
            </div>

            {/* Form Input Link Muncul Saat Tombol Diklik */}
            {activeLinkForm && userRole === "SUPERADMIN" && (
              <UploadForm
                label={`Tambah Link ${activeLinkForm === 'suket' ? 'Suket' : 'Laporan'}`}
                showPeriod
                periodPlaceholder={`Periode ${activeLinkForm} (cth: 2025-2026)`}
                forcedMode="link"
                isSubmitting={activeLinkForm === 'suket' ? isSubmittingSuket : isSubmittingLaporan}
                onSubmit={(data) => {
                  if (activeLinkForm === 'suket') handleUploadSuket(data);
                  else handleUploadLaporan(data);
                  setActiveLinkForm(null); // Tutup form abis submit
                }}
              />
            )}

            {/* List Tampilan URL Mentah Sesuai Request */}
            {combinedLinks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 16px", background: "#FAFAF7", border: "1.5px dashed #E5E2D8", borderRadius: 10, color: "#AAAAAA", fontSize: 12 }}>
                Belum ada link yang ditambahkan.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {combinedLinks.map(link => (
                  <div key={link.id} style={{ background: link.isDeleting ? "rgba(220,60,60,0.03)" : "#FAFAF7", border: link.isDeleting ? "1.5px solid rgba(220,60,60,0.2)" : "1.5px solid #EAE7DF", borderRadius: 10, padding: "12px", opacity: link.isDeleting ? 0.6 : 1, transition: "0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>
                        {link.docTypeLabel} <span style={{ color: "#888880", fontWeight: 500 }}>• Periode {link.period}</span>
                      </span>
                      {userRole === "SUPERADMIN" && (
                        <button onClick={link.onDelete} disabled={link.isDeleting} style={{ background: "transparent", border: "none", color: "#DC3C3C", cursor: link.isDeleting ? "wait" : "pointer", padding: 4 }} title="Hapus Link">
                          {link.isDeleting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                    {/* Render URL langsung sebagai text yang bisa diklik */}
                    <a href={link.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#3B82F6", wordBreak: "break-all", textDecoration: "underline", lineHeight: 1.4, display: "block" }}>
                      {link.fileUrl}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

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