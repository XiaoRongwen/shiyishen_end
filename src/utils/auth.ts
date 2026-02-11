import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '@/config';

// JWT载荷接口
export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  role?: string;
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

  // 标准格式: "Bearer token"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};

/**
 * 加密密码
 */
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.bcrypt.saltRounds);
};

/**
 * 验证密码
 */
const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * 验证密码强度（简化版）
 */
const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const { minLength, maxLength } = config.password;

  if (password.length < minLength) {
    errors.push(`密码长度至少${minLength}个字符`);
  }

  if (password.length > maxLength) {
    errors.push(`密码长度不能超过${maxLength}个字符`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 验证邮箱格式
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


/**
 * 刷新令牌载荷接口
 */
export interface RefreshTokenPayload {
  userId: number;
  type: 'refresh';
  timestamp: number;
}

/**
 * 生成刷新令牌
 */
const generateRefreshToken = (userId: number): string => {
  const payload: RefreshTokenPayload = {
    userId,
    type: 'refresh',
    timestamp: Date.now()
  };
  
  return jwt.sign(payload, config.jwt.secret as string, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  } as jwt.SignOptions);
};

/**
 * 验证刷新令牌
 */
const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret as string, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    } as jwt.VerifyOptions) as RefreshTokenPayload;
    
    if (decoded.type === 'refresh') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
};

// 导出所有认证相关的函数
export {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  validateEmail,
  generateRefreshToken,
  verifyRefreshToken
};