export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, errorResponse } from '@/lib/api';
export async function GET(){try{return NextResponse.json(await prisma.student.findMany({orderBy:{name:'asc'},include:{classRoom:true,parents:{include:{parent:true}}}}));}catch(e){return errorResponse(e)}}
export async function POST(req:Request){const denied=await requirePermission('students.manage');if(denied)return denied;try{const b=await req.json();if(!b.nis?.trim()||!b.name?.trim()||!b.dateOfBirth||!b.classRoomId)return NextResponse.json({message:'NIS, nama, tanggal lahir, dan kelas wajib diisi.'},{status:400});const student=await prisma.student.create({data:{nis:b.nis.trim(),name:b.name.trim(),dateOfBirth:new Date(b.dateOfBirth),gender:b.gender?.trim()||null,classRoomId:b.classRoomId,notes:b.notes?.trim()||null,status:'ACTIVE',parents:b.parentId?{create:{parentId:b.parentId,isPrimary:true,relation:b.relation?.trim()||'Wali'}}:undefined},include:{classRoom:true,parents:{include:{parent:true}}}});return NextResponse.json(student,{status:201})}catch(e){return errorResponse(e)}}
