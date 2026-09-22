import { Prisma } from '@prisma/client';

type Tx = any;
type AllocationInput = { billId: string; amount: string|number };
export async function createSppPayment(tx: Tx, input: { studentId:string; method:'CASH'|'TRANSFER'; notes?:string|null; paymentDate?:Date; allocations:AllocationInput[]; recordedById:string }) {
  const student=await tx.student.findUnique({where:{id:input.studentId}}); if(!student||student.status!=='ACTIVE') throw new Error('Siswa tidak ditemukan atau tidak aktif.');
  const ids=input.allocations.map(x=>x.billId); const bills=await tx.bill.findMany({where:{id:{in:ids},studentId:student.id},include:{allocations:{where:{payment:{status:'COMPLETED'}},select:{amount:true}}}}); if(bills.length!==ids.length) throw new Error('Tagihan tidak valid untuk siswa ini.');
  let total=new Prisma.Decimal(0); const allocationData:{billId:string;amount:Prisma.Decimal;remaining:Prisma.Decimal}[]=[];
  for(const requested of input.allocations){const bill=bills.find((x:any)=>x.id===requested.billId);if(!bill)throw new Error('Tagihan tidak ditemukan.');if(bill.status==='PAID'||bill.status==='CANCELLED')throw new Error('Tagihan sudah lunas atau dibatalkan.');const paid=bill.allocations.reduce((n:any,a:any)=>n.add(a.amount),new Prisma.Decimal(0));const remaining=bill.amount.sub(paid);const amount=new Prisma.Decimal(requested.amount);if(amount.lte(0))throw new Error('Nominal pembayaran harus lebih dari nol.');if(amount.gt(remaining))throw new Error('Nominal pembayaran melebihi sisa tagihan.');total=total.add(amount);allocationData.push({billId:bill.id,amount,remaining:remaining.sub(amount)})}
  if(total.lte(0))throw new Error('Total pembayaran harus lebih dari nol.');
  const setting=await tx.schoolSetting.update({where:{id:1},data:{receiptSequence:{increment:1}}});const number=`SPP-${new Date().getFullYear()}-${String(setting.receiptSequence).padStart(6,'0')}`;
  const payment=await tx.payment.create({data:{studentId:student.id,recordedById:input.recordedById,paymentNumber:number,paymentDate:input.paymentDate,method:input.method,amount:total,notes:input.notes||null,allocations:{create:allocationData.map(a=>({billId:a.billId,amount:a.amount}))}}});
  for(const a of allocationData){const bill=bills.find((x:any)=>x.id===a.billId)!;const paid=bill.allocations.reduce((n:any,x:any)=>n.add(x.amount),new Prisma.Decimal(0)).add(a.amount);await tx.bill.update({where:{id:a.billId},data:{status:paid.gte(bill.amount)?'PAID':'PARTIAL'}})}
  const receipt=await tx.receipt.create({data:{receiptNumber:number,paymentId:payment.id,issuedById:input.recordedById}});await tx.auditLog.create({data:{userId:input.recordedById,action:'CREATE_PAYMENT',entity:'Payment',entityId:payment.id,afterData:{paymentNumber:number,studentId:student.id,amount:total.toString(),method:input.method,allocations:allocationData.map(a=>({billId:a.billId,amount:a.amount.toString()}))}}});return{payment,receipt,total};
}
