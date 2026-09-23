export type PermissionDefinition={key:string;label:string;description:string;group:string;dependencies?:string[]};
export const PERMISSION_CATALOG:PermissionDefinition[]=[
{key:'dashboard.view',label:'Lihat Dashboard',description:'Melihat ringkasan dashboard sekolah.',group:'Dashboard'},
{key:'students.view',label:'Lihat data siswa',description:'Melihat daftar dan detail siswa.',group:'Siswa'},
{key:'students.manage',label:'Kelola data siswa',description:'Menambah dan mengubah data siswa.',group:'Siswa',dependencies:['students.view']},
{key:'parents.view',label:'Lihat orang tua / wali',description:'Melihat data orang tua dan wali siswa.',group:'Orang Tua / Wali'},
{key:'parents.manage',label:'Kelola orang tua / wali',description:'Menambah dan mengubah data orang tua / wali.',group:'Orang Tua / Wali',dependencies:['parents.view']},
{key:'classes.view',label:'Lihat kelas',description:'Melihat daftar kelas.',group:'Kelas'},
{key:'classes.manage',label:'Kelola kelas',description:'Menambah, mengubah, mengaktifkan, atau menonaktifkan kelas.',group:'Kelas',dependencies:['classes.view']},
{key:'billing.view',label:'Lihat SPP & tagihan',description:'Melihat tagihan SPP siswa.',group:'SPP & Tagihan'},
{key:'billing.generate',label:'Generate tagihan SPP',description:'Membuat tagihan SPP berdasarkan periode.',group:'SPP & Tagihan',dependencies:['billing.view']},
{key:'payments.view',label:'Lihat pembayaran SPP',description:'Melihat riwayat pembayaran SPP.',group:'Pembayaran SPP'},
{key:'payments.create',label:'Catat pembayaran SPP',description:'Mencatat pembayaran SPP satu siswa.',group:'Pembayaran SPP',dependencies:['payments.view','billing.view']},
{key:'payments.bulk',label:'Pembayaran massal SPP',description:'Memproses pembayaran SPP beberapa siswa sekaligus.',group:'Pembayaran SPP',dependencies:['payments.create','payments.view','billing.view']},
{key:'savings.view',label:'Lihat tabungan',description:'Melihat saldo dan riwayat tabungan siswa.',group:'Tabungan'},
{key:'savings.deposit',label:'Catat setoran',description:'Mencatat setoran tabungan.',group:'Tabungan',dependencies:['savings.view']},
{key:'savings.withdraw',label:'Catat penarikan',description:'Mencatat penarikan tabungan.',group:'Tabungan',dependencies:['savings.view']},
{key:'savings.bulk',label:'Transaksi tabungan massal',description:'Memproses setoran atau penarikan beberapa siswa.',group:'Tabungan',dependencies:['savings.view']},
{key:'transactions.cancel',label:'Batalkan transaksi',description:'Membatalkan transaksi keuangan yang diizinkan.',group:'Transaksi'},
{key:'reports.view',label:'Lihat laporan',description:'Melihat laporan SPP dan tabungan.',group:'Laporan'},
{key:'reports.export',label:'Export laporan',description:'Mengunduh laporan Excel dan PDF.',group:'Laporan',dependencies:['reports.view']},
{key:'users.view',label:'Lihat pengguna',description:'Melihat akun pengguna aplikasi.',group:'Pengguna'},
{key:'users.manage',label:'Kelola pengguna',description:'Membuat dan mengubah akun pengguna.',group:'Pengguna',dependencies:['users.view']},
{key:'roles.view',label:'Lihat role & akses',description:'Melihat role dan hak akses.',group:'Role & Akses'},
{key:'roles.manage',label:'Kelola role & akses',description:'Membuat, mengubah, dan menghapus role.',group:'Role & Akses',dependencies:['roles.view']},
{key:'audit.view',label:'Lihat Audit Aktivitas',description:'Melihat riwayat aktivitas sistem.',group:'Audit Aktivitas'},
{key:'settings.view',label:'Lihat pengaturan',description:'Melihat pengaturan sekolah.',group:'Pengaturan'},
{key:'settings.manage',label:'Kelola pengaturan',description:'Mengubah pengaturan sekolah.',group:'Pengaturan',dependencies:['settings.view']}
];
export const ALL_PERMISSION_KEYS=PERMISSION_CATALOG.map(x=>x.key);
export const PERMISSION_GROUPS=Array.from(PERMISSION_CATALOG.reduce((m,p)=>{if(!m.has(p.group))m.set(p.group,[]);m.get(p.group)!.push(p);return m},new Map<string,PermissionDefinition[]>())).map(([name,permissions])=>({name,permissions}));
export const DEFAULT_ROLE_PERMISSIONS:Record<string,string[]>={SUPER_ADMIN:ALL_PERMISSION_KEYS,BENDAHARA:['dashboard.view','students.view','parents.view','classes.view','billing.view','billing.generate','payments.view','payments.create','payments.bulk','savings.view','savings.deposit','savings.withdraw','savings.bulk','transactions.cancel','reports.view','reports.export'],GURU:['dashboard.view','students.view','students.manage','parents.view','parents.manage','classes.view','billing.view','payments.view','payments.create','savings.view','savings.deposit']};
export const LEGACY_PERMISSION_MAP:Record<string,string[]>={'dashboard.view':['dashboard.view'],'students.manage':['students.view','students.manage','parents.view','parents.manage','classes.view','classes.manage'],'billing.manage':['billing.view','billing.generate'],'payments.manage':['payments.view','payments.create','payments.bulk'],'savings.manage':['savings.view','savings.deposit','savings.withdraw','savings.bulk'],'reports.view':['reports.view','reports.export'],'users.manage':['users.view','users.manage','roles.view','roles.manage','audit.view'],'settings.manage':['settings.view','settings.manage'],'transactions.cancel':['transactions.cancel']};
const definitions=new Map(PERMISSION_CATALOG.map(x=>[x.key,x]));
export function isKnownPermission(key:string){return definitions.has(key)}
export function expandPermissionKeys(input:string[]){const selected=new Set(input.filter(isKnownPermission));let changed=true;while(changed){changed=false;for(const key of Array.from(selected)){for(const dep of definitions.get(key)?.dependencies??[]){if(!selected.has(dep)){selected.add(dep);changed=true}}}}return Array.from(selected)}
