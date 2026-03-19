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
  { params }: { params: Promise<{ id: string }> }
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
    const equipmentId = resolvedParams.id;

    // 1. Tarik Data Alat + Relasi Klien secara bersamaan
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { company: true } // WAJIB untuk ambil emailPic
    });

    if (!equipment) {
      return NextResponse.json({ message: 'Data alat tidak ditemukan.' }, { status: 404 });
    }

    if (!equipment.company || !equipment.company.emailPic) {
      return NextResponse.json({ message: 'Email PIC Klien tidak ditemukan di database.' }, { status: 400 });
    }

    // 2. Hitung Sisa Hari untuk Pesan Email
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expDate = new Date(equipment.expiryDate);
    expDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let statusText = 'Aman';
    let statusColor = '#22c55e'; // Hijau
    
    if (diffDays < 0) {
      statusText = `KEDALUWARSA (Lewat ${Math.abs(diffDays)} hari)`;
      statusColor = '#dc2626'; // Merah
    } else if (diffDays <= 60) {
      statusText = `WARNING (Sisa ${diffDays} hari)`;
      statusColor = '#f59e0b'; // Amber
    }

    // 3. Eksekusi Pengiriman Email
    await transporter.sendMail({
      from: `"M-Track Marusindo" <${process.env.SMTP_USER}>`,
      to: equipment.company.emailPic,
      subject: `[PERHATIAN] Status Alat: ${equipment.name} - ${equipment.company.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0;">
            <h2 style="margin: 0; color: #0f172a;">Pemberitahuan Status Alat Manual</h2>
          </div>
          <div style="padding: 24px;">
            <p>Halo <strong>${equipment.company.name}</strong>,</p>
            <p>Pesan ini dikirim secara manual oleh Admin PT. Marusindo untuk memberitahukan status alat berat Anda:</p>
            <ul style="background: #f1f5f9; padding: 15px 30px; border-radius: 8px; color: #334155;">
              <li style="margin-bottom: 8px;"><strong>Nama Alat:</strong> ${equipment.name}</li>
              <li style="margin-bottom: 8px;"><strong>No. Izin:</strong> ${equipment.permitNumber}</li>
              <li style="margin-bottom: 8px;"><strong>Lokasi:</strong> ${equipment.location || 'N/A'}</li>
              <li><strong>Status Terkini:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></li>
            </ul>
            <p style="font-size: 14px; color: #475569; margin-top: 20px;">Harap segera lakukan tindak lanjut sesuai dengan status waktu yang tertera.</p>
          </div>
        </div>
      `,
    });

    // 4. Catat Log
    await prisma.emailLog.create({
      data: {
        companyId: equipment.companyId,
        equipmentId: equipment.id,
        status: 'SENT',
        sentAt: new Date()
      }
    });

    return NextResponse.json({ message: 'Notifikasi email berhasil dikirim.' }, { status: 200 });

  } catch (error: any) {
    console.error('[MANUAL SINGLE NOTIFY ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengirim email.' }, { status: 500 });
  }
}