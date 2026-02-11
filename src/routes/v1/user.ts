import { Router } from 'express';
import {
  getUserList,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  batchDeleteUsers,
  updateUserRole,
} from '@/controllers/v1/userManagementController';

import {
  getMyProfile,
  updateMyProfile
} from '@/controllers/v1/userProfileController';
import { authenticateToken, optionalAuthenticateToken } from '@/middleware/authMiddleware';

const router = Router();

/**
 * ============================================
 * 用户个人信息路由（放在最前面）
 * ============================================
 */

/**
 * GET /api/v1/users/me/profile
 * 获取当前用户的个人信息
 * 需要认证
 */
router.get('/me/profile', authenticateToken, getMyProfile);

/**
 * PUT /api/v1/users/me/profile
 * 更新当前用户的个人信息
 * 请求体: { name, avatar, bio, signature }
 * 需要认证
 */
router.put('/me/profile', authenticateToken, updateMyProfile);

/**
 * ============================================
 * 用户管理相关路由
 * ============================================
 * 前缀: /api/v1/users
 * 所有路由都需要认证
 * 
 * 说明：头像上传使用统一上传接口 POST /api/v1/upload
 * 上传成功后获得 URL，然后在创建/编辑用户时传递 URL 即可
 */

/**
 * POST /api/v1/users/batch/delete
 * 批量删除用户 (需要认证)
 */
router.post('/batch/delete', authenticateToken, batchDeleteUsers);

/**
 * GET /api/v1/users
 * 获取用户列表 (需要认证)
 * 查询参数: pageSize, current, name, email, role, isActive
 */
router.get('/', authenticateToken, getUserList);

/**
 * POST /api/v1/users
 * 创建用户 (需要认证)
 * 请求体: { name, email, password, role, avatar(optional url) }
 */
router.post('/', authenticateToken, createUser);

/**
 * POST /api/v1/users/:id/reset-password
 * 重置用户密码（管理员操作）(需要认证)
 */
router.post('/:id/reset-password', authenticateToken, resetPassword);

/**
 * PUT /api/v1/users/:id/role
 * 修改用户角色 (需要认证)
 */
router.put('/:id/role', authenticateToken, updateUserRole);

/**
 * GET /api/v1/users/:id
 * 获取单个用户信息 (需要认证)
 */
router.get('/:id', authenticateToken, getUserById);

/**
 * PUT /api/v1/users/:id
 * 更新用户信息 (需要认证)
 * 请求体: { name, email, role, isActive, avatar(optional url) }
 */
router.put('/:id', authenticateToken, updateUser);

/**
 * DELETE /api/v1/users/:id
 * 删除用户 (需要认证)
 */
router.delete('/:id', authenticateToken, deleteUser);

export default router;

