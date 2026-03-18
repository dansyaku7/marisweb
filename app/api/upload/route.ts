import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 1. Validasi Keamanan (Hanya user login yang boleh nge-upload file)
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    // Verifikasi Token
    const secret = process.env.JWT_SECRET;
    jwt.verify(token, secret!);

    // 2. Tangkap File dari FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'File tidak ditemukan' }, { status: 400 });
    }

    // 3. Validasi Ekstensi & Ukuran (Cegah Hacker Upload Script Jahat)
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Hanya format JPG, PNG, dan PDF yang diizinkan' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) { // Limit 5MB
      return NextResponse.json({ message: 'Ukuran file maksimal 5MB' }, { status: 400 });
    }

    // 4. Generate Nama File Unik (Biar file "sertifikat.pdf" gak saling nimpa)
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // 5. CABANG INFRASTRUKTUR (Local VPS vs Vercel Blob)
    const provider = process.env.STORAGE_PROVIDER || 'LOCAL';

    if (provider === 'VERCEL_BLOB') {
      // OPSI A: Vercel Blob (Enterprise Grade)
      const blob = await put(`certificates/${uniqueFilename}`, file, {
        access: 'public',
      });
      
      return NextResponse.json({ url: blob.url }, { status: 201 });
      
    } else {
      // OPSI B: Local Storage VPS (Risiko tinggi kepenuhan disk)
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Pastikan folder public/uploads/certificates/ ada di VPS lu
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates');
      await mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, uniqueFilename);
      await writeFile(filePath, buffer);

      // Kembalikan URL relatif yang bisa diakses dari browser
      return NextResponse.json({ url: `/uploads/certificates/${uniqueFilename}` }, { status: 201 });
    }

  } catch (error: any) {
    console.error('[UPLOAD ERROR]:', error);
    return NextResponse.json({ message: 'Gagal mengunggah file' }, { status: 500 });
  }
}