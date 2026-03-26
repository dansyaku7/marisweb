import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { del } from '@vercel/blob';

// POST: Tambah suket baru (append ke history, yang lama tetap ada)
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

    // Hanya SUPERADMIN yang boleh upload dokumen
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
      return NextResponse.json({ message: 'Periode suket wajib diisi (cth: 2025-2026)' }, { status: 400 });
    }
    if (!fileUrl?.trim()) {
      return NextResponse.json({ message: 'URL file suket wajib disertakan' }, { status: 400 });
    }

    // Verifikasi equipment ada
    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) {
      return NextResponse.json({ message: 'Alat tidak ditemukan' }, { status: 404 });
    }

    // Append suket baru — history tetap tersimpan
    const suket = await prisma.suket.create({
      data: {
        equipmentId,
        period: period.trim(),
        fileUrl: fileUrl.trim(),
      },
    });

    return NextResponse.json(
      { message: 'Suket berhasil disimpan', suket },
      { status: 201 }
    );

  } catch (error) {
    console.error('[POST SUKET ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

// GET: Ambil semua suket milik equipment (terbaru di atas)
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

    const suketList = await prisma.suket.findMany({
      where: { equipmentId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suketList, { status: 200 });

  } catch (error) {
    console.error('[GET SUKET ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

// DELETE: Hapus suket dari database dan Vercel Blob
export async function DELETE(
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
        { message: 'Akses ditolak. Hanya Administrator yang dapat menghapus dokumen.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const suketId = searchParams.get('suketId');

    if (!suketId) {
      return NextResponse.json({ message: 'ID suket tidak ditemukan.' }, { status: 400 });
    }

    // 1. Cari data suket untuk dapet URL Vercel Blob
    const existingSuket = await prisma.suket.findUnique({
      where: { id: suketId }
    });

    if (!existingSuket) {
      return NextResponse.json({ message: 'Data suket tidak ditemukan.' }, { status: 404 });
    }

    // 2. Hapus file fisik dari Vercel Blob jika URL valid
    if (existingSuket.fileUrl && existingSuket.fileUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(existingSuket.fileUrl);
        console.log(`[VERCEL BLOB]: File deleted -> ${existingSuket.fileUrl}`);
      } catch (blobError: any) {
        console.warn(`[VERCEL BLOB WARNING]: Gagal hapus file ${existingSuket.fileUrl} - ${blobError.message}`);
        // Lanjut hapus database meskipun blob gagal (misal file udah kehapus manual)
      }
    }

    // 3. Hapus data dari database
    await prisma.suket.delete({
      where: { id: suketId },
    });

    return NextResponse.json({ message: 'Suket beserta file fisiknya berhasil dihapus' }, { status: 200 });

  } catch (error) {
    console.error('[DELETE SUKET ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem saat menghapus' }, { status: 500 });
  }
}