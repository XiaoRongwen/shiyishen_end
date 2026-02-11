import { Request, Response, NextFunction } from 'express';

/**
 * 全局错误处理中间件
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // 确定状态码和消息
  let status = 500;
  let message = '服务器内部错误';

  // JWT 错误处理
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = '无效的访问令牌';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token已过期，请重新登录';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  } else {
    status = err.status || err.statusCode || 500;
    message = err.message || '服务器内部错误';
  }

  // 统一的错误响应格式
  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

/**
 * 404 错误处理中间件
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.method} ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
};