import { Request, Response, NextFunction } from 'express';
import { unauthorized } from '../utils/response';
import { extractTokenFromHeader, verifyToken } from '../utils/auth';
import { prisma } from '../utils/database';

/**
 * JWT authentication middleware
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      unauthorized(res, '登录失效，请重新登录');
      return;
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        openid: true,
        phone: true,
        role: true,
      }
    });

    if (!user) {
      unauthorized(res, '用户不存在');
      return;
    }

    req.user = { ...decoded, role: user.role };
    next();

  } catch (error: any) {
    if (error.message && error.message.includes('Token已过期')) {
      unauthorized(res, 'Token已过期，请重新登录');
    } else if (error.message && error.message.includes('无效的Token')) {
      unauthorized(res, '无效的访问令牌');
    } else {
      unauthorized(res, 'Token验证失败');
    }
  }
};

/**
 * 角色权限中间件工厂
 * 用法：requireRole('admin') 或 requireRole('admin', 'auditor')
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      res.status(403).json({ success: false, message: '权限不足' });
      return;
    }
    next();
  };
};

/**
 * Optional JWT authentication middleware
 */
export const optionalAuthenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        openid: true,
        phone: true
      }
    });

    if (user) {
      req.user = decoded;
    }

    next();

  } catch (error: any) {
    next();
  }
};
