"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Wrench, Building2, Search, Loader2, FileUp,
  AlertTriangle, ShieldCheck, XOctagon, ChevronRight,
  Link as LinkIcon, Image as ImageIcon, CheckCircle2, FileText,
  Download, Edit, Trash2, ChevronLeft, Plus, Send, MailWarning
} from "lucide-react";
import * as XLSX from "xlsx-js-style"; 

interface Company {
  id: string;
  name: string;
}

interface Equipment {
  id: string;
  name: string;
  permitNumber: string;
  serialNumber: string;
  location: string | null;
  inspectionDate: string;
  expiryDate: string;
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

  // STATE BARU: Notifikasi Massal Expired
  const [isNotifyingBulkAll, setIsNotifyingBulkAll] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserRole(parsed.role);
      if (parsed.role === "SUPERADMIN") {
        fetchCompanies();
      } else {
        fetchEquipments(null);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchEquipments(selectedCompanyId);
      setSearchEqText("");
      setCurrentPage(1);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchEqText, searchCompanyText]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      if (res.ok) setCompanies(await res.json());
    } catch (e) { console.error("Gagal load companies", e); }
  };

  const fetchEquipments = async (companyId: string | null) => {
    setIsLoadingEq(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/equipments");
      if (!res.ok) throw new Error("Gagal memuat data alat");
      let data = await res.json();
      if (userRole === "SUPERADMIN" && companyId) {
        data = data.filter((eq: any) => eq.companyId === companyId);
      }
      setEquipments(data);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setIsLoadingEq(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompanyId) return;
    setIsUploading(true);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: selectedCompanyId, equipments: mappedEquipments }),
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message);

        setStatusMsg({ type: "success", text: resData.message });
        fetchEquipments(selectedCompanyId);
      } catch (err: any) {
        setStatusMsg({ type: "error", text: err.message || "Gagal membaca file Excel. Pastikan format kolom sesuai." });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseExcelDate = (excelDate: any) => {
    if (!excelDate) return null;
    if (typeof excelDate === "number") {
      const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      return date.toISOString().split("T")[0];
    }
    const dateObj = new Date(excelDate);
    if (!isNaN(dateObj.getTime())) return dateObj.toISOString().split("T")[0];
    return excelDate;
  };

  const getStatus = (expiryDate: string) => {
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)    return { label: "Kedaluwarsa", variant: "danger",  icon: XOctagon,    days: diffDays };
    if (diffDays <= 60)  return { label: "Warning",     variant: "warning", icon: AlertTriangle, days: diffDays };
    return              { label: "Aman",        variant: "safe",    icon: ShieldCheck, days: diffDays };
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      "ALAT": "CONTOH ALAT (WAJIB)",
      "LOKASI": "LOKASI PABRIK",
      "NOMOR IZIN": "123/IZIN/2025",
      "NOMOR SERIE": "SN-001",
      "TANGGAL PEMERIKSAAN": "2025-01-01",
      "TANGGAL HABIS": "2026-01-01"
    }];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    const headerCols = ["A1", "B1", "C1", "D1", "E1", "F1"];
    headerCols.forEach(col => {
      if (worksheet[col]) {
        worksheet[col].s = {
          fill: { fgColor: { rgb: "C8F135" } }, 
          font: { bold: true, color: { rgb: "000000" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    });

    worksheet["!cols"] = [
      { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }  
    ];

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
        
        const formData = new FormData();
        formData.append("file", certFileData);
        
        const uploadRes = await fetch('/api/upload', { 
          method: 'POST', 
          body: formData 
        });
        const uploadData = await uploadRes.json();
        
        if (!uploadRes.ok) throw new Error(uploadData.message || "Gagal upload file.");
        
        finalUrl = uploadData.url; 
      }

      const res = await fetch(`/api/equipments/${activeEq.id}/certificate`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateUrl: finalUrl })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Gagal menyimpan sertifikat.");

      fetchEquipments(selectedCompanyId);
      setIsCertModalOpen(false);
      setStatusMsg({ type: "success", text: "Sertifikat berhasil ditambahkan." });

    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingCert(false);
    }
  };

  const handleDeleteEq = async (id: string) => {
    if(!confirm("Anda yakin ingin menghapus alat ini dari database?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/equipments/${id}`, { method: 'DELETE' });
      if(!res.ok) throw new Error("Gagal menghapus data alat.");
      setStatusMsg({ type: "success", text: "Alat berhasil dihapus." });
      fetchEquipments(selectedCompanyId);
    } catch(err:any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editingEq) return;
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/equipments/${editingEq.id}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingEq.name,
          location: editingEq.location,
          permitNumber: editingEq.permitNumber,
          serialNumber: editingEq.serialNumber,
          inspectionDate: editingEq.inspectionDate,
          expiryDate: editingEq.expiryDate
        })
      });
      if(!res.ok) throw new Error("Gagal mengupdate data alat.");
      
      setStatusMsg({ type: "success", text: "Data alat berhasil diperbarui." });
      setIsEditModalOpen(false);
      fetchEquipments(selectedCompanyId);
    } catch(err:any) {
      alert(err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setIsSubmittingAdd(true);
    try {
      const res = await fetch("/api/equipments", {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEq, companyId: selectedCompanyId })
      });
      if (!res.ok) throw new Error("Gagal menambah data alat.");
      
      setStatusMsg({ type: "success", text: "Data alat berhasil ditambahkan." });
      setIsAddModalOpen(false);
      setNewEq({ name: "", location: "", permitNumber: "", serialNumber: "", inspectionDate: "", expiryDate: "" });
      fetchEquipments(selectedCompanyId);
    } catch(err:any) {
      alert(err.message);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleManualNotify = async (eq: Equipment) => {
    if (!confirm(`Kirim email peringatan manual ke klien untuk alat: ${eq.name}?`)) return;
    setNotifyingId(eq.id);
    try {
      const res = await fetch(`/api/equipments/${eq.id}/notify`, { method: 'POST' });
      if (!res.ok) throw new Error("Gagal mengirim notifikasi manual. Pastikan API backend sudah dibuat.");
      setStatusMsg({ type: "success", text: "Notifikasi berhasil dikirim." });
    } catch (err:any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setNotifyingId(null);
    }
  };

  // --- HANDLER BARU: BULK NOTIFY ALL EXPIRED ---
  const handleNotifyAllExpired = async () => {
    if (!selectedCompanyId) return;
    const isConfirm = confirm("Kirim email peringatan berisi SEMUA alat yang sudah expired ke klien ini?");
    if (!isConfirm) return;

    setIsNotifyingBulkAll(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}/notify-expired`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim notifikasi massal.");
      setStatusMsg({ type: "success", text: data.message });
    } catch(err:any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setIsNotifyingBulkAll(false);
    }
  };

  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(searchCompanyText.toLowerCase()));
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const filteredEquipments = equipments.filter(eq => {
    const term = searchEqText.toLowerCase();
    return (
      (eq.name && eq.name.toLowerCase().includes(term)) || 
      (eq.permitNumber && eq.permitNumber.toLowerCase().includes(term)) ||
      (eq.serialNumber && eq.serialNumber.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredEquipments.length / itemsPerPage) || 1;
  const paginatedEquipments = filteredEquipments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        .eq-root * { box-sizing: border-box; }
        .eq-root { font-family: 'Syne', sans-serif; }
        @keyframes eq-fadeup { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes eq-spin { to { transform: rotate(360deg); } }
        .eq-inner { padding: 28px 20px; max-width: 1280px; margin: 0 auto; animation: eq-fadeup 0.4s ease both; }
        @media (min-width: 768px)  { .eq-inner { padding: 40px 32px; } }
        @media (min-width: 1024px) { .eq-inner { padding: 48px 48px; } }
        .eq-eyebrow { font-family: 'DM Mono', monospace; font-size: 10px; color: #C8F135; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px; }
        .eq-page-title { font-size: clamp(20px, 3.5vw, 28px); font-weight: 700; color: #F0F0F0; margin: 0 0 6px 0; line-height: 1.1; display: flex; align-items: center; gap: 12px; }
        .eq-title-icon { width: 36px; height: 36px; background: rgba(200,241,53,0.08); border: 1px solid rgba(200,241,53,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #C8F135; flex-shrink: 0; }
        .eq-page-desc { font-size: 13px; color: #444; margin: 0; }
        .eq-divider { height: 1px; background: linear-gradient(90deg, #C8F135 0%, transparent 60%); margin: 24px 0 28px; opacity: 0.1; }
        .eq-status-msg { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
        .eq-status-msg.error   { background: rgba(248,113,113,0.07); border: 1px solid rgba(248,113,113,0.2); color: #F87171; }
        .eq-status-msg.success { background: rgba(52,211,153,0.07);  border: 1px solid rgba(52,211,153,0.2);  color: #34D399; }
        .eq-layout { display: flex; flex-direction: column; gap: 16px; }
        @media (min-width: 1024px) { .eq-layout { flex-direction: row; align-items: flex-start; } }
        .eq-left { width: 100%; flex-shrink: 0; display:flex; flex-direction:column; gap:16px;}
        @media (min-width: 1024px) { .eq-left { width: 280px; } }
        .eq-card { background: #111; border: 1px solid #1C1C1C; border-radius: 14px; overflow: hidden; }
        .eq-card-header { padding: 14px 18px; background: #0D0D0D; border-bottom: 1px solid #181818; display: flex; align-items: center; gap: 8px; }
        .eq-card-header-icon { width: 28px; height: 28px; background: rgba(200,241,53,0.07); border: 1px solid rgba(200,241,53,0.12); border-radius: 7px; display: flex; align-items: center; justify-content: center; color: #C8F135; flex-shrink: 0; }
        .eq-card-title { font-size: 13px; font-weight: 700; color: #888; }
        .eq-company-list { padding: 8px; max-height: 480px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
        @media (min-width: 1024px) { .eq-company-list { max-height: 520px; } }
        .eq-company-list::-webkit-scrollbar { width: 0; }
        .eq-company-btn { width: 100%; text-align: left; padding: 10px 14px; border-radius: 9px; background: transparent; border: 1px solid transparent; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; color: #444; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 8px; transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .eq-company-btn:hover { background: #161616; color: #888; border-color: #1E1E1E; }
        .eq-company-btn.active { background: rgba(200,241,53,0.08); border-color: rgba(200,241,53,0.18); color: #C8F135; font-weight: 700; }
        .eq-company-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .eq-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0; }
        .eq-toolbar { padding: 14px 18px; background: #0D0D0D; border-bottom: 1px solid #181818; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
        .eq-search-wrap { position: relative; flex: 1; min-width: 160px; max-width: 320px; }
        .eq-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #2D2D2D; pointer-events: none; }
        .eq-search-input { width: 100%; padding: 9px 14px 9px 34px; background: #141414; border: 1px solid #222; border-radius: 8px; font-family: 'Syne', sans-serif; font-size: 13px; color: #D0D0D0; outline: none; transition: border-color 0.2s, box-shadow 0.2s; caret-color: #C8F135; }
        .eq-search-input::placeholder { color: #2A2A2A; }
        .eq-search-input:focus { border-color: rgba(200,241,53,0.3); box-shadow: 0 0 0 3px rgba(200,241,53,0.06); }
        .eq-search-input:disabled { opacity: 0.3; cursor: not-allowed; }
        .eq-import-btn { display: flex; align-items: center; gap: 7px; padding: 9px 16px; background: #141414; border: 1px solid #252525; border-radius: 8px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; color: #555; cursor: pointer; white-space: nowrap; transition: border-color 0.2s, color 0.2s, background 0.2s; }
        .eq-import-btn:hover:not(:disabled) { background: rgba(200,241,53,0.06); border-color: rgba(200,241,53,0.2); color: #C8F135; }
        .eq-import-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .eq-import-btn.red-btn:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }
        .eq-selected-tag { font-family: 'DM Mono', monospace; font-size: 10px; color: #C8F135; background: rgba(200,241,53,0.06); border: 1px solid rgba(200,241,53,0.12); border-radius: 6px; padding: 3px 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
        .eq-table-wrap { flex: 1; overflow: auto; min-height: 420px; max-height: 560px; }
        .eq-table { width: 100%; border-collapse: collapse; text-align: left; }
        .eq-table thead { position: sticky; top: 0; z-index: 5; background: #111; }
        .eq-table thead th { padding: 12px 20px; font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: #2D2D2D; font-weight: 500; border-bottom: 1px solid #181818; white-space: nowrap; }
        .eq-table tbody tr { border-bottom: 1px solid #161616; transition: background 0.12s; }
        .eq-table tbody tr:hover { background: #141414; }
        .eq-table td { padding: 14px 20px; vertical-align: middle; }
        .eq-eq-name   { font-size: 13px; font-weight: 500; color: #B8B8B8; letter-spacing: 0.01em; }
        .eq-eq-loc    { font-family: 'DM Mono', monospace; font-size: 10px; color: #efecec; margin-top: 3px; text-transform: uppercase; }
        .eq-permit    { font-family: 'DM Mono', monospace; font-size: 11px; color: #efecec; }
        .eq-permit strong { color: #666; font-weight: 400; }
        .eq-insp-date { font-family: 'DM Mono', monospace; font-size: 10px; color: #efecec; margin-top: 3px; }
        .eq-expiry    { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 400; color: #aaa6a6; text-align: right; white-space: nowrap; }
        .eq-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; margin-top: 5px; }
        .eq-badge.safe    { background: rgba(52,211,153,0.08);  border: 1px solid rgba(52,211,153,0.18);  color: #34D399; }
        .eq-badge.warning { background: rgba(251,191,36,0.08);  border: 1px solid rgba(251,191,36,0.2);   color: #FBBF24; }
        .eq-badge.danger  { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);  color: #F87171; }
        .eq-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 340px; text-align: center; padding: 40px 20px; }
        .eq-empty-icon { width: 56px; height: 56px; background: rgba(255,255,255,0.02); border: 1px solid #1E1E1E; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #252525; }
        .eq-empty-title { font-size: 14px; font-weight: 800; color: #2D2D2D; margin: 0 0 6px 0; }
        .eq-empty-desc  { font-size: 12px; color: #252525; margin: 0; }
        .eq-spinner { animation: eq-spin 1s linear infinite; }

        /* MODAL STYLES */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; overflow-y:auto;}
        .modal-content { background: #111; border: 1px solid #222; border-radius: 16px; width: 100%; max-width: 400px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); animation: eq-fadeup 0.2s ease-out; margin:auto; }
        .modal-title { font-size: 16px; font-weight: 700; color: #eee; margin-bottom: 4px; }
        .modal-subtitle { font-size: 12px; color: #666; margin-bottom: 20px; }
        .tab-container { display: flex; gap: 8px; background: #0a0a0a; padding: 6px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #1a1a1a;}
        .tab-btn { flex: 1; padding: 10px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s; border: none; background: transparent; color: #666;}
        .tab-btn.active { background: #1C1C1C; color: #C8F135; border: 1px solid #2A2A2A; }
        .cert-btn { padding: 6px 12px; font-size: 11px; font-weight: 600; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: 0.2s; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #aaa; }
        .cert-btn:hover { background: rgba(200,241,53,0.1); border-color: rgba(200,241,53,0.3); color: #C8F135; }
        .cert-btn.has-cert { background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.3); color: #34D399; }
        .action-btn { padding: 6px; border-radius:6px; cursor:pointer; background: transparent; border:1px solid transparent; color:#666; transition:0.2s;}
        .action-btn:hover { background: #1a1a1a; color:#eee;}
        .action-btn.delete:hover { background: rgba(248,113,113,0.1); color:#F87171;}
        .action-btn.notify:hover { background: rgba(52,211,153,0.1); color:#34D399;}
        
        .pagination-container { padding: 12px 18px; border-top: 1px solid #181818; background: #0D0D0D; display: flex; align-items: center; justify-content: space-between;}
        .page-btn { padding: 6px 12px; font-size:11px; font-family:'DM Mono', monospace; font-weight:600; border-radius:6px; background:#141414; border:1px solid #222; color:#aaa; cursor:pointer; display:flex; align-items:center; gap:4px; transition:0.2s;}
        .page-btn:hover:not(:disabled) { background: #1a1a1a; color:#C8F135; border-color:#333;}
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed;}
      `}</style>

      <div className="eq-root" style={{ background: "#0A0A0A", minHeight: "100vh" }}>
        <div className="eq-inner">
          <p className="eq-eyebrow">// Equipment & Inspection</p>
          <h1 className="eq-page-title"><span className="eq-title-icon"><Wrench size={18} /></span>Data Alat & Inspeksi</h1>
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
                  <div className="eq-card-header" style={{flexDirection:'column', alignItems:'stretch', gap:'12px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <span className="eq-card-header-icon"><Building2 size={14} /></span>
                        <span className="eq-card-title">Pilih Klien</span>
                    </div>
                    <div className="eq-search-wrap" style={{maxWidth:'100%'}}>
                        <Search size={12} className="eq-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Cari PT..." 
                            className="eq-search-input" 
                            style={{padding:'7px 10px 7px 30px', fontSize:'11px'}}
                            value={searchCompanyText}
                            onChange={(e) => setSearchCompanyText(e.target.value)}
                        />
                    </div>
                  </div>
                  <div className="eq-company-list">
                    {companies.length === 0 ? (
                      <div style={{ padding: "24px 14px", textAlign: "center" }}>
                        <Loader2 size={20} className="eq-spinner" style={{ color: "#2D2D2D", margin: "0 auto 8px", display: "block" }} />
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#2D2D2D" }}>Memuat klien...</p>
                      </div>
                    ) : filteredCompanies.length === 0 ? (
                      <p style={{textAlign:'center', padding:'20px', color:'#666', fontSize:'12px'}}>Klien tidak ditemukan</p>
                    ) : filteredCompanies.map((c) => (
                      <button
                        key={c.id}
                        className={`eq-company-btn ${selectedCompanyId === c.id ? "active" : ""}`}
                        onClick={() => setSelectedCompanyId(c.id)}
                      >
                        <span>{c.name}</span>
                        <ChevronRight size={14} style={{ flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <button className="eq-import-btn" onClick={handleDownloadTemplate} style={{justifyContent:'center', padding:'12px'}}>
                    <Download size={14} /> Download Template Import
                </button>
              </div>
            )}

            <div className="eq-right">
              <div className="eq-card" style={{ display: "flex", flexDirection: "column" }}>
                <div className="eq-toolbar">
                  <div className="eq-search-wrap">
                    <Search size={14} className="eq-search-icon" />
                    <input 
                        type="text" 
                        placeholder="Cari alat, seri, atau izin..." 
                        className="eq-search-input" 
                        disabled={!selectedCompanyId && userRole === "SUPERADMIN"} 
                        value={searchEqText}
                        onChange={(e) => setSearchEqText(e.target.value)}
                    />
                  </div>
                  {selectedCompany && <span className="eq-selected-tag">{selectedCompany.name}</span>}
                  <input type="file" ref={fileInputRef} accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: "none" }} />
                  {userRole === "SUPERADMIN" && (
                    <div style={{display:'flex', gap:'8px'}}>
                      <button className="eq-import-btn" onClick={() => setIsAddModalOpen(true)} disabled={!selectedCompanyId}>
                        <Plus size={13} /> Tambah Manual
                      </button>
                      <button className="eq-import-btn" onClick={() => fileInputRef.current?.click()} disabled={!selectedCompanyId || isUploading}>
                        {isUploading ? <Loader2 size={13} className="eq-spinner" /> : <FileUp size={13} />} Import File
                      </button>
                      
                      {/* TOMBOL BARU: BULK NOTIFY EXPIRED */}
                      <button className="eq-import-btn red-btn" onClick={handleNotifyAllExpired} disabled={!selectedCompanyId || isNotifyingBulkAll}>
                        {isNotifyingBulkAll ? <Loader2 size={13} className="eq-spinner text-red-500" /> : <MailWarning size={13} className="text-red-500" />} 
                        <span className="text-red-500">Alert Expired</span>
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
                    <div className="eq-empty"><Loader2 size={28} className="eq-spinner" style={{ color: "#C8F135", marginBottom: 12 }} /><p className="eq-empty-desc">Memuat data alat...</p></div>
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
                                <p className="eq-permit">No. Izin: <strong>{eq.permitNumber}</strong></p>
                                <p className="eq-insp-date">Periksa: {new Date(eq.inspectionDate).toLocaleDateString("id-ID")}</p>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <p className="eq-expiry">
                                  {new Date(eq.expiryDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                  <span className={`eq-badge ${status.variant}`}>
                                    <StatusIcon size={10} /> {status.label} ({status.days < 0 ? "Lewat" : `${status.days}hr`})
                                  </span>
                                </div>
                              </td>
                              <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                                    {eq.certificateUrl ? (
                                      <a href={eq.certificateUrl} target="_blank" rel="noreferrer" className="cert-btn has-cert" title="Lihat Sertifikat">
                                        <FileText size={14} /> Lihat
                                      </a>
                                    ) : (
                                      <button onClick={() => { setActiveEq(eq); setIsCertModalOpen(true); }} className="cert-btn" title="Tambah Sertifikat">
                                        <FileUp size={14} /> Attach
                                      </button>
                                    )}

                                    {userRole === "SUPERADMIN" && (
                                      <>
                                        <button onClick={() => handleManualNotify(eq)} disabled={notifyingId === eq.id} className="action-btn notify" title="Kirim Peringatan Email">
                                            {notifyingId === eq.id ? <Loader2 size={14} className="eq-spinner"/> : <Send size={14}/>}
                                        </button>
                                        <button onClick={() => {setEditingEq(eq); setIsEditModalOpen(true);}} className="action-btn" title="Edit Alat">
                                            <Edit size={14}/>
                                        </button>
                                        <button onClick={() => handleDeleteEq(eq.id)} disabled={deletingId === eq.id} className="action-btn delete" title="Hapus Alat">
                                            {deletingId === eq.id ? <Loader2 size={14} className="eq-spinner"/> : <Trash2 size={14}/>}
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
                        <span style={{fontSize:'11px', color:'#666', fontFamily:"'DM Mono', monospace"}}>
                            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredEquipments.length)} dari {filteredEquipments.length}
                        </span>
                        <div style={{display:'flex', gap:'8px'}}>
                            <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                <ChevronLeft size={14}/> Prev
                            </button>
                            <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                                Next <ChevronRight size={14}/>
                            </button>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCertModalOpen && activeEq && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isSubmittingCert) setIsCertModalOpen(false); }}>
          <div className="modal-content">
            <h3 className="modal-title">Lampirkan Sertifikat</h3>
            <p className="modal-subtitle">{activeEq.name} - {activeEq.permitNumber}</p>

            <div className="tab-container">
              <button className={`tab-btn ${certMode === 'link' ? 'active' : ''}`} onClick={() => setCertMode('link')}>
                <LinkIcon size={14} /> Link Drive
              </button>
              <button className={`tab-btn ${certMode === 'upload' ? 'active' : ''}`} onClick={() => setCertMode('upload')}>
                <ImageIcon size={14} /> Upload File
              </button>
            </div>

            <div style={{ marginBottom: "24px" }}>
              {certMode === "link" ? (
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 8 }}>URL Google Drive / Cloud:</label>
                  <input 
                    type="url" 
                    value={certLinkData}
                    onChange={(e) => setCertLinkData(e.target.value)}
                    placeholder="https://drive.google.com/..." 
                    className="eq-search-input" 
                    style={{ width: "100%", background: "#141414" }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 8 }}>Pilih File Gambar/PDF:</label>
                  <input 
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={(e) => setCertFileData(e.target.files?.[0] || null)}
                    className="eq-search-input" 
                    style={{ width: "100%", padding: "8px", background: "#141414", color: "#666" }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setIsCertModalOpen(false)} 
                disabled={isSubmittingCert}
                className="eq-import-btn" style={{ flex: 1, justifyContent: "center" }}>
                Batal
              </button>
              <button 
                onClick={handleSubmitCertificate}
                disabled={isSubmittingCert}
                className="eq-import-btn" style={{ flex: 1, justifyContent: "center", background: "#C8F135", color: "#111", borderColor: "#C8F135" }}>
                {isSubmittingCert ? <Loader2 size={14} className="eq-spinner" /> : <><CheckCircle2 size={14}/> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingEq && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget && !isSubmittingEdit) setIsEditModalOpen(false); }}>
            <div className="modal-content" style={{maxWidth:'500px'}}>
                <h3 className="modal-title">Edit Data Alat</h3>
                <p className="modal-subtitle">Perbarui informasi inspeksi dan perizinan</p>
                
                <form onSubmit={handleEditSubmit} style={{display:'flex', flexDirection:'column', gap:'12px', marginBottom:'24px'}}>
                    <div>
                        <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Nama Alat</label>
                        <input type="text" required className="eq-search-input" style={{width:'100%'}} value={editingEq.name} onChange={e => setEditingEq({...editingEq, name: e.target.value})} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Lokasi</label>
                        <input type="text" className="eq-search-input" style={{width:'100%'}} value={editingEq.location || ''} onChange={e => setEditingEq({...editingEq, location: e.target.value})} />
                    </div>
                    <div style={{display:'flex', gap:'12px'}}>
                        <div style={{flex:1}}>
                            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>No. Izin</label>
                            <input type="text" className="eq-search-input" style={{width:'100%'}} value={editingEq.permitNumber} onChange={e => setEditingEq({...editingEq, permitNumber: e.target.value})} />
                        </div>
                        <div style={{flex:1}}>
                            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Serial Number</label>
                            <input type="text" className="eq-search-input" style={{width:'100%'}} value={editingEq.serialNumber} onChange={e => setEditingEq({...editingEq, serialNumber: e.target.value})} />
                        </div>
                    </div>
                    <div style={{display:'flex', gap:'12px'}}>
                        <div style={{flex:1}}>
                            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Tgl Inspeksi</label>
                            <input type="date" required className="eq-search-input" style={{width:'100%'}} value={editingEq.inspectionDate.split('T')[0]} onChange={e => setEditingEq({...editingEq, inspectionDate: new Date(e.target.value).toISOString()})} />
                        </div>
                        <div style={{flex:1}}>
                            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Tgl Kedaluwarsa</label>
                            <input type="date" required className="eq-search-input" style={{width:'100%'}} value={editingEq.expiryDate.split('T')[0]} onChange={e => setEditingEq({...editingEq, expiryDate: new Date(e.target.value).toISOString()})} />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop:"16px" }}>
                        <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSubmittingEdit} className="eq-import-btn" style={{ flex: 1, justifyContent: "center" }}>
                            Batal
                        </button>
                        <button type="submit" disabled={isSubmittingEdit} className="eq-import-btn" style={{ flex: 1, justifyContent: "center", background: "#C8F135", color: "#111", borderColor: "#C8F135" }}>
                            {isSubmittingEdit ? <Loader2 size={14} className="eq-spinner" /> : <><CheckCircle2 size={14}/> Simpan Perubahan</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL TAMBAH MANUAL --- */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget && !isSubmittingAdd) setIsAddModalOpen(false); }}>
            <div className="modal-content" style={{maxWidth:'500px'}}>
                <h3 className="modal-title">Tambah Data Alat Manual</h3>
                <p className="modal-subtitle">Masukkan data alat secara satuan</p>
                
                <form onSubmit={handleAddSubmit} style={{display:'flex', flexDirection:'column', gap:'12px', marginBottom:'24px'}}>
                    <div>
                        <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Nama Alat</label>
                        <input type="text" required className="eq-search-input" style={{width:'100%'}} value={newEq.name} onChange={e => setNewEq({...newEq, name: e.target.value})} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Lokasi</label>
                        <input type="text" className="eq-search-input" style={{width:'100%'}} value={newEq.location} onChange={e => setNewEq({...newEq, location: e.target.value})} />
                    </div>
                    <div style={{display:'flex', gap:'12px'}}>
                        <div style={{flex:1}}>
                            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>No. Izin</label>
                            <input type="text" className="eq-search-input" style={{width:'100%'}} value={newEq.permitNumber} onChange={e => setNewEq({...newEq, permitNumber: e.target.value})} />
                        </div>
                        <div style={{flex:1}}>
                            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Serial Number</label>
                            <input type="text" className="eq-search-input" style={{width:'100%'}} value={newEq.serialNumber} onChange={e => setNewEq({...newEq, serialNumber: e.target.value})} />
                        </div>
                    </div>
                    <div style={{display:'flex', gap:'12px'}}>
                        <div style={{flex:1}}>
                            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Tgl Inspeksi</label>
                            <input type="date" required className="eq-search-input" style={{width:'100%'}} value={newEq.inspectionDate} onChange={e => setNewEq({...newEq, inspectionDate: e.target.value})} />
                        </div>
                        <div style={{flex:1}}>
                            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Tgl Kedaluwarsa</label>
                            <input type="date" required className="eq-search-input" style={{width:'100%'}} value={newEq.expiryDate} onChange={e => setNewEq({...newEq, expiryDate: e.target.value})} />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop:"16px" }}>
                        <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSubmittingAdd} className="eq-import-btn" style={{ flex: 1, justifyContent: "center" }}>
                            Batal
                        </button>
                        <button type="submit" disabled={isSubmittingAdd} className="eq-import-btn" style={{ flex: 1, justifyContent: "center", background: "#C8F135", color: "#111", borderColor: "#C8F135" }}>
                            {isSubmittingAdd ? <Loader2 size={14} className="eq-spinner" /> : <><CheckCircle2 size={14}/> Tambah Alat</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </>
  );
}