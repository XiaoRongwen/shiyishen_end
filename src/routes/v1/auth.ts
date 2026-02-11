import { Router } from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  getCurrentUser, 
  changePassword, 
  logout, 
  checkEmailAvailability,
  generateCaptcha,
  resetPassword
} from '@/controllers/v1/authController';
import { sendEmailCode } from '@/controllers/v1/emailController';
import { authenticateToken } from '@/middleware/authMiddleware';
import { authRateLimit } from '@/utils/rateLimiter';

const router = Router();

/**
 * 认证相关路由
 * 前缀: /api/v1/auth
 */

/**
 * POST /api/v1/auth/register
 * 用户注册 (公开路由)
 * 限流: 已启用
 */
router.post('/register', authRateLimit, register);

/**
 * POST /api/v1/auth/login
 * 用户登录 (公开路由)
 * 限流: 已启用
 */
router.post('/login', authRateLimit, login);

/**
 * POST /api/v1/auth/refresh
 * 刷新访问令牌 (需要认证)
 * 限流: 已启用
 */
router.post('/refresh', authRateLimit, refreshToken);

/**
 * GET /api/v1/auth/me
 * 获取当前用户信息 (需要认证)
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * PUT /api/v1/auth/password
 * 修改密码 (需要认证)
 * 限流: 已启用
 */
router.put('/password', authenticateToken, authRateLimit, changePassword);

/**
 * POST /api/v1/auth/logout
 * 用户登出 (需要认证)
 */
router.post('/logout', authenticateToken, logout);

/**
 * GET /api/v1/auth/check-email
 * 检查邮箱可用性 (公开路由)
 * 查询参数: email
 */
router.get('/check-email', checkEmailAvailability);

/**
 * GET /api/v1/auth/captcha
 * 生成验证码图片 (公开路由)
 */
router.get('/captcha', generateCaptcha);

/**
 * POST /api/v1/auth/send-email-code
 * 发送邮箱验证码 (公开路由)
 * 限流: 已启用
 */
router.post('/send-email-code', authRateLimit, sendEmailCode);

/**
 * POST /api/v1/auth/reset-password
 * 重置密码 (公开路由)
 * 限流: 已启用
 */
router.post('/reset-password', authRateLimit, resetPassword);

export default router;
