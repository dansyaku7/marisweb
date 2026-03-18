// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        // NEXT.JS 15+ FIX: Gunakan AWAIT
        const cookieStore = await cookies();
        cookieStore.delete('mtrack_session');

        return NextResponse.json(
            { message: 'Sesi diakhiri secara aman.' }, 
            { status: 200 }
        );
    } catch (error) {
        console.error('[LOGOUT ERROR]:', error);
        return NextResponse.json({ message: 'Gagal mengakhiri sesi' }, { status: 500 });
    }
}