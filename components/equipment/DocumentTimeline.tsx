"use client";

import React, { useState } from "react";
import {
  CheckCircle2, Clock, Download, Eye, Shield,
  ChevronDown, ChevronUp, Plus
} from "lucide-react";
import UploadForm from "./UploadForm";

interface Suket {
  id: string;
  period: string;
  fileUrl: string;
  createdAt: string;
}

interface DocumentTimelineProps {
  suketList: Suket[];
  userRole: string | null;
  isSubmitting: boolean;
  onUpload: (data: { mode: "link" | "upload"; url?: string; file?: File; period?: string }) => void;
  onPreview: (url: string) => void;
}

export default function DocumentTimeline({
  suketList,
  userRole,
  isSubmitting,
  onUpload,
  onPreview,
}: DocumentTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Yang terbaru = index 0 (aktif), sisanya history
  const sorted = [...suketList].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const active = sorted[0];
  const history = sorted.slice(1);
  const visibleHistory = showAll ? history : history.slice(0, 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Header section ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28,
            background: "rgba(240,165,0,0.08)",
            border: "1.5px solid rgba(240,165,0,0.18)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#C87A00",
          }}>
            <Shield size={14} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#555550" }}>
            Surat Keterangan
          </span>
        </div>

        {/* Tombol upload hanya untuk SUPERADMIN */}
        {userRole === "SUPERADMIN" && (
          <button
            onClick={() => setShowUploadForm((v) => !v)}
            style={{
              fontSize: 11, fontWeight: 500,
              padding: "5px 11px", borderRadius: 7,
              background: showUploadForm ? "rgba(240,165,0,0.08)" : "#F5F3EE",
              border: `1.5px solid ${showUploadForm ? "rgba(240,165,0,0.25)" : "#E5E2D8"}`,
              color: showUploadForm ? "#C87A00" : "#888880",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              fontFamily: "inherit", transition: "0.15s",
            }}
          >
            <Plus size={11} />
            Upload Suket Baru
          </button>
        )}
      </div>

      {/* ── Upload form (toggle) ── */}
      {showUploadForm && userRole === "SUPERADMIN" && (
        <UploadForm
          label="Upload Suket Baru"
          showPeriod
          periodPlaceholder="Periode suket (cth: 2025-2026)"
          isSubmitting={isSubmitting}
          onSubmit={(data) => {
            onUpload(data);
            setShowUploadForm(false);
          }}
        />
      )}

      {/* ── Empty state ── */}
      {suketList.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "24px 16px",
          background: "#FAFAF7", border: "1.5px dashed #E5E2D8",
          borderRadius: 12, color: "#AAAAAA", fontSize: 12,
        }}>
          Belum ada suket yang dilampirkan.
        </div>
      ) : (
        <div style={{ position: "relative" }}>

          {/* Garis timeline vertikal */}
          <div style={{
            position: "absolute", left: 11, top: 24, bottom: 24,
            width: 1.5, background: "linear-gradient(180deg, #F0A500 0%, #E5E2D8 100%)",
            opacity: 0.3,
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

            {/* ── AKTIF (terbaru) ── */}
            {active && (
              <TimelineItem
                suket={active}
                isActive
                onPreview={onPreview}
              />
            )}

            {/* ── HISTORY ── */}
            {visibleHistory.map((s) => (
              <TimelineItem key={s.id} suket={s} isActive={false} onPreview={onPreview} />
            ))}

            {/* Show more / less */}
            {history.length > 2 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                style={{
                  marginLeft: 28, marginTop: 4,
                  fontSize: 11, fontWeight: 500, color: "#C87A00",
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                  fontFamily: "inherit", padding: 0,
                }}
              >
                {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showAll ? "Sembunyikan" : `Lihat ${history.length - 2} suket lainnya`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-komponen item timeline ──
function TimelineItem({
  suket,
  isActive,
  onPreview,
}: {
  suket: Suket;
  isActive: boolean;
  onPreview: (url: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 12, paddingBottom: 12, position: "relative" }}>

      {/* Dot timeline */}
      <div style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 2,
        background: isActive ? "#F0A500" : "#F5F3EE",
        border: `2px solid ${isActive ? "#F0A500" : "#E5E2D8"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isActive ? "0 0 0 4px rgba(240,165,0,0.12)" : "none",
        zIndex: 1,
      }}>
        {isActive
          ? <CheckCircle2 size={11} color="#1A1A1A" />
          : <Clock size={10} color="#BBBBBB" />
        }
      </div>

      {/* Konten */}
      <div style={{
        flex: 1,
        background: isActive ? "rgba(240,165,0,0.04)" : "#FAFAF7",
        border: `1.5px solid ${isActive ? "rgba(240,165,0,0.2)" : "#EAE7DF"}`,
        borderRadius: 10, padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? "#C87A00" : "#555550" }}>
              Periode {suket.period}
            </span>
            {isActive && (
              <span style={{
                fontSize: 9, fontWeight: 600, padding: "2px 7px",
                background: "rgba(240,165,0,0.12)", border: "1px solid rgba(240,165,0,0.25)",
                borderRadius: 999, color: "#C87A00", textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}>
                Aktif
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, color: "#BBBBBB", fontFamily: "monospace" }}>
            {new Date(suket.createdAt).toLocaleDateString("id-ID", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </span>
        </div>

        {/* Aksi */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <ActionBtn onClick={() => onPreview(suket.fileUrl)} icon={<Eye size={12} />} label="Preview" />
          <ActionBtn href={suket.fileUrl} icon={<Download size={12} />} label="Unduh" />
        </div>
      </div>
    </div>
  );
}

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

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={base}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(240,165,0,0.08)";
          (e.currentTarget as HTMLElement).style.color = "#C87A00";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,165,0,0.25)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#F5F3EE";
          (e.currentTarget as HTMLElement).style.color = "#888880";
          (e.currentTarget as HTMLElement).style.borderColor = "#E5E2D8";
        }}
      >
        {icon} {label}
      </a>
    );
  }

  return (
    <button onClick={onClick} style={base}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(240,165,0,0.08)";
        (e.currentTarget as HTMLElement).style.color = "#C87A00";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,165,0,0.25)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#F5F3EE";
        (e.currentTarget as HTMLElement).style.color = "#888880";
        (e.currentTarget as HTMLElement).style.borderColor = "#E5E2D8";
      }}
    >
      {icon} {label}
    </button>
  );
}