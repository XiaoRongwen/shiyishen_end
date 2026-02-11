import { Router } from 'express';
import { uploadFile, deleteFile } from '@/controllers/v1/fileController';
import { authenticateToken } from '@/middleware/authMiddleware';
import { uploadRateLimit } from '@/utils/rateLimiter';
import { uploadSingle, handleUploadError } from '@/middleware/uploadMiddleware';

const router = Router();

/**
 * 文件相关路由
 * 前缀: /api/v1
 */

/**
 * POST /api/v1/upload
 * 上传单个文件 (需要认证)
 * 限流: 已启用
 * 中间件: uploadRateLimit -> authenticateToken -> uploadSingle -> handleUploadError
 */
router.post('/upload', 
  uploadRateLimit,
  authenticateToken, 
  uploadSingle('file'), 
  handleUploadError,
  uploadFile
);

/**
 * DELETE /api/v1/files/:id
 * 删除文件 (需要认证)
 * 路径参数: id - 文件ID
 */
router.delete('/files/:id', authenticateToken, deleteFile);

export default router;
