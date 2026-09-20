export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createParentSession, sessionCookie, PARENT_SESSION_COOKIE } from '@/lib/auth';

function normalizePhone(value: string) { return value.replace(/[^0-9+]/g, '').replace(/^08/, '+628'); }
function dateOnly(value: unknown) { const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date; }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(String(body.phone ?? ''));
    const dateOfBirth = dateOnly(body.dateOfBirth);
    if (!phone || !dateOfBirth) return NextResponse.json({ message: 'Nomor WhatsApp dan tanggal lahir wajib diisi.' }, { status: 400 });
    const parents = await prisma.parent.findMany({ where: { phone }, include: { students: { include: { student: { include: { classRoom: true } } } } } });
    const parent = parents.find((item) => item.dateOfBirth && item.dateOfBirth.toISOString().slice(0, 10) === dateOfBirth.toISOString().slice(0, 10));
    if (!parent) return NextResponse.json({ message: 'Data wali tidak ditemukan.' }, { status: 401 });
    const token = await createParentSession(parent.id);
    const response = NextResponse.json({ parent: { id: parent.id, name: parent.name, students: parent.students.map((link) => ({ id: link.student.id, name: link.student.name, className: link.student.classRoom.name })) } });
    response.cookies.set(sessionCookie(PARENT_SESSION_COOKIE, token));
    return response;
  } catch { return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 }); }
}
