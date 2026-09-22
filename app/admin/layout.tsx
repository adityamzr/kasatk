import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminShell from '@/components/admin-shell';
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const user=await getCurrentUser(); if(!user)redirect('/login'); const [setting]=await Promise.all([prisma.schoolSetting.findUnique({where:{id:1},select:{schoolName:true}})]); const permissions=Array.from(new Set(user.roles.flatMap(item=>item.role.permissions.map(permission=>permission.permission.key)))); const role=user.roles[0]?.role.name??'USER'; return <AdminShell user={{name:user.name,email:user.email,role}} permissions={permissions} schoolName={setting?.schoolName||'Administrasi Sekolah'}>{children}</AdminShell> }
