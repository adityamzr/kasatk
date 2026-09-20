export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requirePermission, errorResponse } from '@/lib/api';
export async function GET(){const denied=await requirePermission('users.manage');if(denied)return denied;try{return NextResponse.json(await prisma.user.findMany({orderBy:{name:'asc'},select:{id:true,name:true,email:true,username:true,status:true,roles:{include:{role:true}}}}));}catch(e){return errorResponse(e)}}
export async function POST(req:Request){const denied=await requirePermission('users.manage');if(denied)return denied;try{const b=await req.json();if(!b.name?.trim()||!b.email?.trim()||!b.password||!b.roleId)return NextResponse.json({message:'Nama, email, password, dan role wajib diisi.'},{status:400});const user=await prisma.user.create({data:{name:b.name.trim(),email:b.email.trim().toLowerCase(),username:b.username?.trim()||null,passwordHash:await bcrypt.hash(b.password,12),roles:{create:{roleId:b.roleId}}},select:{id:true,name:true,email:true,username:true}});return NextResponse.json(user,{status:201})}catch(e){return errorResponse(e)}}
