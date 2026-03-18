import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// GET: Ambil daftar alat (Terapkan Isolasi Multi-Tenant)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { companyId: string, role: string };

    // Logika Filter Mutlak
    const whereClause = decoded.role === 'SUPERADMIN' ? {} : { companyId: decoded.companyId };

    const equipments = await prisma.equipment.findMany({
      where: whereClause,
      include: {
        company: { select: { name: true } } // Bawa nama perusahaan untuk UI
      },
      orderBy: { expiryDate: 'asc' } // Urutkan dari yang paling cepat expired
    });

    return NextResponse.json(equipments, { status: 200 });

  } catch (error) {
    console.error('[GET EQUIPMENTS ERROR]:', error);
    return NextResponse.json({ message: 'Gagal memuat data alat' }, { status: 500 });
  }
}

// POST: Tambah Alat Baru (Hanya Superadmin yang boleh)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak. Hanya Admin Marusindo yang dapat menambah data.' }, { status: 403 });
    }

    const body = await request.json();
    const { companyId, location, name, permitNumber, serialNumber, inspectionDate, expiryDate } = body;

    if (!companyId || !name || !inspectionDate || !expiryDate) {
      return NextResponse.json({ message: 'Data wajib (Perusahaan, Nama Alat, Tanggal) tidak lengkap' }, { status: 400 });
    }

    const newEquipment = await prisma.equipment.create({
      data: {
        companyId,
        location,
        name,
        permitNumber,
        serialNumber,
        inspectionDate: new Date(inspectionDate),
        expiryDate: new Date(expiryDate)
      }
    });

    return NextResponse.json({ message: 'Alat berhasil ditambahkan', equipment: newEquipment }, { status: 201 });

  } catch (error) {
    console.error('[POST EQUIPMENT ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}