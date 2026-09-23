'use client';
import { useEffect, useState } from 'react';
import { LoaderCircle, LogOut, UserRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WaliAccount(){
  const router=useRouter(),params=useSearchParams();const[data,setData]=useState<any>(null),[loading,setLoading]=useState(true),[loggingOut,setLoggingOut]=useState(false),[error,setError]=useState('');
  useEffect(()=>{fetch('/api/wali/me').then(async r=>{if(r.status===401){router.replace('/wali/login');return null}const d=await r.json();if(!r.ok)throw Error(d.message);return d}).then(d=>{if(d)setData(d)}).catch(e=>setError(e.message||'Data akun gagal dimuat.')).finally(()=>setLoading(false))},[router,params]);
  async function logout(){if(loggingOut)return;setLoggingOut(true);try{const r=await fetch('/api/auth/parent-logout',{method:'POST'});if(!r.ok)throw Error();router.replace('/wali/login')}catch{setLoggingOut(false);setError('Tidak dapat keluar dari akun.')}}
  if(loading)return <div className="parent-loading"><LoaderCircle className="loading-spinner" size={22}/> Memuat akun...</div>;
  if(error)return <section className="parent-error">{error}</section>;
  return <div className="parent-page parent-account-page"><div className="parent-page-title"><div><p className="parent-eyebrow">AKUN ORANG TUA / WALI</p><h1>Akun</h1><small>Informasi akun dan anak yang terhubung.</small></div></div><section className="parent-account-card"><div className="parent-account-icon"><UserRound size={22}/></div><div className="parent-account-info"><span>Nama orang tua/wali</span><b>{data.parent.name}</b><span>Nomor WhatsApp</span><b>{data.parent.phone}</b></div></section><section className="parent-connected-card"><h2>Anak terhubung</h2>{data.students?.length?data.students.map((child:any)=><div className="parent-connected-child" key={child.id}><span><b>{child.name}</b><small>{child.className}</small></span><em className="status-badge neutral">Terhubung</em></div>):<p className="parent-empty">Belum ada anak yang terhubung.</p>}</section><button className="parent-account-logout" onClick={logout} disabled={loggingOut}>{loggingOut?<LoaderCircle className="loading-spinner" size={17}/>:<LogOut size={17}/>} {loggingOut?'Keluar...':'Keluar dari akun'}</button></div>
}
