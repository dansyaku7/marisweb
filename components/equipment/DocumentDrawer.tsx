"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, FolderOpen, AlertTriangle, ShieldCheck } from "lucide-react";
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
          <span style={{ fontSize: 12, color: "#888880", fontFamily: "monospace" }}>
            Preview Dokumen
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href={url} target="_blank" rel="noreferrer"
              style={{
                fontSize: 11, padding: "5px 12px", borderRadius: 7,
                background: "rgba(240,165,0,0.12)", color: "#F0A500",
                border: "1px solid rgba(240,165,0,0.25)", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 5, fontWeight: 500,
                fontFamily: "inherit",
              }}
            >
              Buka di Tab Baru
            </a>
            <button
              onClick={onClose}
              style={{
                padding: "5px 10px", borderRadius: 7,
                background: "#2A2A2A", border: "1px solid #3A3A3A",
                color: "#888880", cursor: "pointer", display: "flex", alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <iframe
          src={getPreviewUrl(url)}
          style={{ flex: 1, border: "none", background: "#111" }}
          title="Preview"
        />
      </div>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================
function StatusBadge({ expiryDate }: { expiryDate: string }) {
  const diffDays = Math.ceil(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
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
      background: bg, color,
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      <Icon size={10} />
      {label} ({isExpired ? `Lewat ${Math.abs(diffDays)}hr` : `${diffDays}hr`})
    </span>
  );
}

// ============================================================
// DOCUMENT DRAWER UTAMA
// ============================================================
export default function DocumentDrawer({
  equipment,
  isOpen,
  onClose,
  userRole,
  onDocumentSaved,
}: DocumentDrawerProps) {
  const [previewUrl, setPreviewUrl]               = useState<string | null>(null);
  const [isSubmittingSuket, setIsSubmittingSuket] = useState(false);
  const [isSubmittingLaporan, setIsSubmittingLaporan] = useState(false);
  const [successMsg, setSuccessMsg]               = useState<string | null>(null);

  // Auto-dismiss success message
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmittingSuket && !isSubmittingLaporan) onClose();
  };

  // ── Upload suket baru (append ke history) ──
  const handleUploadSuket = async (data: {
    mode: "link" | "upload"; url?: string; file?: File; period?: string;
  }) => {
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
      if (!finalUrl) throw new Error("URL dokumen tidak boleh kosong.");

      const res  = await fetch(`/api/equipments/${equipment.id}/suket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: data.period, fileUrl: finalUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan suket.");

      setSuccessMsg("Suket berhasil disimpan.");
      onDocumentSaved?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingSuket(false);
    }
  };

  // ── Upload / replace laporan (backend upsert by period) ──
  const handleUploadLaporan = async (data: {
    mode: "link" | "upload"; url?: string; file?: File; period?: string;
  }) => {
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
      if (!finalUrl) throw new Error("URL dokumen tidak boleh kosong.");

      const res  = await fetch(`/api/equipments/${equipment.id}/laporan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: data.period, fileUrl: finalUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan laporan.");

      setSuccessMsg("Laporan berhasil disimpan.");
      onDocumentSaved?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingLaporan(false);
    }
  };

  if (!isOpen || !equipment) return null;

  const suketList   = equipment.suket   ?? [];
  const laporanList = equipment.laporan ?? [];
  const hasDocs     = suketList.length > 0 || laporanList.length > 0;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleOverlayClick}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)",
          animation: "drawerFadeIn 0.2s ease",
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "100%", maxWidth: 480,
        background: "#FFFFFF", borderLeft: "1.5px solid #EAE7DF",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.1)",
        animation: "drawerSlideIn 0.25s cubic-bezier(0.32,0.72,0,1)",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #F0EDE4",
          background: "#FAFAF7", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: hasDocs ? "rgba(34,160,100,0.08)" : "rgba(240,165,0,0.08)",
                border: `1.5px solid ${hasDocs ? "rgba(34,160,100,0.2)" : "rgba(240,165,0,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: hasDocs ? "#22A064" : "#C87A00",
              }}>
                <FolderOpen size={18} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                  Kelola Dokumen
                </p>
                <p style={{ fontSize: 11, color: "#AAAAAA", margin: "3px 0 0", fontFamily: "monospace" }}>
                  {equipment.permitNumber}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                padding: 8, borderRadius: 8, flexShrink: 0,
                background: "#F5F3EE", border: "1.5px solid #E5E2D8",
                color: "#888880", cursor: "pointer",
                display: "flex", alignItems: "center", transition: "0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#EDEAE3";
                (e.currentTarget as HTMLElement).style.color = "#333";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#F5F3EE";
                (e.currentTarget as HTMLElement).style.color = "#888880";
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Info card alat */}
          <div style={{
            marginTop: 14, padding: "10px 14px",
            background: "#FFFFFF", border: "1.5px solid #EAE7DF",
            borderRadius: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
                {equipment.name}
              </span>
              <StatusBadge expiryDate={equipment.expiryDate} />
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontSize: 10, color: "#AAAAAA", fontFamily: "monospace" }}>
                Lokasi: {equipment.location || "N/A"}
              </span>
              <span style={{ fontSize: 10, color: "#AAAAAA", fontFamily: "monospace" }}>
                Habis: {new Date(equipment.expiryDate).toLocaleDateString("id-ID", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Success toast */}
          {successMsg && (
            <div style={{
              marginTop: 10, padding: "9px 14px", borderRadius: 9,
              background: "rgba(34,160,100,0.07)", border: "1px solid rgba(34,160,100,0.2)",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, color: "#22A064", fontWeight: 500,
              animation: "drawerFadeIn 0.2s ease",
            }}>
              <ShieldCheck size={13} /> {successMsg}
            </div>
          )}
        </div>

        {/* ── Body scrollable ── */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: 28,
        }}>
          <DocumentTimeline
            suketList={suketList}
            userRole={userRole}
            isSubmitting={isSubmittingSuket}
            onUpload={handleUploadSuket}
            onPreview={setPreviewUrl}
          />

          <div style={{
            height: 1,
            background: "linear-gradient(90deg, #F0A500 0%, transparent 60%)",
            opacity: 0.15,
          }} />

          <LaporanSection
            laporanList={laporanList}
            userRole={userRole}
            isSubmitting={isSubmittingLaporan}
            onUpload={handleUploadLaporan}
            onPreview={setPreviewUrl}
          />
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "12px 24px",
          borderTop: "1px solid #F0EDE4",
          background: "#FAFAF7", flexShrink: 0,
        }}>
          <p style={{
            fontSize: 10, color: "#CCCCCC", margin: 0,
            fontFamily: "monospace", textAlign: "center",
          }}>
            {userRole === "SUPERADMIN"
              ? "SUPERADMIN · Akses penuh dokumen"
              : "USER · Hanya dapat melihat & mengunduh dokumen"}
          </p>
        </div>
      </div>

      {/* Preview modal */}
      {previewUrl && (
        <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}

      <style>{`
        @keyframes drawerFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes drawerSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}