"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldCheck, AlertTriangle, XOctagon, Wrench, ArrowRight } from "lucide-react";
import Link from "next/link";

// ---- STAT CARD COMPONENT ----
type CardVariant = "neutral" | "safe" | "warning" | "danger";

interface KpiCardProps {
  variant: CardVariant;
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  subtext: string;
  pulse?: boolean;
  delay?: string;
}

const variantStyles: Record<CardVariant, { border: string; iconBg: string; iconColor: string; labelColor: string; subtextColor: string; accent: string; glowColor: string; bg: string }> = {
  neutral: {
    bg: "#FFFFFF",
    border: "#E8E4DC",
    iconBg: "rgba(0,0,0,0.04)",
    iconColor: "#999990",
    labelColor: "#888880",
    subtextColor: "#AAAAAA",
    accent: "#D8D4C8",
    glowColor: "transparent",
  },
  safe: {
    bg: "#FAFFF8",
    border: "rgba(34,160,100,0.18)",
    iconBg: "rgba(34,160,100,0.08)",
    iconColor: "#22A064",
    labelColor: "#22A064",
    subtextColor: "#5AAA80",
    accent: "#22A064",
    glowColor: "rgba(34,160,100,0.03)",
  },
  warning: {
    bg: "#FFFDF5",
    border: "rgba(240,165,0,0.25)",
    iconBg: "rgba(240,165,0,0.1)",
    iconColor: "#C87A00",
    labelColor: "#C87A00",
    subtextColor: "#B08020",
    accent: "#F0A500",
    glowColor: "rgba(240,165,0,0.04)",
  },
  danger: {
    bg: "#FFF8F8",
    border: "rgba(220,60,60,0.18)",
    iconBg: "rgba(220,60,60,0.08)",
    iconColor: "#DC3C3C",
    labelColor: "#DC3C3C",
    subtextColor: "#B05050",
    accent: "#DC3C3C",
    glowColor: "rgba(220,60,60,0.03)",
  },
};

function KpiCard({ variant, icon, label, value, unit, subtext, pulse = false, delay = "0s" }: KpiCardProps) {
  const s = variantStyles[variant];
  return (
    <div
      style={{
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        borderRadius: 16,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        animation: `fadeSlideUp 0.5s ease both`,
        animationDelay: delay,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}
    >
      {/* Glow bg */}
      <div style={{ position: "absolute", inset: 0, background: s.glowColor, pointerEvents: "none" }} />

      {/* Corner accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: s.accent, opacity: 0.6, borderRadius: "16px 0 0 16px" }} />

      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div style={{ padding: 10, background: s.iconBg, borderRadius: 10, color: s.iconColor, display: "flex" }}>
          {icon}
        </div>
        {pulse && (
          <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, marginTop: 4 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#F0A500", opacity: 0.6, animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite" }} />
            <span style={{ position: "relative", display: "inline-flex", borderRadius: "50%", width: 10, height: 10, background: "#F0A500" }} />
          </span>
        )}
      </div>

      {/* Bottom content */}
      <div style={{ marginTop: 20, position: "relative" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: s.labelColor, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px 0" }}>{label}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: "#1A1A1A", lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: 13, color: "#AAAAAA", fontWeight: 500 }}>{unit}</span>
        </div>
        <p style={{ fontSize: 12, color: s.subtextColor, marginTop: 8, fontWeight: 400 }}>{subtext}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<{ name?: string; companyName?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    safe: 0,
    warning: 0,
    expired: 0,
  });

  const [urgentEquipments, setUrgentEquipments] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");
    let currentUserRole = null;
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserProfile(parsedUser);
      currentUserRole = parsedUser.role;
    }

    const fetchDashboardData = async () => {
      try {
        const statsResponse = await fetch("/api/dashboard/stats");
        if (!statsResponse.ok) throw new Error(`Stats HTTP ${statsResponse.status}`);
        const statsData = await statsResponse.json();
        setStats(statsData);

        const eqResponse = await fetch("/api/equipments");
        if (eqResponse.ok) {
          let eqData = await eqResponse.json();
          eqData.sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
          setUrgentEquipments(eqData.slice(0, 5));
        }
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusUI = (expiryDate: string) => {
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)   return { label: "Kedaluwarsa", variant: "danger",   icon: XOctagon,      days: diffDays };
    if (diffDays <= 60) return { label: "Warning",     variant: "warning",  icon: AlertTriangle, days: diffDays };
    return                     { label: "Aman",        variant: "safe",     icon: ShieldCheck,   days: diffDays };
  };

  if (loading)
    return (
      <div style={{ display: "flex", height: "80vh", alignItems: "center", justifyContent: "center", background: "#FAFAF8" }}>
        <Loader2 style={{ width: 36, height: 36, color: "#F0A500", animation: "spin 1s linear infinite" }} />
      </div>
    );

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <style>{`
        .db-root * { box-sizing: border-box; }
        .db-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .kpi-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 640px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }

        .db-inner { padding: 28px 20px; max-width: 1280px; margin: 0 auto; }
        @media (min-width: 768px) { .db-inner { padding: 40px 32px; } }
        @media (min-width: 1024px) { .db-inner { padding: 48px 48px; } }

        .db-header { animation: fadeSlideUp 0.4s ease both; }
        .db-section-title { animation: fadeSlideUp 0.4s ease 0.2s both; }
        .db-table-anim { animation: fadeSlideUp 0.5s ease 0.4s both; }

        .db-divider {
          height: 1px;
          background: linear-gradient(90deg, #F0A500 0%, transparent 60%);
          margin: 32px 0;
          opacity: 0.25;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(240,165,0,0.08);
          border: 1px solid rgba(240,165,0,0.2);
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 11px;
          color: #C87A00;
          letter-spacing: 0.04em;
          font-weight: 500;
        }
        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #F0A500;
          animation: ping-soft 2s ease-in-out infinite;
        }
        @keyframes ping-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .company-tag {
          font-size: 12px;
          color: #C87A00;
          background: rgba(240,165,0,0.08);
          border: 1px solid rgba(240,165,0,0.18);
          border-radius: 6px;
          padding: 2px 8px;
          font-weight: 500;
        }

        /* Tabel */
        .db-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E4DC;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.05);
        }
        .db-card-header {
          padding: 16px 24px;
          border-bottom: 1px solid #F0EDE4;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #FAFAF7;
        }
        .db-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #1A1A1A;
          margin: 0;
        }
        .db-card-link {
          font-size: 12px;
          color: #C87A00;
          text-decoration: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: 0.2s;
        }
        .db-card-link:hover { color: #F0A500; transform: translateX(2px); }

        .db-table { width: 100%; border-collapse: collapse; text-align: left; }
        .db-table th {
          padding: 12px 24px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #AAAAAA;
          font-weight: 500;
          border-bottom: 1px solid #F0EDE4;
          background: #FAFAF7;
        }
        .db-table td {
          padding: 16px 24px;
          border-bottom: 1px solid #F5F3EE;
          vertical-align: middle;
        }
        .db-table tr:hover td { background: #FDFCF8; }
        .db-table tr:last-child td { border-bottom: none; }

        .eq-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
          margin-top: 5px;
        }
        .eq-badge.safe    { background: rgba(34,160,100,0.07);  border: 1px solid rgba(34,160,100,0.2);   color: #22A064; }
        .eq-badge.warning { background: rgba(240,165,0,0.08);   border: 1px solid rgba(240,165,0,0.22);   color: #C87A00; }
        .eq-badge.danger  { background: rgba(220,60,60,0.07);   border: 1px solid rgba(220,60,60,0.18);   color: #DC3C3C; }

        .section-label {
          font-size: 11px;
          color: #BBBBBB;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 500;
        }
        .section-line { flex: 1; height: 1px; background: #EDEAE3; }
      `}</style>

      <div className="db-root" style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div className="db-inner">

          {/* ---- HEADER ---- */}
          <div className="db-header" style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div className="status-badge">
                    <span className="status-dot" />
                    Live Monitoring
                  </div>
                </div>
                <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: "#1A1A1A", margin: 0, lineHeight: 1.1 }}>
                  Status Inspeksi &{" "}
                  <span style={{ color: "#F0A500" }}>Perizinan</span>
                </h1>
                <p style={{ marginTop: 8, fontSize: 14, color: "#999990", fontWeight: 400 }}>
                  Ringkasan pemantauan alat berat untuk{" "}
                  <span className="company-tag">{userProfile?.companyName ?? "—"}</span>
                </p>
              </div>

              {/* Date badge */}
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: 'monospace', fontSize: 11, color: "#BBBBBB", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0, fontWeight: 500 }}>{dateStr}</p>
                <p style={{ fontFamily: 'monospace', fontSize: 11, color: "#C87A00", opacity: 0.8, margin: "4px 0 0 0", fontWeight: 500 }}>
                  {userProfile?.name ? `// ${userProfile.name}` : "// MARUSINDO"}
                </p>
              </div>
            </div>

            <div className="db-divider" />
          </div>

          {/* ---- SECTION LABEL ---- */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }} className="db-section-title">
            <span className="section-label">// KPI Overview</span>
            <div className="section-line" />
          </div>

          {/* ---- KPI CARDS ---- */}
          <div className="kpi-grid" style={{ marginBottom: 36 }}>
            <KpiCard
              variant="neutral"
              icon={<Wrench size={20} />}
              label="Total Alat Dipantau"
              value={stats.total}
              unit="Unit"
              subtext="Seluruh aset terdaftar"
              delay="0.1s"
            />
            <KpiCard
              variant="safe"
              icon={<ShieldCheck size={20} />}
              label="Status Aman"
              value={stats.safe}
              unit="Unit"
              subtext="Lisensi valid > 60 hari"
              delay="0.2s"
            />
            <KpiCard
              variant="warning"
              icon={<AlertTriangle size={20} />}
              label="Segera Perpanjang"
              value={stats.warning}
              unit="Unit"
              subtext="Jatuh tempo ≤ 60 hari"
              pulse={stats.warning > 0}
              delay="0.3s"
            />
            <KpiCard
              variant="danger"
              icon={<XOctagon size={20} />}
              label="Kedaluwarsa"
              value={stats.expired}
              unit="Unit"
              subtext="Izin operasi tidak valid"
              delay="0.4s"
            />
          </div>

          {/* ---- SECTION LABEL ---- */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }} className="db-section-title">
            <span className="section-label">// Urgent Action Required</span>
            <div className="section-line" />
          </div>

          {/* ---- URGENT TABLE ---- */}
          <div className="db-card db-table-anim">
            <div className="db-card-header">
              <h3 className="db-card-title">Alat-alat butuh pembaruan</h3>
              <Link href="/dashboard/equipments" className="db-card-link">
                Lihat Semua Data <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ overflowX: "auto" }}>
              {urgentEquipments.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#BBBBBB" }}>
                  <ShieldCheck size={32} style={{ margin: "0 auto 12px", color: "#22A064", opacity: 0.5 }} />
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#555" }}>Tidak ada alat dalam status kritis</p>
                  <p style={{ fontSize: 12, marginTop: 4, color: "#AAAAAA", fontWeight: 400 }}>Semua perizinan masih aman.</p>
                </div>
              ) : (
                <table className="db-table">
                  <thead>
                    <tr>
                      {userProfile?.role === "SUPERADMIN" && <th>Klien</th>}
                      <th>Alat & Izin</th>
                      <th>Lokasi</th>
                      <th style={{ textAlign: "right" }}>Tgl Kedaluwarsa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgentEquipments.map((eq: any) => {
                      const status = getStatusUI(eq.expiryDate);
                      const StatusIcon = status.icon;
                      return (
                        <tr key={eq.id}>
                          {userProfile?.role === "SUPERADMIN" && (
                            <td>
                              <span style={{ fontSize: 12, fontWeight: 500, color: "#666" }}>
                                {eq.company?.name || "N/A"}
                              </span>
                            </td>
                          )}
                          <td>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", margin: "0 0 4px 0" }}>{eq.name}</p>
                            <p style={{ fontFamily: 'monospace', fontSize: 11, color: "#AAAAAA", margin: 0 }}>
                              Izin: {eq.permitNumber}
                            </p>
                          </td>
                          <td>
                            <p style={{ fontSize: 12, color: "#888880", margin: 0, fontWeight: 400 }}>{eq.location || "-"}</p>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "#333", margin: "0 0 4px 0" }}>
                              {new Date(eq.expiryDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                            <span className={`eq-badge ${status.variant}`}>
                              <StatusIcon size={10} /> {status.label} ({status.days < 0 ? "Lewat" : `${status.days}hr`})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}