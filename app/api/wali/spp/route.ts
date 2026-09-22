import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getOwnedStudent, getParentSession } from '@/lib/parent-portal';
import { prisma } from '@/lib/prisma';
import { monthName } from '@/lib/billing';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const session = await getParentSession(); if (!session) return NextResponse.json({ message: 'Sesi Anda telah berakhir.' }, { status: 401 });
  const url = new URL(request.url); const studentId = url.searchParams.get('studentId'); const year = Number(url.searchParams.get('year') ?? new Date().getFullYear());
  if (!studentId) return NextResponse.json({ message: 'Siswa belum dipilih.' }, { status: 400 });
  if (!Number.isInteger(year) || year < 2000 || year > 2200) return NextResponse.json({ message: 'Tahun tidak valid.' }, { status: 400 });
  const student = await getOwnedStudent(session.parentId, studentId); if (!student) return NextResponse.json({ message: 'Data anak tidak ditemukan.' }, { status: 404 });
  const bills = await prisma.bill.findMany({ where: { studentId, billingYear: year }, orderBy: { billingMonth: 'asc' }, include: { allocations: { where: { payment: { status: 'COMPLETED' } }, orderBy: { payment: { paymentDate: 'asc' } }, include: { payment: { include: { receipt: true } } } } } });
  const years = await prisma.bill.findMany({ where: { studentId, billingYear: { not: null } }, distinct: ['billingYear'], select: { billingYear: true }, orderBy: { billingYear: 'desc' } });
  return NextResponse.json({ student: { id: student.id, name: student.name, className: student.classRoom.name }, year, availableYears: years.map((x) => x.billingYear).filter((x): x is number => x !== null), months: bills.map((bill) => { const paid = bill.allocations.reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0)); return { month: bill.billingMonth, monthName: monthName(bill.billingMonth ?? 0), amount: bill.amount.toString(), paidAmount: paid.toString(), remaining: bill.amount.sub(paid).toString(), status: bill.status, payments: bill.allocations.map((allocation) => ({ date: allocation.payment.paymentDate, amount: allocation.amount.toString(), receiptNumber: allocation.payment.receipt?.receiptNumber ?? null })) }; }) });
}
