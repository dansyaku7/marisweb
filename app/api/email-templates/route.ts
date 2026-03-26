import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Pastikan DEFAULT_TEMPLATES pakai key Enum yang baru sesuai schema.prisma
export const DEFAULT_TEMPLATES = {
  EXPIRED_SINGLE: {
    senderName: "MARIS System",
    subject: "[PERINGATAN] Masa Berlaku Alat: {{equipmentName}} Segera Berakhir",
    introText: "Kami menginformasikan bahwa alat {{equipmentName}} milik {{companyName}} akan segera habis masa berlakunya. Silakan ajukan inspeksi ulang melalui link di bawah ini.",
    footerText: "Abaikan email ini jika Anda sudah melakukan proses perpanjangan. Segera urus sebelum operasional terhambat."
  },
  EXPIRED_BULK: {
    senderName: "MARIS System",
    subject: "[ALERT] Daftar Alat {{companyName}} yang Kedaluwarsa",
    introText: "Ditemukan beberapa alat berat milik {{companyName}} yang masa berlakunya hampir habis atau sudah kedaluwarsa. Berikut rinciannya:",
    footerText: "Silakan klik link masing-masing alat untuk mengajukan permohonan inspeksi ulang secara online."
  },
  READY_SINGLE: {
    senderName: "Admin Marusindo",
    subject: "[DOKUMEN SIAP] Suket & Laporan Alat: {{equipmentName}}",
    introText: "Kabar baik! Dokumen Suket dan Laporan untuk alat {{equipmentName}} sudah selesai diproses dan siap diunduh.",
    footerText: "Klik link di bawah untuk melihat dokumen dan mengunduhnya langsung dari dashboard MARIS."
  },
  READY_BULK: {
    senderName: "Admin Marusindo",
    subject: "[UPDATE] Dokumen Alat {{companyName}} Sudah Tersedia",
    introText: "Proses administrasi untuk beberapa alat Anda telah selesai. Anda sekarang dapat mengakses Suket dan Laporan terbaru.",
    footerText: "Terima kasih telah menggunakan jasa PT Marusindo Berkah Jaya."
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Ambil semua template global (companyId is null)
    const templates = await prisma.emailTemplate.findMany({ 
      where: { companyId: null } 
    });

    if (type) {
      const tpl = templates.find(t => t.type === type);
      // Fallback ke DEFAULT_TEMPLATES kalau belum ada di DB
      return NextResponse.json(tpl ?? { ...DEFAULT_TEMPLATES[type as keyof typeof DEFAULT_TEMPLATES], type });
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[GET TEMPLATE ERROR]:", error);
    return NextResponse.json({ message: 'Gagal memuat template.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, senderName, subject, introText, footerText } = body;

    // VALIDASI: Pastikan type yang dikirim sesuai Enum baru
    const validTypes = ['EXPIRED_SINGLE', 'EXPIRED_BULK', 'READY_SINGLE', 'READY_BULK'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ message: 'Tipe template tidak valid.' }, { status: 400 });
    }

    // LOGIC GANTI UPSERT: Cari dulu secara manual
    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: {
        companyId: null, // Global template
        type: type
      }
    });

    let template;

    if (existingTemplate) {
      // Jika ada, lakukan UPDATE pakai ID
      template = await prisma.emailTemplate.update({
        where: { id: existingTemplate.id },
        data: {
          senderName: senderName || "M-Track Marusindo",
          subject: subject.trim(),
          introText: introText.trim(),
          footerText: footerText.trim(),
        }
      });
    } else {
      // Jika tidak ada, lakukan CREATE
      template = await prisma.emailTemplate.create({
        data: {
          companyId: null, // Set null untuk Global
          type: type,
          senderName: senderName || "M-Track Marusindo",
          subject: subject.trim(),
          introText: introText.trim(),
          footerText: footerText.trim(),
        }
      });
    }

    return NextResponse.json({ message: 'Template global berhasil disimpan.', template });
  } catch (error: any) {
    // Log error asli ke terminal biar lu bisa liat masalahnya
    console.error("[POST TEMPLATE ERROR]:", error);
    return NextResponse.json({ 
      message: 'Gagal menyimpan template.', 
      error: error.message 
    }, { status: 500 });
  }
}