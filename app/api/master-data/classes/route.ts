export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, errorResponse } from '@/lib/api';
export async function GET(){const denied=await requirePermission('students.manage');if(denied)return denied;try{return NextResponse.json(await prisma.classRoom.findMany({orderBy:[{isActive:'desc'},{name:'asc'}],include:{_count:{select:{students:true}}}}));}catch(e){return errorResponse(e)}}
export async function POST(req:Request){const denied=await requirePermission('students.manage');if(denied)return denied;try{const b=await req.json();if(!b.name?.trim())return NextResponse.json({message:'Nama kelas wajib diisi.'},{status:400});const item=await prisma.classRoom.create({data:{name:b.name.trim(),level:b.level?.trim()||null,academicYear:b.academicYear?.trim()||null}});return NextResponse.json(item,{status:201})}catch(e){return errorResponse(e)}}
