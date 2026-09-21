import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminShell from '@/components/admin-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const permissions = Array.from(new Set(user.roles.flatMap((item) => item.role.permissions.map((permission) => permission.permission.key))));
  const role = user.roles[0]?.role.name ?? 'USER';
  return <AdminShell user={{ name: user.name, email: user.email, role }} permissions={permissions}>{children}</AdminShell>;
}
