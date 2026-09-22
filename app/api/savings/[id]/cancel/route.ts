export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requirePermission, errorResponse } from '@/lib/api';
import { savingsCancelSchema } from '@/lib/savings';

async function cancelWithRetry(id: string, reason: string, userId: string, attempt = 0): Promise<{ transactionNumber: string; balanceAfter: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const original = await tx.savingsTransaction.findUnique({ where: { id } });
      if (!original) throw new Error('Transaksi tidak ditemukan.');
      if (original.status === 'CANCELLED') throw new Error('Transaksi sudah dibatalkan.');
      if (original.type === 'DEPOSIT_CORRECTION' || original.type === 'WITHDRAWAL_CORRECTION') throw new Error('Transaksi koreksi tidak dapat dibatalkan ulang.');

      const latest = await tx.savingsTransaction.findFirst({ where: { studentId: original.studentId, status: 'COMPLETED' }, orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }] });
      const current = latest?.balanceAfter ?? new Prisma.Decimal(0);
      const correctionType = original.type === 'DEPOSIT' ? 'DEPOSIT_CORRECTION' : 'WITHDRAWAL_CORRECTION';
      const next = correctionType === 'DEPOSIT_CORRECTION' ? current.sub(original.amount) : current.add(original.amount);
      if (next.lessThan(0)) throw new Error('Setoran tidak dapat dibatalkan karena saldo saat ini tidak mencukupi untuk koreksi.');

      const setting = await tx.schoolSetting.update({ where: { id: 1 }, data: { receiptSequence: { increment: 1 } } });
      const number = `TAB-${new Date().getFullYear()}-${String(setting.receiptSequence).padStart(6, '0')}`;
      const correction = await tx.savingsTransaction.create({ data: { studentId: original.studentId, recordedById: userId, transactionNumber: number, type: correctionType, amount: original.amount, balanceAfter: next, notes: `Koreksi pembatalan ${original.transactionNumber}: ${reason}` } });
      await tx.receipt.create({ data: { receiptNumber: number, savingsId: correction.id, issuedById: userId } });
      await tx.savingsTransaction.update({ where: { id: original.id }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason } });
      await tx.auditLog.create({ data: { userId, action: 'CANCEL_SAVINGS_TRANSACTION', entity: 'SavingsTransaction', entityId: original.id, beforeData: { status: original.status, transactionNumber: original.transactionNumber }, afterData: { status: 'CANCELLED', correctionTransactionNumber: number, reason } } });
      return { transactionNumber: number, balanceAfter: next.toString() };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error: any) {
    if (error?.code === 'P2034' && attempt < 2) return cancelWithRetry(id, reason, userId, attempt + 1);
    throw error;
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const denied = await requirePermission('transactions.cancel'); if (denied) return denied;
  try { const user = await getCurrentUser(); if (!user) return NextResponse.json({ message: 'Sesi login tidak ditemukan.' }, { status: 401 }); const { reason } = savingsCancelSchema.parse(await req.json()); const result = await cancelWithRetry(params.id, reason, user.id); return NextResponse.json({ success: true, ...result }); } catch (error) { return errorResponse(error); }
}
