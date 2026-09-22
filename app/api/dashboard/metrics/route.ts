export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission, errorResponse } from '@/lib/api';
export async function GET() {
  const denied = await requirePermission('dashboard.view');
  if (denied) return denied;
  try {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    const [activeStudents, payments, openBills, savingsStudents] = await prisma.$transaction([
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED', paymentDate: { gte: start } }, _sum: { amount: true } }),
      prisma.bill.findMany({ where: { status: { in: ['UNPAID', 'PARTIAL'] } }, select: { amount: true, allocations: { where: { payment: { status: 'COMPLETED' } }, select: { amount: true } } } }),
      prisma.student.findMany({ select: { savings: { where: { status: 'COMPLETED' }, orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }], take: 1, select: { balanceAfter: true } } } }),
    ]);
    const arrears = openBills.reduce((sum, bill) => { const paid = bill.allocations.reduce((n, item) => n.add(item.amount), new Prisma.Decimal(0)); const outstanding = bill.amount.sub(paid); return sum.add(outstanding.greaterThan(0) ? outstanding : new Prisma.Decimal(0)); }, new Prisma.Decimal(0));
    const totalSavingsBalance = savingsStudents.reduce((sum, student) => sum.add(student.savings[0]?.balanceAfter ?? new Prisma.Decimal(0)), new Prisma.Decimal(0));
    return NextResponse.json({ activeStudents, cashInThisMonth: Number(payments._sum.amount ?? 0), totalArrears: arrears.toString(), totalSavingsBalance: totalSavingsBalance.toString() });
  } catch (error) { return errorResponse(error); }
}
