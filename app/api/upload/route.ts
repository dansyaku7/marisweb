import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get('mtrack_session')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    jwt.verify(token, secret!);

    // 2. Tangkap file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'File tidak ditemukan' }, { status: 400 });
    }

    // 3. Validasi tipe & ukuran
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Hanya format JPG, PNG, dan PDF yang diizinkan' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'Ukuran file maksimal 5MB' }, { status: 400 });
    }

    // 4. Generate nama unik
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // 5. Upload
    const provider = process.env.STORAGE_PROVIDER || 'LOCAL';

    if (provider === 'VERCEL_BLOB') {
      // Langsung stream ReadableStream ke Blob — jauh lebih cepat dari arrayBuffer()
      const blob = await put(`certificates/${uniqueFilename}`, file.stream(), {
        access: 'public',
        contentType: file.type,
      });

      return NextResponse.json({ url: blob.url }, { status: 201 });

    } else {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates');
      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, uniqueFilename);
      await writeFile(filePath, buffer);

      return NextResponse.json({ url: `/uploads/certificates/${uniqueFilename}` }, { status: 201 });
    }

  } catch (error: any) {
    console.error('[UPLOAD ERROR]:', error);
    return NextResponse.json({ message: 'Gagal mengunggah file' }, { status: 500 });
  }
}