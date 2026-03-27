import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ message: "Data tidak lengkap." }, { status: 400 });
    }

    // 1. Cari token di database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    // 2. Validasi Token (Ada atau enggak & udah expired atau belum)
    if (!resetToken) {
      return NextResponse.json({ message: "Token tidak valid." }, { status: 400 });
    }

    const hasExpired = new Date(resetToken.expires) < new Date();
    if (hasExpired) {
      // Hapus token yang sudah basi biar DB bersih
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ message: "Token sudah kedaluwarsa." }, { status: 400 });
    }

    // 3. Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Update Password User & Hapus Token (Gunakan Transaction)
    // Kita hapus tokennya biar nggak bisa dipake dua kali
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { token },
      }),
    ]);

    return NextResponse.json({ message: "Kata sandi berhasil diperbarui." }, { status: 200 });

  } catch (error: any) {
    console.error("[RESET_PASSWORD_API_ERROR]:", error);
    return NextResponse.json({ message: "Gagal memperbarui kata sandi." }, { status: 500 });
  }
}