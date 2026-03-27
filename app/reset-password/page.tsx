"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Key, ShieldCheck, AlertTriangle, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cek token pas pertama buka
  useEffect(() => {
    if (!token) {
      setStatus({ type: "error", text: "Link tidak valid atau sudah kedaluwarsa. Silakan minta link baru." });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 6) {
      setStatus({ type: "error", text: "Kata sandi minimal 6 karakter." });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: "error", text: "Konfirmasi kata sandi tidak cocok." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Gagal mengatur ulang kata sandi.");

      setStatus({ type: "success", text: "Kata sandi berhasil diubah! Mengalihkan ke halaman login..." });
      
      // Tendang ke login setelah 3 detik
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err: any) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", background: "#F8F7F3",
    border: "1.5px solid #E5E2D8", borderRadius: 10,
    fontFamily: "inherit", fontSize: 14, color: "#1A1A1A",
    outline: "none", caretColor: "#F0A500", marginTop: "6px"
  };

  return (
    <div style={{ 
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", 
      background: "#FAFAF8", padding: "20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
    }}>
      <div style={{ width: "100%", maxWidth: "400px", animation: "fadeUp 0.4s ease" }}>
        
        {/* Logo / Brand Area */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ 
            width: "56px", height: "56px", background: "#F0A500", borderRadius: "14px", 
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            boxShadow: "0 8px 20px rgba(240, 165, 0, 0.2)"
          }}>
            <Key size={28} color="#1A1A1A" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1A1A1A", margin: "0" }}>Atur Ulang Sandi</h1>
          <p style={{ fontSize: "14px", color: "#1A1A1A", opacity: 0.6, marginTop: "8px" }}>
            Masukkan kata sandi baru untuk akun M-Track Anda.
          </p>
        </div>

        {/* Status Message */}
        {status && (
          <div style={{ 
            padding: "14px", borderRadius: "10px", marginBottom: "20px", fontSize: "13px", display: "flex", gap: "10px", alignItems: "center",
            background: status.type === "error" ? "rgba(220,60,60,0.06)" : "rgba(34,160,100,0.06)",
            border: `1px solid ${status.type === "error" ? "rgba(220,60,60,0.15)" : "rgba(34,160,100,0.15)"}`,
            color: status.type === "error" ? "#DC3C3C" : "#22A064"
          }}>
            {status.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            {status.text}
          </div>
        )}

        {/* Form */}
        {!status || status.type !== "success" ? (
          <form onSubmit={handleSubmit} style={{ background: "#FFFFFF", padding: "24px", borderRadius: "16px", border: "1.5px solid #E8E4DC", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#1A1A1A", textTransform: "uppercase", letterSpacing: "0.08em" }}>Kata Sandi Baru</label>
              <input 
                type="password" required placeholder="••••••••" 
                style={inputStyle} value={password} 
                onChange={(e) => setPassword(e.target.value)}
                disabled={!token || isSubmitting}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#1A1A1A", textTransform: "uppercase", letterSpacing: "0.08em" }}>Konfirmasi Kata Sandi</label>
              <input 
                type="password" required placeholder="••••••••" 
                style={inputStyle} value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!token || isSubmitting}
              />
            </div>

            <button 
              type="submit" 
              disabled={!token || isSubmitting}
              style={{
                width: "100%", padding: "12px", background: "#F0A500", border: "none", borderRadius: "10px",
                fontSize: "14px", fontWeight: 700, color: "#1A1A1A", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                transition: "0.2s", boxShadow: "0 4px 12px rgba(240, 165, 0, 0.2)"
              }}
            >
              {isSubmitting ? <Loader2 size={18} className="spin" /> : "Simpan Perubahan"}
            </button>
          </form>
        ) : null}

        {/* Footer Link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/login" style={{ fontSize: "13px", color: "#1A1A1A", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <ArrowLeft size={14} /> Kembali ke Login
          </Link>
        </div>

      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}