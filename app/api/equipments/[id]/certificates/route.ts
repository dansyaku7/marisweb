import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { companyId: string, role: string };

    const equipmentId = params.id;
    const body = await request.json();
    const { certificateUrl } = body;

    if (!certificateUrl) {
      return NextResponse.json({ message: 'URL Sertifikat wajib disertakan' }, { status: 400 });
    }

    // 1. Verifikasi Kepemilikan Alat (Isolasi Data)
    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    
    if (!equipment) {
      return NextResponse.json({ message: 'Alat tidak ditemukan' }, { status: 404 });
    }

    // Klien hanya boleh update alat perusahaannya sendiri
    if (decoded.role === 'CLIENT' && equipment.companyId !== decoded.companyId) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
    }

    // 2. Eksekusi Update
    const updatedEq = await prisma.equipment.update({
      where: { id: equipmentId },
      data: { certificateUrl }
    });

    return NextResponse.json({ message: 'Sertifikat berhasil ditautkan', equipment: updatedEq }, { status: 200 });

  } catch (error) {
    console.error('[CERT UPDATE ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}