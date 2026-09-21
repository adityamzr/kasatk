import { z } from 'zod';

export const billingQuerySchema = z.object({
  studentId: z.string().optional(), classRoomId: z.string().optional(), year: z.coerce.number().int().min(2000).max(2200).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(), status: z.enum(['UNPAID','PARTIAL','PAID','CANCELLED']).optional(), search: z.string().trim().optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export const generateBillsSchema = z.object({ year: z.coerce.number().int().min(2000).max(2200), month: z.coerce.number().int().min(1).max(12), classRoomId: z.string().optional() });
export const paymentSchema = z.object({ studentId: z.string().min(1), method: z.enum(['CASH','TRANSFER']), notes: z.string().trim().max(500).optional(), allocations: z.array(z.object({ billId: z.string().min(1), amount: z.coerce.number().positive() })).min(1) });
export const cancelSchema = z.object({ reason: z.string().trim().min(3).max(500) });
export const monthName = (month:number) => ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][month] ?? '';
