export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, errorResponse } from '@/lib/api';

export async function GET() {
  const denied = await requirePermission('dashboard.view');
  if (denied) return denied;
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'COMPLETED' }, orderBy: { paymentDate: 'desc' }, take: 6,
      select: { id: true, paymentNumber: true, paymentDate: true, amount: true, method: true, student: { select: { name: true, classRoom: { select: { name: true } } } } },
    });
    return NextResponse.json(payments.map((payment) => ({ ...payment, amount: payment.amount.toString() })));
  } catch (error) { return errorResponse(error); }
}
