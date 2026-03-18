// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: 'Kredensial wajib diisi' }, { status: 400 })
    }

    // 1. Cari User dan relasikan ke Company-nya
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true 
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'Kredensial tidak valid' }, { status: 401 })
    }

    if (!user.company.isActive) {
      return NextResponse.json({ message: 'Akses perusahaan ditangguhkan' }, { status: 403 })
    }

    // 2. Validasi Hash Password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Kredensial tidak valid' }, { status: 401 })
    }

    // 3. Wajib gunakan environment variable yang ketat
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET belum dikonfigurasi di server')
    }

    // 4. Generate JWT Payload 
    const token = jwt.sign(
      { 
        userId: user.id, 
        companyId: user.companyId, 
        role: user.role 
      },
      secret,
      { expiresIn: '1d' }
    )

    // 5. NEXT.JS 15+ FIX: Gunakan AWAIT untuk cookies()
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'mtrack_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 Hari
      path: '/',
    })

    return NextResponse.json({
      message: 'Login Berhasil',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyName: user.company.name
      }
    })

  } catch (error) {
    console.error('[AUTH ERROR]:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}