import { Request, Response, NextFunction } from 'express';
import { success, badRequest, error } from '@/utils/response';
import { config } from '@/config';
import axios from 'axios';

/**
 * 优化提示词
 */
export const optimizePrompt = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    console.log(12222222222222);

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return badRequest(res, '请提供有效的提示词');
    }

    // 检查配置
    if (!config.aiImage.geminiApiUrl || !config.aiImage.geminiApiKey) {
      return error(res, 'Gemini API 未配置，请联系管理员', 500);
    }

    // 调用 Gemini API 优化提示词
    const response = await axios.post(
      `${config.aiImage.geminiApiUrl}/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        contents: [
          {
            parts: [
              {
                text: `你是一个专业的AI图片生成提示词优化专家。请将用户提供的简单描述优化成详细、具体的图片生成提示词。

要求：
1. 只返回优化后的提示词内容，不要有任何解释、说明或额外文字
2. 提示词要详细描述画面内容、风格、光线、构图等细节
3. 使用英文描述（AI图片生成模型通常对英文效果更好）
4. 如果原始提示词过于简单或无意义，请创造一个合理的场景

用户的原始提示词：${prompt}

优化后的提示词：`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.aiImage.geminiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    // 提取优化后的提示词
    let optimizedPrompt = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || prompt;

    // 清理可能的多余内容
    optimizedPrompt = optimizedPrompt.trim();

    return success(res, {
      originalPrompt: prompt,
      optimizedPrompt: optimizedPrompt.trim()
    }, '提示词优化成功');

  } catch (err: any) {
    console.error('优化提示词失败:', err.response?.data || err.message);

    // 如果API调用失败，返回原始提示词
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return error(res, 'API请求超时，请稍后重试', 504);
    }

    return error(res, `优化提示词失败: ${err.response?.data?.error?.message || err.message}`, 500);
  }
};

/**
 * 生成图片
 */
export const generateImage = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { prompt, aspectRatio, resolution } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return badRequest(res, '请提供有效的提示词');
    }

    // 检查配置
    if (!config.aiImage.imageGenApiUrl || !config.aiImage.imageGenApiKey) {
      return error(res, '图片生成 API 未配置，请联系管理员', 500);
    }

    // 构建请求体
    const requestBody: any = {
      prompt: prompt.trim(),
      model: 'nano-banana'
    };

    // 添加可选参数
    if (aspectRatio) {
      requestBody.aspect_ratio = aspectRatio;
    }
    if (resolution) {
      requestBody.resolution = resolution;
    }

    // 调用 Nano-banana API 生成图片
    const response = await axios.post(
      `${config.aiImage.imageGenApiUrl}/v1/images/generations`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${config.aiImage.imageGenApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 图片生成可能需要更长时间
      }
    );

    // 返回生成的图片数据
    return success(res, {
      prompt: prompt.trim(),
      aspectRatio,
      resolution,
      image: response.data
    }, '图片生成成功');

  } catch (err: any) {
    console.error('生成图片失败:', err.response?.data || err.message);

    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return error(res, 'API请求超时，图片生成可能需要较长时间，请稍后重试', 504);
    }

    return error(res, `生成图片失败: ${err.response?.data?.error?.message || err.message}`, 500);
  }
};
