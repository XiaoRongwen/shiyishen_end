import { Request, Response, NextFunction } from 'express';
import { success, badRequest, notFound, forbidden } from '../../utils/response';
import { prisma } from '@/utils/database';
import { hashPassword, validatePasswordStrength, validateEmail, JWTPayload } from '@/utils/auth';

/**
 * 获取用户列表
 */
export const getUserList = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user as JWTPayload;
    const { pageSize = 10, current = 1, name, email, role, isActive } = req.query;

    const page = Number(current) || 1;
    const limit = Number(pageSize) || 10;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = { createBy: user.userId };
    if (name) {
      where.name = { contains: String(name) };
    }
    if (email) {
      where.email = { contains: String(email) };
    }
    if (role) {
      where.role = String(role);
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // 获取总数
    const total = await prisma.user.count({ where });

    // 获取列表
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return success(
      res,
      {
        data: users,
        total,
        pageSize: limit,
        current: page,
      },
      '获取用户列表成功',
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 获取单个用户信息
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return badRequest(res, '用户ID不能为空');
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return notFound(res, '用户不存在');
    }

    return success(res, user, '获取用户信息成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 创建用户
 */
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user as JWTPayload;
    const { name, email, password, avatar, role = 'user' } = req.body;

    // 验证必填字段
    if (!name || !email || !password) {
      return badRequest(res, '姓名、邮箱和密码为必填项');
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return badRequest(res, '邮箱格式不正确');
    }

    // 验证密码强度
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return badRequest(res, passwordValidation.errors.join('; '));
    }

    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return badRequest(res, '该邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        avatar: avatar || null,
        role: role || 'user',
        createBy: user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return success(res, newUser, '用户创建成功', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户信息
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { name, email, avatar, role, isActive } = req.body;

    if (!id) {
      return badRequest(res, '用户ID不能为空');
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return notFound(res, '用户不存在');
    }

    // 如果修改邮箱，检查新邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      if (!validateEmail(email)) {
        return badRequest(res, '邮箱格式不正确');
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return badRequest(res, '该邮箱已被注册');
      }
    }

    // 构建更新数据
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email && email !== user.email) updateData.email = email;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(res, updatedUser, '用户更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 删除用户
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;

    if (!id) {
      return badRequest(res, '用户ID不能为空');
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return notFound(res, '用户不存在');
    }

    // 删除用户（Cascade会自动删除关联的files）
    await prisma.user.delete({
      where: { id: Number(id) },
    });

    return success(res, null, '用户删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 重置用户密码（管理员）
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!id) {
      return badRequest(res, '用户ID不能为空');
    }

    if (!newPassword) {
      return badRequest(res, '新密码不能为空');
    }

    // 验证新密码强度
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return badRequest(res, passwordValidation.errors.join('; '));
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return notFound(res, '用户不存在');
    }

    // 加密新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    await prisma.user.update({
      where: { id: Number(id) },
      data: { password: hashedPassword },
    });

    return success(res, null, '密码重置成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 批量删除用户
 */
export const batchDeleteUsers = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return badRequest(res, '用户ID列表不能为空');
    }

    const numIds = ids.map((id: any) => Number(id));

    // 删除用户
    const result = await prisma.user.deleteMany({
      where: {
        id: {
          in: numIds,
        },
      },
    });

    return success(res, { deletedCount: result.count }, `成功删除${result.count}个用户`);
  } catch (error) {
    next(error);
  }
};

/**
 * 修改用户角色
 */
export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!id) {
      return badRequest(res, '用户ID不能为空');
    }

    if (!role) {
      return badRequest(res, '角色不能为空');
    }

    const validRoles = ['admin', 'manager', 'user'];
    if (!validRoles.includes(role)) {
      return badRequest(res, `角色必须是以下之一: ${validRoles.join(', ')}`);
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return notFound(res, '用户不存在');
    }

    // 更新角色
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return success(res, updatedUser, '用户角色更新成功');
  } catch (error) {
    next(error);
  }
};

