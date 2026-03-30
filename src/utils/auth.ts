import jwt from 'jsonwebtoken';
import { config } from '@/config';

// JWT载荷接口
export interface JWTPayload {
  userId: number;
  openid: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * 生成JWT令牌
 */
const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.secret as string, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  } as jwt.SignOptions);
};

/**
 * 验证JWT令牌
 */
const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret as string, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    } as jwt.VerifyOptions) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token已过期');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('无效的Token');
    } else {
      throw new Error('Token验证失败');
    }
  }
};

/**
 * 从请求头中提取Token
 */
const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};

export {
  generateToken,
  verifyToken,
  extractTokenFromHeader
};