import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashToken, PARENT_SESSION_COOKIE } from '@/lib/auth';
export async function POST() {
  const token = cookies().get(PARENT_SESSION_COOKIE)?.value;
  if (token) await prisma.parentSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: PARENT_SESSION_COOKIE, value: '', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  return response;
}
