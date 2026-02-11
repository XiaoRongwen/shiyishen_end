import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// 导入路由
import apiRoutes from '@/routes/api';

// 导入数据库连接
import { connectDatabase } from '@/utils/database';

// 导入Redis连接
import { getRedisClient } from '@/utils/redis';

// 导入中间件
import { globalErrorHandler, notFoundHandler } from '@/middleware/errorHandler';

// 导入配置
import { config, validateConfig } from '@/config';

// 导入速率限制
// import { apiRateLimit } from '@/utils/rateLimiter';

const app = express();

// 中间件
app.use(helmet()); // 安全头

// CORS 配置 - 支持多个源
const allowedOrigins = config.cors.origin;
app.use(cors({
  origin: (origin, callback) => {
    // 允许没有 origin 的请求（如 Postman）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Captcha-Session'],
  exposedHeaders: ['X-Captcha-Session']
})); // 跨域配置
app.use(morgan('combined')); // 日志记录
// app.use(apiRateLimit); // 全局API速率限制
app.use(express.json({ limit: '10mb' })); // JSON 解析
app.use(express.urlencoded({ extended: true })); // URL 编码

// 静态文件服务（用于文件访问）Express 静态文件不会继承 cors() 中间件！
app.use(
  '/static',
  (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // CORP/CORB
    next();
  },
  express.static(config.upload.dir)
);


// 路由
app.use('/', apiRoutes);

// 404 处理器
app.use(notFoundHandler);

// 全局错误处理中间件
app.use(globalErrorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 首先验证配置
    validateConfig();
    console.log('✅ 配置验证成功');
    
    // 连接数据库
    await connectDatabase();
    
    // 连接Redis
    await getRedisClient();
    
    // 然后启动服务器
    app.listen(config.port, () => {
      console.log(`🚀 服务器运行在端口:${config.port}`);
      console.log(`📝 环境: ${config.nodeEnv}`);
      console.log(`🔗 健康检查: http://localhost:${config.port}/health`);
      console.log(`🔐 JWT 签发者: ${config.jwt.issuer}`);
    });
  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;

