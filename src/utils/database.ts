import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// 创建Prisma客户端实例，配置连接池
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: config.database.url
    }
  },
  // Prisma 连接池配置（多实例部署重要）
  __internal: {
    engine: {
      connectionLimit: config.database.connectionLimit,
      connectTimeout: config.database.connectTimeout,
      queryTimeout: config.database.queryTimeout,
      poolTimeout: config.database.poolTimeout,
    }
  }
} as any); // 使用 any 类型因为 __internal 是内部API

// 数据库连接测试
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('🗄️  Database connected successfully');
    // 执行健康检查查询
    await healthCheck();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
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
      console.warn(`⚠️  Database health check slow: ${duration}ms`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
};


// 优雅关闭数据库连接
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('🗄️  Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
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
