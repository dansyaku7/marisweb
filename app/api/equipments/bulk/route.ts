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
    const { companyId, equipments } = body;

    if (!companyId || !equipments || !Array.isArray(equipments)) {
      return NextResponse.json(
        { message: 'Payload cacat. ID Perusahaan dan Data Alat wajib ada.' },
        { status: 400 }
      );
    }

    const validEquipments = [];

    for (const eq of equipments) {
      // Skip baris yang field wajibnya kosong
      if (!eq.name || !eq.inspectionDate || !eq.expiryDate) continue;

      const inspectDate = new Date(eq.inspectionDate);
      const expDate     = new Date(eq.expiryDate);

      // Skip kalau tanggal tidak valid
      if (isNaN(inspectDate.getTime()) || isNaN(expDate.getTime())) continue;

      validEquipments.push({
        companyId,
        // Field lama
        name:           String(eq.name),
        location:       eq.location     ? String(eq.location)     : null,
        permitNumber:   eq.permitNumber ? String(eq.permitNumber) : 'N/A',
        serialNumber:   eq.serialNumber ? String(eq.serialNumber) : 'N/A',
        inspectionDate: inspectDate,
        expiryDate:     expDate,
        // Field baru (opsional, null kalau kosong di Excel)
        area:           eq.area        ? String(eq.area)        : null,
        brand:          eq.brand       ? String(eq.brand)       : null,
        capacity:       eq.capacity    ? String(eq.capacity)    : null,
        description:    eq.description ? String(eq.description) : null,
      });
    }

    if (validEquipments.length === 0) {
      return NextResponse.json(
        { message: 'Tidak ada data valid yang bisa diimpor dari file tersebut.' },
        { status: 400 }
      );
    }

    const result = await prisma.equipment.createMany({
      data: validEquipments,
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: `Berhasil mengimpor ${result.count} alat berat`,
      count: result.count,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[BULK IMPORT ERROR]:', error);
    return NextResponse.json(
      { message: error.message || 'Kesalahan pemrosesan data' },
      { status: 500 }
    );
  }
}