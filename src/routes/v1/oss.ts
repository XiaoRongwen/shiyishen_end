import { Router } from 'express';
import { authenticateToken } from '@/middleware/authMiddleware';
import { getPresignUrl } from '@/controllers/v1/ossController';

const router = Router();

// 所有 OSS 接口都需要登录
router.use(authenticateToken);

/**
 * POST /api/v1/oss/presign
 * 获取预签名上传 URL
 */
router.post('/presign', getPresignUrl);

export default router;
