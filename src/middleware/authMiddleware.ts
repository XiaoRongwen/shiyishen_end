import { Request, Response, NextFunction } from 'express';
import { unauthorized, forbidden, badRequest, error } from '../utils/response';
import { extractTokenFromHeader, verifyToken } from '../utils/auth';
import { prisma } from '../utils/database';
import { config } from '@/config';

/**
 * JWT认证中间件
 * 验证请求头中的JWT令牌，并将用户信息添加到req.user中
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 从请求头中提取token
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      unauthorized(res, '登陆失效了哟！');
      return;
    }

    // 验证token
    const decoded = verifyToken(token);

    // 验证用户是否仍然存在且处于活跃状态
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    if (!user) {
      unauthorized(res, '用户不存在');
      return;
    }

    if (!user.isActive) {
      forbidden(res, '账户已被禁用');
      return;
    }

    // 将用户信息添加到请求对象中
    req.user = decoded;
    next();

  } catch (error: any) {
    if (error.message.includes('Token已过期')) {
      unauthorized(res, 'Token已过期，请重新登录');
    } else if (error.message.includes('无效的Token')) {
      unauthorized(res, '无效的访问令牌');
    } else {
      unauthorized(res, 'Token验证失败');
    }
  }
};

/**
 * 可选的JWT认证中间件
 * 如果有token则验证并添加用户信息，没有token则继续执行
 * 用于那些登录和未登录都可以访问，但需要根据登录状态显示不同内容的接口
 */
export const optionalAuthenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 从请求头中提取token
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // 如果没有token，直接继续执行
    if (!token) {
      next();
      return;
    }

    // 验证token
    const decoded = verifyToken(token);

    // 验证用户是否仍然存在且处于活跃状态
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    // 如果用户存在且活跃，添加到请求对象中
    if (user && user.isActive) {
      req.user = decoded;
    }

    next();

  } catch (error: any) {
    // 如果token验证失败，也继续执行（不阻止访问）
    next();
  }
};


