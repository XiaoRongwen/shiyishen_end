import { Request, Response, NextFunction } from 'express';
import { success, badRequest } from '../../utils/response';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../../utils/auth';
import axios from 'axios';

const prisma = new PrismaClient();

/**
 * 微信登录（仅使用 openid）
 */
export const wechatPhoneLogin = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { code } = req.body;

    if (!code) {
      return badRequest(res, '缺少微信授权码');
    }

    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      return badRequest(res, '微信配置错误');
    }

    // 获取 openid
    const authUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
    const authResponse = await axios.get(authUrl);

    if (authResponse.data.errcode) {
      return badRequest(res, `微信授权失败: ${authResponse.data.errmsg}`);
    }

    const { openid } = authResponse.data;

    if (!openid) {
      return badRequest(res, '获取openid失败');
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { openid }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          openid,
          lastLogin: new Date()
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date()
        }
      });
    }

    // 生成 JWT token
    const token = generateToken({
      userId: user.id,
      openid: user.openid
    });

    return success(res, {
      token,
      user: {
        id: user.id,
        openid: user.openid,
        phone: user.phone,
        avatar: user.avatar,
        nickname: user.nickname,
        role: user.role
      }
    }, '登录成功');

  } catch (error) {
    console.error('微信登录失败:', error);
    next(error);
  }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return badRequest(res, '用户未登录');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        openid: true,
        phone: true,
        avatar: true,
        nickname: true,
        role: true,
        lastLogin: true,
        createdAt: true
      }
    });

    if (!user) {
      return badRequest(res, '用户不存在');
    }

    return success(res, { user }, '获取用户信息成功');
  } catch (error) {
    console.error('获取用户信息失败:', error);
    next(error);
  }
};

/**
 * 更新用户角色（仅管理员可操作）
 */
export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { userId, role } = req.body;
    const currentUserId = req.user?.userId;

    if (!userId || !role) {
      return badRequest(res, '缺少必要参数');
    }

    // 验证角色值
    const validRoles = ['admin', 'auditor', 'user'];
    if (!validRoles.includes(role)) {
      return badRequest(res, '无效的角色类型');
    }

    // 检查当前用户是否为管理员
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return badRequest(res, '无权限操作');
    }

    // 更新用户角色
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        openid: true,
        phone: true,
        avatar: true,
        nickname: true,
        role: true
      }
    });

    return success(res, { user: updatedUser }, '角色更新成功');
  } catch (error) {
    console.error('更新用户角色失败:', error);
    next(error);
  }
};

/**
 * 上传头像
 */
export const uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;
    const file = (req as any).file;
    if (!file) return badRequest(res, '未收到文件');

    const url = `/uploads/${file.filename}`;
    await prisma.user.update({ where: { id: userId }, data: { avatar: url } });

    return success(res, { url: `http://localhost:3000${url}` }, '上传成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户头像和昵称
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;
    const { nickname, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname && { nickname }),
        ...(avatar && { avatar }),
      },
      select: { id: true, nickname: true, avatar: true, phone: true, role: true }
    });

    return success(res, { user }, '更新成功');
  } catch (error) {
    next(error);
  }
};
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const currentUserId = req.user?.userId;

    // 检查当前用户是否为管理员
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return badRequest(res, '无权限操作');
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        openid: true,
        phone: true,
        avatar: true,
        nickname: true,
        role: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return success(res, { users, total: users.length }, '获取用户列表成功');
  } catch (error) {
    console.error('获取用户列表失败:', error);
    next(error);
  }
};
