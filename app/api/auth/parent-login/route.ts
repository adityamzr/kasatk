export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createParentSession, sessionCookie, PARENT_SESSION_COOKIE } from '@/lib/auth';
import { normalizePhone } from '@/lib/phone';

function dateKey(value: unknown) { const text = String(value ?? '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null; }
export async function POST(request: Request) {
  try {
    const body = await request.json(); const phone = normalizePhone(String(body.phone ?? '')); const birthDate = dateKey(body.dateOfBirth);
    const invalid = NextResponse.json({ message: 'Nomor WhatsApp atau tanggal lahir anak tidak sesuai.' }, { status: 401 });
    if (!phone || !birthDate) return invalid;
    const parent = await prisma.parent.findUnique({ where: { phone }, include: { students: { select: { student: { select: { id: true, dateOfBirth: true } } } } } });
    const valid = parent?.students.some((link) => link.student.dateOfBirth.toISOString().slice(0, 10) === birthDate);
    if (!parent || !valid) return invalid;
    const token = await createParentSession(parent.id); const response = NextResponse.json({ success: true }); response.cookies.set(sessionCookie(PARENT_SESSION_COOKIE, token)); return response;
  } catch { return NextResponse.json({ message: 'Tidak dapat memproses login saat ini.' }, { status: 500 }); }
}
