import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export const ADMIN_SESSION_COOKIE = 'paud_session';
export const PARENT_SESSION_COOKIE = 'paud_parent_session';
const SESSION_DAYS = 30;

export function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function expiry() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DAYS);
  return date;
}

export async function createAdminSession(userId: string) {
  const token = createToken();
  await prisma.authSession.create({ data: { userId, tokenHash: hashToken(token), expiresAt: expiry() } });
  return token;
}

export async function createParentSession(parentId: string) {
  const token = createToken();
  await prisma.parentSession.create({ data: { parentId, tokenHash: hashToken(token), expiresAt: expiry() } });
  return token;
}

export async function getCurrentUser() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.authSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: { include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } } } });
  if (!session || session.expiresAt < new Date() || session.user.status !== 'ACTIVE') return null;
  return session.user;
}

export async function getCurrentParent() {
  const token = cookies().get(PARENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.parentSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { parent: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.parent;
}

export const sessionCookie = (name: string, token: string) => ({ name, value: token, httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: SESSION_DAYS * 24 * 60 * 60 });

export async function hasPermission(permissionKey: string) {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.roles.some((userRole) => userRole.role.permissions.some((rolePermission) => rolePermission.permission.key === permissionKey));
}
