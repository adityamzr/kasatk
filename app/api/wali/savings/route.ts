import { NextResponse } from 'next/server';
import { getOwnedStudent, getParentSession } from '@/lib/parent-portal';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const session = await getParentSession(); if (!session) return NextResponse.json({ message: 'Sesi Anda telah berakhir.' }, { status: 401 });
  const studentId = new URL(request.url).searchParams.get('studentId'); if (!studentId) return NextResponse.json({ message: 'Siswa belum dipilih.' }, { status: 400 });
  const student = await getOwnedStudent(session.parentId, studentId); if (!student) return NextResponse.json({ message: 'Data anak tidak ditemukan.' }, { status: 404 });
  const transactions = await prisma.savingsTransaction.findMany({ where: { studentId }, orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }], take: 100 });
  const latest = transactions.find((transaction) => transaction.status === 'COMPLETED');
  return NextResponse.json({ student: { id: student.id, name: student.name, className: student.classRoom.name }, balance: latest?.balanceAfter.toString() ?? '0', transactions: transactions.map((transaction) => ({ transactionNumber: transaction.transactionNumber, transactionDate: transaction.transactionDate, type: transaction.type, amount: transaction.amount.toString(), balanceAfter: transaction.balanceAfter.toString(), status: transaction.status })) });
}
