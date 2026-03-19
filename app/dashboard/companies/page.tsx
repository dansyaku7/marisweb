"use client";

import React, { useEffect, useState } from "react";
import {
  Building2, Plus, Mail, Key, Loader2,
  Search, AlertCircle, CheckCircle2, ShieldAlert,
  Pencil, Trash2, X
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  emailPic: string;
  isActive: boolean;
  createdAt: string;
  _count: { equipments: number };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", emailPic: "", password: "" });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [editData, setEditData] = useState({ name: "", emailPic: "", isActive: true });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat data");
      setCompanies(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membuat klien");
      setFormData({ name: "", emailPic: "", password: "" });
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (company: Company) => {
    setEditTarget(company);
    setEditData({ name: company.name, emailPic: company.emailPic, isActive: company.isActive });
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsEditSubmitting(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/companies/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperbarui klien");
      setIsEditOpen(false);
      setEditTarget(null);
      fetchCompanies();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const openDelete = (company: Company) => {
    setDeleteTarget(company);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/companies/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus klien");
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchCompanies();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <style>{`
        .cp-root * { box-sizing: border-box; }
        .cp-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        @keyframes cp-fadeup {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cp-spin { to { transform: rotate(360deg); } }
        @keyframes cp-modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .cp-inner {
          padding: 28px 20px;
          max-width: 1280px;
          margin: 0 auto;
          animation: cp-fadeup 0.4s ease both;
        }
        @media (min-width: 768px)  { .cp-inner { padding: 40px 32px; } }
        @media (min-width: 1024px) { .cp-inner { padding: 48px 48px; } }

        /* ---- PAGE HEADER ---- */
        .cp-page-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 32px;
        }
        .cp-eyebrow {
          font-size: 10px;
          font-weight: 500;
          color: #C87A00;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 8px;
        }
        .cp-page-title {
          font-size: clamp(20px, 3.5vw, 26px);
          font-weight: 700;
          color: #1A1A1A;
          margin: 0 0 6px 0;
          line-height: 1.15;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cp-title-icon {
          width: 36px; height: 36px;
          background: rgba(240,165,0,0.08);
          border: 1.5px solid rgba(240,165,0,0.18);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #C87A00;
          flex-shrink: 0;
        }
        .cp-page-desc {
          font-size: 13px;
          font-weight: 400;
          color: #AAAAAA;
          margin: 0;
          max-width: 520px;
          line-height: 1.6;
        }
        .cp-add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          background: #F0A500;
          border: none;
          border-radius: 10px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: #1A1A1A;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(240,165,0,0.2);
        }
        .cp-add-btn:hover { background: #E09800; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(240,165,0,0.28); }
        .cp-add-btn:active { transform: translateY(0); }

        .cp-divider {
          height: 1px;
          background: linear-gradient(90deg, #F0A500 0%, transparent 60%);
          margin-bottom: 28px;
          opacity: 0.2;
        }
        .cp-error-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(220,60,60,0.06);
          border: 1px solid rgba(220,60,60,0.15);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 24px;
          font-size: 13px;
          font-weight: 400;
          color: #DC3C3C;
        }

        /* ---- TABLE CARD ---- */
        .cp-table-card {
          background: #FFFFFF;
          border: 1.5px solid #E8E4DC;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.05);
        }
        .cp-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid #F0EDE4;
          background: #FAFAF7;
          flex-wrap: wrap;
        }
        .cp-search-wrap { position: relative; flex: 1; min-width: 180px; max-width: 360px; }
        .cp-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #BBBBBB; pointer-events: none; }
        .cp-search-input {
          width: 100%;
          padding: 9px 14px 9px 36px;
          background: #FFFFFF;
          border: 1.5px solid #E5E2D8;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 400;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          caret-color: #F0A500;
        }
        .cp-search-input::placeholder { color: #CCCCCC; }
        .cp-search-input:focus { border-color: rgba(240,165,0,0.35); box-shadow: 0 0 0 3px rgba(240,165,0,0.08); }

        .cp-total-badge {
          font-size: 11px;
          font-weight: 400;
          color: #AAAAAA;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }
        .cp-total-badge strong { color: #C87A00; font-weight: 600; }

        .cp-table { width: 100%; border-collapse: collapse; text-align: left; }
        .cp-table thead tr { border-bottom: 1px solid #F0EDE4; }
        .cp-table thead th {
          padding: 12px 20px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #AAAAAA;
          white-space: nowrap;
          background: #FAFAF7;
        }
        .cp-table tbody tr { border-bottom: 1px solid #F5F3EE; transition: background 0.15s; }
        .cp-table tbody tr:last-child { border-bottom: none; }
        .cp-table tbody tr:hover td { background: #FDFCF8; }
        .cp-table td { padding: 14px 20px; vertical-align: middle; }

        .cp-company-name { font-size: 13px; font-weight: 600; color: #1A1A1A; }
        .cp-email-cell { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 400; color: #AAAAAA; font-family: monospace; }
        .cp-unit-badge {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 3px 10px;
          background: #F5F3EE;
          border: 1px solid #E8E4DC;
          border-radius: 999px;
          font-size: 11px; font-weight: 400; color: #888880;
        }
        .cp-status-active {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px;
          background: rgba(34,160,100,0.07); border: 1px solid rgba(34,160,100,0.18);
          border-radius: 999px;
          font-size: 10px; font-weight: 500; color: #22A064; white-space: nowrap;
        }
        .cp-status-suspend {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px;
          background: rgba(220,60,60,0.06); border: 1px solid rgba(220,60,60,0.15);
          border-radius: 999px;
          font-size: 10px; font-weight: 500; color: #DC3C3C; white-space: nowrap;
        }
        .cp-date-cell { font-size: 12px; font-weight: 400; color: #BBBBBB; white-space: nowrap; font-family: monospace; }

        /* ---- ACTION BUTTONS ---- */
        .cp-action-cell { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
        .cp-btn-edit {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px;
          border-radius: 7px;
          background: #F5F3EE;
          border: 1.5px solid #E5E2D8;
          color: #AAAAAA;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .cp-btn-edit:hover { background: rgba(240,165,0,0.08); border-color: rgba(240,165,0,0.25); color: #C87A00; }
        .cp-btn-delete {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px;
          border-radius: 7px;
          background: #F5F3EE;
          border: 1.5px solid #E5E2D8;
          color: #CCCCCC;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .cp-btn-delete:hover { background: rgba(220,60,60,0.07); border-color: rgba(220,60,60,0.18); color: #DC3C3C; }

        /* Empty / loading */
        .cp-empty-cell { padding: 64px 20px; text-align: center; }
        .cp-empty-icon {
          width: 52px; height: 52px;
          background: #F5F3EE; border: 1.5px solid #E5E2D8; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px; color: #CCCCCC;
        }
        .cp-empty-title { font-size: 14px; font-weight: 600; color: #555; margin: 0 0 6px 0; }
        .cp-empty-desc  { font-size: 12px; font-weight: 400; color: #AAAAAA; margin: 0; }
        .cp-spinner { animation: cp-spin 1s linear infinite; }

        /* ---- SHARED MODAL ---- */
        .cp-modal-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .cp-modal-bg { position: absolute; inset: 0; background: rgba(0,0,0,0.25); backdrop-filter: blur(6px); }
        .cp-modal {
          position: relative; background: #FFFFFF; border: 1.5px solid #EAE7DF; border-radius: 20px;
          width: 100%; max-width: 480px; overflow: hidden;
          box-shadow: 0 24px 60px rgba(0,0,0,0.12);
          animation: cp-modal-in 0.2s ease both;
        }
        .cp-modal-sm {
          position: relative; background: #FFFFFF; border: 1.5px solid #EAE7DF; border-radius: 20px;
          width: 100%; max-width: 360px; overflow: hidden;
          box-shadow: 0 24px 60px rgba(0,0,0,0.12);
          animation: cp-modal-in 0.2s ease both;
        }
        .cp-modal-header {
          padding: 20px 24px 18px;
          border-bottom: 1px solid #F0EDE4;
          background: #FAFAF7;
          display: flex; align-items: center; justify-content: space-between;
        }
        .cp-modal-title { font-size: 15px; font-weight: 700; color: #1A1A1A; margin: 0 0 3px 0; }
        .cp-modal-subtitle { font-size: 12px; font-weight: 400; color: #AAAAAA; margin: 0; }
        .cp-modal-close {
          width: 28px; height: 28px;
          background: #F0EDE4; border: 1.5px solid #E5E2D8; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          color: #AAAAAA; cursor: pointer; flex-shrink: 0;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .cp-modal-close:hover { color: #555; border-color: #C8C0B0; background: #E8E4DC; }
        .cp-modal-body { padding: 20px 24px; }

        .cp-form-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: rgba(220,60,60,0.06); border: 1px solid rgba(220,60,60,0.15);
          border-radius: 9px; padding: 11px 13px; margin-bottom: 18px;
          font-size: 12px; font-weight: 400; color: #DC3C3C;
        }

        .cp-field { margin-bottom: 16px; }
        .cp-field-label { display: block; font-size: 11px; font-weight: 600; color: #555550; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 7px; }
        .cp-field-wrap { position: relative; }
        .cp-field-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #CCCCCC; pointer-events: none; }
        .cp-field-input {
          width: 100%; padding: 11px 14px 11px 38px;
          background: #F8F7F3; border: 1.5px solid #E5E2D8; border-radius: 10px;
          font-family: inherit; font-size: 14px; font-weight: 400; color: #1A1A1A;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          caret-color: #F0A500;
        }
        .cp-field-input::placeholder { color: #C8C0B0; }
        .cp-field-input:focus { border-color: rgba(240,165,0,0.4); background: #FFFFFF; box-shadow: 0 0 0 3px rgba(240,165,0,0.08); }
        .cp-field-hint { font-size: 11px; font-weight: 400; color: #BBBBBB; margin-top: 6px; letter-spacing: 0.02em; }

        /* Toggle switch */
        .cp-toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px;
          background: #F8F7F3; border: 1.5px solid #E5E2D8; border-radius: 10px;
          margin-bottom: 16px;
        }
        .cp-toggle-label { font-size: 13px; font-weight: 600; color: #555550; }
        .cp-toggle-sub { font-size: 11px; color: #BBBBBB; margin-top: 2px; font-weight: 400; }
        .cp-switch { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
        .cp-switch input { opacity: 0; width: 0; height: 0; }
        .cp-switch-track {
          position: absolute; inset: 0;
          border-radius: 999px; background: #E5E2D8; border: 1.5px solid #D8D4C8;
          cursor: pointer; transition: background 0.2s, border-color 0.2s;
        }
        .cp-switch-track::after {
          content: ''; position: absolute; left: 3px; top: 50%; transform: translateY(-50%);
          width: 14px; height: 14px; background: #BBBBBB; border-radius: 50%;
          transition: left 0.2s, background 0.2s;
        }
        .cp-switch input:checked + .cp-switch-track { background: rgba(240,165,0,0.15); border-color: rgba(240,165,0,0.35); }
        .cp-switch input:checked + .cp-switch-track::after { left: 21px; background: #F0A500; }

        .cp-modal-actions { display: flex; gap: 10px; padding: 0 24px 20px; }
        .cp-btn-cancel {
          flex: 1; padding: 11px;
          background: #F5F3EE; border: 1.5px solid #E5E2D8; border-radius: 10px;
          font-family: inherit; font-size: 13px; font-weight: 500; color: #888880;
          cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .cp-btn-cancel:hover:not(:disabled) { background: #EDEAE3; color: #333; }
        .cp-btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

        .cp-btn-submit {
          flex: 1; padding: 11px; background: #F0A500; border: none; border-radius: 10px;
          font-family: inherit; font-size: 13px; font-weight: 600; color: #1A1A1A;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: background 0.2s, transform 0.15s;
          box-shadow: 0 4px 14px rgba(240,165,0,0.2);
        }
        .cp-btn-submit:hover:not(:disabled) { background: #E09800; transform: translateY(-1px); }
        .cp-btn-submit:active:not(:disabled) { transform: translateY(0); }
        .cp-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .cp-btn-delete-confirm {
          flex: 1; padding: 11px;
          background: rgba(220,60,60,0.07); border: 1.5px solid rgba(220,60,60,0.18); border-radius: 10px;
          font-family: inherit; font-size: 13px; font-weight: 600; color: #DC3C3C;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: background 0.15s, border-color 0.15s;
        }
        .cp-btn-delete-confirm:hover:not(:disabled) { background: rgba(220,60,60,0.13); border-color: rgba(220,60,60,0.3); }
        .cp-btn-delete-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Delete modal */
        .cp-delete-body { padding: 28px 24px 20px; text-align: center; }
        .cp-delete-icon {
          width: 52px; height: 52px;
          background: rgba(220,60,60,0.07); border: 1.5px solid rgba(220,60,60,0.15); border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px; color: #DC3C3C;
        }
        .cp-delete-title { font-size: 16px; font-weight: 700; color: #1A1A1A; margin: 0 0 8px 0; }
        .cp-delete-desc { font-size: 13px; font-weight: 400; color: #AAAAAA; line-height: 1.6; margin: 0; }
        .cp-delete-target {
          display: inline-block; margin-top: 12px;
          font-size: 12px; color: #C87A00; font-family: monospace;
          background: rgba(240,165,0,0.07); border: 1px solid rgba(240,165,0,0.18);
          border-radius: 6px; padding: 3px 10px; font-weight: 500;
        }
      `}</style>

      <div className="cp-root" style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div className="cp-inner">

          {/* ---- PAGE HEADER ---- */}
          <div className="cp-page-header">
            <div>
              <p className="cp-eyebrow">// Client Management</p>
              <h1 className="cp-page-title">
                <span className="cp-title-icon"><Building2 size={18} /></span>
                Manajemen Klien
              </h1>
              <p className="cp-page-desc">
                Kelola daftar perusahaan klien M-Track. Buat akun akses baru agar mereka dapat memantau alat berat masing-masing.
              </p>
            </div>
            <button className="cp-add-btn" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Tambah Klien
            </button>
          </div>

          <div className="cp-divider" />

          {errorMsg && (
            <div className="cp-error-bar">
              <ShieldAlert size={16} style={{ flexShrink: 0 }} /> {errorMsg}
            </div>
          )}

          {/* ---- TABLE ---- */}
          <div className="cp-table-card">
            <div className="cp-toolbar">
              <div className="cp-search-wrap">
                <Search size={15} className="cp-search-icon" />
                <input type="text" placeholder="Cari nama perusahaan..." className="cp-search-input" />
              </div>
              <span className="cp-total-badge">Total: <strong>{companies.length}</strong> Klien</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Nama Perusahaan</th>
                    <th>Email PIC</th>
                    <th style={{ textAlign: "center" }}>Total Alat</th>
                    <th>Status</th>
                    <th>Terdaftar</th>
                    <th style={{ textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6}>
                      <div className="cp-empty-cell">
                        <Loader2 size={26} className="cp-spinner" style={{ color: "#F0A500", margin: "0 auto 12px", display: "block" }} />
                        <p className="cp-empty-desc">Memuat data klien...</p>
                      </div>
                    </td></tr>
                  ) : companies.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="cp-empty-cell">
                        <div className="cp-empty-icon"><Building2 size={22} /></div>
                        <p className="cp-empty-title">Belum ada klien</p>
                        <p className="cp-empty-desc">Klik tombol Tambah Klien untuk memulai.</p>
                      </div>
                    </td></tr>
                  ) : companies.map((company) => (
                    <tr key={company.id}>
                      <td><span className="cp-company-name">{company.name}</span></td>
                      <td>
                        <span className="cp-email-cell">
                          <Mail size={12} style={{ color: "#CCCCCC", flexShrink: 0 }} />
                          {company.emailPic}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="cp-unit-badge">{company._count.equipments} Unit</span>
                      </td>
                      <td>
                        {company.isActive
                          ? <span className="cp-status-active"><CheckCircle2 size={10} /> Aktif</span>
                          : <span className="cp-status-suspend"><AlertCircle size={10} /> Suspend</span>
                        }
                      </td>
                      <td className="cp-date-cell">
                        {new Date(company.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <div className="cp-action-cell">
                          <button className="cp-btn-edit" onClick={() => openEdit(company)} title="Edit klien">
                            <Pencil size={13} />
                          </button>
                          <button className="cp-btn-delete" onClick={() => openDelete(company)} title="Hapus klien">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================
          MODAL: TAMBAH KLIEN
          ============================================================ */}
      {isModalOpen && (
        <div className="cp-modal-overlay">
          <div className="cp-modal-bg" onClick={() => !isSubmitting && setIsModalOpen(false)} />
          <div className="cp-modal">
            <div className="cp-modal-header">
              <div>
                <h3 className="cp-modal-title">Pendaftaran Klien Baru</h3>
                <p className="cp-modal-subtitle">Sistem akan membuat akun akses otomatis.</p>
              </div>
              <button className="cp-modal-close" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}><X size={14} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="cp-modal-body">
                {formError && <div className="cp-form-error"><AlertCircle size={14} style={{ flexShrink: 0 }} />{formError}</div>}
                <div className="cp-field">
                  <label className="cp-field-label">Nama Perusahaan / PT</label>
                  <div className="cp-field-wrap">
                    <Building2 size={14} className="cp-field-icon" />
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Contoh: PT. Delta Anugerah" className="cp-field-input" />
                  </div>
                </div>
                <div className="cp-field">
                  <label className="cp-field-label">Email Akses (PIC)</label>
                  <div className="cp-field-wrap">
                    <Mail size={14} className="cp-field-icon" />
                    <input type="email" required value={formData.emailPic} onChange={(e) => setFormData({ ...formData, emailPic: e.target.value })} placeholder="pic@perusahaan.com" className="cp-field-input" />
                  </div>
                </div>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-field-label">Kata Sandi Awal</label>
                  <div className="cp-field-wrap">
                    <Key size={14} className="cp-field-icon" />
                    <input type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Minimal 6 karakter" className="cp-field-input" />
                  </div>
                  <p className="cp-field-hint">Klien bisa mengubah kata sandi ini setelah login.</p>
                </div>
              </div>
              <div className="cp-modal-actions">
                <button type="button" className="cp-btn-cancel" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="cp-btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={15} className="cp-spinner" /> : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: EDIT KLIEN
          ============================================================ */}
      {isEditOpen && editTarget && (
        <div className="cp-modal-overlay">
          <div className="cp-modal-bg" onClick={() => !isEditSubmitting && setIsEditOpen(false)} />
          <div className="cp-modal">
            <div className="cp-modal-header">
              <div>
                <h3 className="cp-modal-title">Edit Data Klien</h3>
                <p className="cp-modal-subtitle">Perbarui informasi perusahaan klien.</p>
              </div>
              <button className="cp-modal-close" onClick={() => setIsEditOpen(false)} disabled={isEditSubmitting}><X size={14} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="cp-modal-body">
                {editError && <div className="cp-form-error"><AlertCircle size={14} style={{ flexShrink: 0 }} />{editError}</div>}
                <div className="cp-field">
                  <label className="cp-field-label">Nama Perusahaan / PT</label>
                  <div className="cp-field-wrap">
                    <Building2 size={14} className="cp-field-icon" />
                    <input type="text" required value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Nama perusahaan" className="cp-field-input" />
                  </div>
                </div>
                <div className="cp-field">
                  <label className="cp-field-label">Email Akses (PIC)</label>
                  <div className="cp-field-wrap">
                    <Mail size={14} className="cp-field-icon" />
                    <input type="email" required value={editData.emailPic} onChange={(e) => setEditData({ ...editData, emailPic: e.target.value })} placeholder="pic@perusahaan.com" className="cp-field-input" />
                  </div>
                </div>
                <div className="cp-toggle-row">
                  <div>
                    <p className="cp-toggle-label">Status Akun</p>
                    <p className="cp-toggle-sub">{editData.isActive ? "Aktif — klien bisa login" : "Suspend — akses diblokir"}</p>
                  </div>
                  <label className="cp-switch">
                    <input type="checkbox" checked={editData.isActive} onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })} />
                    <span className="cp-switch-track" />
                  </label>
                </div>
              </div>
              <div className="cp-modal-actions">
                <button type="button" className="cp-btn-cancel" onClick={() => setIsEditOpen(false)} disabled={isEditSubmitting}>Batal</button>
                <button type="submit" className="cp-btn-submit" disabled={isEditSubmitting}>
                  {isEditSubmitting ? <Loader2 size={15} className="cp-spinner" /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: HAPUS KLIEN
          ============================================================ */}
      {isDeleteOpen && deleteTarget && (
        <div className="cp-modal-overlay">
          <div className="cp-modal-bg" onClick={() => !isDeleting && setIsDeleteOpen(false)} />
          <div className="cp-modal-sm">
            <div className="cp-delete-body">
              <div className="cp-delete-icon"><Trash2 size={22} /></div>
              <h3 className="cp-delete-title">Hapus Klien?</h3>
              <p className="cp-delete-desc">
                Tindakan ini tidak bisa dibatalkan. Seluruh data alat berat milik klien ini juga akan ikut terhapus.
              </p>
              <span className="cp-delete-target">{deleteTarget.name}</span>
              {deleteError && (
                <div className="cp-form-error" style={{ marginTop: 16, textAlign: "left" }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />{deleteError}
                </div>
              )}
            </div>
            <div className="cp-modal-actions">
              <button className="cp-btn-cancel" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Batal</button>
              <button className="cp-btn-delete-confirm" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 size={15} className="cp-spinner" /> : <><Trash2 size={14} /> Hapus</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}