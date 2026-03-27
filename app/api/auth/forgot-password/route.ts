import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "Email wajib diisi." }, { status: 400 });
    }

    // 1. Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Secara security, kita jangan kasih tau kalau email nggak terdaftar 
    // biar nggak di-spam, tapi karena ini sistem internal, kita gas aja biar user nggak bingung.
    if (!user) {
      return NextResponse.json({ message: "Email tidak terdaftar di sistem." }, { status: 404 });
    }

    // 2. Generate Token & Expiry (1 jam dari sekarang)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 Jam

    // 3. Simpan ke database (Gunakan transaction atau delete dulu biar nggak numpuk)
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { email } }),
      prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expires,
        },
      }),
    ]);

    // 4. Setup Link Reset
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    // 5. Konfigurasi Transporter (Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 6. Kirim Email
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1a1a1a;">
        <h2 style="color: #1a1a1a; margin-bottom: 16px;">Permintaan Reset Kata Sandi</h2>
        <p style="line-height: 1.6;">Kami menerima permintaan untuk mengatur ulang kata sandi akun M-Track Anda.</p>
        <p style="line-height: 1.6;">Klik tombol di bawah ini untuk melanjutkan. Link ini <b>berlaku selama 1 jam</b>.</p>
        
        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetLink}" style="background: #F0A500; color: #1A1A1A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Reset Kata Sandi
          </a>
        </div>
        
        <p style="font-size: 13px; color: #64748b;">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini. Kata sandi Anda tidak akan berubah.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">M-Track Enterprise System &bull; Marusindo</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"M-Track Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "[PENTING] Instruksi Reset Kata Sandi",
      html: htmlBody,
    });

    return NextResponse.json({ message: "Link reset password telah dikirim ke email Anda." });

  } catch (error: any) {
    console.error("[FORGOT_PASSWORD_ERROR]:", error);
    return NextResponse.json({ message: "Gagal memproses permintaan." }, { status: 500 });
  }
}