import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

async function getEffectiveTemplate(companyId: string, type: string) {
  const override = await prisma.emailTemplate.findFirst({
    where: { companyId, type: type as any },
  });
  if (override) return override;

  const globalTpl = await prisma.emailTemplate.findFirst({
    where: { companyId: null, type: type as any },
  });
  if (globalTpl) return globalTpl;

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
    
    const body = await request.json().catch(() => ({}));
    const { selectedIds, type } = body;

    if (!type) return NextResponse.json({ message: 'Type notifikasi diperlukan' }, { status: 400 });

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company?.emailPic) {
      return NextResponse.json({ message: 'Email PIC perusahaan tidak ditemukan atau kosong' }, { status: 404 });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

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

    const tplType = type === 'expired' ? 'EXPIRED_BULK' : 'READY_BULK';
    const tpl = await getEffectiveTemplate(companyId, tplType);

    // Bikin desain Tabel Nyamping Full Kolom (Scrollable)
    const rows = equipments.map((eq, index) => {
      const expDate = new Date(eq.expiryDate);
      expDate.setHours(0,0,0,0);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let statusText  = 'AMAN';
      let statusColor = '#22A064'; 
      let statusBg    = '#E9F5EF'; 
      let statusBorder= '#BBE3D0'; 

      if (diffDays < 0) {
        statusText  = 'KEDALUWARSA';
        statusColor = '#DC3C3C'; 
        statusBg    = '#FCEBEB'; 
        statusBorder= '#F4C4C4'; 
      } else if (diffDays <= 60) {
        statusText  = 'WARNING';
        statusColor = '#C87A00'; 
        statusBg    = '#FDF6E5'; 
        statusBorder= '#F7E4B2'; 
      }

      const inspectionDateStr = eq.inspectionDate ? new Date(eq.inspectionDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
      const expiryDateStr = expDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

      return `
        <tr style="border-bottom: 1px solid #F0EDE4;">
          <td style="padding: 12px 10px; text-align: center; font-size: 12px; color: #666666; white-space: nowrap;">${index + 1}</td>
          <td style="padding: 12px 10px; font-size: 12px; font-weight: 600; color: #1A1A1A; white-space: nowrap;">${eq.name}</td>
          <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; white-space: nowrap;">${eq.brand || '-'}</td>
          <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; white-space: nowrap;">${eq.location || '-'}</td>
          <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; white-space: nowrap;">${eq.area || '-'}</td>
          <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; font-family: monospace; white-space: nowrap;">${eq.permitNumber || '-'}</td>
          <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; font-family: monospace; white-space: nowrap;">${eq.serialNumber || '-'}</td>
          <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; white-space: nowrap;">${eq.capacity || '-'}</td>
          <td style="padding: 12px 10px; font-size: 12px; color: #1A1A1A; white-space: nowrap;">${inspectionDateStr}</td>
          <td style="padding: 12px 10px; font-size: 12px; font-weight: 600; color: #1A1A1A; white-space: nowrap;">${expiryDateStr}</td>
          <td style="padding: 12px 10px; text-align: center; white-space: nowrap;">
            <span style="display:inline-block; padding:4px 8px; border-radius:999px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; background-color:${statusBg}; color:${statusColor}; border:1px solid ${statusBorder};">
              ${statusText}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://marisweb.vercel.app'}/dashboard/equipments`;
    
    const vars = { companyName: company.name };
    const finalSubject = applyVars(tpl.subject, vars);

    const htmlBody = `
      <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif; background-color:#FAFAF8; padding:32px 16px; color:#1A1A1A;">
        <div style="max-width:800px; margin:0 auto; background-color:#FFFFFF; border:1.5px solid #E8E4DC; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.05);">
          
          <div style="background-color:#FAFAF7; padding:20px 24px; border-bottom:1px solid #F0EDE4;">
            <p style="margin:0 0 4px 0; font-size:10px; font-weight:600; color:#C87A00; text-transform:uppercase; letter-spacing:0.1em;">Pemberitahuan Massal</p>
            <h2 style="margin:0; color:#1A1A1A; font-size:18px;">${finalSubject}</h2>
          </div>
          
          <div style="padding:24px;">
            <p style="color:#1A1A1A; font-size:14px; line-height:1.6; margin-top:0; margin-bottom:24px;">
              ${applyVars(tpl.introText, vars)}
            </p>
            
            <div style="border:1.5px solid #E5E2D8; border-radius:10px; overflow-x:auto; width:100%;">
              <table style="width:100%; border-collapse:collapse; min-width:1200px;">
                <thead style="background-color:#FAFAF7;">
                  <tr>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:center; white-space: nowrap;">#</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Nama Alat</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Merek</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Lokasi</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Area</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">No. Izin</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">SN</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Kapasitas</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Tgl Inspeksi</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:left; white-space: nowrap;">Tgl Habis</th>
                    <th style="padding:12px 10px; font-size:10px; font-weight:600; text-transform:uppercase; color:#1A1A1A; border-bottom:1px solid #F0EDE4; text-align:center; white-space: nowrap;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>

            <div style="text-align:center; margin-top:32px;">
              <a href="${dashboardLink}" style="display:inline-block; padding:12px 32px; background-color:#F0A500; color:#1A1A1A; font-size:13px; font-weight:600; text-decoration:none; border-radius:10px; box-shadow:0 4px 14px rgba(240,165,0,0.2);">
                Buka Dashboard Alat
              </a>
            </div>

            <div style="height:1px; background-color:#EAE7DF; margin:24px 0;"></div>

            <p style="font-size:12px; color:#666666; line-height:1.6; text-align:center; margin:0;">
              ${applyVars(tpl.footerText, vars)}
            </p>
          </div>
          
          <div style="background-color:#FAFAF7; padding:16px; text-align:center; border-top:1px solid #F0EDE4;">
             <p style="margin:0; font-size:11px; color:#AAAAAA; font-family:monospace; text-transform:uppercase; letter-spacing:0.1em;">
                Sistem M-Track · ${tpl.senderName}
             </p>
          </div>
        </div>
      </div>
    `;

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
    console.error("[NOTIFY BULK ERROR]:", error); 
    return NextResponse.json({ 
      message: 'Terjadi kesalahan internal server', 
      error: error.message 
    }, { status: 500 });
  }
}