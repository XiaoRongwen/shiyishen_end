import { Request, Response, NextFunction } from 'express';
import { success, badRequest, tooManyRequests } from '@/utils/response';
import { validateEmail } from '@/utils/auth';
import { prisma } from '@/utils/database';
import { sendVerificationEmail, generateVerificationCode } from '@/utils/email';

/**
 * 发送邮箱验证码
 */
export const sendEmailCode = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email, type = 'register' } = req.body;

    // 验证必填字段
    if (!email) {
      return badRequest(res, '邮箱不能为空');
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return badRequest(res, '邮箱格式不正确');
    }

    // 如果是注册类型，检查邮箱是否已被注册
    if (type === 'register') {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return badRequest(res, '该邮箱已被注册');
      }
    }

    // 检查是否频繁发送（1分钟内只能发送一次）
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCode = await prisma.emailVerification.findFirst({
      where: {
        email,
        type,
        createdAt: {
          gte: oneMinuteAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (recentCode) {
      const remainingSeconds = Math.ceil((recentCode.createdAt.getTime() + 60000 - Date.now()) / 1000);
      return tooManyRequests(res, `请在 ${remainingSeconds} 秒后再试`);
    }

    // 生成验证码
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    // 获取IP地址
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';

    // 先发送邮件
    const emailSent = await sendVerificationEmail(email, code, type as 'register' | 'reset_password');

    if (!emailSent) {
      return badRequest(res, '邮件发送失败，请稍后重试');
    }

    // 邮件发送成功后，再保存验证码到数据库
    await prisma.emailVerification.create({
      data: {
        email,
        code,
        type,
        expiresAt,
        ipAddress
      }
    });

    return success(res, {
      email,
      expiresIn: 300 // 5分钟
    }, '验证码已发送，请查收邮件');

  } catch (error) {
    next(error);
  }
};

/**
 * 验证邮箱验证码
 */
export const verifyEmailCode = async (
  email: string,
  code: string,
  type: string = 'register'
): Promise<boolean> => {
  try {
    // 查找未使用且未过期的验证码
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        type,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!verification) {
      return false;
    }

    // 标记验证码为已使用
    await prisma.emailVerification.update({
      where: {
        id: verification.id
      },
      data: {
        isUsed: true
      }
    });

    return true;
  } catch (error) {
    console.error('验证邮箱验证码失败:', error);
    return false;
  }
};
