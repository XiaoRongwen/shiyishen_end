import { Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { config } from '@/config';
import { generateChatStream, ChatMessage, imageToBase64 } from '@/utils/ollama';

/**
 * 聊天控制器
 * 处理聊天会话和消息的相关操作
 */

/**
 * 创建新的聊天会话
 * POST /api/v1/chat/sessions
 */
export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, model } = req.body;
    // 从认证中间件设置的 req.user 中获取 userId
    const userId = (req as any).user?.userId;

    if (!userId) {
      console.error('创建会话失败: userId 未找到', {
        user: (req as any).user,
        headers: req.headers.authorization ? '有 Authorization 头' : '无 Authorization 头'
      });
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: '未授权，请先登录'
      });
      return;
    }

    if (!title || !model) {
      res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        errorMessage: '标题和模型不能为空'
      });
      return;
    }

    const session = await prisma.chatSession.create({
      data: {
        userId,
        title,
        model
      }
    });

    res.json({
      success: true,
      data: session,
      message: '聊天会话创建成功'
    });
  } catch (error: any) {
    console.error('创建聊天会话失败:', error.message);
    res.status(500).json({
      success: false,
      errorCode: 'CREATE_SESSION_ERROR',
      errorMessage: '创建聊天会话失败',
      message: error.message
    });
  }
};

/**
 * 获取用户的所有聊天会话列表
 * GET /api/v1/chat/sessions
 */
export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId) {
      console.error('获取会话列表失败: userId 未找到', {
        user: (req as any).user,
        headers: req.headers.authorization ? '有 Authorization 头' : '无 Authorization 头'
      });
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: '未授权，请先登录'
      });
      return;
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        model: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true }  // 只计数，不加载消息
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.chatSession.count({
      where: { userId }
    });

    res.json({
      success: true,
      data: sessions.map(s => ({
        id: s.id,
        title: s.title,
        model: s.model,
        summary: s.summary,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: s._count.messages
      })),
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      },
      message: `成功获取 ${sessions.length} 个聊天会话`
    });
  } catch (error: any) {
    console.error('获取聊天会话列表失败:', error.message);
    res.status(500).json({
      success: false,
      errorCode: 'GET_SESSIONS_ERROR',
      errorMessage: '获取聊天会话列表失败',
      message: error.message
    });
  }
};

/**
 * 获取特定聊天会话的详情和消息
 * GET /api/v1/chat/sessions/:sessionId
 */
export const getSessionDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: '未授权，请先登录'
      });
      return;
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: parseInt(sessionId) },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            files: {
              include: {
                file: {
                  select: {
                    id: true,
                    originalName: true,
                    filename: true,
                    mimetype: true,
                    size: true,
                    path: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!session) {
      res.status(404).json({
        success: false,
        errorCode: 'SESSION_NOT_FOUND',
        errorMessage: '聊天会话不存在'
      });
      return;
    }

    // 检查权限
    if (session.userId !== userId) {
      res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: '无权访问此会话'
      });
      return;
    }

    res.json({
      success: true,
      data: session,
      message: '成功获取聊天会话详情'
    });
  } catch (error: any) {
    console.error('获取聊天会话详情失败:', error.message);
    res.status(500).json({
      success: false,
      errorCode: 'GET_SESSION_ERROR',
      errorMessage: '获取聊天会话详情失败',
      message: error.message
    });
  }
};

/**
 * 添加消息到聊天会话
 * POST /api/v1/chat/sessions/:sessionId/messages
 */
export const addMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { role, content } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: '未授权，请先登录'
      });
      return;
    }

    if (!role || !content) {
      res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        errorMessage: '角色和内容不能为空'
      });
      return;
    }

    // 验证会话所有权
    const session = await prisma.chatSession.findUnique({
      where: { id: parseInt(sessionId) }
    });

    if (!session) {
      res.status(404).json({
        success: false,
        errorCode: 'SESSION_NOT_FOUND',
        errorMessage: '聊天会话不存在'
      });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: '无权访问此会话'
      });
      return;
    }

    const message = await prisma.chatMessage.create({
      data: {
        sessionId: parseInt(sessionId),
        role,
        content
      }
    });

    // 更新会话的 updatedAt
    await prisma.chatSession.update({
      where: { id: parseInt(sessionId) },
      data: { updatedAt: new Date() }
    });

    res.json({
      success: true,
      data: message,
      message: '消息添加成功'
    });
  } catch (error: any) {
    console.error('添加消息失败:', error.message);
    res.status(500).json({
      success: false,
      errorCode: 'ADD_MESSAGE_ERROR',
      errorMessage: '添加消息失败',
      message: error.message
    });
  }
};

/**
 * 更新聊天会话
 * PUT /api/v1/chat/sessions/:sessionId
 */
export const updateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { title, summary } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: '未授权，请先登录'
      });
      return;
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: parseInt(sessionId) }
    });

    if (!session) {
      res.status(404).json({
        success: false,
        errorCode: 'SESSION_NOT_FOUND',
        errorMessage: '聊天会话不存在'
      });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: '无权访问此会话'
      });
      return;
    }

    const updatedSession = await prisma.chatSession.update({
      where: { id: parseInt(sessionId) },
      data: {
        ...(title && { title }),
        ...(summary && { summary })
      }
    });

    res.json({
      success: true,
      data: updatedSession,
      message: '聊天会话更新成功'
    });
  } catch (error: any) {
    console.error('更新聊天会话失败:', error.message);
    res.status(500).json({
      success: false,
      errorCode: 'UPDATE_SESSION_ERROR',
      errorMessage: '更新聊天会话失败',
      message: error.message
    });
  }
};

/**
 * 删除聊天会话（包括关联文件）
 * DELETE /api/v1/chat/sessions/:sessionId
 */
export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: '未授权，请先登录'
      });
      return;
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: parseInt(sessionId) },
      include: {
        messages: {
          include: {
            files: {
              include: {
                file: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      res.status(404).json({
        success: false,
        errorCode: 'SESSION_NOT_FOUND',
        errorMessage: '聊天会话不存在'
      });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: '无权访问此会话'
      });
      return;
    }

    // 收集所有关联的文件
    const fileIds = new Set<number>();
    session.messages.forEach(msg => {
      msg.files.forEach(mf => {
        if (mf.file) {
          fileIds.add(mf.file.id);
        }
      });
    });

    // 删除物理文件
    if (fileIds.size > 0) {
      const fs = await import('fs/promises');
      const files = await prisma.file.findMany({
        where: { id: { in: Array.from(fileIds) } }
      });

      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error('删除文件失败:', file.path, err);
        }
      }

      // 删除数据库文件记录
      await prisma.file.deleteMany({
        where: { id: { in: Array.from(fileIds) } }
      });
    }

    // 删除会话（级联删除消息和关联）
    await prisma.chatSession.delete({
      where: { id: parseInt(sessionId) }
    });

    res.json({
      success: true,
      message: '聊天会话删除成功',
      deletedFiles: fileIds.size
    });
  } catch (error: any) {
    console.error('删除聊天会话失败:', error.message);
    res.status(500).json({
      success: false,
      errorCode: 'DELETE_SESSION_ERROR',
      errorMessage: '删除聊天会话失败',
      message: error.message
    });
  }
};

/**
 * 清除所有历史记录（删除所有会话和关联文件）
 * DELETE /api/v1/chat/sessions
 */
export const clearAllSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: '未授权，请先登录'
      });
      return;
    }

    // 查询所有会话及关联文件
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      include: {
        messages: {
          include: {
            files: {
              include: {
                file: true
              }
            }
          }
        }
      }
    });

    // 收集所有文件
    const fileIds = new Set<number>();
    sessions.forEach(session => {
      session.messages.forEach((msg: any) => {
        msg.files?.forEach((mf: any) => {
          if (mf.file) {
            fileIds.add(mf.file.id);
          }
        });
      });
    });

    // 删除物理文件
    if (fileIds.size > 0) {
      const fs = await import('fs/promises');
      const files = await prisma.file.findMany({
        where: { id: { in: Array.from(fileIds) } }
      });

      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error('删除文件失败:', file.path, err);
        }
      }

      // 删除数据库文件记录
      await prisma.file.deleteMany({
        where: { id: { in: Array.from(fileIds) } }
      });
    }

    // 删除所有会话（级联删除消息）
    await prisma.chatSession.deleteMany({
      where: { userId }
    });

    res.json({
      success: true,
      message: '所有历史记录已清除',
      deletedSessions: sessions.length,
      deletedFiles: fileIds.size
    });
  } catch (error: any) {
    console.error('清除历史记录失败:', error.message);
    res.status(500).json({
      success: false,
      errorCode: 'CLEAR_SESSIONS_ERROR',
      errorMessage: '清除历史记录失败',
      message: error.message
    });
  }
};

/**
 * 流式聊天（后端处理 AI 响应和消息保存）
 * POST /api/v1/chat/sessions/:sessionId/chat
 * 
 * LibreChat 风格实现：
 * 1. 验证会话所有权
 * 2. 保存用户消息到数据库（支持附带文件）
 * 3. 调用 Ollama API 获取流式响应（支持 vision 模型）
 * 4. 流式返回给前端
 * 5. 完成后保存 AI 消息到数据库（只保存一次）
 */
export const streamChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { message, fileId } = req.body; // 支持传入 fileId
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: '未授权，请先登录'
      });
      return;
    }

    if (!message || !message.trim()) {
      res.status(400).json({
        success: false,
        errorCode: 'MISSING_MESSAGE',
        errorMessage: '消息内容不能为空'
      });
      return;
    }

    // P0: 验证消息长度
    if (message.length > config.chat.maxMessageLength) {
      res.status(400).json({
        success: false,
        errorCode: 'MESSAGE_TOO_LONG',
        errorMessage: `消息长度不能超过 ${config.chat.maxMessageLength} 个字符`
      });
      return;
    }

    // 验证会话所有权
    const session = await prisma.chatSession.findUnique({
      where: { id: parseInt(sessionId) }
    });

    if (!session) {
      res.status(404).json({
        success: false,
        errorCode: 'SESSION_NOT_FOUND',
        errorMessage: '聊天会话不存在'
      });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: '无权访问此会话'
      });
      return;
    }

    const sessionIdNum = parseInt(sessionId);

    // 4. 查询文件记录（支持多文件）
    let fileRecords: any[] = [];
    if (fileId) {
      const fileIds = Array.isArray(fileId) ? fileId : [fileId];
      
      fileRecords = await prisma.file.findMany({
        where: { 
          id: { in: fileIds.map(id => Number(id)) },
          userId: userId // 只查询属于当前用户的文件
        }
      });

      if (fileRecords.length === 0) {
        res.status(404).json({
          success: false,
          errorCode: 'FILE_NOT_FOUND',
          errorMessage: '文件不存在或无权访问'
        });
        return;
      }
    }

    // 2. 先获取历史消息（不包含当前消息）
    const historyMessages = await prisma.chatMessage.findMany({
      where: { sessionId: sessionIdNum },
      orderBy: { createdAt: 'desc' },
      take: config.chat.contextMessageCount - 1, // 为当前消息留位置
      select: { 
        role: true, 
        content: true,
        files: {
          include: {
            file: {
              select: {
                path: true,
                mimetype: true
              }
            }
          }
        }
      }
    });

    // 3. 保存用户消息到数据库（支持多文件）
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: sessionIdNum,
        role: 'user',
        content: message,
        // 创建多文件关联
        files: {
          create: fileRecords.map(file => ({
            fileId: file.id
          }))
        }
      }
    });

    // 4. 构建完整上下文（历史 + 当前消息），包含图片
    const contextMessages: ChatMessage[] = [];
    
    // 添加历史消息
    for (const msg of historyMessages.reverse()) {
      const chatMsg: ChatMessage = {
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      };
      
      // 如果历史消息有文件，处理所有文件
      if (msg.files && msg.files.length > 0) {
        const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        const images: string[] = [];
        
        for (const msgFile of msg.files) {
          const file = msgFile.file;
          if (file && file.path && file.mimetype && imageTypes.includes(file.mimetype)) {
            try {
              const base64Image = await imageToBase64(file.path);
              images.push(base64Image);
            } catch (err) {
              console.error('转换历史图片失败:', err);
            }
          }
        }
        
        if (images.length > 0) {
          chatMsg.images = images;
        }
      }
      
      contextMessages.push(chatMsg);
    }
    
    // 添加当前消息
    const currentMessage: ChatMessage = { 
      role: 'user', 
      content: message 
    };
    
    // 处理多文件内容
    if (fileRecords.length > 0) {
      const { processFiles } = await import('../../utils/fileProcessor');
      const { images, textContents, otherFiles } = await processFiles(fileRecords);
      
      // 组合消息内容
      const contentParts: string[] = [];
      
      if (textContents.length > 0) {
        contentParts.push('文件内容：\n' + textContents.join('\n\n'));
      }
      
      if (otherFiles.length > 0) {
        contentParts.push('附件：' + otherFiles.join(', '));
      }
      
      if (contentParts.length > 0) {
        currentMessage.content = contentParts.join('\n\n') + '\n\n' + message;
      }
      
      if (images.length > 0) {
        currentMessage.images = images;
      }
    }
    
    contextMessages.push(currentMessage);

    // 5. 调用 Ollama API
    let aiResponse;
    try {
      aiResponse = await generateChatStream(session.model, contextMessages);
    } catch (fetchError: any) {
      console.error('Ollama 连接失败:', fetchError.message);
      // 此时还没发送响应头，可以返回 JSON
      res.status(503).json({
        success: false,
        errorCode: 'OLLAMA_CONNECTION_ERROR',
        errorMessage: 'AI 服务连接失败，请检查 Ollama 是否运行',
        message: fetchError.message
      });
      return;
    }

    // 6. 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let fullResponse = '';
    
    // 7. 流式读取 Ollama 响应（使用 Web Streams API）
    if (!aiResponse.body) {
      throw new Error('响应体为空');
    }

    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder();

    // P1: 流式响应超时处理
    const streamTimeout = setTimeout(() => {
      console.error('❌ 流式响应超时');
      reader.cancel();
      res.write(`data: ${JSON.stringify({ error: '响应超时' })}\n\n`);
      res.end();
    }, config.ollama.streamTimeout);

    // P1: 检测客户端断开
    req.on('close', () => {
      console.log('⚠️ 客户端断开连接，取消流式读取');
      clearTimeout(streamTimeout);
      reader.cancel();
    });

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ 流式读取完成，完整响应长度:', fullResponse.length);
          clearTimeout(streamTimeout);
          break;
        }

        // 解码数据块
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              // /api/chat 端点返回 message.content，/api/generate 返回 response
              const content = json.message?.content || json.response;
              if (content) {
                fullResponse += content;
                // 流式发送给前端
                res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 8. 使用事务保存 AI 响应和更新会话
      if (fullResponse) {
        await prisma.$transaction([
          prisma.chatMessage.create({
            data: {
              sessionId: sessionIdNum,
              role: 'assistant',
              content: fullResponse
            }
          }),
          prisma.chatSession.update({
            where: { id: sessionIdNum },
            data: { updatedAt: new Date() }
          })
        ]);
        console.log('✅ AI 响应已保存到数据库');
      } else {
        console.warn('⚠️ AI 返回了空响应');
      }

      // 发送完成信号
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (streamError: any) {
      console.error('❌ 流式读取错误:', streamError);
      clearTimeout(streamTimeout);
      res.write(`data: ${JSON.stringify({ error: '流式读取失败: ' + streamError.message })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error('❌ 流式聊天失败:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // 如果响应头已发送，只能通过 SSE 发送错误
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({
        success: false,
        errorCode: 'STREAM_CHAT_ERROR',
        errorMessage: '流式聊天失败',
        message: error.message
      });
    }
  }
};
