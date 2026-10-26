import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
async function main() {
  const codes = ['dashboard:read', 'user:read', 'content:manage', 'growth:manage', 'mall:manage', 'system:manage'];
  await Promise.all(codes.map((code) => prisma.permission.upsert({
    where: { code }, update: {}, create: { code, name: code }
  })));
  const role = await prisma.role.upsert({ where: { code: 'SUPER_ADMIN' }, update: {}, create: { code: 'SUPER_ADMIN', name: '超级管理员' } });
  const permissions = await prisma.permission.findMany({ where: { code: { in: codes } } });
  await prisma.rolePermission.createMany({ data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })), skipDuplicates: true });
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@wenxiaoxian.local').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const admin = await prisma.adminUser.upsert({ where: { email }, update: {}, create: { email, displayName: '本地超级管理员', passwordHash: await argon2.hash(password) } });
  await prisma.adminUserRole.createMany({ data: [{ adminUserId: admin.id, roleId: role.id }], skipDuplicates: true });
}
main().finally(() => prisma.$disconnect());
