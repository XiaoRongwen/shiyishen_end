import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '30d',
    issuer: 'food-supervision',
    audience: 'food-supervision-app'
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['http://localhost:3000'],
    credentials: true
  },

  // 微信配置
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET
  },

  // 阿里云 OSS 配置
  oss: {
    region: process.env.OSS_REGION || 'oss-cn-hangzhou',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET || '',
    cdnDomain: process.env.OSS_CDN_DOMAIN || '', // 可选，绑定了 CDN 域名则填写
  }
};

export const validateConfig = (): void => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'WECHAT_APP_ID',
    'WECHAT_APP_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missingVars.join(', ')}`);
  }

  if (config.jwt.secret && config.jwt.secret.length < 32) {
    console.warn('⚠️  为了更好的安全性，JWT_SECRET 应该至少32个字符长');
  }
};
