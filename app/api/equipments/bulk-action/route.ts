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
    const { action, equipmentIds, isProsesDinas } = body;

    if (!equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return NextResponse.json(
        { message: 'Tidak ada alat yang dipilih' },
        { status: 400 }
      );
    }

    // --- AKSI: HAPUS MASSAL ---
    if (action === 'delete') {
      // Sama seperti individual delete, hapus EmailLog yang relasinya manual
      await prisma.emailLog.deleteMany({
        where: { equipmentId: { in: equipmentIds } },
      });

      // Suket & Laporan terhapus via Cascade (harus ada onDelete: Cascade di schema Prisma lo)
      const result = await prisma.equipment.deleteMany({
        where: { id: { in: equipmentIds } },
      });

      return NextResponse.json(
        { message: `${result.count} alat berhasil dihapus secara massal.` },
        { status: 200 }
      );
    }

    // --- AKSI: TOGGLE PROSES DINAS ---
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