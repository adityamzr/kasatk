export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET(){try{return NextResponse.json(await prisma.role.findMany({orderBy:{name:'asc'},select:{id:true,name:true,description:true}}));}catch(e){console.error(e);return NextResponse.json({message:'Terjadi kesalahan pada server.'},{status:500})}}
