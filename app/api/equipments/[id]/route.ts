import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// PATCH: Memperbarui Data Inti Alat (Mendukung Partial Update)
export async function PATCH(
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
        { message: 'Akses ditolak. Fitur ini khusus Administrator.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const equipmentId = resolvedParams.id;

    const body = await request.json();

    // 1. Cek apakah ini HANYA request untuk toggle isProsesDinas
    const isOnlyTogglingDinas = Object.keys(body).length === 1 && 'isProsesDinas' in body;

    if (isOnlyTogglingDinas) {
      const updatedEq = await prisma.equipment.update({
        where: { id: equipmentId },
        data: { isProsesDinas: body.isProsesDinas },
      });
      return NextResponse.json(
        { message: 'Status Proses Dinas berhasil diperbarui', equipment: updatedEq },
        { status: 200 }
      );
    }

    // 2. Kalau bukan sekadar toggle, berarti Edit Data Penuh dari Form. Jalankan validasi ketat.
    const {
      name, location, permitNumber, serialNumber,
      inspectionDate, expiryDate,
      area, brand, capacity, description,
    } = body;

    if (!name || !inspectionDate || !expiryDate) {
      return NextResponse.json(
        { message: 'Nama, Tanggal Inspeksi, dan Tanggal Kedaluwarsa wajib diisi' },
        { status: 400 }
      );
    }

    const updatedEq = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        name, location, permitNumber, serialNumber,
        inspectionDate: new Date(inspectionDate),
        expiryDate:     new Date(expiryDate),
        // Field opsional — simpan null kalau dikosongkan
        area:        area        ?? null,
        brand:       brand       ?? null,
        capacity:    capacity    ?? null,
        description: description ?? null,
      },
    });

    return NextResponse.json(
      { message: 'Data alat berhasil diperbarui', equipment: updatedEq },
      { status: 200 }
    );

  } catch (error) {
    console.error('[EDIT EQUIPMENT ERROR]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan sistem saat memperbarui data' },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus Data Alat beserta semua relasi
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
        { message: 'Akses ditolak. Fitur ini khusus Administrator.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const equipmentId = resolvedParams.id;

    // EmailLog tidak pakai cascade di schema, hapus manual dulu
    await prisma.emailLog.deleteMany({ where: { equipmentId } });

    // Suket & Laporan pakai onDelete: Cascade, ikut terhapus otomatis di DB
    // CATATAN: File fisik di Vercel Blob DARI suket & laporan akan menjadi yatim/tertinggal
    // kalau lu nggak ngeloop dan ngehapus filenya satu-satu di sini sebelum hapus equipment.
    await prisma.equipment.delete({ where: { id: equipmentId } });

    return NextResponse.json(
      { message: 'Alat berhasil dihapus dari database' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[DELETE EQUIPMENT ERROR]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan sistem saat menghapus data' },
      { status: 500 }
    );
  }
}