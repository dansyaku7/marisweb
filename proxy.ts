// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  // Ambil token dari HttpOnly Cookie
  const token = request.cookies.get('mtrack_session')?.value

  const isLoginPage = request.nextUrl.pathname === '/'
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')

  // LOGIKA 1: Cegah orang yang sudah login balik lagi ke halaman depan
  if (isLoginPage) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // LOGIKA 2: Proteksi mutlak untuk semua halaman di dalam /dashboard
  if (isDashboardRoute) {
    if (!token) {
      // Tidak ada token? Tendang balik ke login.
      return NextResponse.redirect(new URL('/', request.url))
    }

    try {
      // Verifikasi kriptografi JWT di Edge Runtime
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      await jwtVerify(token, secret)
      
      // Jika lolos, izinkan akses
      return NextResponse.next()
    } catch (error) {
      // Token kedaluwarsa atau dimanipulasi hacker (Invalid Signature)
      // Hapus cookie bodong tersebut dan tendang ke login
      const response = NextResponse.redirect(new URL('/', request.url))
      response.cookies.delete('mtrack_session')
      return response
    }
  }

  return NextResponse.next()
}

// Konfigurasi ini menentukan rute mana saja yang dicegat oleh satpam (middleware) ini
export const config = {
  matcher: ['/', '/dashboard/:path*']
}