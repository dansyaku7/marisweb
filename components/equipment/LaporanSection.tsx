"use client";

import React, { useState } from "react";
import {
  FileText, Download, Eye, RefreshCw, Plus, AlertCircle
} from "lucide-react";
import UploadForm from "./UploadForm";

interface Laporan {
  id: string;
  period: string;
  fileUrl: string;
  createdAt?: string;
}

interface LaporanSectionProps {
  laporanList: Laporan[];
  userRole: string | null;
  isSubmitting: boolean;
  /** Upload laporan baru atau replace yang sudah ada (sama periode) */
  onUpload: (data: { mode: "link" | "upload"; url?: string; file?: File; period?: string }) => void;
  onPreview: (url: string) => void;
}

export default function LaporanSection({
  laporanList,
  userRole,
  isSubmitting,
  onUpload,
  onPreview,
}: LaporanSectionProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  // Sort terbaru di atas
  const sorted = [...laporanList].sort((a, b) => {
    if (a.period > b.period) return -1;
    if (a.period < b.period) return 1;
    return 0;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28,
            background: "rgba(34,160,100,0.08)",
            border: "1.5px solid rgba(34,160,100,0.18)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#22A064",
          }}>
            <FileText size={14} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#555550" }}>
            Laporan Tahunan
          </span>
        </div>

        {userRole === "SUPERADMIN" && (
          <button
            onClick={() => { setShowUploadForm((v) => !v); setReplacingId(null); }}
            style={{
              fontSize: 11, fontWeight: 500,
              padding: "5px 11px", borderRadius: 7,
              background: showUploadForm ? "rgba(34,160,100,0.08)" : "#F5F3EE",
              border: `1.5px solid ${showUploadForm ? "rgba(34,160,100,0.25)" : "#E5E2D8"}`,
              color: showUploadForm ? "#22A064" : "#888880",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              fontFamily: "inherit", transition: "0.15s",
            }}
          >
            <Plus size={11} />
            Tambah Laporan
          </button>
        )}
      </div>

      {/* ── Form tambah laporan baru ── */}
      {showUploadForm && userRole === "SUPERADMIN" && (
        <div>
          {/* Info replace logic */}
          <div style={{
            display: "flex", gap: 8, alignItems: "flex-start",
            padding: "10px 12px", borderRadius: 9, marginBottom: 10,
            background: "rgba(240,165,0,0.05)", border: "1px solid rgba(240,165,0,0.15)",
          }}>
            <AlertCircle size={13} style={{ color: "#C87A00", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: "#C87A00", margin: 0, lineHeight: 1.5 }}>
              Jika periode sudah ada, laporan lama akan otomatis <strong>digantikan</strong> dengan yang baru.
            </p>
          </div>
          <UploadForm
            label="Upload Laporan Tahunan"
            showPeriod
            periodPlaceholder="Periode laporan (cth: 2025-2026)"
            isSubmitting={isSubmitting}
            onSubmit={(data) => {
              onUpload(data);
              setShowUploadForm(false);
            }}
          />
        </div>
      )}

      {/* ── Empty state ── */}
      {laporanList.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "24px 16px",
          background: "#FAFAF7", border: "1.5px dashed #E5E2D8",
          borderRadius: 12, color: "#AAAAAA", fontSize: 12,
        }}>
          Belum ada laporan tahunan.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((lap) => (
            <div key={lap.id}>
              {/* ── Laporan card ── */}
              <div style={{
                background: "#FAFAF7",
                border: replacingId === lap.id
                  ? "1.5px solid rgba(240,165,0,0.25)"
                  : "1.5px solid #EAE7DF",
                borderRadius: 10, padding: "12px 14px",
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 8,
                transition: "border-color 0.2s",
              }}>
                {/* Info */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: "rgba(34,160,100,0.07)",
                    border: "1.5px solid rgba(34,160,100,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <FileText size={14} color="#22A064" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>
                      Laporan {lap.period}
                    </p>
                    {lap.createdAt && (
                      <p style={{ fontSize: 10, color: "#BBBBBB", margin: "2px 0 0", fontFamily: "monospace" }}>
                        {new Date(lap.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Aksi */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                  <ActionBtn
                    onClick={() => onPreview(lap.fileUrl)}
                    icon={<Eye size={12} />}
                    label="Preview"
                  />
                  <ActionBtn
                    href={lap.fileUrl}
                    icon={<Download size={12} />}
                    label="Unduh"
                  />
                  {/* Tombol replace hanya admin */}
                  {userRole === "SUPERADMIN" && (
                    <button
                      onClick={() => {
                        setReplacingId(replacingId === lap.id ? null : lap.id);
                        setShowUploadForm(false);
                      }}
                      style={{
                        fontSize: 11, fontWeight: 500,
                        padding: "4px 10px", borderRadius: 7,
                        background: replacingId === lap.id
                          ? "rgba(240,165,0,0.08)"
                          : "#F5F3EE",
                        border: `1.5px solid ${replacingId === lap.id
                          ? "rgba(240,165,0,0.25)"
                          : "#E5E2D8"}`,
                        color: replacingId === lap.id ? "#C87A00" : "#888880",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5,
                        fontFamily: "inherit", transition: "0.15s",
                      }}
                    >
                      <RefreshCw size={11} />
                      Replace
                    </button>
                  )}
                </div>
              </div>

              {/* ── Form replace (inline, muncul di bawah card) ── */}
              {replacingId === lap.id && userRole === "SUPERADMIN" && (
                <div style={{ marginTop: 8, paddingLeft: 8 }}>
                  <UploadForm
                    label={`Replace Laporan ${lap.period}`}
                    showPeriod={false}
                    isSubmitting={isSubmitting}
                    onSubmit={(data) => {
                      // Kirim dengan periode yang sama supaya backend bisa replace
                      onUpload({ ...data, period: lap.period });
                      setReplacingId(null);
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared action button ──
function ActionBtn({
  onClick, href, icon, label,
}: {
  onClick?: () => void;
  href?: string;
  icon: React.ReactNode;
  label: string;
}) {
  const base: React.CSSProperties = {
    fontSize: 11, fontWeight: 500,
    padding: "4px 10px", borderRadius: 7,
    background: "#F5F3EE", border: "1.5px solid #E5E2D8",
    color: "#888880", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 5,
    fontFamily: "inherit", textDecoration: "none",
    transition: "0.15s",
  };

  const hover = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.background = "rgba(34,160,100,0.07)";
    (e.currentTarget as HTMLElement).style.color = "#22A064";
    (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,160,100,0.2)";
  };
  const leave = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.background = "#F5F3EE";
    (e.currentTarget as HTMLElement).style.color = "#888880";
    (e.currentTarget as HTMLElement).style.borderColor = "#E5E2D8";
  };

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={base}
        onMouseEnter={hover} onMouseLeave={leave}>
        {icon} {label}
      </a>
    );
  }
  return (
    <button onClick={onClick} style={base} onMouseEnter={hover} onMouseLeave={leave}>
      {icon} {label}
    </button>
  );
}