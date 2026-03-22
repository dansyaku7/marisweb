export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// PATCH: Perbarui Data Perusahaan
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret  = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const companyId      = resolvedParams.id;

    const body = await request.json();
    const { name, emailPic, isActive, namePic, phonePic } = body;

    if (!name || !emailPic) {
      return NextResponse.json(
        { message: 'Nama perusahaan dan Email PIC wajib diisi' },
        { status: 400 }
      );
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data:  {
        name,
        emailPic,
        isActive,
        // Field baru — simpan null kalau dikosongkan
        namePic:  namePic?.trim()  ?? null,
        phonePic: phonePic?.trim() ?? null,
      },
    });

    return NextResponse.json(
      { message: 'Data klien berhasil diperbarui', company: updatedCompany },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[EDIT COMPANY ERROR]:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Email tersebut sudah digunakan oleh perusahaan lain.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Terjadi kesalahan sistem saat memperbarui data' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus Perusahaan & Seluruh Asetnya (Atomic Transaction)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret  = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const companyId      = resolvedParams.id;

    await prisma.$transaction([
      prisma.emailLog.deleteMany(   { where: { companyId } }),
      prisma.equipment.deleteMany(  { where: { companyId } }),
      prisma.company.delete(        { where: { id: companyId } }),
    ]);

    return NextResponse.json(
      { message: 'Klien beserta seluruh data alat berhasil dihapus.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[DELETE COMPANY ERROR]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan sistem saat menghapus data klien' },
      { status: 500 }
    );
  }
}