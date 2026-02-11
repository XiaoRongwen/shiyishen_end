import { Request, Response, NextFunction } from 'express';
import { unauthorized, forbidden } from '../utils/response';

/**
 * 要求管理员权限的中间件
 * 必须在 authenticateToken 之后使用
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    unauthorized(res, '未登录');
    return;
  }

  if (req.user.role !== 'admin') {
    forbidden(res, '需要管理员权限');
    return;
  }

  next();
};

/**
 * 要求特定角色的中间件
 * 必须在 authenticateToken 之后使用
 * @param roles 允许的角色列表
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res, '未登录');
      return;
    }

    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      forbidden(res, '权限不足');
      return;
    }

    next();
  };
};

/**
 * 要求管理员或版主权限的中间件
 * 必须在 authenticateToken 之后使用
 */
export const requireModeratorOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    unauthorized(res, '未登录');
    return;
  }

  const userRole = req.user.role || 'user';
  
  if (userRole !== 'admin' && userRole !== 'moderator') {
    forbidden(res, '需要管理员或版主权限');
    return;
  }

  next();
};
