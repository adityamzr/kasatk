import { NextResponse } from 'next/server';
import { hasPermission } from './auth';
export async function requirePermission(permission: string) { if (!(await hasPermission(permission))) return NextResponse.json({ message: 'Anda tidak memiliki akses untuk tindakan ini.' }, { status: 403 }); return null; }
export function errorResponse(error: unknown) { console.error(error); if (error instanceof Error && !error.name.startsWith('Prisma')) return NextResponse.json({ message: error.message }, { status: 400 }); return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 }); }
