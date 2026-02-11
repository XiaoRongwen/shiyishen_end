import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 应用配置
 */
export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL,
    // 连接池配置（多实例部署必需）
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000', 10),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000', 10),
    poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '10000', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '600000', 10),
    maxLifetime: parseInt(process.env.DB_MAX_LIFETIME || '1800000', 10),
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'auth-backend',
    audience: process.env.JWT_AUDIENCE || 'auth-frontend'
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['http://localhost:3000'],
    credentials: true
  },

  // 密码配置
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '6', 10),
    maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '128', 10)
  },

  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10)
  },

  // bcrypt配置
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
  },

  // 文件上传配置
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      // 图片
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
      // 文档
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      // 文本
      'txt', 'md', 'csv',
      // 压缩文件
      'zip', 'rar', '7z',
      // 其他
      'json', 'xml'
    ]
  },

  // 微信配置
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET
  },

  // Redis配置
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10)
  },

  // Ollama配置
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT || '300000', 10), // 5分钟
    maxRetries: parseInt(process.env.OLLAMA_MAX_RETRIES || '3', 10),
    streamTimeout: parseInt(process.env.OLLAMA_STREAM_TIMEOUT || '120000', 10) // 2分钟
  },

  // 聊天配置
  chat: {
    maxMessageLength: parseInt(process.env.CHAT_MAX_MESSAGE_LENGTH || '10000', 10),
    contextMessageCount: parseInt(process.env.CHAT_CONTEXT_MESSAGE_COUNT || '10', 10)
  },

  // AI图片生成配置
  aiImage: {
    geminiApiUrl: process.env.GEMINI_API_URL || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    imageGenApiUrl: process.env.IMAGE_GEN_API_URL || '',
    imageGenApiKey: process.env.IMAGE_GEN_API_KEY || ''
  },

  // 邮件配置
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.EMAIL_HOST || 'smtp.qq.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    fromName: process.env.EMAIL_FROM_NAME || 'Rong AI'
  }
};

/**
 * 验证必需的环境变量
 */
export const validateConfig = (): void => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missingVars.join(', ')}`);
  }

  if (!config.jwt.secret) {
    throw new Error('JWT_SECRET 环境变量是必需的');
  }

  if (config.jwt.secret.length < 32) {
    console.warn('⚠️  为了更好的安全性，JWT_SECRET 应该至少32个字符长');
  }

  // 验证数据库配置
  if (!config.database.url) {
    throw new Error('DATABASE_URL 环境变量是必需的');
  }

  // 验证连接池配置
  if (config.database.connectionLimit < 1 || config.database.connectionLimit > 100) {
    console.warn('⚠️  DB_CONNECTION_LIMIT 应该在 1 到 100 之间');
  }

  if (config.database.connectTimeout < 1000) {
    console.warn('⚠️  DB_CONNECT_TIMEOUT 应该至少为 1000 毫秒');
  }

  // 验证邮件配置（如果需要发送邮件功能）
  if (!config.email.user || !config.email.password) {
    console.warn('⚠️  邮件配置不完整，邮件发送功能将不可用。请设置 EMAIL_USER 和 EMAIL_PASSWORD');
  }
};
