import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { resolveTemplate } from '@/app/api/email-templates/[companyId]/route';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Ganti placeholder variabel di string template
function applyVars(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
    text
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret  = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };
    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const companyId      = resolvedParams.id;

    // 1. Tangkap payload defensif
    let selectedIds: string[] = [];
    try {
      const body = await request.json();
      if (body.selectedIds && Array.isArray(body.selectedIds)) {
        selectedIds = body.selectedIds;
      }
    } catch {
      selectedIds = [];
    }

    // 2. Tarik data perusahaan
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company?.emailPic) {
      return NextResponse.json(
        { message: 'Perusahaan tidak ditemukan atau Email PIC kosong' },
        { status: 404 }
      );
    }

    // 3. Query alat dinamis
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const whereClause: any = { companyId };
    if (selectedIds.length > 0) {
      whereClause.id = { in: selectedIds };
    } else {
      whereClause.expiryDate = { lte: now };
    }

    const equipments = await prisma.equipment.findMany({
      where:   whereClause,
      orderBy: { expiryDate: 'asc' },
    });

    if (equipments.length === 0) {
      const errorMsg = selectedIds.length > 0
        ? 'Data alat yang dipilih tidak valid atau sudah dihapus.'
        : 'Tidak ada alat yang kedaluwarsa untuk perusahaan ini.';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    // 4. Resolve template — override klien → global → default
    const tpl = await resolveTemplate(companyId, 'BULK');

    // 5. Terapkan variabel ke subject, intro, footer
    const vars = { companyName: company.name };
    const finalSubject = applyVars(tpl.subject,    vars);
    const finalIntro   = applyVars(tpl.introText,  vars);
    const finalFooter  = applyVars(tpl.footerText, vars);

    // 6. Susun baris tabel HTML
    const rows = equipments.map((eq) => {
      const expDate = new Date(eq.expiryDate);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let statusHtml = '';
      if (diffDays < 0) {
        statusHtml = `<span style="color:#ef4444;font-weight:bold;">KEDALUWARSA (Lewat ${Math.abs(diffDays)} Hr)</span>`;
      } else if (diffDays <= 60) {
        statusHtml = `<span style="color:#f59e0b;font-weight:bold;">WARNING (Sisa ${diffDays} Hr)</span>`;
      } else {
        statusHtml = `<span style="color:#22c55e;font-weight:bold;">AMAN (Sisa ${diffDays} Hr)</span>`;
      }

      const metaParts = [eq.brand, eq.area || eq.location, eq.capacity]
        .filter(Boolean).join(' · ');

      return `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 10px;color:#1e293b;">
            <strong>${eq.name}</strong>
            ${metaParts ? `<br><span style="font-size:11px;color:#94a3b8;font-family:monospace;">${metaParts}</span>` : ''}
          </td>
          <td style="padding:12px 10px;color:#475569;font-family:monospace;font-size:12px;">
            ${eq.permitNumber || 'N/A'}
            ${eq.serialNumber ? `<br><span style="color:#94a3b8;">${eq.serialNumber}</span>` : ''}
          </td>
          <td style="padding:12px 10px;color:#475569;font-family:monospace;font-size:12px;white-space:nowrap;">
            ${expDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </td>
          <td style="padding:12px 10px;">${statusHtml}</td>
        </tr>
      `;
    }).join('');

    // 7. Kirim email
    await transporter.sendMail({
      from: `"${tpl.senderName}" <${process.env.SMTP_USER}>`,
      to:   company.emailPic,
      subject: finalSubject,
      html: `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:680px;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden;background:#ffffff;">

          <!-- Header -->
          <div style="background:#f8fafc;padding:24px;border-bottom:1px solid #cbd5e1;">
            <h2 style="margin:0;color:#0f172a;font-size:18px;">${tpl.senderName}</h2>
            <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;font-family:monospace;">
              ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <!-- Body -->
          <div style="padding:24px;">
            <p style="color:#334155;font-size:15px;margin-top:0;">
              Halo <strong>${company.name}</strong>,
            </p>
            <p style="color:#475569;font-size:14px;line-height:1.6;">${finalIntro}</p>

            <!-- Tabel alat -->
            <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;text-align:left;font-size:11px;color:#64748b;letter-spacing:0.05em;text-transform:uppercase;">
                  <th style="padding:12px 10px;border-bottom:2px solid #e2e8f0;">Nama Alat</th>
                  <th style="padding:12px 10px;border-bottom:2px solid #e2e8f0;">No. Izin / Seri</th>
                  <th style="padding:12px 10px;border-bottom:2px solid #e2e8f0;">Exp. Date</th>
                  <th style="padding:12px 10px;border-bottom:2px solid #e2e8f0;">Status</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <p style="font-size:13px;color:#64748b;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;line-height:1.6;">
              ${finalFooter}
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f8fafc;padding:12px 24px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;font-family:monospace;">
              M-Track · ${tpl.senderName} · Sistem Manajemen Alat Berat
            </p>
          </div>
        </div>
      `,
    });

    // 8. Catat log audit — createMany lebih efisien
    await prisma.emailLog.createMany({
      data: equipments.map((eq) => ({
        companyId,
        equipmentId: eq.id,
        status:      'SENT' as const,
        sentAt:      new Date(),
      })),
    });

    return NextResponse.json(
      { message: `Berhasil mengirim notifikasi untuk ${equipments.length} alat ke Klien.` },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[MANUAL BULK NOTIFY ERROR]:', error);
    return NextResponse.json(
      { message: error.message || 'Terjadi kesalahan pengiriman email.' },
      { status: 500 }
    );
  }
}