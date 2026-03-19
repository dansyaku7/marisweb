"use client";

import React, { useState, FormEvent } from "react";
import { Loader2 } from "lucide-react";

// --- ICONS ---
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
);

// --- STAT CARD ---
const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-2xl font-black text-[#F0A500] tracking-tight leading-none">{value}</span>
    <span className="text-[11px] text-stone-500 uppercase tracking-widest font-bold">{label}</span>
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Kredensial tidak valid");
      }

      // PERINGATAN: Harus diubah ke HTTP-Only Cookies nanti
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        .login-root {
          font-family: 'Syne', sans-serif;
          min-height: 100vh;
          min-height: 100dvh;
          background-color: #FAFAF8;
          display: flex;
        }

        /* ---- ANIMATED GRID BG ---- */
        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(240,165,0,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(240,165,0,0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: gridDrift 20s linear infinite;
        }
        @keyframes gridDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }

        /* ---- NOISE OVERLAY ---- */
        .noise {
          position: absolute;
          inset: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        /* ---- LEFT PANE ---- */
        .left-pane {
          position: relative;
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 50%;
          overflow: hidden;
          background-color: #F3F4EF;
          border-right: 1px solid #E2E4DC;
          padding: 52px 56px;
        }
        @media (min-width: 1024px) {
          .left-pane { display: flex; }
        }
        @media (min-width: 1024px) and (max-width: 1280px) {
          .left-pane { padding: 40px 40px; }
        }

        /* Big accent number */
        .accent-number {
          position: absolute;
          right: -20px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 320px;
          font-weight: 800;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1px rgba(240,165,0,0.08);
          pointer-events: none;
          letter-spacing: -20px;
          user-select: none;
        }

        .orb-1 {
          position: absolute;
          top: -80px; left: -80px;
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(240,165,0,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .orb-2 {
          position: absolute;
          bottom: -100px; right: -60px;
          width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(240,165,0,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(240,165,0,0.1);
          border: 1px solid rgba(240,165,0,0.25);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 11px;
          font-weight: 700;
          color: #C87A00;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .tag-pill-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #F0A500;
          animation: blink 1.4s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }

        .left-heading {
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 800;
          line-height: 1.1;
          color: #1A1A1A;
          margin: 0 0 16px 0;
        }
        .left-heading span { color: #F0A500; }

        .left-desc {
          font-size: 15px;
          line-height: 1.7;
          color: #666660;
          font-weight: 500;
          max-width: 360px;
          margin: 0;
        }

        .divider-line {
          width: 40px;
          height: 2px;
          background: rgba(240,165,0,0.4);
          margin: 32px 0;
          border-radius: 2px;
        }

        .stats-row {
          display: flex;
          gap: 40px;
          margin-bottom: 40px;
        }

        /* Testimonial card */
        .testimonial {
          background: rgba(255,255,255,0.8);
          border: 1px solid #E8E4D8;
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(8px);
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(240,165,0,0.08);
        }
        .testimonial::before {
          content: '"';
          position: absolute;
          top: -10px; left: 16px;
          font-size: 80px;
          font-weight: 800;
          color: rgba(240,165,0,0.12);
          line-height: 1;
          pointer-events: none;
        }
        .testimonial-text {
          font-size: 13.5px;
          color: #4A4A45;
          font-weight: 600;
          line-height: 1.7;
          font-style: italic;
          margin: 0 0 16px 0;
        }
        .testimonial-footer {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .avatar-stack {
          display: flex;
        }
        .avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid #F3F4EF;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
          margin-left: -6px;
        }
        .avatar:first-child { margin-left: 0; }
        .a1 { background: #FEF3C7; color: #92400E; }
        .a2 { background: #FDE68A; color: #78350F; }
        .a3 { background: #E5E7E0; color: #4B5563; }
        .trust-text {
          font-size: 12px;
          color: #9CA390;
          font-weight: 700;
        }
        .trust-text strong { color: #5A5A55; }

        /* ---- RIGHT PANE ---- */
        .right-pane {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          background-color: #FFFFFF;
          padding: 48px 20px;
          box-shadow: -1px 0 0 #EAECEA;
        }
        @media (min-width: 480px) {
          .right-pane { padding: 48px 32px; }
        }
        @media (min-width: 1024px) {
          .right-pane { width: 50%; padding: 60px 72px; }
        }
        @supports (padding: env(safe-area-inset-left)) {
          .right-pane {
            padding-left: calc(20px + env(safe-area-inset-left));
            padding-right: calc(20px + env(safe-area-inset-right));
          }
        }
        @media (max-height: 700px) {
          .right-pane { align-items: flex-start; padding-top: 32px; padding-bottom: 32px; }
        }

        .form-wrap {
          width: 100%;
          max-width: 420px;
        }

        /* ---- LOGO: MOBILE ---- */
        .mobile-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 36px;
        }
        @media (min-width: 1024px) {
          .mobile-logo { display: none; }
        }

        /* ---- LOGO: LEFT PANE (desktop) ---- */
        .desktop-logo {
          position: relative;
          z-index: 10;
          margin-bottom: 40px;
        }

        .mobile-logo-lockup {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mobile-logo-sub {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #AAB0A4;
          margin-top: 4px;
          text-align: center;
        }

        .form-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #C87A00;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .form-title {
          font-size: clamp(26px, 6vw, 34px);
          font-weight: 800;
          color: #1A1A1A;
          margin: 0 0 6px 0;
          line-height: 1.15;
        }

        .form-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: #888880;
          margin: 0 0 36px 0;
        }

        /* Error */
        .error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 24px;
          font-size: 13px;
          color: #DC2626;
        }

        /* Field */
        .field { margin-bottom: 20px; }
        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 800;
          color: #4A4A45;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        /* ---- PASSWORD WRAPPER ---- */
        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-input {
          display: block;
          width: 100%;
          background: #F8F7F3;
          border: 1.5px solid #E2DDD0;
          border-radius: 12px;
          padding: 14px 16px;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          caret-color: #F0A500;
        }
        .field-input::placeholder { color: #C0BBB0; font-weight: 400; }
        .field-input:focus {
          border-color: #F0A500;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(240,165,0,0.1);
        }

        /* Input password */
        .field-input--pw {
          padding-right: 52px;
        }

        /* Toggle button */
        .pw-toggle {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #B8B0A0;
          transition: color 0.2s;
          border-radius: 0 12px 12px 0;
          flex-shrink: 0;
          line-height: 0;
        }
        .pw-toggle:hover { color: #F0A500; }
        .pw-toggle svg {
          display: block;
          pointer-events: none;
        }

        /* Remember row */
        .remember-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .custom-checkbox {
          appearance: none;
          width: 16px; height: 16px;
          border: 1.5px solid #C8C0B0;
          border-radius: 4px;
          background: #F8F7F3;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          position: relative;
        }
        .custom-checkbox:checked {
          background: #F0A500;
          border-color: #F0A500;
        }
        .custom-checkbox:checked::after {
          content: '';
          display: block;
          width: 4px; height: 7px;
          border: 2px solid #FFFFFF;
          border-top: none; border-left: none;
          position: absolute;
          top: 1px; left: 5px;
          transform: rotate(45deg);
        }
        .remember-label {
          font-size: 13px;
          font-weight: 600;
          color: #888880;
          cursor: pointer;
        }

        /* Submit */
        .submit-btn {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #F0A500;
          border: none;
          border-radius: 12px;
          padding: 15px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 800;
          color: #1A1A1A;
          letter-spacing: 0.04em;
          cursor: pointer;
          text-transform: uppercase;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(240,165,0,0.25);
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%);
          pointer-events: none;
        }
        .submit-btn:hover:not(:disabled) {
          background: #E09800;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(240,165,0,0.35);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .form-footer {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #ECEAE3;
          text-align: center;
        }
        @media (min-width: 1024px) {
          .form-footer { text-align: left; }
        }
        .form-footer-text {
          font-size: 12px;
          font-weight: 600;
          color: #AAAAAA;
          margin: 0;
        }
        .form-footer-link {
          color: #C87A00;
          font-weight: 800;
          text-decoration: none;
        }
        .form-footer-link:hover { color: #E09800; text-decoration: underline; }

        .version-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #C8C0B0;
          margin-top: 12px;
        }
        .version-badge-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #C8C0B0;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div className="login-root">

        {/* =========================================================
            LEFT PANE
            ========================================================= */}
        <div className="left-pane">
          <div className="grid-bg" />
          <div className="noise" />
          <div className="orb-1" />
          <div className="orb-2" />
          <div className="accent-number" aria-hidden>50</div>

          {/* TOP: LOGO + HEADLINE */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div className="desktop-logo">
              <img
                src="/images/marusindologo.png"
                alt="PT Marusindo"
                style={{
                  height: '56px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            <div className="tag-pill">
              <span className="tag-pill-dot" />
              Enterprise Asset Platform
            </div>
            <h1 className="left-heading">
              Monitoring Aset &<br />
              <span>Inspeksi Berkala</span>
            </h1>
            <p className="left-desc">
              MARIS Enterprise memastikan seluruh peralatan perusahaan Anda terpantau, terkalibrasi, dan memenuhi standar K3 tanpa terlewat tenggat waktu.
            </p>
            <div className="divider-line" />
            <div className="stats-row">
              <StatCard value="40+" label="Perusahaan" />
              <StatCard value="99.8%" label="Uptime" />
              <StatCard value="<1d" label="Respons" />
            </div>
          </div>

          {/* BOTTOM: TESTIMONIAL */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div className="testimonial">
              <p className="testimonial-text">
                "Sistem peringatan dini dari Marusindo menyelamatkan pabrik kami dari denda keterlambatan perpanjangan izin alat berat."
              </p>
              <div className="testimonial-footer">
                <div className="avatar-stack">
                  <div className="avatar a1">PT</div>
                  <div className="avatar a2">CV</div>
                  <div className="avatar a3">+8</div>
                </div>
                <span className="trust-text">Dipercaya <strong>40+ Perusahaan</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT PANE: FORM
            ========================================================= */}
        <div className="right-pane">
          <div className="form-wrap">

            {/* Mobile logo */}
            <div className="mobile-logo">
              <div className="mobile-logo-lockup">
                <img
                  src="/images/marusindologo.png"
                  alt="PT Marusindo"
                  style={{
                    height: '48px',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
            </div>

            <p className="form-eyebrow">// Marusindo Integrated System</p>
            <h2 className="form-title">Selamat<br />Datang.</h2>
            <p className="form-subtitle">Masuk ke dasbor monitoring Anda.</p>

            {/* Error */}
            {error && (
              <div className="error-box">
                <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="email">Email Perusahaan</label>
                <input
                  id="email"
                  className="field-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="password">Kata Sandi</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    className="field-input field-input--pw"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="remember-row">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="custom-checkbox"
                />
                <label htmlFor="remember-me" className="remember-label">Ingat saya di perangkat ini</label>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading
                  ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                  : "Masuk ke Sistem →"
                }
              </button>
            </form>

            <div className="form-footer">
              <p className="form-footer-text">
                Butuh bantuan?{" "}
                <a href="#" className="form-footer-link">Hubungi Administrator Marusindo</a>
              </p>
              <div className="version-badge">
                <span className="version-badge-dot" />
                M-Track v2.4.1 · Secure Connection by SYK
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}