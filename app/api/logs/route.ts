import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret!) as { companyId: string, role: string };

    // Isolasi Multi-Tenant
    const whereClause = decoded.role === 'SUPERADMIN' ? {} : { companyId: decoded.companyId };

    // Tarik data Log beserta relasinya (Siapa perusahaannya, apa alatnya)
    const logs = await prisma.emailLog.findMany({
      where: whereClause,
      include: {
        company: { select: { name: true, emailPic: true } },
        equipment: { select: { name: true, expiryDate: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Batasi 100 log terakhir agar tidak membebani memori
    });

    return NextResponse.json(logs, { status: 200 });

  } catch (error) {
    console.error('[GET LOGS ERROR]:', error);
    return NextResponse.json({ message: 'Gagal memuat log notifikasi' }, { status: 500 });
  }
}