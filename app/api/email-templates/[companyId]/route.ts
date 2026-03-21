import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { DEFAULT_TEMPLATES } from '../route';

// ============================================================
// HELPER: Ambil template efektif untuk sebuah company
// Prioritas: override per-klien → global → hardcoded default
// ============================================================
export async function resolveTemplate(
  companyId: string,
  type: 'SINGLE' | 'BULK'
) {
  // 1. Cek override per-klien
  const override = await prisma.emailTemplate.findFirst({
    where: { companyId, type },
  });
  if (override) return override;

  // 2. Cek global — pakai findFirst + filter IS NULL
  //    TIDAK bisa pakai findUnique karena Prisma menolak null di unique constraint query
  const globalTpl = await prisma.emailTemplate.findFirst({
    where: { companyId: null, type },
  });
  if (globalTpl) return globalTpl;

  // 3. Fallback ke hardcoded default
  return {
    ...DEFAULT_TEMPLATES[type],
    id:        null,
    companyId: null,
    type,
  };
}

// ---------------------------------------------------------------

// GET: Ambil template override untuk company tertentu
export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
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

    const { companyId } = await params;

    const templates = await prisma.emailTemplate.findMany({
      where: { companyId },
    });

    const single = templates.find((t) => t.type === 'SINGLE') ?? null;
    const bulk   = templates.find((t) => t.type === 'BULK')   ?? null;

    return NextResponse.json({ SINGLE: single, BULK: bulk }, { status: 200 });

  } catch (error) {
    console.error('[GET COMPANY TEMPLATE ERROR]:', error);
    return NextResponse.json({ message: 'Gagal memuat template klien.' }, { status: 500 });
  }
}

// POST: Simpan/update override untuk company tertentu
export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
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

    const { companyId } = await params;
    const body = await request.json();
    const { type, senderName, subject, introText, footerText } = body;

    if (!type || !['SINGLE', 'BULK'].includes(type)) {
      return NextResponse.json({ message: 'Type harus SINGLE atau BULK.' }, { status: 400 });
    }
    if (!subject?.trim() || !introText?.trim() || !footerText?.trim()) {
      return NextResponse.json({ message: 'Subject, intro, dan footer wajib diisi.' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ message: 'Perusahaan tidak ditemukan.' }, { status: 404 });
    }

    // Cek existing → update atau create
    const existing = await prisma.emailTemplate.findFirst({
      where: { companyId, type },
    });

    const template = existing
      ? await prisma.emailTemplate.update({
          where: { id: existing.id },
          data: {
            senderName: senderName?.trim() || 'M-Track Marusindo',
            subject:    subject.trim(),
            introText:  introText.trim(),
            footerText: footerText.trim(),
          },
        })
      : await prisma.emailTemplate.create({
          data: {
            companyId,
            type,
            senderName: senderName?.trim() || 'M-Track Marusindo',
            subject:    subject.trim(),
            introText:  introText.trim(),
            footerText: footerText.trim(),
          },
        });

    return NextResponse.json(
      { message: `Template override untuk ${company.name} berhasil disimpan.`, template },
      { status: 200 }
    );

  } catch (error) {
    console.error('[POST COMPANY TEMPLATE ERROR]:', error);
    return NextResponse.json({ message: 'Gagal menyimpan template klien.' }, { status: 500 });
  }
}

// DELETE: Hapus override → klien kembali pakai template global
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
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

    const { companyId } = await params;
    const body = await request.json();
    const { type } = body;

    if (!type || !['SINGLE', 'BULK'].includes(type)) {
      return NextResponse.json({ message: 'Type harus SINGLE atau BULK.' }, { status: 400 });
    }

    await prisma.emailTemplate.deleteMany({ where: { companyId, type } });

    return NextResponse.json(
      { message: 'Override template berhasil dihapus. Klien akan menggunakan template global.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[DELETE COMPANY TEMPLATE ERROR]:', error);
    return NextResponse.json({ message: 'Gagal menghapus template klien.' }, { status: 500 });
  }
}