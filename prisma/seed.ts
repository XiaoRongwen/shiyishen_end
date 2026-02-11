import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建管理员账号...');

  // 检查是否已存在admin用户
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' }
  });

  if (existingAdmin) {
    console.log('管理员账号已存在，跳过创建');
    return;
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash('admin', 10);

  // 创建管理员账号
  const admin = await prisma.user.create({
    data: {
      name: 'admin',
      email: 'admin@admin.com',
      password: hashedPassword,
      isActive: true,
    },
  });

  console.log('管理员账号创建成功:');
  console.log('用户名: admin');
  console.log('邮箱: admin@admin.com');
  console.log('密码: admin');
  console.log('用户ID:', admin.id);
}

main()
  .catch((e) => {
    console.error('创建管理员账号失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
