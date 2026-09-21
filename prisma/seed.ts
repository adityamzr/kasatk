import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissions = [
  ['dashboard.view', 'Melihat dashboard'],
  ['students.manage', 'Mengelola data siswa'],
  ['billing.manage', 'Mengelola tagihan'],
  ['payments.manage', 'Mencatat dan mengelola pembayaran'],
  ['savings.manage', 'Mencatat dan mengelola tabungan'],
  ['reports.view', 'Melihat dan mengekspor laporan'],
  ['users.manage', 'Mengelola pengguna dan permission'],
  ['transactions.cancel', 'Membatalkan transaksi'],
];

async function main() {
  await prisma.schoolSetting.upsert({
    where: { id: 1 },
    update: { defaultSppAmount: 250000 },
    create: { schoolName: 'PAUD Cerdas Ceria', receiptPrefix: 'SPP', defaultSppAmount: 250000 },
  });

  const permissionMap = new Map<string, string>();
  for (const [key, description] of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
    permissionMap.set(key, permission.id);
  }

  const roleDefinitions = [
    { name: 'SUPER_ADMIN', description: 'Akses penuh aplikasi', permissions: permissions.map(([key]) => key) },
    { name: 'BENDAHARA', description: 'Mengelola pembayaran dan tabungan', permissions: ['dashboard.view', 'students.manage', 'billing.manage', 'payments.manage', 'savings.manage', 'reports.view'] },
    { name: 'GURU', description: 'Akses operasional sesuai permission', permissions: ['dashboard.view', 'students.manage', 'payments.manage', 'savings.manage'] },
  ];

  for (const definition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: definition.name },
      update: { description: definition.description },
      create: { name: definition.name, description: definition.description },
    });
    for (const key of definition.permissions) {
      const permissionId = permissionMap.get(key);
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId } },
          update: {},
          create: { roleId: role.id, permissionId },
        });
      }
    }
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'SUPER_ADMIN' } });
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cerdasceria.sch.id' },
    update: { name: 'Administrator', username: 'admin', passwordHash: await bcrypt.hash(adminPassword, 12), status: 'ACTIVE' },
    create: { name: 'Administrator', email: 'admin@cerdasceria.sch.id', username: 'admin', passwordHash: await bcrypt.hash(adminPassword, 12) },
  });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } }, update: {}, create: { userId: admin.id, roleId: adminRole.id } });

  const kelasA = await prisma.classRoom.upsert({ where: { name_academicYear: { name: 'Kelompok A', academicYear: '2026/2027' } }, update: {}, create: { name: 'Kelompok A', academicYear: '2026/2027' } });
  const kelasB = await prisma.classRoom.upsert({ where: { name_academicYear: { name: 'Kelompok B', academicYear: '2026/2027' } }, update: {}, create: { name: 'Kelompok B', academicYear: '2026/2027' } });

  const parentA = await prisma.parent.upsert({ where: { phone: '+628111111111' }, update: { name: 'Budi Santoso' }, create: { name: 'Budi Santoso', phone: '+628111111111', dateOfBirth: new Date('1985-04-12') } });
  const parentB = await prisma.parent.upsert({ where: { phone: '+628122222222' }, update: { name: 'Siti Rahma' }, create: { name: 'Siti Rahma', phone: '+628122222222', dateOfBirth: new Date('1987-08-23') } });
  const studentA = await prisma.student.upsert({ where: { nis: '26001' }, update: { name: 'Aisyah Putri', classRoomId: kelasB.id, customSppAmount: null }, create: { nis: '26001', name: 'Aisyah Putri', dateOfBirth: new Date('2020-02-10'), classRoomId: kelasB.id, parents: { create: { parentId: parentA.id, isPrimary: true, relation: 'Ayah' } } } });
  const studentB = await prisma.student.upsert({ where: { nis: '26002' }, update: { name: 'Rafa Pratama', classRoomId: kelasA.id, customSppAmount: 150000 }, create: { nis: '26002', name: 'Rafa Pratama', dateOfBirth: new Date('2020-07-18'), classRoomId: kelasA.id, customSppAmount: 150000, parents: { create: { parentId: parentB.id, isPrimary: true, relation: 'Ibu' } } } });
  await prisma.studentParent.upsert({ where: { studentId_parentId: { studentId: studentA.id, parentId: parentA.id } }, update: {}, create: { studentId: studentA.id, parentId: parentA.id, isPrimary: true, relation: 'Ayah' } });
  const billA = await prisma.bill.upsert({ where: { code: 'SPP-2026-09-26001' }, update: {}, create: { studentId: studentA.id, classRoomId: kelasB.id, createdById: admin.id, code: 'SPP-2026-09-26001', title: 'SPP September 2026', periodLabel: 'September 2026', billingMonth: 9, billingYear: 2026, originalAmount: 250000, amount: 250000, status: 'UNPAID' } });
  const billB = await prisma.bill.upsert({ where: { code: 'SPP-2026-09-26002' }, update: {}, create: { studentId: studentB.id, classRoomId: kelasA.id, createdById: admin.id, code: 'SPP-2026-09-26002', title: 'SPP September 2026', periodLabel: 'September 2026', billingMonth: 9, billingYear: 2026, originalAmount: 150000, amount: 150000, status: 'PAID' } });
  const existingPayment = await prisma.payment.findUnique({ where: { paymentNumber: 'SPP-2026-000001' } });
  if (!existingPayment) {
    const seededPayment = await prisma.payment.create({ data: { studentId: studentB.id, recordedById: admin.id, paymentNumber: 'SPP-2026-000001', method: 'TRANSFER', amount: 150000, allocations: { create: { billId: billB.id, amount: 150000 } } } });
    await prisma.receipt.create({ data: { receiptNumber: 'SPP-2026-000001', paymentId: seededPayment.id, issuedById: admin.id } });
    await prisma.auditLog.create({ data: { userId: admin.id, action: 'SEED_CREATE_PAYMENT', entity: 'Payment', entityId: seededPayment.id, afterData: { paymentNumber: seededPayment.paymentNumber, amount: 150000 } } });
  }
  console.log(`Seed selesai: ${kelasA.name}, ${kelasB.name}, ${permissions.length} permission`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
