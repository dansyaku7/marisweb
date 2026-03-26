import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

// VERSI FIXED: Jangan import resolveTemplate dari route lain, 
// mending taruh logic-nya di sini atau di lib folder biar aman.
async function getEffectiveTemplate(companyId: string, type: string) {
  // 1. Cari override PT
  const override = await prisma.emailTemplate.findFirst({
    where: { companyId, type: type as any },
  });
  if (override) return override;

  // 2. Cari Global (companyId null)
  const globalTpl = await prisma.emailTemplate.findFirst({
    where: { companyId: null, type: type as any },
  });
  if (globalTpl) return globalTpl;

  // 3. Hardcoded Fallback kalau DB bener-bener kosong
  return {
    senderName: 'MARIS System',
    subject: '[NOTIFIKASI] Pembaruan Status Alat Berat',
    introText: 'Berikut adalah rincian status alat berat Anda:',
    footerText: 'Silakan cek dashboard MARIS untuk info lebih lanjut.',
  };
}

function applyVars(text: string, vars: Record<string, string>) {
  if (!text) return '';
  return Object.entries(vars).reduce((acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val || ''), text);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: companyId } = await params;
    
    // 1. Defensif check json body
    const body = await request.json().catch(() => ({}));
    const { selectedIds, type } = body;

    if (!type) return NextResponse.json({ message: 'Type notifikasi diperlukan' }, { status: 400 });

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company?.emailPic) {
      return NextResponse.json({ message: 'Email PIC perusahaan tidak ditemukan atau kosong' }, { status: 404 });
    }

    // 2. Ambil data alat (Jika selectedIds kosong, ambil yang EXPIRED saja sebagai safety)
    const now = new Date();
    const equipments = await prisma.equipment.findMany({
      where: { 
        companyId,
        id: selectedIds?.length > 0 ? { in: selectedIds } : undefined,
        expiryDate: selectedIds?.length > 0 ? undefined : { lte: now } 
      }
    });

    if (equipments.length === 0) {
      return NextResponse.json({ message: 'Tidak ada alat yang dipilih atau perlu dinotifikasi.' }, { status: 400 });
    }

    // 3. Resolve template pakai fungsi lokal biar gak kena circular import
    const tplType = type === 'expired' ? 'EXPIRED_BULK' : 'READY_BULK';
    const tpl = await getEffectiveTemplate(companyId, tplType);

    // 4. Susun baris tabel
    const rows = equipments.map((eq) => {
      const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://marisweb.vercel.app'}/dashboard/equipments?eqId=${eq.id}`;
      return `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:12px 10px;">
            <div style="font-weight:bold; color:#1e293b;">${eq.name}</div>
            <div style="font-size:11px; color:#94a3b8; margin-top:4px;">${[eq.brand, eq.location].filter(Boolean).join(' - ')}</div>
          </td>
          <td style="padding:12px 10px; font-family:monospace; font-size:12px; color:#475569;">
            ${eq.permitNumber || '-'}
          </td>
          <td style="padding:12px 10px; text-align:right;">
            <a href="${magicLink}" style="display:inline-block; padding:6px 12px; background:#F0A500; color:#1A1A1A; text-decoration:none; font-size:11px; font-weight:bold; border-radius:6px;">
              DETAIL &rarr;
            </a>
          </td>
        </tr>
      `;
    }).join('');

    const vars = { companyName: company.name };
    const finalSubject = applyVars(tpl.subject, vars);

    const htmlBody = `
      <div style="font-family:'Segoe UI', Tahoma, sans-serif; max-width:600px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background:#ffffff;">
        <div style="background:#f8fafc; padding:24px; border-bottom:1px solid #e2e8f0;">
          <h2 style="margin:0; color:#0f172a; font-size:20px;">${finalSubject}</h2>
        </div>
        <div style="padding:24px;">
          <p style="color:#334155; font-size:15px; line-height:1.6; margin-bottom:20px;">
            ${applyVars(tpl.introText, vars)}
          </p>
          <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
            <thead>
              <tr style="text-align:left; font-size:12px; color:#64748b; text-transform:uppercase; background:#f1f5f9;">
                <th style="padding:10px;">Alat</th>
                <th style="padding:10px;">No. Izin</th>
                <th style="padding:10px; text-align:right;">Aksi</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color:#64748b; font-size:13px; line-height:1.6; padding-top:16px; border-top:1px solid #f1f5f9;">
            ${applyVars(tpl.footerText, vars)}
          </p>
        </div>
        <div style="background:#f8fafc; padding:16px; text-align:center; font-size:11px; color:#94a3b8;">
          Sistem Notifikasi Otomatis M-Track Marusindo
        </div>
      </div>
    `;

    // 5. Konfigurasi Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"${tpl.senderName}" <${process.env.SMTP_USER}>`,
      to: company.emailPic,
      subject: finalSubject,
      html: htmlBody,
    });

    return NextResponse.json({ message: 'Email notifikasi berhasil dikirim ke ' + company.emailPic });

  } catch (error: any) {
    console.error("[NOTIFY BULK ERROR]:", error); // WAJIB CEK TERMINAL VSCODE
    return NextResponse.json({ 
      message: 'Terjadi kesalahan internal server', 
      error: error.message 
    }, { status: 500 });
  }
}