import { Router } from 'express';
import { optimizePrompt, generateImage } from '@/controllers/v1/aiImageController';
import { authenticateToken } from '@/middleware/authMiddleware';

const router = Router();

console.log('🎨 AI Image routes loaded'); // 调试日志

/**
 * AI图片生成相关路由
 * 前缀: /api/v1/ai-image
 */

/**
 * POST /api/v1/ai-image/optimize-prompt
 * 优化提示词 (需要认证)
 */
router.post('/optimize-prompt', authenticateToken, optimizePrompt);

/**
 * POST /api/v1/ai-image/generate
 * 生成图片 (需要认证)
 */
router.post('/generate', authenticateToken, generateImage);

console.log('🎨 AI Image routes registered:', router.stack.length, 'routes'); // 调试日志

export default router;
