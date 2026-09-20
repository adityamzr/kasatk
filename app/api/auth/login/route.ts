export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createAdminSession, sessionCookie, ADMIN_SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    if (!identifier || !password) return NextResponse.json({ message: 'Username/email dan password wajib diisi.' }, { status: 400 });
    const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { username: identifier }], status: 'ACTIVE' } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ message: 'Data login tidak valid.' }, { status: 401 });
    const token = await createAdminSession(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
    response.cookies.set(sessionCookie(ADMIN_SESSION_COOKIE, token));
    return response;
  } catch { return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 }); }
}
