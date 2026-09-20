export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashToken, ADMIN_SESSION_COOKIE, PARENT_SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  const cookieStore = cookies();
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const parentToken = cookieStore.get(PARENT_SESSION_COOKIE)?.value;
  if (adminToken) await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(adminToken) } });
  if (parentToken) await prisma.parentSession.deleteMany({ where: { tokenHash: hashToken(parentToken) } });
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_SESSION_COOKIE); response.cookies.delete(PARENT_SESSION_COOKIE);
  return response;
}
