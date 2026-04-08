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

function applyVars(text: string, vars: Record<string, string>): string {
  if (!text) return '';
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val || ''),
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

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expDate = new Date(equipment.expiryDate);
    expDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let statusText  = 'AMAN';
    let statusColor = '#22A064'; 
    let statusBg    = '#E9F5EF'; 
    let statusBorder= '#BBE3D0'; 

    if (diffDays < 0) {
      statusText  = `KEDALUWARSA (Lewat ${Math.abs(diffDays)} hari)`;
      statusColor = '#DC3C3C'; 
      statusBg    = '#FCEBEB'; 
      statusBorder= '#F4C4C4'; 
    } else if (diffDays <= 60) {
      statusText  = `WARNING (Sisa ${diffDays} hari)`;
      statusColor = '#C87A00'; 
      statusBg    = '#FDF6E5'; 
      statusBorder= '#F7E4B2'; 
    }

    const tpl = await resolveTemplate(equipment.companyId, 'SINGLE');
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://marisweb.vercel.app'}/dashboard/equipments?eqId=${equipment.id}`;

    const vars = {
      companyName:   equipment.company.name,
      equipmentName: equipment.name,
      link_alat:     magicLink
    };
    const finalSubject = applyVars(tpl.subject,   vars);
    const finalIntro   = applyVars(tpl.introText, vars);
    const finalFooter  = applyVars(tpl.footerText, vars);

    const infoRow = (label: string, value: string | null | undefined) => {
      return `
        <tr>
          <td style="padding:10px 14px; border-bottom:1px solid #F5F3EE; color:#666666; font-size:12px; width:150px; text-transform:uppercase; letter-spacing:0.05em;">${label}</td>
          <td style="padding:10px 14px; border-bottom:1px solid #F5F3EE; color:#1A1A1A; font-size:13px; font-weight:600;">${value || '-'}</td>
        </tr>
      `;
    };

    const inspectionDateStr = equipment.inspectionDate ? new Date(equipment.inspectionDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const expiryDateStr = expDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    await transporter.sendMail({
      from: `"${tpl.senderName}" <${process.env.SMTP_USER}>`,
      to:   equipment.company.emailPic,
      subject: finalSubject,
      html: `
        <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif; background-color:#FAFAF8; padding:32px 16px; color:#1A1A1A;">
          <div style="max-width:600px; margin:0 auto; background-color:#FFFFFF; border:1.5px solid #E8E4DC; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.05);">
            
            <div style="background-color:#FAFAF7; padding:20px 24px; border-bottom:1px solid #F0EDE4;">
              <p style="margin:0 0 4px 0; font-size:10px; font-weight:600; color:#C87A00; text-transform:uppercase; letter-spacing:0.1em;">Pemberitahuan Sistem</p>
              <h2 style="margin:0; color:#1A1A1A; font-size:18px;">Notifikasi Alat Berat</h2>
            </div>

            <div style="padding:24px;">
              <p style="color:#1A1A1A; font-size:15px; margin-top:0;">Halo <strong>${equipment.company.name}</strong>,</p>
              <p style="color:#1A1A1A; font-size:13px; line-height:1.6;">${finalIntro}</p>

              <div style="margin:24px 0; border:1.5px solid #E5E2D8; border-radius:10px; overflow:hidden;">
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                  <tbody>
                    ${infoRow('Nama Alat', equipment.name)}
                    ${infoRow('Merek', equipment.brand)}
                    ${infoRow('Lokasi', equipment.location)}
                    ${infoRow('Area Penempatan', equipment.area)}
                    ${infoRow('No. Izin', equipment.permitNumber)}
                    ${infoRow('Serial Number', equipment.serialNumber)}
                    ${infoRow('Kapasitas', equipment.capacity)}
                    ${infoRow('Tgl Inspeksi', inspectionDateStr)}
                    ${infoRow('Tgl Kedaluwarsa', expiryDateStr)}
                    <tr>
                      <td style="padding:10px 14px; color:#666666; font-size:12px; text-transform:uppercase; letter-spacing:0.05em;">Status</td>
                      <td style="padding:10px 14px;">
                        <span style="display:inline-block; padding:4px 10px; border-radius:999px; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; background-color:${statusBg}; color:${statusColor}; border:1px solid ${statusBorder};">
                          ${statusText}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              ${equipment.description ? `
                <div style="margin-top:16px; padding:12px 16px; background-color:#FAFAF7; border:1.5px solid #EAE7DF; border-radius:10px;">
                  <p style="margin:0; font-size:12px; color:#666666;">
                    <strong style="color:#1A1A1A; text-transform:uppercase; font-size:10px; letter-spacing:0.1em; display:block; margin-bottom:4px;">Keterangan:</strong> 
                    ${equipment.description}
                  </p>
                </div>
              ` : ''}

              <div style="text-align:center; margin-top:32px;">
                <a href="${magicLink}" style="display:inline-block; padding:12px 32px; background-color:#F0A500; color:#1A1A1A; font-size:13px; font-weight:600; text-decoration:none; border-radius:10px; box-shadow:0 4px 14px rgba(240,165,0,0.2);">
                  Buka Detail Alat
                </a>
              </div>

              <div style="height:1px; background-color:#EAE7DF; margin:24px 0;"></div>
              
              <p style="font-size:12px; color:#666666; line-height:1.6; text-align:center; margin:0;">
                ${finalFooter}
              </p>
            </div>

            <div style="background-color:#FAFAF7; padding:16px; text-align:center; border-top:1px solid #F0EDE4;">
              <p style="margin:0; font-size:11px; color:#AAAAAA; font-family:monospace; text-transform:uppercase; letter-spacing:0.1em;">
                Sistem M-Track · ${tpl.senderName}
              </p>
            </div>
          </div>
        </div>
      `,
    });

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