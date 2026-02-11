import { Router } from 'express';
import {
  getModels,
  getModelInfo,
  checkHealth,
  pullModel,
  deleteModel
} from '@/controllers/v1/ollamaController';

const router = Router();

/**
 * ============================================
 * Ollama 模型管理路由
 * 前缀: /api/v1/ollama
 * ============================================
 */

/**
 * GET /api/v1/ollama/health
 * 检查 Ollama 服务是否可用
 * 返回：
 *   - status: 服务状态 (healthy / unhealthy)
 *   - url: Ollama 服务地址
 */
router.get('/health', checkHealth);

/**
 * GET /api/v1/ollama/models
 * 获取所有可用的 Ollama 模型
 * 返回：
 *   - data: 模型列表数组
 *     - name: 模型名称
 *     - modified_at: 修改时间
 *     - size: 模型大小
 *     - digest: 模型摘要
 */
router.get('/models', getModels);

/**
 * GET /api/v1/ollama/models/:modelName
 * 获取特定模型的详细信息
 * 参数：
 *   - modelName: 模型名称（URL 参数）
 * 返回：
 *   - data: 模型详细信息
 */
router.get('/models/:modelName', getModelInfo);

/**
 * POST /api/v1/ollama/pull
 * 拉取/下载模型
 * 请求体：
 *   - modelName: 要拉取的模型名称
 * 返回：
 *   - data: 拉取结果
 * 注意：这是一个长时间运行的操作
 */
router.post('/pull', pullModel);

/**
 * DELETE /api/v1/ollama/models/:modelName
 * 删除模型
 * 参数：
 *   - modelName: 模型名称（URL 参数）
 * 返回：
 *   - message: 删除成功消息
 */
router.delete('/models/:modelName', deleteModel);

export default router;
