import { Request, Response } from 'express';
import { getOllamaClient, getModels as fetchModels, getModelInfo as fetchModelInfo, checkOllamaHealth } from '@/utils/ollama';
import { config } from '@/config';

/**
 * Ollama 控制器
 * 用于管理和获取 Ollama 模型信息
 */

/**
 * 获取所有可用的 Ollama 模型
 * GET /api/v1/ollama/models
 */
export const getModels = async (req: Request, res: Response) => {
  try {
    const models = await fetchModels();

    res.json({
      success: true,
      data: models.map((model: any) => ({
        name: model.name,
        modified_at: model.modified_at,
        size: model.size,
        digest: model.digest
      })),
      message: `成功获取 ${models.length} 个模型`
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      errorCode: 'OLLAMA_CONNECTION_ERROR',
      errorMessage: 'Ollama 服务不可用或未运行',
      message: error.message
    });
  }
};

/**
 * 获取特定模型的详细信息
 * GET /api/v1/ollama/models/:modelName
 */
export const getModelInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { modelName } = req.params;

    if (!modelName) {
      res.status(400).json({
        success: false,
        errorCode: 'MISSING_MODEL_NAME',
        errorMessage: '模型名称不能为空'
      });
      return;
    }

    const data = await fetchModelInfo(modelName);

    res.json({
      success: true,
      data,
      message: `成功获取模型 ${modelName} 的信息`
    });
  } catch (error: any) {
    console.error('获取模型信息失败:', error.message);

    res.status(503).json({
      success: false,
      errorCode: 'OLLAMA_ERROR',
      errorMessage: '获取模型信息失败',
      message: error.message
    });
  }
};

/**
 * 检查 Ollama 服务是否可用
 * GET /api/v1/ollama/health
 */
export const checkHealth = async (req: Request, res: Response) => {
  try {
    const isHealthy = await checkOllamaHealth();

    if (isHealthy) {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          url: config.ollama.baseUrl
        },
        message: 'Ollama 服务正常'
      });
    } else {
      throw new Error('Health check failed');
    }
  } catch (error: any) {
    console.error('Ollama 健康检查失败:', error.message);

    res.status(503).json({
      success: false,
      errorCode: 'OLLAMA_UNAVAILABLE',
      errorMessage: 'Ollama 服务不可用',
      data: {
        status: 'unhealthy',
        url: config.ollama.baseUrl
      }
    });
  }
};

/**
 * 拉取/下载模型
 * POST /api/v1/ollama/pull
 */
export const pullModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { modelName } = req.body;

    if (!modelName) {
      res.status(400).json({
        success: false,
        errorCode: 'MISSING_MODEL_NAME',
        errorMessage: '模型名称不能为空'
      });
      return;
    }

    const client = getOllamaClient();
    // 注意：这是一个异步操作，可能需要很长时间
    // 实际应用中应该使用 WebSocket 或 Server-Sent Events 来流式传输进度
    const response = await client.post('/api/pull', { name: modelName });

    res.json({
      success: true,
      data: response.data,
      message: `模型 ${modelName} 拉取成功`
    });
  } catch (error: any) {
    console.error('拉取模型失败:', error.message);

    res.status(503).json({
      success: false,
      errorCode: 'OLLAMA_PULL_ERROR',
      errorMessage: '拉取模型失败',
      message: error.message
    });
  }
};

/**
 * 删除模型
 * DELETE /api/v1/ollama/models/:modelName
 */
export const deleteModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { modelName } = req.params;

    if (!modelName) {
      res.status(400).json({
        success: false,
        errorCode: 'MISSING_MODEL_NAME',
        errorMessage: '模型名称不能为空'
      });
      return;
    }

    const client = getOllamaClient();
    await client.delete('/api/delete', {
      data: { name: modelName }
    });

    res.json({
      success: true,
      message: `模型 ${modelName} 删除成功`
    });
  } catch (error: any) {
    console.error('删除模型失败:', error.message);

    res.status(503).json({
      success: false,
      errorCode: 'OLLAMA_DELETE_ERROR',
      errorMessage: '删除模型失败',
      message: error.message
    });
  }
};
