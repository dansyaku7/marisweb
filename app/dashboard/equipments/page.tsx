"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Wrench, Building2, Search, Loader2, FileUp,
  AlertTriangle, ShieldCheck, XOctagon, ChevronRight,
  Link as LinkIcon, Image as ImageIcon, CheckCircle2, FileText,
  Download, Edit, Trash2, ChevronLeft, Plus, Send, MailWarning
} from "lucide-react";
import * as XLSX from "xlsx-js-style";

interface Company { id: string; name: string; }
interface Equipment {
  id: string; name: string; permitNumber: string; serialNumber: string;
  location: string | null; inspectionDate: string; expiryDate: string;
  certificateUrl?: string | null;
}

export default function EquipmentsPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [searchCompanyText, setSearchCompanyText] = useState("");
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoadingEq, setIsLoadingEq] = useState(false);
  const [searchEqText, setSearchEqText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [activeEq, setActiveEq] = useState<Equipment | null>(null);
  const [certMode, setCertMode] = useState<"link" | "upload">("link");
  const [certLinkData, setCertLinkData] = useState("");
  const [certFileData, setCertFileData] = useState<File | null>(null);
  const [isSubmittingCert, setIsSubmittingCert] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEq, setNewEq] = useState({ name: "", location: "", permitNumber: "", serialNumber: "", inspectionDate: "", expiryDate: "" });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [isNotifyingBulkAll, setIsNotifyingBulkAll] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserRole(parsed.role);
      if (parsed.role === "SUPERADMIN") fetchCompanies();
      else fetchEquipments(null);
    }
  }, []);

  useEffect(() => {
    if (selectedCompanyId) { fetchEquipments(selectedCompanyId); setSearchEqText(""); setCurrentPage(1); }
  }, [selectedCompanyId]);

  useEffect(() => { setCurrentPage(1); }, [searchEqText, searchCompanyText]);

  const fetchCompanies = async () => {
    try { const res = await fetch("/api/companies"); if (res.ok) setCompanies(await res.json()); }
    catch (e) { console.error(e); }
  };

  const fetchEquipments = async (companyId: string | null) => {
    setIsLoadingEq(true); setStatusMsg(null);
    try {
      const res = await fetch("/api/equipments");
      if (!res.ok) throw new Error("Gagal memuat data alat");
      let data = await res.json();
      if (userRole === "SUPERADMIN" && companyId) data = data.filter((eq: any) => eq.companyId === companyId);
      setEquipments(data);
    } catch (err: any) { setStatusMsg({ type: "error", text: err.message }); }
    finally { setIsLoadingEq(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompanyId) return;
    setIsUploading(true); setStatusMsg(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
        const mappedEquipments = jsonData.map((row) => ({
          name: row["ALAT"] || row["Nama Alat"] || row["Alat"] || null,
          location: row["LOKASI"] || row["Lokasi"] || null,
          permitNumber: row["NOMOR IZIN"] || row["Nomor Izin"] || null,
          serialNumber: row["NOMOR SERIE"] || row["NOMOR SERI"] || null,
          inspectionDate: parseExcelDate(row["TANGGAL PEMERIKSAAN"] || row["Tanggal Pemeriksaan"]),
          expiryDate: parseExcelDate(row["TANGGAL HABIS"] || row["Tanggal Habis"]),
        }));
        if (mappedEquipments.length === 0) throw new Error("Excel kosong atau format kolom tidak sesuai.");
        const res = await fetch("/api/equipments/bulk", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: selectedCompanyId, equipments: mappedEquipments }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message);
        setStatusMsg({ type: "success", text: resData.message });
        fetchEquipments(selectedCompanyId);
      } catch (err: any) {
        setStatusMsg({ type: "error", text: err.message || "Gagal membaca file Excel." });
      } finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseExcelDate = (excelDate: any) => {
    if (!excelDate) return null;
    if (typeof excelDate === "number") return new Date(Math.round((excelDate - 25569) * 86400 * 1000)).toISOString().split("T")[0];
    const d = new Date(excelDate);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    return excelDate;
  };

  const getStatus = (expiryDate: string) => {
    const diffDays = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)   return { label: "Kedaluwarsa", variant: "danger",  icon: XOctagon,      days: diffDays };
    if (diffDays <= 60) return { label: "Warning",     variant: "warning", icon: AlertTriangle, days: diffDays };
    return                     { label: "Aman",        variant: "safe",    icon: ShieldCheck,   days: diffDays };
  };

  const handleDownloadTemplate = () => {
    const templateData = [{ "ALAT": "CONTOH ALAT (WAJIB)", "LOKASI": "LOKASI PABRIK", "NOMOR IZIN": "123/IZIN/2025", "NOMOR SERIE": "SN-001", "TANGGAL PEMERIKSAAN": "2025-01-01", "TANGGAL HABIS": "2026-01-01" }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    ["A1","B1","C1","D1","E1","F1"].forEach(col => {
      if (worksheet[col]) worksheet[col].s = { fill: { fgColor: { rgb: "F0A500" } }, font: { bold: true, color: { rgb: "1A1A1A" } }, alignment: { horizontal: "center" } };
    });
    worksheet["!cols"] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Import");
    XLSX.writeFile(workbook, "Template_Import_MTrack.xlsx");
  };

  const handleSubmitCertificate = async () => {
    if (!activeEq) return;
    setIsSubmittingCert(true);
    try {
      let finalUrl = "";
      if (certMode === "link") {
        if (!certLinkData) throw new Error("Link URL tidak boleh kosong.");
        finalUrl = certLinkData;
      } else {
        if (!certFileData) throw new Error("Pilih file gambar terlebih dahulu.");
        const formData = new FormData(); formData.append("file", certFileData);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.message || "Gagal upload file.");
        finalUrl = uploadData.url;
      }
      const res = await fetch(`/api/equipments/${activeEq.id}/certificate`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ certificateUrl: finalUrl }) });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Gagal menyimpan sertifikat.");
      fetchEquipments(selectedCompanyId); setIsCertModalOpen(false);
      setStatusMsg({ type: "success", text: "Sertifikat berhasil ditambahkan." });
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmittingCert(false); }
  };

  const handleDeleteEq = async (id: string) => {
    if (!confirm("Anda yakin ingin menghapus alat ini dari database?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/equipments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data alat.");
      setStatusMsg({ type: "success", text: "Alat berhasil dihapus." }); fetchEquipments(selectedCompanyId);
    } catch (err: any) { setStatusMsg({ type: "error", text: err.message }); }
    finally { setDeletingId(null); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingEq) return;
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/equipments/${editingEq.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingEq.name, location: editingEq.location, permitNumber: editingEq.permitNumber, serialNumber: editingEq.serialNumber, inspectionDate: editingEq.inspectionDate, expiryDate: editingEq.expiryDate }) });
      if (!res.ok) throw new Error("Gagal mengupdate data alat.");
      setStatusMsg({ type: "success", text: "Data alat berhasil diperbarui." }); setIsEditModalOpen(false); fetchEquipments(selectedCompanyId);
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmittingEdit(false); }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedCompanyId) return;
    setIsSubmittingAdd(true);
    try {
      const res = await fetch("/api/equipments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newEq, companyId: selectedCompanyId }) });
      if (!res.ok) throw new Error("Gagal menambah data alat.");
      setStatusMsg({ type: "success", text: "Data alat berhasil ditambahkan." }); setIsAddModalOpen(false);
      setNewEq({ name: "", location: "", permitNumber: "", serialNumber: "", inspectionDate: "", expiryDate: "" }); fetchEquipments(selectedCompanyId);
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmittingAdd(false); }
  };

  const handleManualNotify = async (eq: Equipment) => {
    if (!confirm(`Kirim email peringatan manual ke klien untuk alat: ${eq.name}?`)) return;
    setNotifyingId(eq.id);
    try {
      const res = await fetch(`/api/equipments/${eq.id}/notify`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal mengirim notifikasi.");
      setStatusMsg({ type: "success", text: "Notifikasi berhasil dikirim." });
    } catch (err: any) { setStatusMsg({ type: "error", text: err.message }); }
    finally { setNotifyingId(null); }
  };

  const handleNotifyAllExpired = async () => {
    if (!selectedCompanyId) return;
    if (!confirm("Kirim email peringatan berisi SEMUA alat yang sudah expired ke klien ini?")) return;
    setIsNotifyingBulkAll(true); setStatusMsg(null);
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}/notify-expired`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim notifikasi massal.");
      setStatusMsg({ type: "success", text: data.message });
    } catch (err: any) { setStatusMsg({ type: "error", text: err.message }); }
    finally { setIsNotifyingBulkAll(false); }
  };

  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(searchCompanyText.toLowerCase()));
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const filteredEquipments = equipments.filter(eq => {
    const term = searchEqText.toLowerCase();
    return eq.name?.toLowerCase().includes(term) || eq.permitNumber?.toLowerCase().includes(term) || eq.serialNumber?.toLowerCase().includes(term);
  });
  const totalPages = Math.ceil(filteredEquipments.length / itemsPerPage) || 1;
  const paginatedEquipments = filteredEquipments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    background: "#F8F7F3", border: "1.5px solid #E5E2D8", borderRadius: 10,
    fontFamily: "inherit", fontSize: 13, fontWeight: 400, color: "#1A1A1A",
    outline: "none", caretColor: "#F0A500",
  };

  return (
    <>
      <style>{`
        .eq-root * { box-sizing: border-box; }
        .eq-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        @keyframes eq-fadeup { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes eq-spin { to { transform: rotate(360deg); } }

        .eq-inner { padding: 28px 20px; max-width: 1280px; margin: 0 auto; animation: eq-fadeup 0.4s ease both; }
        @media (min-width: 768px)  { .eq-inner { padding: 40px 32px; } }
        @media (min-width: 1024px) { .eq-inner { padding: 48px 48px; } }

        .eq-eyebrow { font-size: 10px; font-weight: 500; color: #C87A00; text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 8px; }
        .eq-page-title { font-size: clamp(20px, 3.5vw, 26px); font-weight: 700; color: #1A1A1A; margin: 0 0 6px 0; line-height: 1.15; display: flex; align-items: center; gap: 12px; }
        .eq-title-icon { width: 36px; height: 36px; background: rgba(240,165,0,0.08); border: 1.5px solid rgba(240,165,0,0.18); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #C87A00; flex-shrink: 0; }
        .eq-page-desc { font-size: 13px; font-weight: 400; color: #AAAAAA; margin: 0; }

        .eq-divider { height: 1px; background: linear-gradient(90deg, #F0A500 0%, transparent 60%); margin: 24px 0 28px; opacity: 0.2; }

        .eq-status-msg { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 10px; font-size: 13px; font-weight: 400; margin-bottom: 24px; }
        .eq-status-msg.error   { background: rgba(220,60,60,0.06);  border: 1px solid rgba(220,60,60,0.15);  color: #DC3C3C; }
        .eq-status-msg.success { background: rgba(34,160,100,0.06); border: 1px solid rgba(34,160,100,0.15); color: #22A064; }

        .eq-layout { display: flex; flex-direction: column; gap: 16px; }
        @media (min-width: 1024px) { .eq-layout { flex-direction: row; align-items: flex-start; } }

        .eq-left { width: 100%; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 1024px) { .eq-left { width: 272px; } }

        .eq-card { background: #FFFFFF; border: 1.5px solid #E8E4DC; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
        .eq-card-header { padding: 14px 18px; background: #FAFAF7; border-bottom: 1px solid #F0EDE4; display: flex; align-items: center; gap: 8px; }
        .eq-card-header-icon { width: 28px; height: 28px; background: rgba(240,165,0,0.08); border: 1.5px solid rgba(240,165,0,0.18); border-radius: 7px; display: flex; align-items: center; justify-content: center; color: #C87A00; flex-shrink: 0; }
        .eq-card-title { font-size: 13px; font-weight: 600; color: #555550; }

        .eq-company-list { padding: 8px; max-height: 480px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
        @media (min-width: 1024px) { .eq-company-list { max-height: 520px; } }
        .eq-company-list::-webkit-scrollbar { width: 0; }

        .eq-company-btn { width: 100%; text-align: left; padding: 10px 14px; border-radius: 9px; background: transparent; border: 1.5px solid transparent; font-family: inherit; font-size: 13px; font-weight: 500; color: #888880; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 8px; transition: 0.15s; }
        .eq-company-btn:hover { background: #F5F3EE; color: #555550; border-color: #EAE7DF; }
        .eq-company-btn.active { background: rgba(240,165,0,0.08); border-color: rgba(240,165,0,0.22); color: #C87A00; font-weight: 600; }
        .eq-company-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .eq-right { flex: 1; min-width: 0; display: flex; flex-direction: column; }

        .eq-toolbar { padding: 14px 18px; background: #FAFAF7; border-bottom: 1px solid #F0EDE4; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }

        .eq-search-wrap { position: relative; flex: 1; min-width: 160px; max-width: 320px; }
        .eq-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #CCCCCC; pointer-events: none; }
        .eq-search-input { width: 100%; padding: 9px 14px 9px 34px; background: #FFFFFF; border: 1.5px solid #E5E2D8; border-radius: 8px; font-family: inherit; font-size: 13px; font-weight: 400; color: #1A1A1A; outline: none; transition: border-color 0.2s, box-shadow 0.2s; caret-color: #F0A500; }
        .eq-search-input::placeholder { color: #CCCCCC; }
        .eq-search-input:focus { border-color: rgba(240,165,0,0.35); box-shadow: 0 0 0 3px rgba(240,165,0,0.08); }
        .eq-search-input:disabled { opacity: 0.4; cursor: not-allowed; }

        .eq-tool-btn { display: flex; align-items: center; gap: 7px; padding: 8px 14px; background: #FFFFFF; border: 1.5px solid #E5E2D8; border-radius: 8px; font-family: inherit; font-size: 12px; font-weight: 500; color: #888880; cursor: pointer; white-space: nowrap; transition: 0.2s; }
        .eq-tool-btn:hover:not(:disabled) { background: #F5F3EE; border-color: #C8C0B0; color: #555550; }
        .eq-tool-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .eq-tool-btn.amber:hover:not(:disabled) { background: rgba(240,165,0,0.07); border-color: rgba(240,165,0,0.25); color: #C87A00; }
        .eq-tool-btn.red:hover:not(:disabled) { background: rgba(220,60,60,0.06); border-color: rgba(220,60,60,0.2); color: #DC3C3C; }

        .eq-selected-tag { font-size: 11px; font-weight: 500; color: #C87A00; background: rgba(240,165,0,0.07); border: 1px solid rgba(240,165,0,0.18); border-radius: 6px; padding: 3px 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; font-family: monospace; }

        .eq-table-wrap { flex: 1; overflow: auto; min-height: 420px; max-height: 560px; }
        .eq-table { width: 100%; border-collapse: collapse; text-align: left; }
        .eq-table thead { position: sticky; top: 0; z-index: 5; background: #FAFAF7; }
        .eq-table thead th { padding: 12px 20px; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: #AAAAAA; border-bottom: 1px solid #F0EDE4; white-space: nowrap; }
        .eq-table tbody tr { border-bottom: 1px solid #F5F3EE; transition: 0.12s; }
        .eq-table tbody tr:last-child { border-bottom: none; }
        .eq-table tbody tr:hover td { background: #FDFCF8; }
        .eq-table td { padding: 14px 20px; vertical-align: middle; }

        .eq-eq-name   { font-size: 13px; font-weight: 600; color: #1A1A1A; }
        .eq-eq-loc    { font-size: 11px; color: #AAAAAA; margin-top: 3px; font-weight: 400; font-family: monospace; text-transform: uppercase; }
        .eq-permit    { font-size: 11px; color: #888880; font-weight: 400; font-family: monospace; }
        .eq-insp-date { font-size: 11px; color: #BBBBBB; margin-top: 3px; font-weight: 400; font-family: monospace; }
        .eq-expiry    { font-size: 12px; font-weight: 400; color: #555550; text-align: right; white-space: nowrap; font-family: monospace; }

        .eq-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; margin-top: 5px; }
        .eq-badge.safe    { background: rgba(34,160,100,0.07);  border: 1px solid rgba(34,160,100,0.18);  color: #22A064; }
        .eq-badge.warning { background: rgba(240,165,0,0.08);   border: 1px solid rgba(240,165,0,0.2);    color: #C87A00; }
        .eq-badge.danger  { background: rgba(220,60,60,0.07);   border: 1px solid rgba(220,60,60,0.18);   color: #DC3C3C; }

        .eq-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 340px; text-align: center; padding: 40px 20px; }
        .eq-empty-icon { width: 56px; height: 56px; background: #F5F3EE; border: 1.5px solid #E5E2D8; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #CCCCCC; }
        .eq-empty-title { font-size: 14px; font-weight: 600; color: #555550; margin: 0 0 6px 0; }
        .eq-empty-desc  { font-size: 12px; font-weight: 400; color: #AAAAAA; margin: 0; }
        .eq-spinner { animation: eq-spin 1s linear infinite; }

        .action-btn { padding: 6px; border-radius: 7px; cursor: pointer; background: #F5F3EE; border: 1.5px solid #E5E2D8; color: #BBBBBB; transition: 0.2s; }
        .action-btn:hover         { background: #EDEAE3; color: #555550; border-color: #C8C0B0; }
        .action-btn.delete:hover  { background: rgba(220,60,60,0.07); border-color: rgba(220,60,60,0.2); color: #DC3C3C; }
        .action-btn.notify:hover  { background: rgba(34,160,100,0.07); border-color: rgba(34,160,100,0.2); color: #22A064; }

        .cert-btn { padding: 5px 11px; font-size: 11px; font-weight: 500; border-radius: 7px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: 0.2s; background: #F5F3EE; border: 1.5px solid #E5E2D8; color: #888880; font-family: inherit; }
        .cert-btn:hover { background: rgba(240,165,0,0.08); border-color: rgba(240,165,0,0.25); color: #C87A00; }
        .cert-btn.has-cert { background: rgba(34,160,100,0.07); border-color: rgba(34,160,100,0.2); color: #22A064; }

        .pagination-container { padding: 12px 18px; border-top: 1px solid #F0EDE4; background: #FAFAF7; display: flex; align-items: center; justify-content: space-between; }
        .page-btn { padding: 6px 12px; font-size: 11px; font-weight: 500; border-radius: 7px; background: #FFFFFF; border: 1.5px solid #E5E2D8; color: #888880; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: 0.2s; font-family: monospace; }
        .page-btn:hover:not(:disabled) { background: rgba(240,165,0,0.07); border-color: rgba(240,165,0,0.25); color: #C87A00; }
        .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.25); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; overflow-y: auto; }
        .modal-content { background: #FFFFFF; border: 1.5px solid #EAE7DF; border-radius: 16px; width: 100%; max-width: 420px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); animation: eq-fadeup 0.2s ease-out; margin: auto; }
        .modal-title { font-size: 16px; font-weight: 700; color: #1A1A1A; margin-bottom: 4px; }
        .modal-subtitle { font-size: 12px; font-weight: 400; color: #AAAAAA; margin-bottom: 20px; }
        .modal-label { display: block; font-size: 11px; font-weight: 600; color: #555550; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }

        .tab-container { display: flex; gap: 6px; background: #F5F3EE; padding: 5px; border-radius: 10px; margin-bottom: 20px; border: 1.5px solid #EAE7DF; }
        .tab-btn { flex: 1; padding: 9px; font-size: 12px; font-weight: 500; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s; border: none; background: transparent; color: #AAAAAA; font-family: inherit; }
        .tab-btn.active { background: #FFFFFF; color: #C87A00; border: 1.5px solid rgba(240,165,0,0.25); box-shadow: 0 1px 4px rgba(0,0,0,0.06); }

        .modal-btn-cancel { flex: 1; padding: 11px; background: #F5F3EE; border: 1.5px solid #E5E2D8; border-radius: 10px; font-family: inherit; font-size: 13px; font-weight: 500; color: #888880; cursor: pointer; transition: 0.15s; }
        .modal-btn-cancel:hover:not(:disabled) { background: #EDEAE3; color: #333; }
        .modal-btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }
        .modal-btn-submit { flex: 1; padding: 11px; background: #F0A500; border: none; border-radius: 10px; font-family: inherit; font-size: 13px; font-weight: 600; color: #1A1A1A; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s, transform 0.15s; box-shadow: 0 4px 14px rgba(240,165,0,0.2); }
        .modal-btn-submit:hover:not(:disabled) { background: #E09800; transform: translateY(-1px); }
        .modal-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="eq-root" style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div className="eq-inner">
          <p className="eq-eyebrow">// Equipment & Inspection</p>
          <h1 className="eq-page-title">
            <span className="eq-title-icon"><Wrench size={18} /></span>
            Data Alat & Inspeksi
          </h1>
          <p className="eq-page-desc">Manajemen aset dan pemantauan perizinan alat berat.</p>
          <div className="eq-divider" />

          {statusMsg && (
            <div className={`eq-status-msg ${statusMsg.type}`}>
              {statusMsg.type === "error" ? <AlertTriangle size={15} style={{ flexShrink: 0 }} /> : <ShieldCheck size={15} style={{ flexShrink: 0 }} />}
              {statusMsg.text}
            </div>
          )}

          <div className="eq-layout">
            {userRole === "SUPERADMIN" && (
              <div className="eq-left">
                <div className="eq-card">
                  <div className="eq-card-header" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="eq-card-header-icon"><Building2 size={14} /></span>
                      <span className="eq-card-title">Pilih Klien</span>
                    </div>
                    <div className="eq-search-wrap" style={{ maxWidth: "100%" }}>
                      <Search size={12} className="eq-search-icon" />
                      <input type="text" placeholder="Cari PT..." className="eq-search-input" style={{ padding: "7px 10px 7px 30px", fontSize: 11 }} value={searchCompanyText} onChange={(e) => setSearchCompanyText(e.target.value)} />
                    </div>
                  </div>
                  <div className="eq-company-list">
                    {companies.length === 0 ? (
                      <div style={{ padding: "24px 14px", textAlign: "center" }}>
                        <Loader2 size={20} className="eq-spinner" style={{ color: "#C87A00", margin: "0 auto 8px", display: "block" }} />
                        <p style={{ fontSize: 10, color: "#BBBBBB", fontFamily: "monospace" }}>Memuat klien...</p>
                      </div>
                    ) : filteredCompanies.length === 0 ? (
                      <p style={{ textAlign: "center", padding: "20px", color: "#AAAAAA", fontSize: 12 }}>Klien tidak ditemukan</p>
                    ) : filteredCompanies.map((c) => (
                      <button key={c.id} className={`eq-company-btn ${selectedCompanyId === c.id ? "active" : ""}`} onClick={() => setSelectedCompanyId(c.id)}>
                        <span>{c.name}</span>
                        <ChevronRight size={14} style={{ flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </div>
                <button className="eq-tool-btn amber" onClick={handleDownloadTemplate} style={{ justifyContent: "center", padding: 11, width: "100%" }}>
                  <Download size={14} /> Download Template
                </button>
              </div>
            )}

            <div className="eq-right">
              <div className="eq-card" style={{ display: "flex", flexDirection: "column" }}>
                <div className="eq-toolbar">
                  <div className="eq-search-wrap">
                    <Search size={14} className="eq-search-icon" />
                    <input type="text" placeholder="Cari alat, seri, atau izin..." className="eq-search-input" disabled={!selectedCompanyId && userRole === "SUPERADMIN"} value={searchEqText} onChange={(e) => setSearchEqText(e.target.value)} />
                  </div>
                  {selectedCompany && <span className="eq-selected-tag">{selectedCompany.name}</span>}
                  <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: "none" }} />
                  {userRole === "SUPERADMIN" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="eq-tool-btn amber" onClick={() => setIsAddModalOpen(true)} disabled={!selectedCompanyId}>
                        <Plus size={13} /> Tambah Manual
                      </button>
                      <button className="eq-tool-btn amber" onClick={() => fileInputRef.current?.click()} disabled={!selectedCompanyId || isUploading}>
                        {isUploading ? <Loader2 size={13} className="eq-spinner" /> : <FileUp size={13} />} Import File
                      </button>
                      <button className="eq-tool-btn red" onClick={handleNotifyAllExpired} disabled={!selectedCompanyId || isNotifyingBulkAll}>
                        {isNotifyingBulkAll ? <Loader2 size={13} className="eq-spinner" /> : <MailWarning size={13} />} Alert Expired
                      </button>
                    </div>
                  )}
                </div>

                <div className="eq-table-wrap">
                  {(!selectedCompanyId && userRole === "SUPERADMIN") ? (
                    <div className="eq-empty">
                      <div className="eq-empty-icon"><Building2 size={24} /></div>
                      <p className="eq-empty-title">Pilih klien di sebelah kiri</p>
                      <p className="eq-empty-desc">Untuk melihat atau mengimpor data alat berat</p>
                    </div>
                  ) : isLoadingEq ? (
                    <div className="eq-empty">
                      <Loader2 size={28} className="eq-spinner" style={{ color: "#F0A500", marginBottom: 12 }} />
                      <p className="eq-empty-desc">Memuat data alat...</p>
                    </div>
                  ) : filteredEquipments.length === 0 ? (
                    <div className="eq-empty">
                      <div className="eq-empty-icon"><Wrench size={24} /></div>
                      <p className="eq-empty-title">Belum ada data alat</p>
                      {userRole === "SUPERADMIN" && <p className="eq-empty-desc">Gunakan tombol Import File atau Tambah Manual di atas.</p>}
                    </div>
                  ) : (
                    <table className="eq-table">
                      <thead>
                        <tr>
                          <th>Informasi Alat</th>
                          <th>Inspeksi & Izin</th>
                          <th style={{ textAlign: "right" }}>Status Waktu</th>
                          <th style={{ textAlign: "center" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedEquipments.map((eq) => {
                          const status = getStatus(eq.expiryDate);
                          const StatusIcon = status.icon;
                          return (
                            <tr key={eq.id}>
                              <td>
                                <p className="eq-eq-name">{eq.name}</p>
                                <p className="eq-eq-loc">Lokasi: {eq.location || "N/A"}</p>
                              </td>
                              <td>
                                <p className="eq-permit">No. Izin: {eq.permitNumber}</p>
                                <p className="eq-insp-date">Periksa: {new Date(eq.inspectionDate).toLocaleDateString("id-ID")}</p>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <p className="eq-expiry">{new Date(eq.expiryDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</p>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                  <span className={`eq-badge ${status.variant}`}>
                                    <StatusIcon size={10} /> {status.label} ({status.days < 0 ? "Lewat" : `${status.days}hr`})
                                  </span>
                                </div>
                              </td>
                              <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                  {eq.certificateUrl ? (
                                    <a href={eq.certificateUrl} target="_blank" rel="noreferrer" className="cert-btn has-cert">
                                      <FileText size={13} /> Lihat
                                    </a>
                                  ) : (
                                    <button onClick={() => { setActiveEq(eq); setIsCertModalOpen(true); }} className="cert-btn">
                                      <FileUp size={13} /> Attach
                                    </button>
                                  )}
                                  {userRole === "SUPERADMIN" && (
                                    <>
                                      <button onClick={() => handleManualNotify(eq)} disabled={notifyingId === eq.id} className="action-btn notify">
                                        {notifyingId === eq.id ? <Loader2 size={14} className="eq-spinner" /> : <Send size={14} />}
                                      </button>
                                      <button onClick={() => { setEditingEq(eq); setIsEditModalOpen(true); }} className="action-btn">
                                        <Edit size={14} />
                                      </button>
                                      <button onClick={() => handleDeleteEq(eq.id)} disabled={deletingId === eq.id} className="action-btn delete">
                                        {deletingId === eq.id ? <Loader2 size={14} className="eq-spinner" /> : <Trash2 size={14} />}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {filteredEquipments.length > itemsPerPage && (
                  <div className="pagination-container">
                    <span style={{ fontSize: 11, color: "#AAAAAA", fontFamily: "monospace" }}>
                      {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredEquipments.length)} dari {filteredEquipments.length}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                        <ChevronLeft size={14} /> Prev
                      </button>
                      <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- MODAL: SERTIFIKAT ---- */}
      {isCertModalOpen && activeEq && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isSubmittingCert) setIsCertModalOpen(false); }}>
          <div className="modal-content">
            <h3 className="modal-title">Lampirkan Sertifikat</h3>
            <p className="modal-subtitle">{activeEq.name} — {activeEq.permitNumber}</p>
            <div className="tab-container">
              <button className={`tab-btn ${certMode === "link" ? "active" : ""}`} onClick={() => setCertMode("link")}><LinkIcon size={13} /> Link Drive</button>
              <button className={`tab-btn ${certMode === "upload" ? "active" : ""}`} onClick={() => setCertMode("upload")}><ImageIcon size={13} /> Upload File</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              {certMode === "link" ? (
                <div>
                  <label className="modal-label">URL Google Drive / Cloud</label>
                  <input type="url" value={certLinkData} onChange={(e) => setCertLinkData(e.target.value)} placeholder="https://drive.google.com/..." style={inputStyle} />
                </div>
              ) : (
                <div>
                  <label className="modal-label">Pilih File Gambar / PDF</label>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setCertFileData(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: "8px", color: "#888880" }} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="modal-btn-cancel" onClick={() => setIsCertModalOpen(false)} disabled={isSubmittingCert}>Batal</button>
              <button className="modal-btn-submit" onClick={handleSubmitCertificate} disabled={isSubmittingCert}>
                {isSubmittingCert ? <Loader2 size={14} className="eq-spinner" /> : <><CheckCircle2 size={14} /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- MODAL: EDIT ALAT ---- */}
      {isEditModalOpen && editingEq && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isSubmittingEdit) setIsEditModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <h3 className="modal-title">Edit Data Alat</h3>
            <p className="modal-subtitle">Perbarui informasi inspeksi dan perizinan</p>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label className="modal-label">Nama Alat</label><input type="text" required style={inputStyle} value={editingEq.name} onChange={e => setEditingEq({ ...editingEq, name: e.target.value })} /></div>
              <div><label className="modal-label">Lokasi</label><input type="text" style={inputStyle} value={editingEq.location || ""} onChange={e => setEditingEq({ ...editingEq, location: e.target.value })} /></div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><label className="modal-label">No. Izin</label><input type="text" style={inputStyle} value={editingEq.permitNumber} onChange={e => setEditingEq({ ...editingEq, permitNumber: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label className="modal-label">Serial Number</label><input type="text" style={inputStyle} value={editingEq.serialNumber} onChange={e => setEditingEq({ ...editingEq, serialNumber: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><label className="modal-label">Tgl Inspeksi</label><input type="date" required style={inputStyle} value={editingEq.inspectionDate.split("T")[0]} onChange={e => setEditingEq({ ...editingEq, inspectionDate: new Date(e.target.value).toISOString() })} /></div>
                <div style={{ flex: 1 }}><label className="modal-label">Tgl Kedaluwarsa</label><input type="date" required style={inputStyle} value={editingEq.expiryDate.split("T")[0]} onChange={e => setEditingEq({ ...editingEq, expiryDate: new Date(e.target.value).toISOString() })} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="modal-btn-cancel" onClick={() => setIsEditModalOpen(false)} disabled={isSubmittingEdit}>Batal</button>
                <button type="submit" className="modal-btn-submit" disabled={isSubmittingEdit}>
                  {isSubmittingEdit ? <Loader2 size={14} className="eq-spinner" /> : <><CheckCircle2 size={14} /> Simpan Perubahan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- MODAL: TAMBAH MANUAL ---- */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isSubmittingAdd) setIsAddModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <h3 className="modal-title">Tambah Data Alat Manual</h3>
            <p className="modal-subtitle">Masukkan data alat secara satuan</p>
            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label className="modal-label">Nama Alat</label><input type="text" required style={inputStyle} value={newEq.name} onChange={e => setNewEq({ ...newEq, name: e.target.value })} /></div>
              <div><label className="modal-label">Lokasi</label><input type="text" style={inputStyle} value={newEq.location} onChange={e => setNewEq({ ...newEq, location: e.target.value })} /></div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><label className="modal-label">No. Izin</label><input type="text" style={inputStyle} value={newEq.permitNumber} onChange={e => setNewEq({ ...newEq, permitNumber: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label className="modal-label">Serial Number</label><input type="text" style={inputStyle} value={newEq.serialNumber} onChange={e => setNewEq({ ...newEq, serialNumber: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><label className="modal-label">Tgl Inspeksi</label><input type="date" required style={inputStyle} value={newEq.inspectionDate} onChange={e => setNewEq({ ...newEq, inspectionDate: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label className="modal-label">Tgl Kedaluwarsa</label><input type="date" required style={inputStyle} value={newEq.expiryDate} onChange={e => setNewEq({ ...newEq, expiryDate: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" className="modal-btn-cancel" onClick={() => setIsAddModalOpen(false)} disabled={isSubmittingAdd}>Batal</button>
                <button type="submit" className="modal-btn-submit" disabled={isSubmittingAdd}>
                  {isSubmittingAdd ? <Loader2 size={14} className="eq-spinner" /> : <><CheckCircle2 size={14} /> Tambah Alat</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}