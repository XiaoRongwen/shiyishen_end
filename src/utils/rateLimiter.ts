import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { config } from '@/config';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './database';

/**
 * 创建速率限制中间件
 * 使用 express-rate-limit 库实现标准的速率限制功能
 */
export const createRateLimit = (options?: {
  maxRequests?: number;
  windowMs?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  const {
    maxRequests = config.rateLimit.maxRequests,
    windowMs = config.rateLimit.windowMs,
    message = '请求过于频繁，请稍后再试',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options || {};

  return rateLimit({
    windowMs, // 时间窗口
    max: maxRequests, // 最大请求数
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000),
      timestamp: new Date().toISOString()
    },
    standardHeaders: true, // 返回标准的 `RateLimit-*` 头
    legacyHeaders: false, // 禁用 `X-RateLimit-*` 头
    skipSuccessfulRequests, // 是否跳过成功的请求计数
    skipFailedRequests, // 是否跳过失败的请求计数
    // 使用 ipKeyGenerator 助手函数来正确处理 IPv6 地址
    keyGenerator: (req) => {
      return ipKeyGenerator(req.ip || '');
    },
    // 自定义跳过逻辑
    skip: (req) => {
      // 可以在这里添加跳过某些请求的逻辑
      // 例如：跳过健康检查请求
      return req.path === '/health';
    },
    // 自定义处理器
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        error: 'Too Many Requests',
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

/**
 * 认证相关的速率限制
 * 用于登录、注册等敏感操作
 */
export const authRateLimit = createRateLimit({
  maxRequests: config.rateLimit.maxRequests,
  windowMs: config.rateLimit.windowMs,
  message: '认证请求过于频繁，请稍后再试',
  skipSuccessfulRequests: false, // 成功的请求也计数
  skipFailedRequests: false // 失败的请求也计数
});

/**
 * 文件上传的速率限制
 * 相对宽松一些，但仍需要限制
 */
export const uploadRateLimit = createRateLimit({
  maxRequests: config.rateLimit.maxRequests,
  windowMs: config.rateLimit.windowMs,
  message: '文件上传过于频繁，请稍后再试',
  skipSuccessfulRequests: false,
  skipFailedRequests: true // 上传失败不计数
});

/**
 * 通用API速率限制
 * 用于一般的API请求
 */
export const apiRateLimit = createRateLimit({
  maxRequests: config.rateLimit.maxRequests * 2, // 相对宽松
  windowMs: config.rateLimit.windowMs,
  message: 'API请求过于频繁，请稍后再试',
  skipSuccessfulRequests: false,
  skipFailedRequests: true
});

/**
 * 严格的速率限制
 * 用于特别敏感的操作
 */
export const strictRateLimit = createRateLimit({
  maxRequests: Math.max(1, Math.floor(config.rateLimit.maxRequests / 2)), // 更严格
  windowMs: config.rateLimit.windowMs,
  message: '操作过于频繁，请稍后再试',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * 基于用户和IP的发帖频率限制中间件
 * 限制用户在指定时间内只能发布一定数量的帖子
 * 同时限制IP地址，防止恶意用户通过多个账号刷帖
 */
export const createPostRateLimit = (options?: {
  maxPosts?: number;
  windowMs?: number;
  ipMaxPosts?: number; // IP地址的限制（更宽松）
}) => {
  const {
    maxPosts = 1, // 默认时间窗口内只能发1篇
    windowMs = 5 * 60 * 1000, // 默认5分钟
    ipMaxPosts = 3 // 同一IP默认5分钟内最多3篇（防止多账号刷帖）
  } = options || {};

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 论坛功能已移除，跳过帖子频率检查
      // TODO: 如果需要其他内容的发布频率限制，可以在这里添加
      next();
    } catch (error) {
      console.error('限流检查失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: 'Internal Server Error'
      });
    }
  };
};

/**
 * 发帖频率限制（5分钟1篇）
 */
export const postCreationRateLimit = createPostRateLimit({
  maxPosts: 1,
  windowMs: 5 * 60 * 1000 // 5分钟
});

/**
 * 评论频率限制（1分钟5条）
 */
export const commentCreationRateLimit = createPostRateLimit({
  maxPosts: 5,
  windowMs: 1 * 60 * 1000 // 1分钟
});
