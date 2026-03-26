import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function resolveTemplate(companyId: string, type: string) {
  // 1. Cari di PT dulu
  const override = await prisma.emailTemplate.findUnique({
    where: { companyId_type: { companyId, type } }
  });
  if (override) return override;

  // 2. Cari di Global
  const global = await prisma.emailTemplate.findUnique({
    where: { companyId_type: { companyId: "GLOBAL", type } }
  });
  if (global) return global;

  // 3. Hardcoded Fallback
  // @ts-ignore
  return { ...DEFAULT_TEMPLATES[type], type };
}

export async function GET(request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type) {
    const tpl = await prisma.emailTemplate.findUnique({
      where: { companyId_type: { companyId, type } }
    });
    return NextResponse.json(tpl);
  }

  const templates = await prisma.emailTemplate.findMany({ where: { companyId } });
  return NextResponse.json(templates);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { type } = await request.json();
  
  await prisma.emailTemplate.delete({
    where: { companyId_type: { companyId, type } }
  });

  return NextResponse.json({ message: 'Override dihapus.' });
}