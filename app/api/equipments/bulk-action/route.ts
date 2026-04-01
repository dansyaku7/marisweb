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
    const { action, equipmentIds, isProsesDinas, companyId, targetDoc, period, url } = body;

    // --- AKSI BARU: TAMBAH LINK CLOUD KE SEMUA ALAT (SATU PT) ---
    if (action === 'add-bulk-link-all') {
      if (!companyId || !targetDoc || !period || !url) {
        return NextResponse.json({ message: 'Data form tidak lengkap.' }, { status: 400 });
      }

      // Ambil semua ID alat yang ada di Klien (Company) ini
      const equipments = await prisma.equipment.findMany({
        where: { companyId },
        select: { id: true }
      });

      if (equipments.length === 0) {
        return NextResponse.json({ message: 'Tidak ada data alat di klien ini.' }, { status: 404 });
      }

      if (targetDoc === 'suket') {
        // Suket sifatnya history (append), jadi kita pakai createMany
        const dataToInsert = equipments.map(eq => ({
          equipmentId: eq.id,
          period: period.trim(),
          fileUrl: url.trim(),
          documentType: 'LINK' as const
        }));
        await prisma.suket.createMany({ data: dataToInsert });
      } 
      else if (targetDoc === 'laporan') {
        // Laporan sifatnya unik per periode (upsert), kita bungkus dalam transaction
        const transactions = equipments.map(eq => prisma.laporan.upsert({
          where: { equipmentId_period: { equipmentId: eq.id, period: period.trim() } },
          update: { fileUrl: url.trim(), documentType: 'LINK', updatedAt: new Date() },
          create: { equipmentId: eq.id, period: period.trim(), fileUrl: url.trim(), documentType: 'LINK' }
        }));
        await prisma.$transaction(transactions);
      }

      return NextResponse.json(
        { message: `Link berhasil dipasang ke ${equipments.length} alat.` },
        { status: 200 }
      );
    }

    // ====================================================================
    // Validasi di bawah ini khusus untuk aksi yang butuh equipmentIds (Checkbox)
    // ====================================================================
    if (!equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return NextResponse.json(
        { message: 'Tidak ada alat yang dipilih' },
        { status: 400 }
      );
    }

    // --- AKSI LAMA: HAPUS MASSAL ---
    if (action === 'delete') {
      // Hapus log email manual karena tidak pakai cascade di schema
      await prisma.emailLog.deleteMany({
        where: { equipmentId: { in: equipmentIds } },
      });

      // Suket & Laporan terhapus via Cascade
      const result = await prisma.equipment.deleteMany({
        where: { id: { in: equipmentIds } },
      });

      return NextResponse.json(
        { message: `${result.count} alat berhasil dihapus secara massal.` },
        { status: 200 }
      );
    }

    // --- AKSI LAMA: TOGGLE PROSES DINAS ---
    if (action === 'toggle-dinas') {
      const result = await prisma.equipment.updateMany({
        where: { id: { in: equipmentIds } },
        data: { isProsesDinas: Boolean(isProsesDinas) },
      });

      return NextResponse.json(
        { message: `${result.count} alat berhasil diupdate statusnya.` },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: 'Aksi tidak valid.' }, { status: 400 });

  } catch (error) {
    console.error('[BULK ACTION ERROR]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan sistem saat memproses aksi massal' },
      { status: 500 }
    );
  }
}