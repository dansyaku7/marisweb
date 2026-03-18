import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // 1. Ambil & Ekstrak Token (Wajib Await untuk Next.js 15+)
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET hilang');

    // 2. Dekode JWT untuk mendapatkan Identitas
    const decoded = jwt.verify(token, secret) as { companyId: string, role: string };

    // 3. Logika Multi-Tenant Otomatis
    // SUPERADMIN = Kosongkan filter (ambil semua)
    // CLIENT = Filter mutlak berdasarkan companyId
    const whereClause = decoded.role === 'SUPERADMIN' ? {} : { companyId: decoded.companyId };

    // 4. Tarik HANYA kolom tanggal dari database untuk efisiensi memori server
    const equipments = await prisma.equipment.findMany({
      where: whereClause,
      select: { expiryDate: true }
    });

    // 5. Mesin Kalkulator Waktu
    const now = new Date();
    // Hilangkan jam/menit/detik dari waktu sekarang agar komparasi adil per hari penuh
    now.setHours(0, 0, 0, 0); 

    let safe = 0;
    let warning = 0;
    let expired = 0;

    equipments.forEach(eq => {
      // Normalisasi waktu kedaluwarsa
      const expDate = new Date(eq.expiryDate);
      expDate.setHours(0, 0, 0, 0);

      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        expired++;
      } else if (diffDays <= 60) {
        warning++; // Batas Kritis 2 Bulan
      } else {
        safe++;
      }
    });

    return NextResponse.json({
      total: equipments.length,
      safe,
      warning,
      expired
    }, { status: 200 });

  } catch (error) {
    console.error('[STATS API ERROR]:', error);
    return NextResponse.json({ message: 'Gagal memproses data statistik' }, { status: 500 });
  }
}