export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs'; // TAMBAHAN: Untuk enkripsi password

// PATCH: Perbarui Data Perusahaan & Password User
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
    // Tambah password di destructuring
    const { name, emailPic, isActive, namePic, phonePic, password } = body;

    if (!name || !emailPic) {
      return NextResponse.json(
        { message: 'Nama perusahaan dan Email PIC wajib diisi' },
        { status: 400 }
      );
    }

    // 1. Update data perusahaan
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data:  {
        name,
        emailPic,
        isActive,
        namePic:  namePic?.trim()  ?? null,
        phonePic: phonePic?.trim() ?? null,
      },
    });

    // 2. Update data User (Password & Email Login)
    // Kita update email login supaya selalu sama dengan email PIC yang baru
    const userData: any = { email: emailPic };

    // Jika admin mengisi field password, kita hash dan masukkan ke data update
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json({ message: 'Password minimal 6 karakter.' }, { status: 400 });
      }
      userData.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.updateMany({
      where: { companyId: companyId },
      data: userData,
    });

    return NextResponse.json(
      { message: 'Data klien & akun berhasil diperbarui', company: updatedCompany },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[EDIT COMPANY ERROR]:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Email atau Nama Perusahaan sudah digunakan.' },
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

    // Tambahkan penghapusan User dalam transaksi agar tidak ada data sampah
    await prisma.$transaction([
      prisma.emailLog.deleteMany(   { where: { companyId } }),
      prisma.equipment.deleteMany(  { where: { companyId } }),
      prisma.user.deleteMany(       { where: { companyId } }), // Hapus akun login juga
      prisma.company.delete(        { where: { id: companyId } }),
    ]);

    return NextResponse.json(
      { message: 'Klien beserta seluruh data akun dan alat berhasil dihapus.' },
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