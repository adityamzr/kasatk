export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, errorResponse } from '@/lib/api';
import { normalizePhone } from '@/lib/phone';
export async function GET(){const denied=await requirePermission('students.manage');if(denied)return denied;try{return NextResponse.json(await prisma.parent.findMany({orderBy:{name:'asc'},include:{students:{include:{student:{select:{id:true,name:true,nis:true}}}}}}));}catch(e){return errorResponse(e)}}
export async function POST(req:Request){const denied=await requirePermission('students.manage');if(denied)return denied;try{const b=await req.json();if(!b.name?.trim()||!b.phone?.trim())return NextResponse.json({message:'Nama dan nomor WhatsApp wajib diisi.'},{status:400});const item=await prisma.parent.create({data:{name:b.name.trim(),phone:normalizePhone(b.phone),email:b.email?.trim()||null,address:b.address?.trim()||null,dateOfBirth:b.dateOfBirth?new Date(b.dateOfBirth):null}});return NextResponse.json(item,{status:201})}catch(e){return errorResponse(e)}}
