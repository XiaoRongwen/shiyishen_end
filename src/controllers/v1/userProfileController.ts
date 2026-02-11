import { Request, Response, NextFunction } from 'express';
import { success, badRequest, notFound } from '../../utils/response';
import { prisma } from '@/utils/database';
import { JWTPayload } from '@/utils/auth';

/**
 * 获取当前用户的个人信息
 */
export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user as JWTPayload;

    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return notFound(res, '用户不存在');
    }

    return success(res, profile, '获取个人信息成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 更新当前用户的个人信息
 */
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user as JWTPayload;
    const { name, avatar } = req.body;

    // 验证字段长度
    if (name && name.length > 100) {
      return badRequest(res, '用户名不能超过100个字符');
    }

    // 构建更新数据
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar || null;

    // 更新用户信息
    const updatedProfile = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(res, updatedProfile, '个人信息更新成功');
  } catch (error) {
    next(error);
  }
};
