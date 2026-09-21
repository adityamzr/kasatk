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

  console.log(`Seed selesai: ${kelasA.name}, ${kelasB.name}, ${permissions.length} permission`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
