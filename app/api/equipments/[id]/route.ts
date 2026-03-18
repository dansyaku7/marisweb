import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// PATCH: Memperbarui Data Inti Alat (Edit)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // NEXT.JS 15+ FIX: params adalah Promise
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak. Fitur ini khusus Administrator.' }, { status: 403 });
    }

    // NEXT.JS 15+ FIX: Gunakan AWAIT untuk params
    const resolvedParams = await params;
    const equipmentId = resolvedParams.id;

    const body = await request.json();
    const { name, location, permitNumber, serialNumber, inspectionDate, expiryDate } = body;

    if (!name || !inspectionDate || !expiryDate) {
      return NextResponse.json({ message: 'Nama, Tanggal Inspeksi, dan Tanggal Kedaluwarsa wajib diisi' }, { status: 400 });
    }

    const updatedEq = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        name,
        location:
        location,
        permitNumber,
        serialNumber,
        inspectionDate: new Date(inspectionDate),
        expiryDate: new Date(expiryDate),
      }
    });

    return NextResponse.json({ message: 'Data alat berhasil diperbarui', equipment: updatedEq }, { status: 200 });

  } catch (error) {
    console.error('[EDIT EQUIPMENT ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem saat memperbarui data' }, { status: 500 });
  }
}

// DELETE: Menghapus Data Alat
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // NEXT.JS 15+ FIX
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak. Fitur ini khusus Administrator.' }, { status: 403 });
    }

    // NEXT.JS 15+ FIX: Gunakan AWAIT untuk params
    const resolvedParams = await params;
    const equipmentId = resolvedParams.id;

    // Hapus log email yang terkait terlebih dahulu
    await prisma.emailLog.deleteMany({
      where: { equipmentId: equipmentId }
    });

    // Eksekusi Hapus Alat
    await prisma.equipment.delete({
      where: { id: equipmentId }
    });

    return NextResponse.json({ message: 'Alat berhasil dihapus dari database' }, { status: 200 });

  } catch (error) {
    console.error('[DELETE EQUIPMENT ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem saat menghapus data' }, { status: 500 });
  }
}