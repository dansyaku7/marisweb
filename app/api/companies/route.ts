import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';

// GET: Mengambil daftar semua klien (Hanya untuk Superadmin)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    // OTORISASI MUTLAK: Tendang jika bukan SUPERADMIN
    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak. Anda bukan Administrator.' }, { status: 403 });
    }

    // Tarik data perusahaan beserta jumlah alat yang mereka miliki
    const companies = await prisma.company.findMany({
      where: { 
        name: { not: 'PT. Marusindo' } // Jangan tampilkan Marusindo di daftar klien
      },
      include: {
        _count: {
          select: { equipments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(companies, { status: 200 });

  } catch (error) {
    console.error('[GET COMPANIES ERROR]:', error);
    return NextResponse.json({ message: 'Gagal memuat data klien' }, { status: 500 });
  }
}

// POST: Membuat Perusahaan Klien Baru + Akun Loginnya
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { role: string };

    // OTORISASI MUTLAK
    if (decoded.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, emailPic, password } = body;

    // Validasi Input Dasar
    if (!name || !emailPic || !password) {
      return NextResponse.json({ message: 'Nama perusahaan, email, dan password wajib diisi' }, { status: 400 });
    }

    // Cek apakah email sudah dipakai (Email harus unik untuk login)
    const existingUser = await prisma.user.findUnique({ where: { email: emailPic } });
    if (existingUser) {
      return NextResponse.json({ message: 'Email PIC sudah terdaftar di sistem' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // NESTED CREATE: Buat Company sekaligus User-nya dalam satu transaksi database
    const newCompany = await prisma.company.create({
      data: {
        name,
        emailPic,
        isActive: true,
        users: {
          create: {
            email: emailPic,
            password: hashedPassword,
            role: 'CLIENT' // Paksa role menjadi CLIENT, jangan percaya input dari frontend
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Perusahaan dan Akun Klien berhasil dibuat',
      companyId: newCompany.id
    }, { status: 201 });

  } catch (error) {
    console.error('[POST COMPANY ERROR]:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}