export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Konfigurasi Mesin SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function GET(request: Request) {
  try {
    // 1. Validasi Keamanan (Hanya mesin cron yang boleh akses)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 2. Tarik Data Alat & Perusahaan
    const equipments = await prisma.equipment.findMany({
      include: {
        company: { select: { id: true, name: true, emailPic: true, isActive: true } }
      }
    });

    // 3. Agregasi Data (Grouping per Perusahaan)
    const queue: Record<string, any> = {};

    equipments.forEach(eq => {
      if (!eq.company.isActive || !eq.company.emailPic) return;

      const expDate = new Date(eq.expiryDate);
      expDate.setHours(0, 0, 0, 0);
      
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Trigger pada H-60, H-30, H-7, dan Hari H
      if ([60, 30, 7, 0].includes(diffDays)) {
        if (!queue[eq.company.id]) {
          queue[eq.company.id] = {
            name: eq.company.name,
            email: eq.company.emailPic,
            items: []
          };
        }
        queue[eq.company.id].items.push({
          alat: eq.name,
          izin: eq.permitNumber,
          sisa: diffDays,
          id: eq.id
        });
      }
    });

    // 4. Eksekusi Pengiriman Email
    let totalSent = 0;
    for (const [companyId, data] of Object.entries(queue)) {
      try {
        const rows = data.items.map((it: any) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;">${it.alat}</td>
            <td style="padding: 10px;">${it.izin}</td>
            <td style="padding: 10px; font-weight: bold; color: ${it.sisa === 0 ? '#ef4444' : '#f59e0b'};">
              ${it.sisa === 0 ? 'KEDALUWARSA HARI INI' : `${it.sisa} Hari Lagi`}
            </td>
          </tr>
        `).join('');

        await transporter.sendMail({
          from: `"M-Track Marusindo" <${process.env.SMTP_USER}>`,
          to: data.email,
          subject: `[URGENT] Peringatan Masa Berlaku Alat - ${data.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                <h2 style="margin: 0; color: #1e293b;">M-Track Early Warning</h2>
              </div>
              <div style="padding: 24px;">
                <p>Halo <strong>${data.name}</strong>,</p>
                <p>Kami mendeteksi beberapa peralatan Anda memerlukan perhatian segera sebelum masa berlakunya habis:</p>
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
                <p style="font-size: 14px; color: #475569;">Mohon segera hubungi admin PT. Marusindo untuk proses inspeksi ulang.</p>
              </div>
            </div>
          `,
        });

        // Catat Log Sukses per Alat
        for (const it of data.items) {
          await prisma.emailLog.create({
            data: { companyId, equipmentId: it.id, status: 'SENT', sentAt: new Date() }
          });
        }
        totalSent++;

      } catch (err: any) {
        console.error(`Gagal kirim ke ${data.name}:`, err);
        for (const it of data.items) {
          await prisma.emailLog.create({
            data: { companyId, equipmentId: it.id, status: 'FAILED', errorMessage: err.message }
          });
        }
      }
    }

    return NextResponse.json({ success: true, companiesNotified: totalSent });

  } catch (err: any) {
    console.error('CRON ERROR:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}