"use client";

import React, { useState, useEffect } from "react";
import { LinkIcon, ImageIcon, Loader2, CheckCircle2, FileUp } from "lucide-react";

interface UploadFormProps {
  label: string;
  showPeriod?: boolean;
  periodPlaceholder?: string;
  isSubmitting: boolean;
  forcedMode?: "link" | "upload"; // STRATEGI: Mengunci mode tanpa perlu radio button
  onSubmit: (data: { mode: "link" | "upload"; url?: string; file?: File; period?: string }) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "#F8F7F3",
  border: "1.5px solid #E5E2D8", borderRadius: 10,
  fontFamily: "inherit", fontSize: 13, color: "#1A1A1A",
  outline: "none", caretColor: "#F0A500", transition: "border-color 0.2s, opacity 0.2s",
};

export default function UploadForm({
  label, showPeriod = true, periodPlaceholder = "Periode (cth: 2025-2026)",
  isSubmitting, forcedMode, onSubmit,
}: UploadFormProps) {
  const [mode, setMode] = useState<"link" | "upload">(forcedMode || "link");
  const [linkValue, setLinkValue] = useState("");
  const [fileValue, setFileValue] = useState<File | null>(null);
  const [period, setPeriod] = useState("");
  const [loadingText, setLoadingText] = useState("Menyiapkan dokumen...");
  
  useEffect(() => {
    if (isSubmitting) {
      const texts = [
        "Sedang mengunggah berkas...", "Menghubungkan ke server...",
        "Menyimpan informasi periode...", "Sinkronisasi data alat...",
      ];
      let i = 0;
      const interval = setInterval(() => { setLoadingText(texts[i % texts.length]); i++; }, 1500);
      return () => clearInterval(interval);
    }
  }, [isSubmitting]);

  const handleSubmit = () => {
    onSubmit({
      mode,
      url: mode === "link" ? linkValue : undefined,
      file: mode === "upload" ? (fileValue ?? undefined) : undefined,
      period: showPeriod ? period : undefined,
    });
    setLinkValue(""); setFileValue(null); setPeriod("");
  };

  return (
    <div style={{
      background: "#FAFAF7", border: "1.5px solid #EAE7DF",
      borderRadius: 12, padding: 16, display: "flex", flexDirection: "column",
      gap: 12, position: "relative", transition: "all 0.2s",
    }}>
      {/* LOADING OVERLAY */}
      {isSubmitting && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(4px)", zIndex: 10, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease-out",
          borderRadius: 12,
        }}>
          <Loader2 size={24} color="#F0A500" style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px 0" }}>Memproses...</h2>
          <p style={{ fontSize: 12, color: "#1A1A1A", opacity: 0.6, margin: 0, textAlign: "center" }}>{loadingText}</p>
        </div>
      )}

      {/* FORM CONTENT */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1A", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
        {label}
      </p>

      {showPeriod && (
        <input type="text" placeholder={periodPlaceholder} value={period} onChange={(e) => setPeriod(e.target.value)} style={inputStyle} disabled={isSubmitting} />
      )}

      {/* Tampilkan Radio Button HANYA jika forcedMode tidak diset */}
      {!forcedMode && (
        <div style={{ display: "flex", gap: 12 }}>
          {(["link", "upload"] as const).map((m) => (
            <label key={m} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: mode === m ? "#C87A00" : "#1A1A1A", fontWeight: mode === m ? 600 : 400 }}>
              <input type="radio" checked={mode === m} onChange={() => setMode(m)} disabled={isSubmitting} style={{ accentColor: "#F0A500" }} />
              {m === "link" ? <LinkIcon size={12} /> : <ImageIcon size={12} />}
              {m === "link" ? "Link Cloud" : "Upload File"}
            </label>
          ))}
        </div>
      )}

      {mode === "link" ? (
        <input type="url" placeholder="https://drive.google.com/..." value={linkValue} onChange={(e) => setLinkValue(e.target.value)} style={inputStyle} disabled={isSubmitting} />
      ) : (
        <input type="file" accept="image/*,.pdf" onChange={(e) => setFileValue(e.target.files?.[0] ?? null)} style={{ ...inputStyle, padding: "8px" }} disabled={isSubmitting} />
      )}

      <button onClick={handleSubmit} disabled={isSubmitting} style={{
        padding: "10px 16px", background: "#F0A500", border: "none", borderRadius: 10,
        fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#1A1A1A",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        gap: 7, transition: "all 0.2s", boxShadow: "0 4px 14px rgba(240,165,0,0.2)",
      }}>
        <CheckCircle2 size={14} /> Simpan Dokumen
      </button>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}