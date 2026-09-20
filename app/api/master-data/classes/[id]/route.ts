export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, errorResponse } from '@/lib/api';
export async function PATCH(req:Request,{params}:{params:{id:string}}){const denied=await requirePermission('students.manage');if(denied)return denied;try{const b=await req.json();const item=await prisma.classRoom.update({where:{id:params.id},data:{name:b.name?.trim(),level:b.level?.trim()||null,academicYear:b.academicYear?.trim()||null,isActive:b.isActive}});return NextResponse.json(item)}catch(e){return errorResponse(e)}}
export async function DELETE(_req:Request,{params}:{params:{id:string}}){const denied=await requirePermission('students.manage');if(denied)return denied;try{const item=await prisma.classRoom.update({where:{id:params.id},data:{isActive:false}});return NextResponse.json(item)}catch(e){return errorResponse(e)}}
