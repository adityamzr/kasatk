export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
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
    const arrears = openBills.reduce((sum, bill) => sum + Math.max(0, Number(bill.amount) - bill.allocations.reduce((n, item) => n + Number(item.amount), 0)), 0);
    const totalSavingsBalance = savingsStudents.reduce((sum, student) => sum + Number(student.savings[0]?.balanceAfter ?? 0), 0);
    return NextResponse.json({ activeStudents, cashInThisMonth: Number(payments._sum.amount ?? 0), totalArrears: arrears, totalSavingsBalance });
  } catch (error) { return errorResponse(error); }
}
