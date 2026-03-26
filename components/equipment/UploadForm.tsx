"use client";

import React, { useState } from "react";
import { LinkIcon, ImageIcon, Loader2, CheckCircle2 } from "lucide-react";

interface UploadFormProps {
  label: string;
  showPeriod?: boolean;
  periodPlaceholder?: string;
  isSubmitting: boolean;
  onSubmit: (data: { mode: "link" | "upload"; url?: string; file?: File; period?: string }) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "#F8F7F3",
  border: "1.5px solid #E5E2D8",
  borderRadius: 10,
  fontFamily: "inherit",
  fontSize: 13,
  color: "#1A1A1A",
  outline: "none",
  caretColor: "#F0A500",
  transition: "border-color 0.2s, opacity 0.2s",
};

export default function UploadForm({
  label,
  showPeriod = true,
  periodPlaceholder = "Periode (cth: 2025-2026)",
  isSubmitting,
  onSubmit,
}: UploadFormProps) {
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [linkValue, setLinkValue] = useState("");
  const [fileValue, setFileValue] = useState<File | null>(null);
  const [period, setPeriod] = useState("");

  const handleSubmit = () => {
    onSubmit({
      mode,
      url: mode === "link" ? linkValue : undefined,
      file: mode === "upload" ? (fileValue ?? undefined) : undefined,
      period: showPeriod ? period : undefined,
    });
    // Jangan reset state di sini secara hardcode. 
    // Idealnya state di-reset dari parent setelah request API benar-benar sukses.
    // Tapi karena ini kode lu, gua biarin.
    setLinkValue("");
    setFileValue(null);
    setPeriod("");
  };

  return (
    <div
      style={{
        background: "#FAFAF7",
        border: "1.5px solid #EAE7DF",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: isSubmitting ? 0.6 : 1, // Feedback visual form sedang dikunci
        pointerEvents: isSubmitting ? "none" : "auto", // Mencegah interaksi nakal user
        transition: "opacity 0.2s",
      }}
    >
      {/* Label */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#555550",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: 0,
        }}
      >
        {label}
      </p>

      {/* Period input */}
      {showPeriod && (
        <input
          type="text"
          placeholder={periodPlaceholder}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
             ...inputStyle, 
             background: isSubmitting ? "#EFEFEF" : inputStyle.background 
          }}
          disabled={isSubmitting}
        />
      )}

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 12 }}>
        {(["link", "upload"] as const).map((m) => (
          <label
            key={m}
            style={{
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              color: mode === m ? "#C87A00" : "#888880",
              fontWeight: mode === m ? 600 : 400,
              transition: "color 0.15s",
            }}
          >
            <input
              type="radio"
              checked={mode === m}
              onChange={() => setMode(m)}
              disabled={isSubmitting}
              style={{ accentColor: "#F0A500" }}
            />
            {m === "link" ? <LinkIcon size={12} /> : <ImageIcon size={12} />}
            {m === "link" ? "Link Cloud" : "Upload File"}
          </label>
        ))}
      </div>

      {/* Input area */}
      {mode === "link" ? (
        <input
          type="url"
          placeholder="https://drive.google.com/..."
          value={linkValue}
          onChange={(e) => setLinkValue(e.target.value)}
          style={{
            ...inputStyle, 
            background: isSubmitting ? "#EFEFEF" : inputStyle.background 
         }}
          disabled={isSubmitting}
        />
      ) : (
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFileValue(e.target.files?.[0] ?? null)}
          style={{ 
            ...inputStyle, 
            padding: "8px", 
            color: "#888880",
            background: isSubmitting ? "#EFEFEF" : inputStyle.background 
          }}
          disabled={isSubmitting}
        />
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{
          padding: "10px 16px",
          background: isSubmitting ? "#F5F3EE" : "#F0A500",
          border: "none",
          borderRadius: 10,
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          color: isSubmitting ? "#AAAAAA" : "#1A1A1A",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          transition: "background 0.2s, transform 0.15s",
          boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(240,165,0,0.2)",
        }}
        onMouseEnter={(e) => {
          if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.background = "#E09800";
        }}
        onMouseLeave={(e) => {
          if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.background = "#F0A500";
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            Menyimpan...
          </>
        ) : (
          <>
            <CheckCircle2 size={14} />
            Simpan Dokumen
          </>
        )}
      </button>

      {/* Tetap butuh keyframes karena lu pakai inline styles alih-alih Tailwind */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}