import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    
    // 1. Decode token untuk ambil companyId dan role
    const decoded = jwt.verify(token, secret!) as { companyId: string; role: string };

    if (decoded.role === 'SUPERADMIN') {
      return NextResponse.json({ message: 'Admin tidak perlu request ke diri sendiri.' }, { status: 400 });
    }

    // 2. SOLUSI: Ambil detail perusahaan dari DB berdasarkan companyId di token
    // Supaya nama klien nggak undefined
    const company = await prisma.company.findUnique({
      where: { id: decoded.companyId },
      select: { name: true }
    });

    if (!company) {
      return NextResponse.json({ message: 'Data klien tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json();
    const { equipmentIds, requestType } = body; 

    if (!equipmentIds || equipmentIds.length === 0) {
      return NextResponse.json({ message: 'Tidak ada alat yang dipilih.' }, { status: 400 });
    }

    // 3. Ambil data alat
    const equipments = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIds },
        companyId: decoded.companyId 
      },
      select: { name: true, permitNumber: true, location: true }
    });

    if (equipments.length === 0) {
      return NextResponse.json({ message: 'Alat tidak valid.' }, { status: 400 });
    }

    // Konfigurasi SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
    });

    const tableRows = equipments.map((eq, i) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${i + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>${eq.name}</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${eq.permitNumber || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${eq.location || '-'}</td>
      </tr>
    `).join('');

    const typeLabel = requestType === 'inspeksi' ? 'Permohonan Inspeksi Ulang' : 'Permintaan Dokumen (Suket & Laporan)';

    const htmlBody = `
      <div style="font-family: sans-serif; color: #333;">
        <h2>${typeLabel}</h2>
        <p>Klien <strong>${company.name}</strong> telah mengajukan ${typeLabel.toLowerCase()} untuk ${equipments.length} alat berikut:</p>
        <table style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">No</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nama Alat</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">No. Izin</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Lokasi</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <p style="margin-top: 24px; font-size: 12px; color: #888;">Notifikasi otomatis dari MARIS Enterprise.</p>
      </div>
    `;

    // Kirim email
    await transporter.sendMail({
      from: `"MARIS System" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `[MARIS Request] ${typeLabel} - ${company.name}`,
      html: htmlBody,
    });

    return NextResponse.json({ message: 'Permohonan berhasil dikirim ke Admin.' }, { status: 200 });

  } catch (error) {
    console.error('[CLIENT REQUEST ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengirim email.' }, { status: 500 });
  }
}