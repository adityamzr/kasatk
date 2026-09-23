export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission, errorResponse } from '@/lib/api';
import { normalizePhone } from '@/lib/phone';

export async function GET(req: Request) {
  const denied = await requirePermission('students.view'); if (denied) return denied;
  try { const url = new URL(req.url); const search = url.searchParams.get('search')?.trim(); const classRoomId = url.searchParams.get('classRoomId') || undefined; const status = url.searchParams.get('status') as any || undefined; const page = Math.max(1, Number(url.searchParams.get('page') || 1)); const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 25))); const where:any={ ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { nis: { contains: search, mode: 'insensitive' } }] } : {}), ...(classRoomId ? { classRoomId } : {}), ...(status ? { status } : {}) }; const [items,total]=await prisma.$transaction([prisma.student.findMany({where,orderBy:{name:'asc'},skip:(page-1)*pageSize,take:pageSize,include:{classRoom:true,parents:{include:{parent:true}}}}),prisma.student.count({where})]); return NextResponse.json({items,pagination:{page,pageSize,total,totalPages:Math.ceil(total/pageSize)}});
  } catch (e: any) { if (e?.code === 'PARENT_PHONE_EXISTS') return NextResponse.json({ code: e.code, message: e.message, guardianClientId: e.guardianClientId, existingParent: e.existingParent }, { status: 409 }); return errorResponse(e); }
}

export async function POST(req: Request) {
  const denied = await requirePermission('students.manage'); if (denied) return denied;
  try {
    const body = await req.json(); const s = body.student ?? body; const guardians = body.guardians ?? (body.parentId ? [{ type: 'existing', parentId: body.parentId, relation: body.relation, isPrimary: true }] : []);
    if (!s.nis?.trim() || !s.name?.trim() || !s.dateOfBirth || !s.classRoomId) return NextResponse.json({ message: 'NIS, nama, tanggal lahir, dan kelas wajib diisi.' }, { status: 400 });
    if (s.customSppAmount !== null && s.customSppAmount !== undefined && s.customSppAmount !== '' && !((typeof s.customSppAmount === 'number' && Number.isInteger(s.customSppAmount) && s.customSppAmount > 0) || (typeof s.customSppAmount === 'string' && /^[1-9]\d*$/.test(s.customSppAmount)))) return NextResponse.json({ message: 'Nominal SPP khusus harus berupa angka rupiah tanpa format.' }, { status: 400 });
    if (!Array.isArray(guardians) || guardians.length === 0) return NextResponse.json({ message: 'Tambahkan minimal satu orang tua/wali.' }, { status: 400 });
    if (guardians.filter((g: any) => g.isPrimary).length > 1) return NextResponse.json({ message: 'Hanya boleh ada satu kontak utama.' }, { status: 400 });
    const user = await (await import('@/lib/auth')).getCurrentUser(); if (!user) return NextResponse.json({ message: 'Sesi login tidak ditemukan.' }, { status: 401 });
    const result = await prisma.$transaction(async (tx) => {
      const links: { parentId: string; isPrimary: boolean; relation: string }[] = [];
      for (const guardian of guardians) {
        const relation = ['AYAH', 'IBU', 'WALI', 'LAINNYA'].includes(String(guardian.relation).toUpperCase()) ? String(guardian.relation).toUpperCase() : 'LAINNYA';
        let parentId = guardian.parentId;
        if (guardian.type === 'new' || !parentId) {
          if (!guardian.parent?.name?.trim() || !guardian.parent?.phone?.trim()) throw new Error('Nama dan nomor WhatsApp orang tua baru wajib diisi.');
          const phone = normalizePhone(guardian.parent.phone);
          const existing = await tx.parent.findUnique({ where: { phone } });
          if (existing) { const conflict: any = new Error(`Nomor WhatsApp ini sudah terdaftar atas nama ${existing.name}.`); conflict.code = 'PARENT_PHONE_EXISTS'; conflict.guardianClientId = guardian.clientId; conflict.existingParent = { id: existing.id, name: existing.name, phone: existing.phone }; throw conflict; }
          const parent = await tx.parent.create({ data: { name: guardian.parent.name.trim(), phone, email: guardian.parent.email?.trim() || null, dateOfBirth: guardian.parent.dateOfBirth ? new Date(guardian.parent.dateOfBirth) : null } }); parentId = parent.id;
        } else { const parent = await tx.parent.findUnique({ where: { id: parentId } }); if (!parent) throw new Error('Orang tua yang dipilih tidak ditemukan.'); }
        if (links.some((link) => link.parentId === parentId)) throw new Error('Orang tua/wali yang sama tidak dapat ditambahkan dua kali.');
        links.push({ parentId, relation, isPrimary: Boolean(guardian.isPrimary) });
      }
      const primary = links.some((l) => l.isPrimary) ? links : links.map((l, i) => ({ ...l, isPrimary: i === 0 }));
      const student = await tx.student.create({ data: { nis: s.nis.trim(), name: s.name.trim(), dateOfBirth: new Date(s.dateOfBirth), gender: s.gender?.trim() || null, classRoomId: s.classRoomId, notes: s.notes?.trim() || null, customSppAmount: s.customSppAmount === null || s.customSppAmount === undefined || s.customSppAmount === '' ? null : new Prisma.Decimal(s.customSppAmount), parents: { create: primary } }, include: { classRoom: true, parents: { include: { parent: true } } } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'CREATE_STUDENT', entity: 'Student', entityId: student.id, afterData: { nis: student.nis, name: student.name, guardians: primary } } });
      return student;
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) { if (e?.code === 'PARENT_PHONE_EXISTS') return NextResponse.json({ code: e.code, message: e.message, guardianClientId: e.guardianClientId, existingParent: e.existingParent }, { status: 409 }); return errorResponse(e); }
}
