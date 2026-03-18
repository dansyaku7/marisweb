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

    // 1. Tarik Data Perusahaan
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company || !company.emailPic) {
      return NextResponse.json({ message: 'Perusahaan tidak ditemukan atau Email PIC kosong' }, { status: 404 });
    }

    // 2. Tarik Semua Alat yang Sudah Expired (Sisa waktu <= 0)
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const equipments = await prisma.equipment.findMany({
      where: {
        companyId: companyId,
        expiryDate: { lte: now } // Ambil yang tanggal expired-nya hari ini atau sebelumnya
      }
    });

    if (equipments.length === 0) {
      return NextResponse.json({ message: 'Tidak ada alat yang kedaluwarsa untuk perusahaan ini.' }, { status: 400 });
    }

    // 3. Susun Email
    const rows = equipments.map(eq => {
      const expDate = new Date(eq.expiryDate);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px;">${eq.name}</td>
          <td style="padding: 10px;">${eq.permitNumber}</td>
          <td style="padding: 10px; font-weight: bold; color: #ef4444;">
            ${diffDays === 0 ? 'KEDALUWARSA HARI INI' : `LEWAT ${Math.abs(diffDays)} HARI`}
          </td>
        </tr>
      `;
    }).join('');

    await transporter.sendMail({
      from: `"M-Track Marusindo" <${process.env.SMTP_USER}>`,
      to: company.emailPic,
      subject: `[PEMBERITAHUAN MANUAL] Rekap Alat Kedaluwarsa - ${company.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #fef2f2; padding: 20px; border-bottom: 1px solid #fecaca;">
            <h2 style="margin: 0; color: #b91c1c;">M-Track Manual Alert</h2>
          </div>
          <div style="padding: 24px;">
            <p>Halo <strong>${company.name}</strong>,</p>
            <p>Admin PT. Marusindo secara manual mengirimkan rekapitulasi peralatan Anda yang <strong>telah habis masa berlakunya</strong>:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f1f5f9; text-align: left; font-size: 12px; color: #64748b;">
                  <th style="padding: 10px;">ALAT</th>
                  <th style="padding: 10px;">NO. IZIN</th>
                  <th style="padding: 10px;">STATUS</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="font-size: 14px; color: #475569;">Alat-alat ini ilegal untuk dioperasikan sebelum diinspeksi ulang.</p>
          </div>
        </div>
      `,
    });

    // 4. Catat ke Log Audit
    for (const eq of equipments) {
      await prisma.emailLog.create({
        data: { companyId, equipmentId: eq.id, status: 'SENT', sentAt: new Date() }
      });
    }

    return NextResponse.json({ message: `Berhasil mengirim email berisi ${equipments.length} alat kedaluwarsa.` }, { status: 200 });

  } catch (error: any) {
    console.error('[MANUAL BULK NOTIFY ERROR]:', error);
    return NextResponse.json({ message: error.message || 'Terjadi kesalahan pengiriman email.' }, { status: 500 });
  }
}