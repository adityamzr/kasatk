import { z } from 'zod';
export const savingsCreateSchema = z.object({ studentId: z.string().min(1), type: z.enum(['DEPOSIT','WITHDRAWAL']), amount: z.coerce.number().positive(), notes: z.string().trim().max(500).optional() });
export const savingsCancelSchema = z.object({ reason: z.string().trim().min(3).max(500) });
export const savingsTypeLabel: Record<string,string> = { DEPOSIT:'Setoran', WITHDRAWAL:'Penarikan', DEPOSIT_CORRECTION:'Koreksi setoran', WITHDRAWAL_CORRECTION:'Koreksi penarikan' };
