import { NextResponse } from 'next/server';
import { getOwnedStudent, getParentSession, serializeDecimal } from '@/lib/parent-portal';
import { prisma } from '@/lib/prisma';
import { monthName } from '@/lib/billing';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const session = await getParentSession(); if (!session) return NextResponse.json({ message: 'Sesi Anda telah berakhir.' }, { status: 401 });
  const studentId = new URL(request.url).searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ message: 'Siswa belum dipilih.' }, { status: 400 });
  const student = await getOwnedStudent(session.parentId, studentId); if (!student) return NextResponse.json({ message: 'Data anak tidak ditemukan.' }, { status: 404 });
  const now = new Date();
  const bill = await prisma.bill.findUnique({ where: { studentId_billingMonth_billingYear: { studentId, billingMonth: now.getMonth() + 1, billingYear: now.getFullYear() } }, include: { allocations: { where: { payment: { status: 'COMPLETED' } }, include: { payment: { include: { receipt: true } } } } } });
  const latest = await prisma.savingsTransaction.findFirst({ where: { studentId, status: 'COMPLETED' }, orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }] });
  const [payments, savings] = await Promise.all([
    prisma.payment.findMany({ where: { studentId, status: 'COMPLETED' }, orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }], take: 5, include: { receipt: true } }),
    prisma.savingsTransaction.findMany({ where: { studentId }, orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }], take: 5 })
  ]);
  const activities = [...payments.map((p) => ({ id: p.id, kind: 'SPP', date: p.paymentDate, label: `Pembayaran SPP${bill?.billingMonth ? ` ${monthName(bill.billingMonth)}` : ''}`, amount: serializeDecimal(p.amount), direction: 'positive' as const, receiptNumber: p.receipt?.receiptNumber ?? null })), ...savings.map((t) => ({ id: t.id, kind: 'SAVINGS', date: t.transactionDate, label: t.type === 'DEPOSIT' ? 'Setoran tabungan' : t.type === 'WITHDRAWAL' ? 'Penarikan tabungan' : t.type === 'DEPOSIT_CORRECTION' ? 'Koreksi setoran' : 'Koreksi penarikan', amount: serializeDecimal(t.amount), direction: ['DEPOSIT', 'WITHDRAWAL_CORRECTION'].includes(t.type) ? 'positive' as const : 'negative' as const, receiptNumber: null }))].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5);
  const paidAmount = bill?.allocations.reduce((sum, item) => sum.add(item.amount), new (require('@prisma/client').Prisma.Decimal)(0)) ?? new (require('@prisma/client').Prisma.Decimal)(0);
  return NextResponse.json({ student: { id: student.id, name: student.name, nis: student.nis, className: student.classRoom.name }, currentMonthSPP: bill ? { month: now.getMonth() + 1, monthName: monthName(now.getMonth() + 1), amount: serializeDecimal(bill.amount), paidAmount: paidAmount.toString(), remaining: bill.amount.sub(paidAmount).toString(), status: bill.status, payments: bill.allocations.map((a) => ({ date: a.payment.paymentDate, receiptNumber: a.payment.receipt?.receiptNumber ?? null })) } : null, currentSavingsBalance: serializeDecimal(latest?.balanceAfter), recentActivities: activities });
}
