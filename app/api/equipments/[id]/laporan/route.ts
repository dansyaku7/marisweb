import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// POST: Upload/replace laporan (upsert by period)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { companyId: string; role: string };

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Administrator yang dapat mengelola dokumen.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const equipmentId = resolvedParams.id;

    const body = await request.json();
    const { period, fileUrl } = body;

    if (!period?.trim()) {
      return NextResponse.json({ message: 'Periode laporan wajib diisi (cth: 2025-2026)' }, { status: 400 });
    }
    if (!fileUrl?.trim()) {
      return NextResponse.json({ message: 'URL file laporan wajib disertakan' }, { status: 400 });
    }

    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) {
      return NextResponse.json({ message: 'Alat tidak ditemukan' }, { status: 404 });
    }

    const laporan = await prisma.laporan.upsert({
      where: {
        equipmentId_period: {
          equipmentId,
          period: period.trim(),
        },
      },
      update: {
        fileUrl: fileUrl.trim(),
        updatedAt: new Date(),
      },
      create: {
        equipmentId,
        period: period.trim(),
        fileUrl: fileUrl.trim(),
      },
    });

    return NextResponse.json(
      { message: 'Laporan berhasil disimpan', laporan },
      { status: 200 }
    );

  } catch (error) {
    console.error('[POST LAPORAN ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

// GET: Ambil semua laporan milik equipment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const equipmentId = resolvedParams.id;

    const laporanList = await prisma.laporan.findMany({
      where: { equipmentId },
      orderBy: { period: 'desc' },
    });

    return NextResponse.json(laporanList, { status: 200 });

  } catch (error) {
    console.error('[GET LAPORAN ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

// DELETE: Hapus laporan by laporanId
export async function DELETE(
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
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Administrator yang dapat menghapus dokumen.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const equipmentId = resolvedParams.id;

    const { searchParams } = new URL(request.url);
    const laporanId = searchParams.get('laporanId');

    if (!laporanId) {
      return NextResponse.json({ message: 'laporanId wajib disertakan' }, { status: 400 });
    }

    // Pastiin laporan ini memang milik equipment yang dimaksud
    const laporan = await prisma.laporan.findFirst({
      where: { id: laporanId, equipmentId },
    });

    if (!laporan) {
      return NextResponse.json({ message: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    await prisma.laporan.delete({ where: { id: laporanId } });

    return NextResponse.json(
      { message: 'Laporan berhasil dihapus' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[DELETE LAPORAN ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}