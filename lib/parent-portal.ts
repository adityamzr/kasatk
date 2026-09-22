import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashToken, PARENT_SESSION_COOKIE } from '@/lib/auth';

export async function getParentSession() {
  const token = cookies().get(PARENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.parentSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { parent: true } });
  if (!session || session.expiresAt <= new Date()) return null;
  return session;
}

export async function getOwnedStudent(parentId: string, studentId: string) {
  const link = await prisma.studentParent.findUnique({ where: { studentId_parentId: { studentId, parentId } }, include: { student: { include: { classRoom: true } } } });
  return link?.student ?? null;
}

export function serializeDecimal(value: { toString(): string } | null | undefined) { return value?.toString() ?? '0'; }
