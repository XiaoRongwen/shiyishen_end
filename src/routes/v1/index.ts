import { Router } from 'express';
import authRoutes from './auth';
import fileRoutes from './file';
import wechatRoutes from './wechat';
import userRoutes from './user';
import homeRoutes from './home';
import ollamaRoutes from './ollama';
import chatRoutes from './chat';
import aiImageRoutes from './aiImage';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API v1 is working!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      upload: '/api/v1/upload',
      wechat: '/api/v1/wechat',
      users: '/api/v1/users',
      home: '/api/v1/home',
      ollama: '/api/v1/ollama',
      chat: '/api/v1/chat',
      aiImage: '/api/v1/ai-image',
      static: '/static'
    }
  });
});

router.use('/auth', authRoutes);
router.use('/', fileRoutes);
router.use('/users', userRoutes);
router.use('/wechat', wechatRoutes);
router.use('/home', homeRoutes);

/**
 * Ollama 模型管理路由
 * 前缀: /api/v1/ollama
 */
router.use('/ollama', ollamaRoutes);

/**
 * 聊天管理路由
 * 前缀: /api/v1/chat
 */
router.use('/chat', chatRoutes);

/**
 * AI图片生成路由
 * 前缀: /api/v1/ai-image
 */
router.use('/ai-image', aiImageRoutes);

console.log('✅ All v1 routes registered');

export default router;
