"use client";

import React from "react";
import {
  X, Wrench, MapPin, Tag, Hash, Gauge, FileText,
  Calendar, Clock, ShieldCheck, AlertTriangle, XOctagon,
  FolderOpen, Edit, Building2,
} from "lucide-react";

// ============================================================
// TIPE
// ============================================================
interface Suket   { id: string; period: string; fileUrl: string; createdAt: string; }
interface Laporan { id: string; period: string; fileUrl: string; createdAt?: string; }

interface Equipment {
  id: string; name: string; permitNumber?: string; serialNumber?: string;
  location: string | null; inspectionDate: string; expiryDate: string;
  companyId?: string;
  area?:        string | null;
  brand?:       string | null;
  capacity?:    string | null;
  description?: string | null;
  suket?:       Suket[];
  laporan?:     Laporan[];
  company?:     { name: string };
}

interface EquipmentDetailPanelProps {
  equipment:  Equipment | null;
  isOpen:     boolean;
  userRole:   string | null;
  onClose:    () => void;
  onEdit:     (eq: Equipment) => void;
  onDocument: (eq: Equipment) => void;
}

// ============================================================
// HELPERS
// ============================================================
function getStatus(expiryDate: string) {
  const diffDays = Math.ceil(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0)   return { label: "Kedaluwarsa", variant: "danger",  icon: XOctagon,      days: diffDays };
  if (diffDays <= 60) return { label: "Warning",     variant: "warning", icon: AlertTriangle, days: diffDays };
  return                     { label: "Aman",        variant: "safe",    icon: ShieldCheck,   days: diffDays };
}

// Baris info — skip kalau value kosong
function InfoRow({ icon, label, value }: {
  icon:  React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 0", borderBottom: "1px solid #F5F3EE",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: "rgba(240,165,0,0.06)", border: "1.5px solid rgba(240,165,0,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#C87A00", marginTop: 1,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 500, color: "#AAAAAA", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </p>
        <p style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A", margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function EquipmentDetailPanel({
  equipment, isOpen, userRole, onClose, onEdit, onDocument,
}: EquipmentDetailPanelProps) {
  if (!isOpen || !equipment) return null;

  const status   = getStatus(equipment.expiryDate);
  const StatusIcon = status.icon;
  const hasDocs  = (equipment.suket?.length ?? 0) > 0 || (equipment.laporan?.length ?? 0) > 0;

  const statusColors = {
    safe:    { color: "#22A064", bg: "rgba(34,160,100,0.07)",  border: "rgba(34,160,100,0.18)" },
    warning: { color: "#C87A00", bg: "rgba(240,165,0,0.08)",   border: "rgba(240,165,0,0.2)"   },
    danger:  { color: "#DC3C3C", bg: "rgba(220,60,60,0.07)",   border: "rgba(220,60,60,0.18)"  },
  };
  const sc = statusColors[status.variant as keyof typeof statusColors];

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.15)", backdropFilter: "blur(2px)",
          animation: "dp-fade 0.2s ease",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "100%", maxWidth: 360,
        background: "#FFFFFF", borderLeft: "1.5px solid #EAE7DF",
        display: "flex", flexDirection: "column",
        boxShadow: "-6px 0 32px rgba(0,0,0,0.08)",
        animation: "dp-slide 0.25s cubic-bezier(0.32,0.72,0,1)",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid #F0EDE4",
          background: "#FAFAF7", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: "rgba(240,165,0,0.08)", border: "1.5px solid rgba(240,165,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#C87A00",
              }}>
                <Wrench size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {equipment.name}
                </p>
                {equipment.company?.name && (
                  <p style={{ fontSize: 11, color: "#AAAAAA", margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                    <Building2 size={10} /> {equipment.company.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: 7, borderRadius: 8, flexShrink: 0,
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
              <X size={15} />
            </button>
          </div>

          {/* Status badge */}
          <div style={{ marginTop: 12 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 10, fontWeight: 500, padding: "4px 10px",
              borderRadius: 999, border: `1px solid ${sc.border}`,
              background: sc.bg, color: sc.color,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              <StatusIcon size={10} />
              {status.label} · {status.days < 0 ? `Lewat ${Math.abs(status.days)} hari` : `Sisa ${status.days} hari`}
            </span>
          </div>
        </div>

        {/* ── Body scrollable ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 20px" }}>

          {/* Tanggal section */}
          <div style={{
            display: "flex", gap: 10, margin: "16px 0 4px",
            padding: 14, borderRadius: 10,
            background: "#FAFAF7", border: "1.5px solid #EAE7DF",
          }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 10, color: "#AAAAAA", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Tgl Inspeksi
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#555550", margin: 0, fontFamily: "monospace" }}>
                {new Date(equipment.inspectionDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <div style={{ width: 1, background: "#EAE7DF" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 10, color: "#AAAAAA", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Tgl Kedaluwarsa
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: sc.color, margin: 0, fontFamily: "monospace" }}>
                {new Date(equipment.expiryDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Info rows */}
          <div style={{ marginTop: 8 }}>
            <InfoRow icon={<Tag size={12} />}      label="Merek"           value={equipment.brand} />
            <InfoRow icon={<MapPin size={12} />}   label="Lokasi"          value={equipment.location} />
            <InfoRow icon={<MapPin size={12} />}   label="Area Penempatan" value={equipment.area} />
            <InfoRow icon={<Hash size={12} />}     label="No. Izin"        value={equipment.permitNumber} />
            <InfoRow icon={<Hash size={12} />}     label="Serial Number"   value={equipment.serialNumber} />
            <InfoRow icon={<Gauge size={12} />}    label="Kapasitas"       value={equipment.capacity} />
            <InfoRow icon={<FileText size={12} />} label="Keterangan"      value={equipment.description} />
          </div>

          {/* Dokumen summary */}
          <div style={{
            marginTop: 16, padding: "12px 14px", borderRadius: 10,
            background: hasDocs ? "rgba(34,160,100,0.04)" : "#FAFAF7",
            border: `1.5px solid ${hasDocs ? "rgba(34,160,100,0.15)" : "#EAE7DF"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: hasDocs ? "#22A064" : "#888880", margin: "0 0 2px" }}>
                {hasDocs ? "Dokumen Tersedia" : "Belum Ada Dokumen"}
              </p>
              <p style={{ fontSize: 10, color: "#AAAAAA", margin: 0, fontFamily: "monospace" }}>
                {(equipment.suket?.length ?? 0)} suket · {(equipment.laporan?.length ?? 0)} laporan
              </p>
            </div>
            <FolderOpen size={16} color={hasDocs ? "#22A064" : "#CCCCCC"} />
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid #F0EDE4",
          background: "#FAFAF7", flexShrink: 0,
          display: "flex", gap: 8,
        }}>
          {/* Tombol Dokumen — semua role bisa lihat */}
          <button
            onClick={() => onDocument(equipment)}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              background: hasDocs ? "rgba(34,160,100,0.07)" : "#F5F3EE",
              border: `1.5px solid ${hasDocs ? "rgba(34,160,100,0.2)" : "#E5E2D8"}`,
              fontFamily: "inherit", fontSize: 13, fontWeight: 500,
              color: hasDocs ? "#22A064" : "#888880",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 7, transition: "0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(34,160,100,0.12)";
              (e.currentTarget as HTMLElement).style.color = "#22A064";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,160,100,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = hasDocs ? "rgba(34,160,100,0.07)" : "#F5F3EE";
              (e.currentTarget as HTMLElement).style.color = hasDocs ? "#22A064" : "#888880";
              (e.currentTarget as HTMLElement).style.borderColor = hasDocs ? "rgba(34,160,100,0.2)" : "#E5E2D8";
            }}
          >
            <FolderOpen size={14} /> Dokumen
          </button>

          {/* Tombol Edit — SUPERADMIN only */}
          {userRole === "SUPERADMIN" && (
            <button
              onClick={() => onEdit(equipment)}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                background: "#F0A500", border: "none",
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                color: "#1A1A1A", cursor: "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 7,
                transition: "background 0.15s, transform 0.12s",
                boxShadow: "0 4px 14px rgba(240,165,0,0.2)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#E09800";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#F0A500";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <Edit size={14} /> Edit Data
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dp-fade  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dp-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}