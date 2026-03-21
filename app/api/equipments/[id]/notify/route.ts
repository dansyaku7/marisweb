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
    const equipmentId    = resolvedParams.id;

    // 1. Tarik data alat + company
    const equipment = await prisma.equipment.findUnique({
      where:   { id: equipmentId },
      include: { company: true },
    });

    if (!equipment) {
      return NextResponse.json({ message: 'Data alat tidak ditemukan.' }, { status: 404 });
    }
    if (!equipment.company?.emailPic) {
      return NextResponse.json({ message: 'Email PIC Klien tidak ditemukan di database.' }, { status: 400 });
    }

    // 2. Hitung sisa hari
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expDate = new Date(equipment.expiryDate);
    expDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let statusText  = 'AMAN';
    let statusColor = '#22c55e';
    if (diffDays < 0) {
      statusText  = `KEDALUWARSA (Lewat ${Math.abs(diffDays)} hari)`;
      statusColor = '#dc2626';
    } else if (diffDays <= 60) {
      statusText  = `WARNING (Sisa ${diffDays} hari)`;
      statusColor = '#f59e0b';
    }

    // 3. Resolve template — override klien → global → default
    const tpl = await resolveTemplate(equipment.companyId, 'SINGLE');

    // 4. Terapkan variabel ke subject & intro
    const vars = {
      companyName:   equipment.company.name,
      equipmentName: equipment.name,
    };
    const finalSubject = applyVars(tpl.subject,   vars);
    const finalIntro   = applyVars(tpl.introText, vars);
    const finalFooter  = applyVars(tpl.footerText, vars);

    // 5. Helper baris info — skip kalau null
    const infoRow = (label: string, value: string | null | undefined) => {
      if (!value) return '';
      return `<li style="margin-bottom:8px;color:#334155;"><strong>${label}:</strong> ${value}</li>`;
    };

    // 6. Kirim email
    await transporter.sendMail({
      from: `"${tpl.senderName}" <${process.env.SMTP_USER}>`,
      to:   equipment.company.emailPic,
      subject: finalSubject,
      html: `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#ffffff;">
          
          <!-- Header -->
          <div style="background:#f8fafc;padding:20px 24px;border-bottom:1px solid #e2e8f0;">
            <h2 style="margin:0;color:#0f172a;font-size:18px;">Pemberitahuan Status Alat</h2>
            <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;font-family:monospace;">
              Manual Notification · ${tpl.senderName}
            </p>
          </div>

          <!-- Body -->
          <div style="padding:24px;">
            <p style="color:#334155;font-size:15px;margin-top:0;">
              Halo <strong>${equipment.company.name}</strong>,
            </p>
            <p style="color:#475569;font-size:14px;line-height:1.6;">${finalIntro}</p>

            <!-- Detail alat -->
            <ul style="background:#f8fafc;padding:16px 16px 16px 36px;border-radius:8px;border:1px solid #e2e8f0;list-style:disc;">
              ${infoRow('Nama Alat',       equipment.name)}
              ${infoRow('Merek',           equipment.brand)}
              ${infoRow('No. Izin',        equipment.permitNumber)}
              ${infoRow('Serial Number',   equipment.serialNumber)}
              ${infoRow('Lokasi',          equipment.location)}
              ${infoRow('Area Penempatan', equipment.area)}
              ${infoRow('Kapasitas',       equipment.capacity)}
              <li style="margin-bottom:8px;color:#334155;">
                <strong>Tanggal Kedaluwarsa:</strong>
                ${expDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </li>
              <li style="color:#334155;">
                <strong>Status Terkini:</strong>
                <span style="color:${statusColor};font-weight:bold;">${statusText}</span>
              </li>
            </ul>

            ${equipment.description ? `
              <div style="margin-top:16px;padding:12px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
                <p style="margin:0;font-size:13px;color:#92400e;">
                  <strong>Keterangan:</strong> ${equipment.description}
                </p>
              </div>
            ` : ''}

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

    // 7. Catat log
    await prisma.emailLog.create({
      data: {
        companyId:   equipment.companyId,
        equipmentId: equipment.id,
        status:      'SENT',
        sentAt:      new Date(),
      },
    });

    return NextResponse.json({ message: 'Notifikasi email berhasil dikirim.' }, { status: 200 });

  } catch (error: any) {
    console.error('[MANUAL SINGLE NOTIFY ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengirim email.' }, { status: 500 });
  }
}