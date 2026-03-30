import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { wechatPhoneLogin, getCurrentUser, updateUserRole, getAllUsers, updateProfile, uploadAvatar } from '../../controllers/v1/authController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * POST /api/v1/auth/wechat-login
 * 微信手机号登录
 */
router.post('/wechat-login', wechatPhoneLogin);

/**
 * GET /api/v1/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * PUT /api/v1/auth/role
 * 更新用户角色（仅管理员）
 */
router.put('/role', authenticateToken, updateUserRole);

/**
 * PUT /api/v1/auth/profile
 * 更新用户头像和昵称
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * POST /api/v1/auth/avatar
 * 上传头像文件
 */
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

export default router;
