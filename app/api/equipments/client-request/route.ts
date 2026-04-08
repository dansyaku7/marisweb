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

    // 2. Ambil detail perusahaan
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

    // 3. Ambil data alat (diperluas biar tabelnya lengkap kayak notif expired)
    const equipments = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIds },
        companyId: decoded.companyId 
      },
      select: { 
        name: true, 
        brand: true, 
        location: true, 
        area: true, 
        permitNumber: true, 
        serialNumber: true 
      }
    });

    if (equipments.length === 0) {
      return NextResponse.json({ message: 'Alat tidak valid.' }, { status: 400 });
    }

    const typeLabel = requestType === 'inspeksi' ? 'Permohonan Inspeksi Ulang' : 'Permintaan Dokumen (Suket & Laporan)';
    const typeColor = requestType === 'inspeksi' ? '#DC3C3C' : '#3B82F6'; // Merah untuk inspeksi, Biru untuk dokumen

    // 4. Susun baris tabel lengkap dan bisa di-scroll ke samping
    const tableRows = equipments.map((eq, i) => `
      <tr style="border-bottom: 1px solid #F0EDE4;">
        <td style="padding: 12px 10px; text-align: center; font-size: 12px; color: #666666; white-space: nowrap;">${i + 1}</td>
        <td style="padding: 12px 10px; font-size: 12px; font-weight: 600; color: #1A1A1A; white-space: nowrap;">${eq.name}</td>
        <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; white-space: nowrap;">${eq.brand || '-'}</td>
        <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; white-space: nowrap;">${eq.location || '-'}</td>
        <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; white-space: nowrap;">${eq.area || '-'}</td>
        <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; font-family: monospace; white-space: nowrap;">${eq.permitNumber || '-'}</td>
        <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; font-family: monospace; white-space: nowrap;">${eq.serialNumber || '-'}</td>
      </tr>
    `).join('');

    const dashboardAdminLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://marisweb.vercel.app'}/dashboard/equipments`;

    const htmlBody = `
      <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif; background-color:#FAFAF8; padding:32px 16px; color:#1A1A1A;">
        <div style="max-width:800px; margin:0 auto; background-color:#FFFFFF; border:1.5px solid #E8E4DC; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.05);">
          
          <div style="background-color:#FAFAF7; padding:20px 24px; border-bottom:1px solid #F0EDE4;">
            <p style="margin:0 0 4px 0; font-size:10px; font-weight:600; color:#C87A00; text-transform:uppercase; letter-spacing:0.1em;">Request dari Klien</p>
            <h2 style="margin:0; color:#1A1A1A; font-size:18px;">${typeLabel}</h2>
          </div>
          
          <div style="padding:24px;">
            <p style="color:#1A1A1A; font-size:14px; line-height:1.6; margin-top:0; margin-bottom:24px;">
              Klien <strong style="color:#C87A00;">${company.name}</strong> telah mengajukan <strong>${typeLabel.toLowerCase()}</strong> untuk ${equipments.length} alat berikut. Mohon segera ditindaklanjuti.
            </p>
            
            <div style="border:1.5px solid #E5E2D8; border-radius:10px; overflow-x:auto; width:100%;">
              <table style="width:100%; border-collapse:collapse; min-width:800px;">
                <thead style="background-color:#FAFAF7;">
                  <tr>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:center; white-space: nowrap;">#</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Nama Alat</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Merek</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Lokasi</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Area</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">No. Izin</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">SN</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>

            <div style="text-align:center; margin-top:32px;">
              <a href="${dashboardAdminLink}" style="display:inline-block; padding:12px 32px; background-color:#1A1A1A; color:#FFFFFF; font-size:13px; font-weight:600; text-decoration:none; border-radius:10px; box-shadow:0 4px 14px rgba(0,0,0,0.15);">
                Buka Dashboard Admin
              </a>
            </div>

            <div style="height:1px; background-color:#EAE7DF; margin:24px 0;"></div>

            <p style="font-size:12px; color:#666666; line-height:1.6; text-align:center; margin:0;">
              Harap cek dashboard M-Track untuk melakukan update status atau mengunggah dokumen terkait.
            </p>
          </div>
          
          <div style="background-color:#FAFAF7; padding:16px; text-align:center; border-top:1px solid #F0EDE4;">
             <p style="margin:0; font-size:11px; color:#AAAAAA; font-family:monospace; text-transform:uppercase; letter-spacing:0.1em;">
                Sistem Notifikasi M-Track Enterprise
             </p>
          </div>

        </div>
      </div>
    `;

    // 5. Konfigurasi SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
    });

    // 6. Kirim email
    await transporter.sendMail({
      from: `"MARIS System" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER, // Dikirim ke email admin
      subject: `[MARIS Request] ${typeLabel} - ${company.name}`,
      html: htmlBody,
    });

    return NextResponse.json({ message: 'Permohonan berhasil dikirim ke Admin.' }, { status: 200 });

  } catch (error) {
    console.error('[CLIENT REQUEST ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengirim email.' }, { status: 500 });
  }
}