"use client";

import React, { useState } from "react";
import { FileText, Download, Eye, RefreshCw, Plus, AlertCircle, Trash2, Loader2, Cloud, ExternalLink, Link as LinkIcon } from "lucide-react";
import UploadForm from "./UploadForm";

interface Laporan {
  id: string; period: string; fileUrl: string; documentType?: "link" | "upload"; createdAt?: string;
}

interface LaporanSectionProps {
  laporanList: Laporan[];
  userRole: string | null;
  isSubmitting: boolean;
  isDeletingId: string | null;
  title?: string;          // Baru
  emptyText?: string;      // Baru
  buttonText?: string;     // Baru
  forcedMode?: "link" | "upload"; // Baru
  onUpload: (data: { mode: "link" | "upload"; url?: string; file?: File; period?: string }) => void;
  onPreview: (url: string) => void;
  onDelete: (laporanId: string) => void;
}

const isCloudLink = (url: string, type?: string) => {
  if (type) return type === "link";
  const u = url.toLowerCase();
  return u.includes("drive.google.com") || u.includes("docs.google.com") || u.includes("dropbox.com") || u.includes("sharepoint");
};

export default function LaporanSection({
  laporanList, userRole, isSubmitting, isDeletingId,
  title = "Laporan Tahunan",
  emptyText = "Belum ada laporan tahunan.",
  buttonText = "Tambah Laporan",
  forcedMode,
  onUpload, onPreview, onDelete,
}: LaporanSectionProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const sorted = [...laporanList].sort((a, b) => a.period > b.period ? -1 : a.period < b.period ? 1 : 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: "rgba(34,160,100,0.08)", border: "1.5px solid rgba(34,160,100,0.18)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#22A064",
          }}>
            {forcedMode === "link" ? <LinkIcon size={14} /> : <FileText size={14} />}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#555550" }}>{title}</span>
        </div>

        {userRole === "SUPERADMIN" && (
          <button onClick={() => { setShowUploadForm((v) => !v); setReplacingId(null); }} style={{
            fontSize: 11, fontWeight: 500, padding: "5px 11px", borderRadius: 7,
            background: showUploadForm ? "rgba(34,160,100,0.08)" : "#F5F3EE",
            border: `1.5px solid ${showUploadForm ? "rgba(34,160,100,0.25)" : "#E5E2D8"}`,
            color: showUploadForm ? "#22A064" : "#888880", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", transition: "0.15s",
          }}>
            <Plus size={11} /> {buttonText}
          </button>
        )}
      </div>

      {showUploadForm && userRole === "SUPERADMIN" && (
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", borderRadius: 9, marginBottom: 10, background: "rgba(240,165,0,0.05)", border: "1px solid rgba(240,165,0,0.15)" }}>
            <AlertCircle size={13} style={{ color: "#C87A00", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: "#C87A00", margin: 0, lineHeight: 1.5 }}>Jika periode sudah ada, laporan lama akan otomatis <strong>digantikan</strong>.</p>
          </div>
          <UploadForm
            label={buttonText} showPeriod periodPlaceholder="Periode laporan (cth: 2025-2026)"
            isSubmitting={isSubmitting} forcedMode={forcedMode}
            onSubmit={(data) => { onUpload(data); setShowUploadForm(false); }}
          />
        </div>
      )}

      {laporanList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 16px", background: "#FAFAF7", border: "1.5px dashed #E5E2D8", borderRadius: 12, color: "#AAAAAA", fontSize: 12 }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((lap) => {
            const isDeleting = isDeletingId === lap.id;
            const isLink = isCloudLink(lap.fileUrl, lap.documentType);

            return (
              <div key={lap.id}>
                <div style={{
                  background: isDeleting ? "rgba(220,60,60,0.03)" : "#FAFAF7",
                  border: replacingId === lap.id ? "1.5px solid rgba(240,165,0,0.25)" : isDeleting ? "1.5px solid rgba(220,60,60,0.2)" : "1.5px solid #EAE7DF",
                  borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, transition: "all 0.2s", opacity: isDeleting ? 0.6 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: isLink ? "rgba(59,130,246,0.07)" : "rgba(34,160,100,0.07)",
                      border: `1.5px solid ${isLink ? "rgba(59,130,246,0.15)" : "rgba(34,160,100,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isDeleting ? <Loader2 size={14} color="#DC3C3C" style={{ animation: "spin 1s linear infinite" }} /> : isLink ? <Cloud size={14} color="#3B82F6" /> : <FileText size={14} color="#22A064" />}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>Laporan {lap.period}</p>
                        {isLink ? <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 4, color: "#3B82F6" }}>Link Cloud</span>
                                : <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", background: "#E5E2D8", border: "1px solid #D1CDBC", borderRadius: 4, color: "#555550" }}>File</span>}
                      </div>
                      {lap.createdAt && <p style={{ fontSize: 10, color: "#BBBBBB", margin: "2px 0 0", fontFamily: "monospace" }}>{new Date(lap.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</p>}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                    <ActionBtn onClick={() => onPreview(lap.fileUrl)} icon={<Eye size={12} />} label="Preview" disabled={isDeleting} />
                    {isLink ? <ActionBtn href={lap.fileUrl} icon={<ExternalLink size={12} />} label="Buka Link" disabled={isDeleting} /> : <ActionBtn href={lap.fileUrl} icon={<Download size={12} />} label="Unduh" disabled={isDeleting} />}
                    {userRole === "SUPERADMIN" && (
                      <>
                        <button onClick={() => { setReplacingId(replacingId === lap.id ? null : lap.id); setShowUploadForm(false); }} disabled={isDeleting} style={{
                          fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 7,
                          background: replacingId === lap.id ? "rgba(240,165,0,0.08)" : "#F5F3EE", border: `1.5px solid ${replacingId === lap.id ? "rgba(240,165,0,0.25)" : "#E5E2D8"}`, color: replacingId === lap.id ? "#C87A00" : "#888880", cursor: isDeleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", transition: "0.15s", opacity: isDeleting ? 0.4 : 1,
                        }}>
                          <RefreshCw size={11} /> Replace
                        </button>
                        <button onClick={() => onDelete(lap.id)} disabled={isDeleting} title="Hapus laporan" style={{
                          padding: "4px 8px", borderRadius: 7, background: "rgba(220,60,60,0.06)", border: "1.5px solid rgba(220,60,60,0.18)", color: "#DC3C3C", cursor: isDeleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", transition: "0.15s", opacity: isDeleting ? 0.4 : 1,
                        }}>
                          {isDeleting ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {replacingId === lap.id && userRole === "SUPERADMIN" && (
                  <div style={{ marginTop: 8, paddingLeft: 8 }}>
                    <UploadForm label={`Replace Laporan ${lap.period}`} showPeriod={false} isSubmitting={isSubmitting} forcedMode={forcedMode} onSubmit={(data) => { onUpload({ ...data, period: lap.period }); setReplacingId(null); }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ActionBtn({ onClick, href, icon, label, disabled }: any) {
  const base: React.CSSProperties = { fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 7, background: "#F5F3EE", border: "1.5px solid #E5E2D8", color: "#888880", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", textDecoration: "none", transition: "0.15s", opacity: disabled ? 0.4 : 1 };
  if (href) return <a href={href} target="_blank" rel="noreferrer" style={base}>{icon} {label}</a>;
  return <button onClick={onClick} disabled={disabled} style={base}>{icon} {label}</button>;
}