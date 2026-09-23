export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, errorResponse } from '@/lib/api';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requirePermission('billing.view');
  if (denied) return denied;
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        student: { include: { classRoom: true, parents: { include: { parent: true } } } },
        allocations: { include: { payment: { select: { paymentNumber: true, paymentDate: true, status: true } } } },
      },
    });
    if (!bill) return NextResponse.json({ message: 'Tagihan tidak ditemukan.' }, { status: 404 });
    const paid = bill.allocations.filter((item) => item.payment.status === 'COMPLETED').reduce((sum, item) => sum + Number(item.amount), 0);
    return NextResponse.json({ ...bill, amount: bill.amount.toString(), paidAmount: paid, remainingAmount: Math.max(0, Number(bill.amount) - paid) });
  } catch (error) {
    return errorResponse(error);
  }
}
