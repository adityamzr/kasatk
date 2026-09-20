import { NextResponse } from 'next/server';
import { hasPermission } from './auth';
export async function requirePermission(permission: string) {
  if (!(await hasPermission(permission))) return NextResponse.json({ message: 'Anda tidak memiliki akses untuk tindakan ini.' }, { status: 403 });
  return null;
}
export function errorResponse(error: unknown) {
  console.error(error);
  return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
}
