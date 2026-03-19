import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // NEXT.JS 15 FIX
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const companyId = resolvedParams.id;

    // 1. Tangkap Payload Secara Defensif
    // Kalau frontend nggak ngirim body (null/kosong), block try-catch ini menyelamatkan API lu dari crash 400 Bad Request.
    let selectedIds: string[] = [];
    try {
      const body = await request.json();
      if (body.selectedIds && Array.isArray(body.selectedIds)) {
        selectedIds = body.selectedIds;
      }
    } catch (e) {
      selectedIds = [];
    }

    // 2. Tarik Data Perusahaan
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company || !company.emailPic) {
      return NextResponse.json({ message: 'Perusahaan tidak ditemukan atau Email PIC kosong' }, { status: 404 });
    }

    // 3. Bangun Query Database Dinamis
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const whereClause: any = { companyId: companyId };
    
    // STRATEGI INTI:
    // Jika ada ID yang dicentang, cari spesifik ID tersebut.
    // Jika array kosong, default ambil SEMUA yang sudah expired.
    if (selectedIds.length > 0) {
      whereClause.id = { in: selectedIds };
    } else {
      whereClause.expiryDate = { lte: now };
    }

    const equipments = await prisma.equipment.findMany({
      where: whereClause,
      orderBy: { expiryDate: 'asc' } // Urutkan dari yang paling kritis
    });

    if (equipments.length === 0) {
      const errorMsg = selectedIds.length > 0 
        ? 'Data alat yang dipilih tidak valid atau sudah dihapus.' 
        : 'Tidak ada alat yang kedaluwarsa untuk perusahaan ini.';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    // 4. Susun Baris Tabel HTML
    const rows = equipments.map(eq => {
      const expDate = new Date(eq.expiryDate);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let statusHtml = '';
      if (diffDays < 0) {
        statusHtml = `<span style="color: #ef4444; font-weight: bold;">KEDALUWARSA (Lewat ${Math.abs(diffDays)} Hr)</span>`;
      } else if (diffDays <= 60) {
        statusHtml = `<span style="color: #f59e0b; font-weight: bold;">WARNING (Sisa ${diffDays} Hr)</span>`;
      } else {
        statusHtml = `<span style="color: #22c55e; font-weight: bold;">AMAN (Sisa ${diffDays} Hr)</span>`;
      }

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 10px; color: #1e293b; font-weight: 500;">${eq.name}</td>
          <td style="padding: 12px 10px; color: #475569;">${eq.permitNumber}</td>
          <td style="padding: 12px 10px; color: #475569;">${expDate.toLocaleDateString('id-ID')}</td>
          <td style="padding: 12px 10px;">${statusHtml}</td>
        </tr>
      `;
    }).join('');

    // 5. Sesuaikan Narasi Email Berdasarkan Konteks
    const isCustomSelection = selectedIds.length > 0;
    const emailSubject = isCustomSelection 
      ? `[PERHATIAN] Status Spesifik Peralatan Anda - ${company.name}`
      : `[PEMBERITAHUAN] Rekap Alat Kedaluwarsa - ${company.name}`;
      
    const emailHeaderBg = isCustomSelection ? '#f0f9ff' : '#fef2f2';
    const emailHeaderColor = isCustomSelection ? '#0369a1' : '#b91c1c';
    const emailTitle = isCustomSelection ? 'M-Track Equipment Status Update' : 'M-Track Manual Alert';
    const emailDesc = isCustomSelection
      ? `Berikut adalah pembaruan status untuk <strong>${equipments.length} peralatan spesifik</strong> yang Anda miliki di database kami:`
      : 'Secara manual, Admin menginformasikan bahwa peralatan berikut <strong>telah habis masa berlakunya</strong>:';

    // 6. Eksekusi Pengiriman Email
    await transporter.sendMail({
      from: `"M-Track Marusindo" <${process.env.SMTP_USER}>`,
      to: company.emailPic,
      subject: emailSubject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: ${emailHeaderBg}; padding: 24px; border-bottom: 1px solid #cbd5e1;">
            <h2 style="margin: 0; color: ${emailHeaderColor}; font-size: 20px;">${emailTitle}</h2>
          </div>
          <div style="padding: 24px;">
            <p style="color: #334155; font-size: 15px;">Halo <strong>${company.name}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">${emailDesc}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f8fafc; text-align: left; font-size: 12px; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;">
                  <th style="padding: 12px 10px; border-bottom: 2px solid #e2e8f0;">Nama Alat</th>
                  <th style="padding: 12px 10px; border-bottom: 2px solid #e2e8f0;">No. Izin</th>
                  <th style="padding: 12px 10px; border-bottom: 2px solid #e2e8f0;">Exp. Date</th>
                  <th style="padding: 12px 10px; border-bottom: 2px solid #e2e8f0;">Status</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            
            <p style="font-size: 13px; color: #64748b; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              Catatan: Alat yang berstatus <strong>KEDALUWARSA</strong> berisiko secara hukum dan keselamatan kerja jika dioperasikan sebelum inspeksi ulang dilakukan.
            </p>
          </div>
        </div>
      `,
    });

    // 7. Catat ke Log Audit
    for (const eq of equipments) {
      await prisma.emailLog.create({
        data: { companyId, equipmentId: eq.id, status: 'SENT', sentAt: new Date() }
      });
    }

    return NextResponse.json({ message: `Berhasil mengirim notifikasi untuk ${equipments.length} alat ke Klien.` }, { status: 200 });

  } catch (error: any) {
    console.error('[MANUAL BULK NOTIFY ERROR]:', error);
    return NextResponse.json({ message: error.message || 'Terjadi kesalahan pengiriman email.' }, { status: 500 });
  }
}