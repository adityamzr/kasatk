export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, errorResponse } from '@/lib/api';
export async function PATCH(req:Request,{params}:{params:{id:string}}){const denied=await requirePermission('students.manage');if(denied)return denied;try{const b=await req.json();const item=await prisma.student.update({where:{id:params.id},data:{nis:b.nis?.trim(),name:b.name?.trim(),dateOfBirth:b.dateOfBirth?new Date(b.dateOfBirth):undefined,classRoomId:b.classRoomId,gender:b.gender?.trim()||null,notes:b.notes?.trim()||null,status:b.status}});return NextResponse.json(item)}catch(e){return errorResponse(e)}}
export async function DELETE(_req:Request,{params}:{params:{id:string}}){const denied=await requirePermission('students.manage');if(denied)return denied;try{return NextResponse.json(await prisma.student.update({where:{id:params.id},data:{status:'INACTIVE'}}))}catch(e){return errorResponse(e)}}
