import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Cerdas Ceria · Keuangan PAUD', description: 'Dashboard pengelolaan SPP dan tabungan siswa' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="id"><body>{children}</body></html>; }
