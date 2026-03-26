"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Wrench, Building2, Search, Loader2, FileUp,
  AlertTriangle, ShieldCheck, XOctagon, ChevronRight,
  CheckCircle2, Download, Edit, Trash2, ChevronLeft,
  Plus, Send, MailWarning, FolderOpen, Clock, FileCheck
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import DocumentDrawer from "@/components/equipment/DocumentDrawer";
import { useConfirm } from "@/components/providers/confirm-dialog";

// ============================================================
// TIPE DATA
// ============================================================
interface Company { id: string; name: string; }
interface Suket   { id: string; period: string; fileUrl: string; createdAt: string; }
interface Laporan { id: string; period: string; fileUrl: string; createdAt?: string; }
interface Equipment {
  id: string; name: string; permitNumber: string; serialNumber: string;
  location: string | null; inspectionDate: string; expiryDate: string;
  companyId?: string;
  area?:          string | null;
  brand?:         string | null;
  capacity?:      string | null;
  description?: string | null;
  isProsesDinas?: boolean; // TAMBAHAN DATABASE BARU LU
  suket?:       Suket[];
  laporan?:     Laporan[];
  company?:     { name: string };
}

// ============================================================
// HELPERS
// ============================================================
const getStatus = (expiryDate: string) => {
  const diffDays = Math.ceil(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0)   return { label: "Kedaluwarsa", variant: "danger",  icon: XOctagon,      days: diffDays };
  if (diffDays <= 60) return { label: "Warning",     variant: "warning", icon: AlertTriangle, days: diffDays };
  return                     { label: "Aman",        variant: "safe",    icon: ShieldCheck,   days: diffDays };
};

const parseExcelDate = (excelDate: any) => {
  if (!excelDate) return null;
  if (typeof excelDate === "number")
    return new Date(Math.round((excelDate - 25569) * 86400 * 1000)).toISOString().split("T")[0];
  const d = new Date(excelDate);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return excelDate;
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "#F8F7F3",
  border: "1.5px solid #E5E2D8", borderRadius: 10,
  fontFamily: "inherit", fontSize: 13, color: "#1A1A1A",
  outline: "none", caretColor: "#F0A500",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: "vertical", minHeight: 80,
};

// ============================================================
// PAGE UTAMA
// ============================================================
export default function EquipmentsPage() {
  const { confirm } = useConfirm();

  const [userRole, setUserRole]                   = useState<string | null>(null);
  const [companies, setCompanies]                 = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [searchCompanyText, setSearchCompanyText] = useState("");
  const [companyPage, setCompanyPage]             = useState(1);
  const companiesPerPage = 5;

  const [equipments, setEquipments]     = useState<Equipment[]>([]);
  const [isLoadingEq, setIsLoadingEq]   = useState(false);
  const [searchEqText, setSearchEqText] = useState("");
  const [eqPage, setEqPage]             = useState(1);
  const eqPerPage = 10;

  const fileInputRef                        = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading]       = useState(false);
  const [statusMsg, setStatusMsg]           = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeEq, setActiveEq]     = useState<Equipment | null>(null);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen]   = useState(false);
  const [editingEq, setEditingEq]               = useState<Equipment | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEq, setNewEq] = useState({
    name: "", location: "", permitNumber: "", serialNumber: "",
    inspectionDate: "", expiryDate: "",
    area: "", brand: "", capacity: "", description: "",
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Notify & select
  const [notifyingId, setNotifyingId]               = useState<string | null>(null);
  const [isNotifyingBulkAll, setIsNotifyingBulkAll] = useState(false);
  const [selectedEqIds, setSelectedEqIds]           = useState<string[]>([]);
  const [deletingId, setDeletingId]                 = useState<string | null>(null);

  // Client Request State
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // ── Init ──
  useEffect(() => {
    const stored = localStorage.getItem("userProfile");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    setUserRole(parsed.role);
    if (parsed.role === "SUPERADMIN") fetchCompanies();
    else fetchEquipments(null);
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) return;
    fetchEquipments(selectedCompanyId);
    setSearchEqText(""); setEqPage(1); setSelectedEqIds([]);
  }, [selectedCompanyId]);

  // Reset page kalau search berubah
  useEffect(() => { setEqPage(1); },      [searchEqText]);
  useEffect(() => { setCompanyPage(1); }, [searchCompanyText]);

  // ── Fetch ──
  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      if (res.ok) setCompanies(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchEquipments = async (companyId: string | null) => {
    setIsLoadingEq(true); setStatusMsg(null);
    try {
      const res = await fetch("/api/equipments");
      if (!res.ok) throw new Error("Gagal memuat data alat");
      let data: Equipment[] = await res.json();
      if (userRole === "SUPERADMIN" && companyId)
        data = data.filter((eq) => eq.companyId === companyId);
      setEquipments(data);
      if (activeEq) {
        const updated = data.find((eq) => eq.id === activeEq.id);
        if (updated) setActiveEq(updated);
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setIsLoadingEq(false);
    }
  };

  // ── Client Request Handler ──
  const handleClientRequest = async (type: 'inspeksi' | 'dokumen') => {
    if (selectedEqIds.length === 0) {
      setStatusMsg({ type: "error", text: "Pilih setidaknya satu alat terlebih dahulu." });
      return;
    }

    const label = type === 'inspeksi' ? 'permohonan inspeksi ulang' : 'permintaan dokumen (Suket/Laporan)';
    const ok = await confirm({
      variant: "info",
      title: "Kirim Permohonan",
      description: `Kirim ${label} untuk ${selectedEqIds.length} alat yang dipilih ke Admin Marusindo?`,
      confirmLabel: "Ya, Kirim",
      cancelLabel: "Batal",
    });

    if (!ok) return;

    setIsSubmittingRequest(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/equipments/client-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentIds: selectedEqIds,
          requestType: type
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim permohonan.");

      setStatusMsg({ type: "success", text: data.message });
      setSelectedEqIds([]); // Reset seleksi setelah berhasil
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // ── Import Excel ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompanyId) return;
    setIsUploading(true); setStatusMsg(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data     = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const ws       = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(ws);
        const mapped = json.map((row) => ({
          name:           row["ALAT"]         || row["Nama Alat"]  || null,
          location:       row["LOKASI"]       || row["Lokasi"]     || null,
          permitNumber:   row["NOMOR IZIN"]  || row["Nomor Izin"] || null,
          serialNumber:   row["NOMOR SERIE"] || row["NOMOR SERI"] || null,
          inspectionDate: parseExcelDate(row["TANGGAL PEMERIKSAAN"] || row["Tanggal Pemeriksaan"]),
          expiryDate:     parseExcelDate(row["TANGGAL HABIS"]       || row["Tanggal Habis"]),
          area:        row["AREA"]       || row["Area"]       || null,
          brand:       row["MEREK"]      || row["Merek"]      || null,
          capacity:    row["KAPASITAS"]  || row["Kapasitas"]  || null,
          description: row["KETERANGAN"] || row["Keterangan"] || null,
        }));
        if (!mapped.length) throw new Error("Excel kosong atau format kolom tidak sesuai.");
        const res     = await fetch("/api/equipments/bulk", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: selectedCompanyId, equipments: mapped }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.message);
        setStatusMsg({ type: "success", text: resData.message });
        fetchEquipments(selectedCompanyId);
      } catch (err: any) {
        setStatusMsg({ type: "error", text: err.message || "Gagal membaca file Excel." });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      "ALAT": "CONTOH ALAT (WAJIB)", "LOKASI": "Gedung A",
      "NOMOR IZIN": "Cth: 123/IZIN/2025", "NOMOR SERIE": "Cth: SN-001",
      "TANGGAL PEMERIKSAAN": "2025-01-01", "TANGGAL HABIS": "2026-01-01",
      "AREA": ".....", "MEREK": "....",
      "KAPASITAS": "Cth: 5 Ton", "KETERANGAN": "Catatan tambahan (opsional)",
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ["A1","B1","C1","D1","E1","F1","G1","H1","I1","J1"].forEach((col) => {
      if (ws[col]) ws[col].s = {
        fill: { fgColor: { rgb: "F0A500" } },
        font: { bold: true, color: { rgb: "1A1A1A" } },
        alignment: { horizontal: "center" },
      };
    });
    ws["!cols"] = Array(10).fill({ wch: 26 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Import");
    XLSX.writeFile(wb, "Template_Import_MTrack.xlsx");
  };

  // ── Delete ──
  const handleDeleteEq = async (id: string, name: string) => {
    const ok = await confirm({
      variant: "danger", title: "Hapus Data Alat",
      description: `Alat "${name}" akan dihapus permanen beserta semua dokumen terkait. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: "Ya, Hapus", cancelLabel: "Batal",
    });
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/equipments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data alat.");
      setStatusMsg({ type: "success", text: "Alat berhasil dihapus." });
      fetchEquipments(selectedCompanyId);
      setSelectedEqIds((prev) => prev.filter((x) => x !== id));
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Edit ──
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEq) return;
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/equipments/${editingEq.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingEq.name, location: editingEq.location,
          permitNumber: editingEq.permitNumber, serialNumber: editingEq.serialNumber,
          inspectionDate: editingEq.inspectionDate, expiryDate: editingEq.expiryDate,
          area: editingEq.area, brand: editingEq.brand,
          capacity: editingEq.capacity, description: editingEq.description,
        }),
      });
      if (!res.ok) throw new Error("Gagal mengupdate data alat.");
      setStatusMsg({ type: "success", text: "Data alat berhasil diperbarui." });
      setIsEditModalOpen(false);
      fetchEquipments(selectedCompanyId);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // ── Add ──
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setIsSubmittingAdd(true);
    try {
      const res = await fetch("/api/equipments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEq, companyId: selectedCompanyId }),
      });
      if (!res.ok) throw new Error("Gagal menambah data alat.");
      setStatusMsg({ type: "success", text: "Data alat berhasil ditambahkan." });
      setIsAddModalOpen(false);
      setNewEq({ name: "", location: "", permitNumber: "", serialNumber: "", inspectionDate: "", expiryDate: "", area: "", brand: "", capacity: "", description: "" });
      fetchEquipments(selectedCompanyId);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // ── Admin Notify (DITINGKATKAN) ──
  const handleAdminNotify = async (type: 'expired' | 'ready') => {
    if (!selectedCompanyId) return;
    const isCustom = selectedEqIds.length > 0;
    
    const config = type === 'expired' 
      ? { title: "Alert Expired", label: "Peringatan Expired", variant: "danger" as const, icon: MailWarning }
      : { title: "Notif Dokumen", label: "Notif Dokumen Ready", variant: "info" as const, icon: FileCheck };

    const ok = await confirm({
      variant: config.variant,
      title: config.title,
      description: isCustom 
        ? `Kirim ${config.label.toLowerCase()} untuk ${selectedEqIds.length} alat yang dipilih?`
        : `Tidak ada alat dipilih. Kirim ${config.label.toLowerCase()} ke semua alat yang sesuai?`,
      confirmLabel: "Ya, Kirim",
      cancelLabel: "Batal",
    });

    if (!ok) return;

    setIsNotifyingBulkAll(true);
    setStatusMsg(null);

    try {
      // Kita pakai endpoint notify-bulk yang lebih generic
      const res = await fetch(`/api/companies/${selectedCompanyId}/notify-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          selectedIds: selectedEqIds,
          type: type // 'expired' atau 'ready'
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim notifikasi.");

      setStatusMsg({ type: "success", text: data.message });
      setSelectedEqIds([]);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setIsNotifyingBulkAll(false);
    }
  };

  // ── Notify single ──
  const handleManualNotify = async (eq: Equipment) => {
    const ok = await confirm({
      variant: "info", title: "Kirim Notifikasi",
      description: `Kirim email peringatan manual ke klien untuk alat "${eq.name}"?`,
      confirmLabel: "Ya, Kirim", cancelLabel: "Batal",
    });
    if (!ok) return;
    setNotifyingId(eq.id);
    try {
      const res = await fetch(`/api/equipments/${eq.id}/notify`, { method: "POST" });
      if (!res.ok) throw new Error("Gagal mengirim notifikasi.");
      setStatusMsg({ type: "success", text: "Notifikasi berhasil dikirim." });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setNotifyingId(null);
    }
  };

  // ── Select ──
  const toggleSelectEq  = (id: string) =>
    setSelectedEqIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleSelectAll = () => {
    const ids = paginatedEquipments.map((eq) => eq.id);
    const allSelected = ids.every((id) => selectedEqIds.includes(id));
    if (allSelected) setSelectedEqIds((prev) => prev.filter((id) => !ids.includes(id)));
    else setSelectedEqIds((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
  };

  // ── Derived: companies ──
  const filteredCompanies   = companies.filter((c) =>
    c.name.toLowerCase().includes(searchCompanyText.toLowerCase())
  );
  const totalCompanyPages   = Math.max(1, Math.ceil(filteredCompanies.length / companiesPerPage));
  const paginatedCompanies  = filteredCompanies.slice(
    (companyPage - 1) * companiesPerPage,
    companyPage * companiesPerPage
  );
  const selectedCompany     = companies.find((c) => c.id === selectedCompanyId);

  // ── Derived: equipments ──
  const filteredEquipments  = equipments.filter((eq) => {
    const t = searchEqText.toLowerCase();
    return eq.name?.toLowerCase().includes(t)
      || eq.permitNumber?.toLowerCase().includes(t)
      || eq.serialNumber?.toLowerCase().includes(t)
      || eq.brand?.toLowerCase().includes(t)
      || eq.area?.toLowerCase().includes(t);
  });
  const totalEqPages        = Math.max(1, Math.ceil(filteredEquipments.length / eqPerPage));
  const paginatedEquipments = filteredEquipments.slice(
    (eqPage - 1) * eqPerPage,
    eqPage * eqPerPage
  );

  // ── Form fields reusable ──
  const renderFormFields = (
    data: Partial<Equipment> & { inspectionDate?: string; expiryDate?: string },
    onChange: (key: string, val: string) => void
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 2 }}>
          <label className="modal-label">Nama Alat <span style={{ color: "#DC3C3C" }}>*</span></label>
          <input type="text" required style={inputStyle} value={data.name || ""} onChange={(e) => onChange("name", e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="modal-label">Merek</label>
          <input type="text" style={inputStyle} placeholder="Komatsu..." value={data.brand || ""} onChange={(e) => onChange("brand", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label className="modal-label">Lokasi</label>
          <input type="text" style={inputStyle} value={data.location || ""} onChange={(e) => onChange("location", e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="modal-label">Area Penempatan</label>
          <input type="text" style={inputStyle} placeholder="Area Produksi Lt.2" value={data.area || ""} onChange={(e) => onChange("area", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label className="modal-label">No. Izin</label>
          <input type="text" style={inputStyle} value={data.permitNumber || ""} onChange={(e) => onChange("permitNumber", e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="modal-label">Serial Number</label>
          <input type="text" style={inputStyle} value={data.serialNumber || ""} onChange={(e) => onChange("serialNumber", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="modal-label">Kapasitas</label>
        <input type="text" style={inputStyle} placeholder="cth: 5 Ton, 500 kVA" value={data.capacity || ""} onChange={(e) => onChange("capacity", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label className="modal-label">Tgl Inspeksi <span style={{ color: "#DC3C3C" }}>*</span></label>
          <input type="date" required style={inputStyle}
            value={data.inspectionDate ? String(data.inspectionDate).split("T")[0] : ""}
            onChange={(e) => onChange("inspectionDate", e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="modal-label">Tgl Kedaluwarsa <span style={{ color: "#DC3C3C" }}>*</span></label>
          <input type="date" required style={inputStyle}
            value={data.expiryDate ? String(data.expiryDate).split("T")[0] : ""}
            onChange={(e) => onChange("expiryDate", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="modal-label">Keterangan</label>
        <textarea style={textareaStyle} placeholder="Catatan tambahan..." value={data.description || ""} onChange={(e) => onChange("description", e.target.value)} />
      </div>
    </div>
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <style>{`
        .eq-root * { box-sizing: border-box; }
        .eq-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @keyframes eq-fadeup { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes eq-spin   { to { transform: rotate(360deg); } }

        .eq-inner { padding:28px 20px; max-width:1280px; margin:0 auto; animation: eq-fadeup 0.4s ease both; }
        @media (min-width:768px)  { .eq-inner { padding:40px 32px; } }
        @media (min-width:1024px) { .eq-inner { padding:48px 48px; } }

        .eq-eyebrow    { font-size:10px; font-weight:500; color:#C87A00; text-transform:uppercase; letter-spacing:0.14em; margin-bottom:8px; }
        .eq-page-title { font-size:clamp(20px,3.5vw,26px); font-weight:700; color:#1A1A1A; margin:0 0 6px; line-height:1.15; display:flex; align-items:center; gap:12px; }
        .eq-title-icon { width:36px; height:36px; background:rgba(240,165,0,0.08); border:1.5px solid rgba(240,165,0,0.18); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#C87A00; flex-shrink:0; }
        .eq-page-desc  { font-size:13px; color:#1A1A1A; margin:0; } /* UBAH: ABU KE ITEM */
        .eq-divider    { height:1px; background:linear-gradient(90deg,#F0A500 0%,transparent 60%); margin:24px 0 28px; opacity:0.2; }

        .eq-status-msg         { display:flex; align-items:center; gap:10px; padding:13px 16px; border-radius:10px; font-size:13px; margin-bottom:24px; }
        .eq-status-msg.error   { background:rgba(220,60,60,0.06);  border:1px solid rgba(220,60,60,0.15);  color:#DC3C3C; }
        .eq-status-msg.success { background:rgba(34,160,100,0.06); border:1px solid rgba(34,160,100,0.15); color:#22A064; }

        .eq-layout { display:flex; flex-direction:column; gap:16px; }
        @media (min-width:1024px) { .eq-layout { flex-direction:row; align-items:flex-start; } }
        .eq-left  { width:100%; flex-shrink:0; display:flex; flex-direction:column; gap:12px; }
        @media (min-width:1024px) { .eq-left { width:272px; } }
        .eq-right { flex:1; min-width:0; display:flex; flex-direction:column; }

        .eq-card        { background:#FFFFFF; border:1.5px solid #E8E4DC; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.05); }
        .eq-card-header { padding:14px 18px; background:#FAFAF7; border-bottom:1px solid #F0EDE4; display:flex; align-items:center; gap:8px; }
        .eq-card-header-icon { width:28px; height:28px; background:rgba(240,165,0,0.08); border:1.5px solid rgba(240,165,0,0.18); border-radius:7px; display:flex; align-items:center; justify-content:center; color:#C87A00; flex-shrink:0; }
        .eq-card-title  { font-size:13px; font-weight:600; color:#1A1A1A; } /* UBAH: ABU KE ITEM */

        .eq-company-list { padding:8px; display:flex; flex-direction:column; gap:2px; }

        .eq-company-btn       { width:100%; text-align:left; padding:10px 14px; border-radius:9px; background:transparent; border:1.5px solid transparent; font-family:inherit; font-size:13px; font-weight:500; color:#1A1A1A; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:8px; transition:0.15s; } /* UBAH: ABU KE ITEM */
        .eq-company-btn:hover { background:#F5F3EE; color:#1A1A1A; border-color:#EAE7DF; }
        .eq-company-btn.active{ background:rgba(240,165,0,0.08); border-color:rgba(240,165,0,0.22); color:#C87A00; font-weight:600; }
        .eq-company-btn span  { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        .eq-toolbar      { padding:14px 18px; background:#FAFAF7; border-bottom:1px solid #F0EDE4; display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
        .eq-search-wrap  { position:relative; flex:1; min-width:160px; max-width:320px; }
        .eq-search-icon  { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#1A1A1A; pointer-events:none; } /* UBAH: ABU KE ITEM */
        .eq-search-input { width:100%; padding:9px 14px 9px 34px; background:#FFFFFF; border:1.5px solid #E5E2D8; border-radius:8px; font-family:inherit; font-size:13px; color:#1A1A1A; outline:none; transition:0.2s; caret-color:#F0A500; }
        .eq-search-input::placeholder { color:#CCCCCC; }
        .eq-search-input:focus         { border-color:rgba(240,165,0,0.35); box-shadow:0 0 0 3px rgba(240,165,0,0.08); }
        .eq-search-input:disabled      { opacity:0.4; cursor:not-allowed; }

        .eq-tool-btn             { display:flex; align-items:center; gap:7px; padding:8px 14px; background:#FFFFFF; border:1.5px solid #E5E2D8; border-radius:8px; font-family:inherit; font-size:12px; font-weight:500; color:#1A1A1A; cursor:pointer; white-space:nowrap; transition:0.2s; } /* UBAH: ABU KE ITEM */
        .eq-tool-btn:hover:not(:disabled)       { background:#F5F3EE; border-color:#C8C0B0; color:#1A1A1A; }
        .eq-tool-btn.amber:hover:not(:disabled) { background:rgba(240,165,0,0.07); border-color:rgba(240,165,0,0.25); color:#C87A00; }
        .eq-tool-btn.red:hover:not(:disabled)   { background:rgba(220,60,60,0.06);  border-color:rgba(220,60,60,0.2);  color:#DC3C3C; }
        .eq-tool-btn.green:hover:not(:disabled) { background:rgba(34,160,100,0.06); border-color:rgba(34,160,100,0.2); color:#22A064; }
        .eq-tool-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .eq-selected-tag { font-size:11px; font-weight:500; color:#C87A00; background:rgba(240,165,0,0.07); border:1px solid rgba(240,165,0,0.18); border-radius:6px; padding:3px 9px; white-space:nowrap; font-family:monospace; }

        /* HORIZONTAL SCROLL UPDATES */
        .eq-table-wrap { 
          flex:1; 
          overflow-x: auto; 
          overflow-y: visible; 
          min-height: 420px;
          scrollbar-width: thin;
          scrollbar-color: #EAE7DF transparent;
        }
        .eq-table-wrap::-webkit-scrollbar { height: 8px; }
        .eq-table-wrap::-webkit-scrollbar-track { background: transparent; }
        .eq-table-wrap::-webkit-scrollbar-thumb { background-color: #EAE7DF; border-radius: 4px; }

        .eq-table      { width:100%; border-collapse:collapse; text-align:left; min-width: 1300px; }
        .eq-table thead { position:sticky; top:0; z-index:15; background:#FAFAF7; }
        .eq-table thead th { padding:12px 16px; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; color:#1A1A1A; border-bottom:1px solid #F0EDE4; white-space:nowrap; } /* UBAH: ABU KE ITEM */
        .eq-table tbody tr { border-bottom:1px solid #F5F3EE; transition:background 0.12s; }
        .eq-table tbody tr:last-child { border-bottom:none; }
        .eq-table tbody tr:hover td:not(.sticky-col)  { background:#FDFCF8; }
        .eq-table td { padding:12px 16px; vertical-align:middle; white-space: nowrap; font-size: 13px; color: #1A1A1A; }

        .eq-eq-name   { font-size:13px; font-weight:600; color:#1A1A1A; cursor:pointer; display:inline; }
        .eq-eq-name:hover { color:#C87A00; text-decoration:underline; text-underline-offset:3px; }
        .eq-permit, .eq-insp-date, .eq-expiry { font-size:12px; color:#1A1A1A; font-family:monospace; } /* UBAH: SEMUA KE ITEM */

        /* BADGES */
        .eq-badge          { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:999px; font-size:10px; font-weight:500; text-transform:uppercase; letter-spacing:0.06em; white-space:nowrap; }
        .eq-badge.safe    { background:rgba(34,160,100,0.07);  border:1px solid rgba(34,160,100,0.18);  color:#22A064; }
        .eq-badge.warning { background:rgba(240,165,0,0.08);   border:1px solid rgba(240,165,0,0.2);    color:#C87A00; }
        .eq-badge.danger  { background:rgba(220,60,60,0.07);   border:1px solid rgba(220,60,60,0.18);   color:#DC3C3C; }
        /* Badge Tambahan: Proses Dinas */
        .eq-badge.process { background:rgba(59,130,246,0.08);  border:1px solid rgba(59,130,246,0.22);  color:#3B82F6; }

        .eq-empty       { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:340px; text-align:center; padding:40px 20px; position: sticky; left: 0;}
        .eq-empty-icon  { width:56px; height:56px; background:#F5F3EE; border:1.5px solid #E5E2D8; border-radius:14px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:#1A1A1A; } /* UBAH: KE ITEM */
        .eq-empty-title { font-size:14px; font-weight:600; color:#1A1A1A; margin:0 0 6px; } /* UBAH: KE ITEM */
        .eq-empty-desc  { font-size:12px; color:#1A1A1A; margin:0; } /* UBAH: KE ITEM */
        .eq-spinner     { animation: eq-spin 1s linear infinite; }

        .action-btn           { padding:6px; border-radius:7px; cursor:pointer; background:#F5F3EE; border:1.5px solid #E5E2D8; color:#1A1A1A; transition:0.2s; } /* UBAH: KE ITEM */
        .action-btn:hover         { background:#EDEAE3; color:#1A1A1A; border-color:#C8C0B0; }
        .action-btn.delete:hover  { background:rgba(220,60,60,0.07); border-color:rgba(220,60,60,0.2); color:#DC3C3C; }
        .action-btn.notify:hover  { background:rgba(34,160,100,0.07); border-color:rgba(34,160,100,0.2); color:#22A064; }
        .action-btn:disabled      { opacity:0.4; cursor:not-allowed; }

        .doc-btn       { padding:5px 11px; font-size:11px; font-weight:500; border-radius:7px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:0.2s; border:1.5px solid #E5E2D8; font-family:inherit; background:#F5F3EE; color:#1A1A1A; } /* UBAH: KE ITEM */
        .doc-btn:hover { background:rgba(240,165,0,0.08); border-color:rgba(240,165,0,0.25); color:#C87A00; }

        /* Pagination — shared style */
        .pag-bar  { padding:10px 12px; border-top:1px solid #F0EDE4; background:#FAFAF7; display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .pag-info { font-size:10px; color:#1A1A1A; font-family:monospace; white-space:nowrap; } /* UBAH: KE ITEM */
        .pag-btns { display:flex; gap:6px; }
        .pag-btn  { padding:5px 10px; font-size:11px; font-weight:500; border-radius:7px; background:#FFFFFF; border:1.5px solid #E5E2D8; color:#1A1A1A; cursor:pointer; display:flex; align-items:center; gap:3px; transition:0.15s; font-family:monospace; } /* UBAH: KE ITEM */
        .pag-btn:hover:not(:disabled) { background:rgba(240,165,0,0.07); border-color:rgba(240,165,0,0.25); color:#C87A00; }
        .pag-btn:disabled { opacity:0.35; cursor:not-allowed; }

        .modal-overlay  { position:fixed; inset:0; background:rgba(0,0,0,0.25); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; overflow-y:auto; }
        .modal-content  { background:#FFFFFF; border:1.5px solid #EAE7DF; border-radius:16px; width:100%; max-width:560px; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.1); animation:eq-fadeup 0.2s ease-out; margin:auto; max-height:90vh; overflow-y:auto; }
        .modal-title     { font-size:16px; font-weight:700; color:#1A1A1A; margin-bottom:4px; }
        .modal-subtitle { font-size:12px; color:#1A1A1A; margin-bottom:20px; } /* UBAH: KE ITEM */
        .modal-label    { display:block; font-size:11px; font-weight:600; color:#1A1A1A; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px; } /* UBAH: KE ITEM */
        .modal-btn-cancel { flex:1; padding:11px; background:#F5F3EE; border:1.5px solid #E5E2D8; border-radius:10px; font-family:inherit; font-size:13px; font-weight:500; color:#1A1A1A; cursor:pointer; transition:0.15s; } /* UBAH: KE ITEM */
        .modal-btn-cancel:hover:not(:disabled) { background:#EDEAE3; color:#1A1A1A; }
        .modal-btn-cancel:disabled { opacity:0.4; cursor:not-allowed; }
        .modal-btn-submit { flex:1; padding:11px; background:#F0A500; border:none; border-radius:10px; font-family:inherit; font-size:13px; font-weight:600; color:#1A1A1A; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:0.2s; box-shadow:0 4px 14px rgba(240,165,0,0.2); }
        .modal-btn-submit:hover:not(:disabled) { background:#E09800; transform:translateY(-1px); }
        .modal-btn-submit:disabled { opacity:0.5; cursor:not-allowed; }
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
              {statusMsg.type === "error"
                ? <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                : <ShieldCheck size={15} style={{ flexShrink: 0 }} />}
              {statusMsg.text}
            </div>
          )}

          <div className="eq-layout">
            {/* ── SIDEBAR PERUSAHAAN ── */}
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
                      <input type="text" placeholder="Cari PT..." className="eq-search-input"
                        style={{ padding: "7px 10px 7px 30px", fontSize: 11 }}
                        value={searchCompanyText}
                        onChange={(e) => { setSearchCompanyText(e.target.value); setCompanyPage(1); }} />
                    </div>
                  </div>

                  <div className="eq-company-list">
                    {companies.length === 0 ? (
                      <div style={{ padding: "24px 14px", textAlign: "center" }}>
                        <Loader2 size={20} className="eq-spinner" style={{ color: "#C87A00", margin: "0 auto 8px", display: "block" }} />
                        <p style={{ fontSize: 10, color: "#1A1A1A", fontFamily: "monospace" }}>Memuat klien...</p>
                      </div>
                    ) : filteredCompanies.length === 0 ? (
                      <p style={{ textAlign: "center", padding: "20px", color: "#1A1A1A", fontSize: 12 }}>Klien tidak ditemukan</p>
                    ) : paginatedCompanies.map((c) => (
                      <button key={c.id}
                        className={`eq-company-btn ${selectedCompanyId === c.id ? "active" : ""}`}
                        onClick={() => setSelectedCompanyId(c.id)}
                      >
                        <span>{c.name}</span>
                        <ChevronRight size={14} style={{ flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>

                  <div className="pag-bar">
                    <span className="pag-info">
                      {filteredCompanies.length === 0 ? "0 klien" : `${(companyPage - 1) * companiesPerPage + 1}–${Math.min(companyPage * companiesPerPage, filteredCompanies.length)} / ${filteredCompanies.length}`}
                    </span>
                    <div className="pag-btns">
                      <button className="pag-btn" disabled={companyPage === 1} onClick={() => setCompanyPage((p) => p - 1)}>
                        <ChevronLeft size={12} /> Prev
                      </button>
                      <button className="pag-btn" disabled={companyPage === totalCompanyPages} onClick={() => setCompanyPage((p) => p + 1)}>
                        Next <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <button className="eq-tool-btn amber" onClick={handleDownloadTemplate} style={{ justifyContent: "center", padding: 11, width: "100%" }}>
                  <Download size={14} /> Download Template
                </button>
              </div>
            )}

            {/* ── TABEL ALAT ── */}
            <div className="eq-right">
              <div className="eq-card" style={{ display: "flex", flexDirection: "column" }}>
                <div className="eq-toolbar">
                  <div className="eq-search-wrap">
                    <Search size={14} className="eq-search-icon" />
                    <input type="text" placeholder="Cari alat, merek, area..."
                      className="eq-search-input"
                      disabled={!selectedCompanyId && userRole === "SUPERADMIN"}
                      value={searchEqText} onChange={(e) => setSearchEqText(e.target.value)} />
                  </div>
                  {selectedCompany && <span className="eq-selected-tag">{selectedCompany.name}</span>}
                  <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: "none" }} />
                  
                  {/* BUTTONS UNTUK ADMIN */}
                  {userRole === "SUPERADMIN" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <button className="eq-tool-btn amber" onClick={() => setIsAddModalOpen(true)} disabled={!selectedCompanyId}>
                        <Plus size={13} /> Tambah Manual
                      </button>
                      <button className="eq-tool-btn amber" onClick={() => fileInputRef.current?.click()} disabled={!selectedCompanyId || isUploading}>
                        {isUploading ? <Loader2 size={13} className="eq-spinner" /> : <FileUp size={13} />} Import File
                      </button>
                      
                      {/* PELURU 1: ALERT EXPIRED (NAGIH) */}
                      <button 
                        className="eq-tool-btn red" 
                        onClick={() => handleAdminNotify('expired')} 
                        disabled={!selectedCompanyId || isNotifyingBulkAll}
                      >
                        {isNotifyingBulkAll ? <Loader2 size={13} className="eq-spinner" /> : <MailWarning size={13} />}
                        {selectedEqIds.length > 0 ? `Kirim ${selectedEqIds.length} Peringatan` : "Alert Expired"}
                      </button>

                      {/* PELURU 2: NOTIF DOKUMEN READY (INFO SELESAI) */}
                      <button 
                        className="eq-tool-btn green" 
                        onClick={() => handleAdminNotify('ready')} 
                        disabled={!selectedCompanyId || isNotifyingBulkAll}
                      >
                        {isNotifyingBulkAll ? <Loader2 size={13} className="eq-spinner" /> : <FileCheck size={13} />}
                        {selectedEqIds.length > 0 ? `Notif ${selectedEqIds.length} Dokumen` : "Notif Dok Ready"}
                      </button>
                    </div>
                  )}

                  {/* BUTTONS UNTUK KLIEN (USER BIASA) */}
                  {userRole !== "SUPERADMIN" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <button 
                        className="eq-tool-btn amber" 
                        onClick={() => handleClientRequest('inspeksi')} 
                        disabled={selectedEqIds.length === 0 || isSubmittingRequest}
                      >
                        {isSubmittingRequest ? <Loader2 size={13} className="eq-spinner" /> : <Send size={13} />} 
                        Request Inspeksi
                      </button>
                      <button 
                        className="eq-tool-btn amber" 
                        onClick={() => handleClientRequest('dokumen')} 
                        disabled={selectedEqIds.length === 0 || isSubmittingRequest}
                      >
                        {isSubmittingRequest ? <Loader2 size={13} className="eq-spinner" /> : <FileUp size={13} />} 
                        Request Dokumen
                      </button>
                    </div>
                  )}
                </div>

                {/* Tabel */}
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
                          <th style={{ width: 40, paddingRight: 0, textAlign: "center", position: "sticky", left: 0, zIndex: 20, background: "#FAFAF7" }}>
                            <input type="checkbox" style={{ cursor: "pointer", accentColor: "#F0A500" }}
                              checked={paginatedEquipments.length > 0 && paginatedEquipments.every((eq) => selectedEqIds.includes(eq.id))}
                              onChange={toggleSelectAll} />
                          </th>
                          <th style={{ position: "sticky", left: 40, zIndex: 20, background: "#FAFAF7", boxShadow: "2px 0 5px rgba(0,0,0,0.03)" }}>Nama Alat</th>
                          <th>Merek</th>
                          <th>Lokasi / Area</th>
                          <th>No. Izin</th>
                          <th>Serial Number</th>
                          <th>Kapasitas</th>
                          <th>Tgl Inspeksi</th>
                          <th>Tgl Kedaluwarsa</th>
                          <th>Status</th>
                          <th>Keterangan</th>
                          <th style={{ textAlign: "center", position: "sticky", right: 0, zIndex: 20, background: "#FAFAF7", boxShadow: "-2px 0 5px rgba(0,0,0,0.03)" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedEquipments.map((eq) => {
                          const status     = getStatus(eq.expiryDate);
                          const StatusIcon = status.icon;
                          const isSelected = selectedEqIds.includes(eq.id);
                          const hasDocs    = (eq.suket?.length ?? 0) > 0 || (eq.laporan?.length ?? 0) > 0;
                          
                          const stickyBg = isSelected ? "#FDFCF8" : "#FFFFFF";

                          return (
                            <tr key={eq.id} style={{ background: isSelected ? "#FDFCF8" : "transparent" }}>
                              <td className="sticky-col" style={{ width: 40, paddingRight: 0, textAlign: "center", position: "sticky", left: 0, background: stickyBg, zIndex: 10 }}>
                                <input type="checkbox" style={{ cursor: "pointer", accentColor: "#F0A500" }}
                                  checked={isSelected} onChange={() => toggleSelectEq(eq.id)} />
                              </td>
                              
                              <td className="sticky-col" style={{ 
                                position: "sticky", 
                                left: 40, 
                                background: stickyBg, 
                                zIndex: 10, 
                                boxShadow: "2px 0 5px rgba(0,0,0,0.02)",
                                whiteSpace: "normal", 
                                maxWidth: 220,        
                                wordBreak: "break-word",
                                lineHeight: 1.4
                              }}>
                                <p className="eq-eq-name" onClick={() => { setActiveEq(eq); setDrawerOpen(true); }}>
                                  {eq.name}
                                  {eq.name.toLowerCase() === 'lift' || eq.name.toLowerCase() === 'crane' ? ` - ${eq.area || eq.location || eq.serialNumber}` : ''}
                                </p>
                              </td>

                              <td><span className="eq-permit">{eq.brand || "-"}</span></td>
                              <td><span className="eq-permit">{[eq.location, eq.area].filter(Boolean).join(" - ") || "-"}</span></td>
                              <td><span className="eq-permit">{eq.permitNumber || "-"}</span></td>
                              <td><span className="eq-permit">{eq.serialNumber || "-"}</span></td>
                              <td><span className="eq-permit">{eq.capacity || "-"}</span></td>
                              <td>
                                <span className="eq-insp-date">
                                  {new Date(eq.inspectionDate).toLocaleDateString("id-ID")}
                                </span>
                              </td>
                              <td>
                                <span className="eq-expiry">
                                  {new Date(eq.expiryDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                              </td>

                              {/* KOLOM STATUS GANDA */}
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                  
                                  {/* Badge 1: Status Waktu (Aman/Warning/Expired) */}
                                  <span className={`eq-badge ${status.variant}`}>
                                    <StatusIcon size={10} />
                                    {status.label} ({status.days < 0 ? "Lewat" : `${status.days}hr`})
                                  </span>

                                  {/* Badge 2: Status Manual dari Database */}
                                  {eq.isProsesDinas && (
                                    <span className="eq-badge process" style={{ marginTop: 0 }}>
                                      <Clock size={10} /> Proses Dinas
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", color: "#1A1A1A", fontSize: 12 }}>
                                {eq.description || "-"}
                              </td>
                              <td className="sticky-col" style={{ textAlign: "center", verticalAlign: "middle", position: "sticky", right: 0, background: stickyBg, zIndex: 10, boxShadow: "-2px 0 5px rgba(0,0,0,0.02)" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                  <button onClick={() => { setActiveEq(eq); setDrawerOpen(true); }} className="doc-btn"
                                    style={{
                                      background:  hasDocs ? "rgba(34,160,100,0.07)" : "#F5F3EE",
                                      color:       hasDocs ? "#22A064" : "#1A1A1A",
                                      borderColor: hasDocs ? "rgba(34,160,100,0.2)" : "#E5E2D8",
                                    }}>
                                    <FolderOpen size={13} /> Dok
                                  </button>
                                  {userRole === "SUPERADMIN" && (
                                    <>
                                      <button onClick={() => handleManualNotify(eq)} disabled={notifyingId === eq.id} className="action-btn notify" title="Kirim Notifikasi Manual">
                                        {notifyingId === eq.id ? <Loader2 size={14} className="eq-spinner" /> : <Send size={14} />}
                                      </button>
                                      <button onClick={() => { setEditingEq(eq); setIsEditModalOpen(true); }} className="action-btn" title="Edit Data">
                                        <Edit size={14} />
                                      </button>
                                      <button onClick={() => handleDeleteEq(eq.id, eq.name)} disabled={deletingId === eq.id} className="action-btn delete" title="Hapus Data">
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

                {filteredEquipments.length > 0 && (
                  <div className="pag-bar">
                    <span className="pag-info">
                      {`${(eqPage - 1) * eqPerPage + 1}–${Math.min(eqPage * eqPerPage, filteredEquipments.length)} / ${filteredEquipments.length} alat`}
                    </span>
                    <div className="pag-btns">
                      <button className="pag-btn" disabled={eqPage === 1} onClick={() => setEqPage((p) => p - 1)}>
                        <ChevronLeft size={12} /> Prev
                      </button>
                      <button className="pag-btn" disabled={eqPage === totalEqPages} onClick={() => setEqPage((p) => p + 1)}>
                        Next <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DOCUMENT DRAWER ── */}
      <DocumentDrawer
        equipment={activeEq}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userRole={userRole}
        onDocumentSaved={() => fetchEquipments(selectedCompanyId)}
      />

      {/* ── MODAL EDIT ── */}
      {isEditModalOpen && editingEq && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isSubmittingEdit) setIsEditModalOpen(false); }}>
          <div className="modal-content">
            <h3 className="modal-title">Edit Data Alat</h3>
            <p className="modal-subtitle">Perbarui informasi inspeksi dan perizinan</p>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {renderFormFields(
                { ...editingEq },
                (key, val) => setEditingEq((prev) => prev ? { ...prev, [key]: val } : prev)
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button type="button" className="modal-btn-cancel" onClick={() => setIsEditModalOpen(false)} disabled={isSubmittingEdit}>Batal</button>
                <button type="submit" className="modal-btn-submit" disabled={isSubmittingEdit}>
                  {isSubmittingEdit ? <Loader2 size={14} className="eq-spinner" /> : <><CheckCircle2 size={14} /> Simpan Perubahan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL TAMBAH ── */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isSubmittingAdd) setIsAddModalOpen(false); }}>
          <div className="modal-content">
            <h3 className="modal-title">Tambah Data Alat Manual</h3>
            <p className="modal-subtitle">Masukkan data alat secara satuan</p>
            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {renderFormFields(
                newEq,
                (key, val) => setNewEq((prev) => ({ ...prev, [key]: val }))
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
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