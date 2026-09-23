export const dynamic='force-dynamic';
import {NextResponse} from 'next/server'; import {prisma} from '@/lib/prisma'; import {requirePermission,errorResponse} from '@/lib/api';
export async function GET(_r:Request,{params}:{params:{id:string}}){const d=await requirePermission('parents.view');if(d)return d;try{const p=await prisma.parent.findUnique({where:{id:params.id},include:{students:{include:{student:{include:{classRoom:true}}}}}});if(!p)return NextResponse.json({message:'Orang tua/wali tidak ditemukan.'},{status:404});return NextResponse.json(p)}catch(e){return errorResponse(e)}}
