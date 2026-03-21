"use client";

import React, { useState, useEffect } from "react";
import {
  Mail, Save, RotateCcw, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, AlertTriangle, Building2, Globe
} from "lucide-react";

// ============================================================
// TIPE
// ============================================================
interface TemplateData {
  id?:        string | null;
  senderName: string;
  subject:    string;
  introText:  string;
  footerText: string;
}

interface Company { id: string; name: string; }

interface EmailTemplateEditorProps {
  type:        "SINGLE" | "BULK";
  label:       string;
  description: string;
  companies:   Company[];
}

// ============================================================
// PLACEHOLDER HINTS
// ============================================================
const PLACEHOLDERS = [
  { tag: "{{companyName}}",   desc: "Nama perusahaan klien" },
  { tag: "{{equipmentName}}", desc: "Nama alat (SINGLE only)" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "#F8F7F3",
  border: "1.5px solid #E5E2D8", borderRadius: 10,
  fontFamily: "inherit", fontSize: 13, color: "#1A1A1A",
  outline: "none", caretColor: "#F0A500", transition: "border-color 0.2s",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: "vertical", minHeight: 88, lineHeight: 1.6,
};

// ============================================================
// SUB: FORM EDITOR
// ============================================================
function TemplateForm({
  title, badge, data, isSaving, isOverride,
  onChange, onSave, onReset,
}: {
  title:      string;
  badge?:     string;
  data:       TemplateData;
  isSaving:   boolean;
  isOverride: boolean;
  onChange:   (key: keyof TemplateData, val: string) => void;
  onSave:     () => void;
  onReset?:   () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{
      border: `1.5px solid ${isOverride ? "rgba(240,165,0,0.25)" : "#EAE7DF"}`,
      borderRadius: 12, overflow: "hidden",
      background: isOverride ? "rgba(240,165,0,0.02)" : "#FFFFFF",
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%", padding: "14px 18px",
          background: isOverride ? "rgba(240,165,0,0.05)" : "#FAFAF7",
          border: "none", borderBottom: expanded ? "1px solid #F0EDE4" : "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mail size={14} color={isOverride ? "#C87A00" : "#888880"} />
          <span style={{ fontSize: 13, fontWeight: 600, color: isOverride ? "#C87A00" : "#555550" }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: 9, fontWeight: 600, padding: "2px 7px",
              borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.08em",
              background: isOverride ? "rgba(240,165,0,0.12)" : "rgba(34,160,100,0.08)",
              border: `1px solid ${isOverride ? "rgba(240,165,0,0.25)" : "rgba(34,160,100,0.2)"}`,
              color: isOverride ? "#C87A00" : "#22A064",
            }}>
              {badge}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} color="#AAAAAA" /> : <ChevronDown size={14} color="#AAAAAA" />}
      </button>

      {expanded && (
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Sender name */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#555550", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Nama Pengirim
            </label>
            <input
              type="text" style={inputStyle}
              placeholder="M-Track Marusindo"
              value={data.senderName}
              onChange={(e) => onChange("senderName", e.target.value)}
            />
          </div>

          {/* Subject */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#555550", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Subject Email
            </label>
            <input
              type="text" style={inputStyle}
              placeholder="[PERHATIAN] Status Alat: {{equipmentName}}"
              value={data.subject}
              onChange={(e) => onChange("subject", e.target.value)}
            />
          </div>

          {/* Intro */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#555550", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Teks Intro / Narasi
            </label>
            <textarea
              style={textareaStyle}
              placeholder="Teks pembuka di atas tabel alat..."
              value={data.introText}
              onChange={(e) => onChange("introText", e.target.value)}
            />
          </div>

          {/* Footer */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#555550", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Pesan Footer / Peringatan
            </label>
            <textarea
              style={textareaStyle}
              placeholder="Catatan penutup di bawah tabel alat..."
              value={data.footerText}
              onChange={(e) => onChange("footerText", e.target.value)}
            />
          </div>

          {/* Placeholder hints */}
          <div style={{
            padding: "10px 14px", borderRadius: 9,
            background: "rgba(240,165,0,0.04)", border: "1px solid rgba(240,165,0,0.15)",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#C87A00", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Variabel yang bisa dipakai:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PLACEHOLDERS.map((p) => (
                <span key={p.tag} style={{
                  fontSize: 11, padding: "3px 9px", borderRadius: 6,
                  background: "#FFFFFF", border: "1px solid rgba(240,165,0,0.2)",
                  color: "#C87A00", fontFamily: "monospace",
                  cursor: "default",
                }} title={p.desc}>
                  {p.tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {onReset && isOverride && (
              <button
                onClick={onReset}
                disabled={isSaving}
                style={{
                  padding: "9px 14px", borderRadius: 9,
                  background: "#F5F3EE", border: "1.5px solid #E5E2D8",
                  fontFamily: "inherit", fontSize: 12, fontWeight: 500,
                  color: "#888880", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(220,60,60,0.06)";
                  (e.currentTarget as HTMLElement).style.color = "#DC3C3C";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,60,60,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#F5F3EE";
                  (e.currentTarget as HTMLElement).style.color = "#888880";
                  (e.currentTarget as HTMLElement).style.borderColor = "#E5E2D8";
                }}
              >
                <RotateCcw size={12} /> Reset ke Global
              </button>
            )}
            <button
              onClick={onSave}
              disabled={isSaving}
              style={{
                flex: 1, padding: "9px 14px", borderRadius: 9,
                background: isSaving ? "#F5F3EE" : "#F0A500",
                border: "none", fontFamily: "inherit", fontSize: 13,
                fontWeight: 600, color: isSaving ? "#AAAAAA" : "#1A1A1A",
                cursor: isSaving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 7, transition: "0.2s",
                boxShadow: isSaving ? "none" : "0 4px 14px rgba(240,165,0,0.2)",
              }}
            >
              {isSaving
                ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Menyimpan...</>
                : <><Save size={13} /> Simpan Template</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function EmailTemplateEditor({
  type, label, description, companies,
}: EmailTemplateEditorProps) {
  // ── Global state ──
  const [globalData, setGlobalData] = useState<TemplateData>({
    senderName: "M-Track Marusindo", subject: "", introText: "", footerText: "",
  });
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [globalMsg, setGlobalMsg]           = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Per-company override state ──
  const [selectedCompanyId, setSelectedCompanyId]   = useState<string>("");
  const [overrideData, setOverrideData]             = useState<TemplateData>({
    senderName: "M-Track Marusindo", subject: "", introText: "", footerText: "",
  });
  const [isOverrideActive, setIsOverrideActive]     = useState(false);
  const [isSavingOverride, setIsSavingOverride]     = useState(false);
  const [isLoadingOverride, setIsLoadingOverride]   = useState(false);
  const [overrideMsg, setOverrideMsg]               = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showOverrideSection, setShowOverrideSection] = useState(false);

  // Auto-dismiss messages
  useEffect(() => {
    if (!globalMsg) return;
    const t = setTimeout(() => setGlobalMsg(null), 3500);
    return () => clearTimeout(t);
  }, [globalMsg]);

  useEffect(() => {
    if (!overrideMsg) return;
    const t = setTimeout(() => setOverrideMsg(null), 3500);
    return () => clearTimeout(t);
  }, [overrideMsg]);

  // Load global template on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch("/api/email-templates");
        const data = await res.json();
        if (data[type]) {
          setGlobalData({
            senderName: data[type].senderName || "M-Track Marusindo",
            subject:    data[type].subject    || "",
            introText:  data[type].introText  || "",
            footerText: data[type].footerText || "",
          });
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, [type]);

  // Load override ketika company dipilih
  useEffect(() => {
    if (!selectedCompanyId) return;
    const load = async () => {
      setIsLoadingOverride(true);
      try {
        const res  = await fetch(`/api/email-templates/${selectedCompanyId}`);
        const data = await res.json();
        const tpl  = data[type];
        if (tpl) {
          setOverrideData({
            senderName: tpl.senderName || "M-Track Marusindo",
            subject:    tpl.subject    || "",
            introText:  tpl.introText  || "",
            footerText: tpl.footerText || "",
          });
          setIsOverrideActive(true);
        } else {
          // Belum ada override — prefill dari global
          setOverrideData({ ...globalData });
          setIsOverrideActive(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingOverride(false);
      }
    };
    load();
  }, [selectedCompanyId]);

  // ── Save global ──
  const handleSaveGlobal = async () => {
    setIsSavingGlobal(true);
    try {
      const res = await fetch("/api/email-templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...globalData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setGlobalMsg({ type: "success", text: "Template global berhasil disimpan." });
    } catch (err: any) {
      setGlobalMsg({ type: "error", text: err.message });
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // ── Save override ──
  const handleSaveOverride = async () => {
    if (!selectedCompanyId) return;
    setIsSavingOverride(true);
    try {
      const res = await fetch(`/api/email-templates/${selectedCompanyId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...overrideData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setIsOverrideActive(true);
      setOverrideMsg({ type: "success", text: data.message });
    } catch (err: any) {
      setOverrideMsg({ type: "error", text: err.message });
    } finally {
      setIsSavingOverride(false);
    }
  };

  // ── Reset override (hapus → kembali ke global) ──
  const handleResetOverride = async () => {
    if (!selectedCompanyId) return;
    if (!confirm("Hapus override ini? Klien akan kembali menggunakan template global.")) return;
    setIsSavingOverride(true);
    try {
      const res = await fetch(`/api/email-templates/${selectedCompanyId}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setIsOverrideActive(false);
      setOverrideData({ ...globalData });
      setOverrideMsg({ type: "success", text: "Override dihapus. Kembali ke template global." });
    } catch (err: any) {
      setOverrideMsg({ type: "error", text: err.message });
    } finally {
      setIsSavingOverride(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Deskripsi section ── */}
      <div style={{ padding: "12px 16px", background: "#FAFAF7", border: "1.5px solid #EAE7DF", borderRadius: 10 }}>
        <p style={{ fontSize: 12, color: "#888880", margin: 0, lineHeight: 1.6 }}>
          {description}
        </p>
      </div>

      {/* ── Status message ── */}
      {globalMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", borderRadius: 9, fontSize: 12, fontWeight: 500,
          background: globalMsg.type === "success" ? "rgba(34,160,100,0.07)" : "rgba(220,60,60,0.07)",
          border: `1px solid ${globalMsg.type === "success" ? "rgba(34,160,100,0.2)" : "rgba(220,60,60,0.2)"}`,
          color: globalMsg.type === "success" ? "#22A064" : "#DC3C3C",
        }}>
          {globalMsg.type === "success" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          {globalMsg.text}
        </div>
      )}

      {/* ── Global template form ── */}
      <TemplateForm
        title={`Template Global — ${label}`}
        badge="Default"
        data={globalData}
        isSaving={isSavingGlobal}
        isOverride={false}
        onChange={(key, val) => setGlobalData((prev) => ({ ...prev, [key]: val }))}
        onSave={handleSaveGlobal}
      />

      {/* ── Toggle override section ── */}
      <button
        onClick={() => setShowOverrideSection((v) => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "11px 16px", borderRadius: 10,
          background: showOverrideSection ? "rgba(240,165,0,0.05)" : "#F5F3EE",
          border: `1.5px solid ${showOverrideSection ? "rgba(240,165,0,0.2)" : "#E5E2D8"}`,
          fontFamily: "inherit", fontSize: 13, fontWeight: 500,
          color: showOverrideSection ? "#C87A00" : "#888880",
          cursor: "pointer", transition: "0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={14} />
          Override per Klien
        </div>
        {showOverrideSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* ── Override section ── */}
      {showOverrideSection && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 4 }}>

          {/* Pilih company */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#555550", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Pilih Klien
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">-- Pilih perusahaan --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Loading override */}
          {isLoadingOverride && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", color: "#AAAAAA", fontSize: 12 }}>
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              Memuat template klien...
            </div>
          )}

          {/* Override status message */}
          {overrideMsg && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: 9, fontSize: 12, fontWeight: 500,
              background: overrideMsg.type === "success" ? "rgba(34,160,100,0.07)" : "rgba(220,60,60,0.07)",
              border: `1px solid ${overrideMsg.type === "success" ? "rgba(34,160,100,0.2)" : "rgba(220,60,60,0.2)"}`,
              color: overrideMsg.type === "success" ? "#22A064" : "#DC3C3C",
            }}>
              {overrideMsg.type === "success" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {overrideMsg.text}
            </div>
          )}

          {/* Form override */}
          {selectedCompanyId && !isLoadingOverride && (
            <TemplateForm
              title={`Override — ${companies.find((c) => c.id === selectedCompanyId)?.name ?? ""}`}
              badge={isOverrideActive ? "Override Aktif" : "Belum di-override"}
              data={overrideData}
              isSaving={isSavingOverride}
              isOverride={isOverrideActive}
              onChange={(key, val) => setOverrideData((prev) => ({ ...prev, [key]: val }))}
              onSave={handleSaveOverride}
              onReset={handleResetOverride}
            />
          )}

          {!selectedCompanyId && (
            <div style={{
              textAlign: "center", padding: "20px 16px",
              background: "#FAFAF7", border: "1.5px dashed #E5E2D8",
              borderRadius: 10, color: "#AAAAAA", fontSize: 12,
            }}>
              Pilih klien di atas untuk melihat atau mengatur override template-nya.
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}