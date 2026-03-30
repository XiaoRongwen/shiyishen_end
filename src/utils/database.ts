import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// 创建Prisma客户端实例
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: config.database.url
    }
  }
});

// 数据库连接测试
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('🗄️  数据库连接成功');
    await healthCheck();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

// 数据库健康检查
export const healthCheck = async (): Promise<boolean> => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as health_check`;
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      console.warn(`⚠️  数据库响应较慢: ${duration}ms`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ 数据库健康检查失败:', error);
    return false;
  }
};

// 优雅关闭数据库连接
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('🗄️  数据库连接已关闭');
  } catch (error) {
    console.error('❌ 数据库断开连接失败:', error);
  }
};

// 导出Prisma客户端
export { prisma };

// 处理应用退出时的数据库连接清理
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
