import { Prisma } from '@prisma/client';
export function getEffectiveSppAmount(student: { customSppAmount: Prisma.Decimal | null }, setting: { defaultSppAmount: Prisma.Decimal | null } | null) {
  return student.customSppAmount ?? setting?.defaultSppAmount ?? null;
}
