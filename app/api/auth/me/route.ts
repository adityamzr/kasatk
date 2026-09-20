import { NextResponse } from 'next/server';
import { getCurrentParent, getCurrentUser } from '@/lib/auth';
export async function GET() {
  const [user, parent] = await Promise.all([getCurrentUser(), getCurrentParent()]);
  return NextResponse.json({ user: user ? { id: user.id, name: user.name, email: user.email, roles: user.roles.map((item) => item.role.name) } : null, parent: parent ? { id: parent.id, name: parent.name, phone: parent.phone } : null });
}
