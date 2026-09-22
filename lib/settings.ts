import { z } from 'zod';
export const settingsSchema = z.object({
  schoolName: z.string().trim().min(1, 'Nama sekolah wajib diisi.').max(120),
  schoolAddress: z.string().trim().max(300).nullable().optional(),
  schoolPhone: z.string().trim().max(40).nullable().optional(),
  schoolEmail: z.union([z.string().trim().email('Format email tidak valid.').max(160), z.literal(''), z.null()]).optional(),
  defaultSppAmount: z.union([z.coerce.number().positive('Nominal SPP harus lebih dari nol.'), z.null()]),
  receiptPrefix: z.string().trim().min(1).max(12).regex(/^[A-Za-z0-9-]+$/).transform((value) => value.toUpperCase()),
  timezone: z.string().trim().min(1).max(80),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
