import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

/**
 * 成功响应
 */
const success = <T>(res: Response, data: T, message: string = '操作成功', statusCode: number = 200): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(response);
};

/**
 * 400 请求错误响应
 */
const badRequest = (res: Response, message: string): Response => {
  return res.status(400).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * 401 未授权响应
 */
const unauthorized = (res: Response, message: string): Response => {
  return res.status(401).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * 403 禁止访问响应
 */
const forbidden = (res: Response, message: string): Response => {
  return res.status(403).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * 404 未找到响应
 */
const notFound = (res: Response, message: string): Response => {
  return res.status(404).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * 429 请求过多响应
 */
const tooManyRequests = (res: Response, message: string): Response => {
  return res.status(429).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * 通用错误响应
 */
const error = (res: Response, message: string, statusCode: number = 500): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

// 导出所有响应相关的函数
export {
  success,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  tooManyRequests,
  error
};