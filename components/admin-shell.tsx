'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { CircleCheck, LoaderCircle, GraduationCap, LayoutDashboard, LogOut, Menu, Banknote, ReceiptText, School, Settings, UserCog, UsersRound, History, FileBarChart, X, type LucideIcon } from 'lucide-react';

type Props = { children: React.ReactNode; user: { name: string; email: string; role: string }; permissions: string[]; schoolName?: string };
type NavItem = { href: string; label: string; icon: LucideIcon; permission?: string; group: string; disabled?: boolean };
const items: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view', group: '' },
  { href: '/admin/spp', label: 'SPP & Tagihan', icon: ReceiptText, permission: 'billing.manage', group: 'KEUANGAN' },
  { href: '/admin/savings', label: 'Tabungan Siswa', icon: Banknote, permission: 'savings.manage', group: 'KEUANGAN' },
  { href: '/admin/students', label: 'Siswa', icon: GraduationCap, permission: 'students.manage', group: 'DATA SEKOLAH' },
  { href: '/admin/parents', label: 'Orang Tua / Wali', icon: UsersRound, permission: 'students.manage', group: 'DATA SEKOLAH' },
  { href: '/admin/classes', label: 'Kelas', icon: School, permission: 'students.manage', group: 'DATA SEKOLAH' },
  { href: '/admin/users', label: 'Pengguna', icon: UserCog, permission: 'users.manage', group: 'SISTEM' },
  { href: '/admin/reports', label: 'Laporan', icon: FileBarChart, permission: 'reports.view', group: 'KEUANGAN' },
  { href: '/admin/audit', label: 'Audit Aktivitas', icon: History, permission: 'users.manage', group: 'SISTEM' },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings, permission: 'settings.manage', group: 'SISTEM' },
];

export default function AdminShell({ children, user, permissions, schoolName = 'Administrasi Sekolah' }: Props) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false); const [loggingOut, setLoggingOut] = useState(false);
  const allowed = items.filter((item) => !item.permission || permissions.includes(item.permission));
  const initials = user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  async function logout() { if (loggingOut) return; setLoggingOut(true); try { const response = await fetch('/api/auth/logout', { method: 'POST' }); if (!response.ok) throw new Error('Logout gagal'); router.replace('/login'); router.refresh(); } catch { setLoggingOut(false); } }
  const active = (href: string) => href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
  return <div className="admin-shell">
    <div className={open ? 'mobile-overlay open' : 'mobile-overlay'} onClick={() => setOpen(false)} />
    <aside className={open ? 'admin-sidebar open' : 'admin-sidebar'}>
      <div className="brand"><img src="/logo-paud.jpg" alt="Logo PAUD" /><div><b>{schoolName}</b><span>PAUD Finance</span></div><button className="close-drawer" aria-label="Tutup menu" onClick={() => setOpen(false)}><X size={20} aria-hidden="true" /></button></div>
      <div className="school-pill"><span className="online-dot" /> Portal sekolah</div>
      <nav>{['', 'KEUANGAN', 'DATA SEKOLAH', 'SISTEM'].map((group) => <div key={group}>{group && <p className="nav-group">{group}</p>}{allowed.filter((item) => item.group === group).map((item) => { const Icon = item.icon; return item.disabled ? <div key={item.href} className="nav-disabled"><Icon size={17} strokeWidth={1.8} aria-hidden="true" /> <span>{item.label}</span><small>Segera hadir</small></div> : <Link key={item.href} href={item.href} className={active(item.href) ? 'active' : ''} onClick={() => setOpen(false)}><Icon size={17} strokeWidth={1.8} aria-hidden="true" /><span>{item.label}</span></Link>; })}</div>)}</nav>
      <div className="account-area"><div className="profile"><div className="avatar">{initials}</div><div><b>{user.name}</b><span>{user.role}</span></div></div><button className="logout-text" onClick={logout} disabled={loggingOut}>{loggingOut ? <LoaderCircle className="loading-spinner" size={16}/> : <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />}{loggingOut ? 'Keluar...' : 'Keluar'}</button></div>
    </aside>
    <section className="admin-main"><header className="admin-header"><button className="menu-toggle" aria-label="Buka menu" onClick={() => setOpen(true)}><Menu size={22} aria-hidden="true" /></button><div className="breadcrumb">Dashboard <span>/</span> {pathname === '/admin' ? 'Dashboard' : pathname.startsWith('/admin/spp') ? 'SPP & Tagihan' : pathname.startsWith('/admin/savings/') ? 'Tabungan Siswa / Detail Siswa' : pathname.startsWith('/admin/savings') ? 'Tabungan Siswa' : pathname.startsWith('/admin/students/new') ? 'Data Siswa / Tambah Siswa' : pathname.startsWith('/admin/students/') ? 'Data Siswa / Detail Siswa' : pathname.startsWith('/admin/students') ? 'Data Siswa' : pathname.startsWith('/admin/parents/') ? 'Orang Tua / Detail' : pathname.startsWith('/admin/parents') ? 'Orang Tua / Wali' : pathname.startsWith('/admin/classes') ? 'Kelas' : pathname.startsWith('/admin/users') ? 'Pengguna' : pathname.startsWith('/admin/settings') ? 'Pengaturan' : pathname.startsWith('/admin/reports') ? 'Laporan' : pathname.startsWith('/admin/audit') ? 'Audit Aktivitas' : 'Dashboard'}</div><div className="header-actions"><div className="user-chip"><div className="avatar small">{initials}</div><span>{user.name}</span></div></div></header><div className="admin-content">{children}</div></section>
  </div>;
}
