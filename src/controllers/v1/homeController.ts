import { Request, Response, NextFunction } from 'express';
import { success } from '@/utils/response';
import { prisma } from '@/utils/database';

/**
 * 获取首页数据
 * 论坛功能已移除，返回基础统计信息
 */
export const getHomeData = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    // 获取全站统计数据
    const [totalUsers, totalFiles, totalChatSessions] = await Promise.all([
      prisma.user.count({
        where: { isActive: true }
      }),
      prisma.file.count(),
      prisma.chatSession.count()
    ]);

    return success(res, {
      stats: {
        totalUsers,
        totalFiles,
        totalChatSessions
      },
      message: '欢迎使用 Rong AI'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取热门内容
 * 论坛功能已移除，返回空数组
 */
export const getHotPosts = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    return success(res, []);
  } catch (error) {
    next(error);
  }
};
