import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { message: 'Akses ditolak. Fitur ini khusus Administrator.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, equipmentIds, isProsesDinas, companyId, period, url } = body;

    // ====================================================================
    // FITUR BARU: BULK LINK CLOUD (ADD & DELETE)
    // ====================================================================

    // --- 1. AKSI: TAMBAH LINK CLOUD ---
    if (action === 'add-bulk-link-all') {
      if (!companyId || !period || !url) {
        return NextResponse.json({ message: 'Data form tidak lengkap.' }, { status: 400 });
      }

      let targetIds: string[] = [];

      if (equipmentIds && Array.isArray(equipmentIds) && equipmentIds.length > 0) {
        targetIds = equipmentIds;
      } else {
        const equipments = await prisma.equipment.findMany({
          where: { companyId },
          select: { id: true }
        });
        if (equipments.length === 0) return NextResponse.json({ message: 'Tidak ada data alat.' }, { status: 404 });
        targetIds = equipments.map(eq => eq.id);
      }

      const dataToInsert = targetIds.map(id => ({
        equipmentId: id,
        period: period.trim(),
        fileUrl: url.trim(),
        documentType: 'LINK' as const
      }));
      
      await prisma.suket.createMany({ data: dataToInsert });

      return NextResponse.json({ message: `Link berhasil dipasang ke ${targetIds.length} alat.` }, { status: 200 });
    }

    // --- 2. AKSI: HAPUS LINK CLOUD ---
    if (action === 'delete-bulk-link') {
      if (!companyId || !url) return NextResponse.json({ message: 'URL tidak valid.' }, { status: 400 });

      let targetIds: string[] = [];

      if (equipmentIds && Array.isArray(equipmentIds) && equipmentIds.length > 0) {
        targetIds = equipmentIds;
      } else {
        const equipments = await prisma.equipment.findMany({
          where: { companyId },
          select: { id: true }
        });
        targetIds = equipments.map(eq => eq.id);
      }

      // Hapus link tersebut dari tabel Suket (dan Laporan buat jaga-jaga kalau ada history lama) 
      // HANYA pada alat-alat yang menjadi target
      await prisma.suket.deleteMany({
        where: { equipmentId: { in: targetIds }, fileUrl: url, documentType: 'LINK' }
      });
      await prisma.laporan.deleteMany({
        where: { equipmentId: { in: targetIds }, fileUrl: url, documentType: 'LINK' }
      });

      return NextResponse.json({ message: `Link berhasil dihapus dari alat yang dipilih.` }, { status: 200 });
    }

    // ====================================================================
    // Validasi di bawah ini khusus untuk aksi yang WAJIB ada equipmentIds
    // ====================================================================
    if (!equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return NextResponse.json({ message: 'Tidak ada alat yang dipilih' }, { status: 400 });
    }

    // --- AKSI LAMA: HAPUS MASSAL ---
    if (action === 'delete') {
      await prisma.emailLog.deleteMany({ where: { equipmentId: { in: equipmentIds } } });
      const result = await prisma.equipment.deleteMany({ where: { id: { in: equipmentIds } } });
      return NextResponse.json({ message: `${result.count} alat berhasil dihapus secara massal.` }, { status: 200 });
    }

    // --- AKSI LAMA: TOGGLE PROSES DINAS ---
    if (action === 'toggle-dinas') {
      const result = await prisma.equipment.updateMany({
        where: { id: { in: equipmentIds } },
        data: { isProsesDinas: Boolean(isProsesDinas) },
      });
      return NextResponse.json({ message: `${result.count} alat berhasil diupdate statusnya.` }, { status: 200 });
    }

    return NextResponse.json({ message: 'Aksi tidak valid.' }, { status: 400 });

  } catch (error) {
    console.error('[BULK ACTION ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem saat memproses aksi massal' }, { status: 500 });
  }
}