import { redirect } from 'next/navigation';
import { getParentSession } from '@/lib/parent-portal';
import ParentShell from '@/components/parent-shell';
export default async function WaliLayout({ children }: { children: React.ReactNode }) {
  const session = await getParentSession();
  if (!session) redirect('/wali/login');
  return <ParentShell>{children}</ParentShell>;
}
