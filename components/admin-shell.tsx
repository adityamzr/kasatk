'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = { children: React.ReactNode; user: { name: string; email: string; role: string }; permissions: string[] };
const items = [
  { href: '/admin', label: 'Dashboard', icon: '⌂', permission: 'dashboard.view', group: '' },
  { href: '/admin/spp', label: 'SPP & Tagihan', icon: '▣', permission: 'billing.manage', group: 'KEUANGAN' },
  { href: '/admin/master-data', label: 'Data Siswa', icon: '♧', permission: 'students.manage', group: 'DATA' },
  { href: '/admin/master-data?tab=users', label: 'Pengguna', icon: '◎', permission: 'users.manage', group: 'SISTEM' },
];

export default function AdminShell({ children, user, permissions }: Props) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false); const [loggingOut, setLoggingOut] = useState(false);
  const allowed = items.filter((item) => permissions.includes(item.permission));
  const initials = user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  async function logout() { setLoggingOut(true); await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login'); router.refresh(); }
  return <div className="admin-shell"><div className={open?'mobile-overlay open':'mobile-overlay'} onClick={()=>setOpen(false)}/><aside className={open?'admin-sidebar open':'admin-sidebar'}><div className="brand"><img src="/logo-paud.jpg"/><div><b>Cerdas Ceria</b><span>PAUD Finance</span></div><button className="close-drawer" onClick={()=>setOpen(false)}>×</button></div><div className="school-pill"><span className="online-dot"/> Portal sekolah <strong>●</strong></div><nav>{['','KEUANGAN','DATA','SISTEM'].map((group)=><div key={group}>{group&&<p className="nav-group">{group}</p>}{allowed.filter((item)=>item.group===group).map((item)=><Link key={item.href} href={item.href} className={(pathname===item.href.split('?')[0]||item.href==='/admin'&&pathname==='/admin')?'active':''} onClick={()=>setOpen(false)}><i>{item.icon}</i>{item.label}</Link>)}</div>)}</nav><div className="sidebar-bottom"><button className="settings-disabled"><i>⚙</i> Pengaturan <small>Segera hadir</small></button><div className="profile"><div className="avatar">{initials}</div><div><b>{user.name}</b><span>{user.role}</span></div><button className="logout-icon" title="Keluar" onClick={logout} disabled={loggingOut}>↪</button></div><button className="logout-text" onClick={logout} disabled={loggingOut}>{loggingOut?'Keluar...':'Keluar dari aplikasi'}</button></div></aside><section className="admin-main"><header className="admin-header"><button className="menu-toggle" onClick={()=>setOpen(true)}>☰</button><div className="breadcrumb">Beranda <span>/</span> {pathname==='/admin'?'Dashboard':pathname.startsWith('/admin/spp')?'SPP & Tagihan':'Master Data'}</div><div className="header-actions"><div className="user-chip"><div className="avatar small">{initials}</div><span>{user.name}</span></div></div></header><div className="admin-content">{children}</div></section></div>;
}
