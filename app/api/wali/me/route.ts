import { NextResponse } from 'next/server';
import { getParentSession } from '@/lib/parent-portal';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET() {
  const session = await getParentSession();
  if (!session) return NextResponse.json({ message: 'Sesi Anda telah berakhir.' }, { status: 401 });
  const [parent, setting] = await Promise.all([prisma.parent.findUnique({ where: { id: session.parentId }, include: { students: { include: { student: { include: { classRoom: true } } }, orderBy: { student: { name: 'asc' } } } } }), prisma.schoolSetting.findUnique({ where: { id: 1 }, select: { schoolName: true } })]);
  if (!parent) return NextResponse.json({ message: 'Data wali tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ school: { name: setting?.schoolName ?? 'Sekolah' }, parent: { id: parent.id, name: parent.name, phone: parent.phone }, students: parent.students.map((link) => ({ id: link.student.id, nis: link.student.nis, name: link.student.name, className: link.student.classRoom.name, relation: link.relation, isPrimary: link.isPrimary })) });
}
