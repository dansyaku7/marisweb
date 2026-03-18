import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner'; // <--- JANGAN LUPA INI (Notifikasi)
import { ConfirmProvider } from "@/components/providers/confirm-dialog"; // <--- JANGAN LUPA INI (Modal Confirm)

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MARIS: Monitoring Alat Tracker",
  description: "MARIS Aplikasi Monitoring Alat Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* WRAPPER UTAMA: Semua page harus di dalam ini */}
        <ConfirmProvider>
            
            {children}
            
            {/* TOASTER: Biar notifikasi muncul di atas layer */}
            <Toaster position="top-center" richColors closeButton />
            
        </ConfirmProvider>
      </body>
    </html>
  );
}