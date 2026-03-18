// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ✅ Ganti nama fungsi dari "middleware" → "proxy"
export async function proxy(request: NextRequest) {
  const token = request.cookies.get('mtrack_session')?.value

  const isLoginPage = request.nextUrl.pathname === '/'
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')

  if (isLoginPage) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (isDashboardRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      await jwtVerify(token, secret)
      return NextResponse.next()
    } catch (error) {
      const response = NextResponse.redirect(new URL('/', request.url))
      response.cookies.delete('mtrack_session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*']
}