"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // ✅ FIX: ganti min-h-screen → h-screen, tambah overflow-hidden
    // Ini "mengunci" tinggi layout pas di viewport, supaya scroll terjadi di dalam
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0A0A0A" }}>

      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      {/* ✅ FIX: tambah overflow-hidden di sini juga supaya flex column berfungsi dengan benar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ backgroundColor: "#0A0A0A" }}>
        <Header setSidebarOpen={setSidebarOpen} />

        {/* Page Content */}
        {/* overflow-y-auto di sini yang akan handle scroll konten */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#0A0A0A" }}>
          {children}
        </main>
      </div>

    </div>
  );
}