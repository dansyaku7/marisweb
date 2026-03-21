import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Default values kalau belum ada template sama sekali
export const DEFAULT_TEMPLATES = {
  SINGLE: {
    senderName: 'M-Track Marusindo',
    subject:    '[PERHATIAN] Status Alat: {{equipmentName}} - {{companyName}}',
    introText:  'Admin PT. Marusindo mengirimkan pemberitahuan mengenai status alat berat Anda berikut:',
    footerText: 'Harap segera lakukan tindak lanjut sesuai dengan status waktu yang tertera. Alat berstatus KEDALUWARSA berisiko secara hukum dan keselamatan kerja.',
  },
  BULK: {
    senderName: 'M-Track Marusindo',
    subject:    '[PEMBERITAHUAN] Rekap Status Peralatan - {{companyName}}',
    introText:  'Berikut adalah pembaruan status peralatan Anda yang perlu mendapat perhatian:',
    footerText: 'Alat berstatus KEDALUWARSA berisiko secara hukum dan keselamatan kerja jika dioperasikan sebelum inspeksi ulang dilakukan. Segera hubungi tim PT. Marusindo untuk proses perpanjangan.',
  },
};

// GET: Ambil semua template global (companyId = null)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret  = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    // Ambil template global yang sudah disimpan
    const templates = await prisma.emailTemplate.findMany({
      where: { companyId: null },
    });

    // Merge dengan default — kalau belum ada di DB, pakai default
    const single = templates.find((t) => t.type === 'SINGLE');
    const bulk   = templates.find((t) => t.type === 'BULK');

    return NextResponse.json({
      SINGLE: single ?? { ...DEFAULT_TEMPLATES.SINGLE, id: null, companyId: null, type: 'SINGLE' },
      BULK:   bulk   ?? { ...DEFAULT_TEMPLATES.BULK,   id: null, companyId: null, type: 'BULK'   },
    }, { status: 200 });

  } catch (error) {
    console.error('[GET GLOBAL TEMPLATES ERROR]:', error);
    return NextResponse.json({ message: 'Gagal memuat template.' }, { status: 500 });
  }
}

// POST: Simpan/update template global (upsert)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret  = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await request.json();
    const { type, senderName, subject, introText, footerText } = body;

    if (!type || !['SINGLE', 'BULK'].includes(type)) {
      return NextResponse.json({ message: 'Type harus SINGLE atau BULK.' }, { status: 400 });
    }
    if (!subject?.trim() || !introText?.trim() || !footerText?.trim()) {
      return NextResponse.json({ message: 'Subject, intro, dan footer wajib diisi.' }, { status: 400 });
    }

    // Upsert — kalau sudah ada update, kalau belum create
    const template = await prisma.emailTemplate.upsert({
      where: {
        companyId_type: { companyId: null as any, type },
      },
      update: {
        senderName: senderName?.trim() || 'M-Track Marusindo',
        subject:    subject.trim(),
        introText:  introText.trim(),
        footerText: footerText.trim(),
      },
      create: {
        companyId:  null,
        type,
        senderName: senderName?.trim() || 'M-Track Marusindo',
        subject:    subject.trim(),
        introText:  introText.trim(),
        footerText: footerText.trim(),
      },
    });

    return NextResponse.json(
      { message: 'Template global berhasil disimpan.', template },
      { status: 200 }
    );

  } catch (error) {
    console.error('[POST GLOBAL TEMPLATE ERROR]:', error);
    return NextResponse.json({ message: 'Gagal menyimpan template.' }, { status: 500 });
  }
}