import axios, { AxiosInstance } from 'axios';
import { config } from '@/config';

/**
 * Ollama 客户端工具
 * 提供统一的 Ollama API 访问接口，包含连接池、超时、重试等功能
 */

// 创建 Ollama axios 实例（单例）
let ollamaClient: AxiosInstance | null = null;

/**
 * 获取 Ollama 客户端实例
 */
export const getOllamaClient = (): AxiosInstance => {
  if (!ollamaClient) {
    ollamaClient = axios.create({
      baseURL: config.ollama.baseUrl,
      timeout: config.ollama.timeout,
      headers: {
        'Content-Type': 'application/json'
      },
      // 连接池配置
      maxRedirects: 5,
      // 保持连接活跃
      httpAgent: undefined, // 使用默认的 http.Agent
      httpsAgent: undefined
    });

    // 请求拦截器
    ollamaClient.interceptors.request.use(
      (config) => {
        console.log(`🤖 Ollama Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Ollama Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    ollamaClient.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // 重试逻辑
        if (!originalRequest._retry && originalRequest._retryCount < config.ollama.maxRetries) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          console.warn(`⚠️ Ollama Request Failed, Retrying (${originalRequest._retryCount}/${config.ollama.maxRetries})...`);

          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * originalRequest._retryCount));

          return ollamaClient!(originalRequest);
        }

        console.error('❌ Ollama Response Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  return ollamaClient;
};

/**
 * 获取可用模型列表
 */
export const getModels = async () => {
  const client = getOllamaClient();
  const response = await client.get('/api/tags');
  return response.data.models || [];
};

/**
 * 获取模型信息
 */
export const getModelInfo = async (modelName: string) => {
  const client = getOllamaClient();
  const response = await client.post('/api/show', { name: modelName });
  return response.data;
};

/**
 * 检查 Ollama 服务健康状态
 */
export const checkOllamaHealth = async (): Promise<boolean> => {
  try {
    const client = getOllamaClient();
    await client.get('/api/tags', { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // base64 编码的图片数组
}

/**
 * 生成聊天响应（流式）- 支持 vision 模型
 * @param model 模型名称
 * @param messages 消息历史
 * @returns fetch Response 对象
 */
export const generateChatStream = async (
  model: string,
  messages: ChatMessage[]
): Promise<Response> => {
  // 检查是否有图片，使用不同的 API 端点
  const hasImages = messages.some(msg => msg.images && msg.images.length > 0);

  if (hasImages) {
    // 使用 /api/chat 端点支持 vision
    const response = await fetch(`${config.ollama.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.images && msg.images.length > 0 && { images: msg.images })
        })),
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  } else {
    // 原有的文本模式，使用 /api/generate
    let prompt = '';
    
    // 添加历史消息作为上下文
    for (const msg of messages) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n\n`;
      }
    }

    const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: prompt.trim(),
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  }
};

/**
 * 生成聊天响应（非流式）
 */
export const generateChat = async (
  model: string,
  messages: ChatMessage[]
): Promise<string> => {
  const client = getOllamaClient();
  
  // 构建 prompt
  let prompt = '';
  for (const msg of messages) {
    if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n\n`;
    }
  }

  const response = await client.post('/api/generate', {
    model,
    prompt: prompt.trim(),
    stream: false
  });

  return response.data.response || '';
};

/**
 * 将图片文件转换为 base64 编码
 */
export const imageToBase64 = async (filePath: string): Promise<string> => {
  const fs = await import('fs/promises');
  const imageBuffer = await fs.readFile(filePath);
  return imageBuffer.toString('base64');
};
