import { Router } from 'express';
import { healthCheck } from '@/utils/database';
import v1Routes from './v1';

const router = Router();

/**
 * ============================================
 * 全局路由 - 不带版本前缀
 * ============================================
 */

/**
 * GET /health
 * 服务器健康检查
 * 返回：
 *   - status: 服务状态 (healthy / unhealthy)
 *   - database: 数据库连接状态 (connected / disconnected)
 *   - timestamp: 检查时间戳
 */
router.get('/health', async (req, res) => {
  const dbHealthy = await healthCheck();
  
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    database: dbHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api
 * API 根信息和可用端点列表
 */
router.get('/api', (req, res) => {
  res.json({
    message: 'Backend API Service',
    version: '1.0.0',
    description: 'A backend service with authentication and file upload',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      upload: '/api/v1/upload',
      wechat: '/api/v1/wechat',
      static: '/static'
    }
  });
});

/**
 * ============================================
 * v1 API 路由 - 前缀: /api/v1
 * ============================================
 * 详见: ./v1/index.ts 和 ROUTES_DOCUMENTATION.md
 */
router.use('/api/v1', v1Routes);

export default router;
