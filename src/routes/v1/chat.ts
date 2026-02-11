import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSessionDetail,
  addMessage,
  updateSession,
  deleteSession,
  clearAllSessions,
  streamChat
} from '@/controllers/v1/chatController';
import { authenticateToken } from '@/middleware/authMiddleware';

const router = Router();

/**
 * ============================================
 * 聊天管理路由
 * 前缀: /api/v1/chat
 * 所有路由都需要认证
 * ============================================
 */

/**
 * POST /api/v1/chat/sessions
 * 创建新的聊天会话
 * 请求体：
 *   - title: 会话标题
 *   - model: 使用的模型名称
 * 返回：
 *   - data: 创建的会话对象
 */
router.post('/sessions', authenticateToken, createSession);

/**
 * GET /api/v1/chat/sessions
 * 获取用户的所有聊天会话列表
 * 查询参数：
 *   - limit: 每页数量（默认20）
 *   - offset: 偏移量（默认0）
 * 返回：
 *   - data: 会话列表
 *   - pagination: 分页信息
 */
router.get('/sessions', authenticateToken, getSessions);

/**
 * GET /api/v1/chat/sessions/:sessionId
 * 获取特定聊天会话的详情和所有消息
 * 参数：
 *   - sessionId: 会话ID
 * 返回：
 *   - data: 会话详情和消息列表
 */
router.get('/sessions/:sessionId', authenticateToken, getSessionDetail);

/**
 * POST /api/v1/chat/sessions/:sessionId/messages
 * 添加消息到聊天会话
 * 参数：
 *   - sessionId: 会话ID
 * 请求体：
 *   - role: 消息角色 ('user' 或 'assistant')
 *   - content: 消息内容
 * 返回：
 *   - data: 创建的消息对象
 */
router.post('/sessions/:sessionId/messages', authenticateToken, addMessage);

/**
 * PUT /api/v1/chat/sessions/:sessionId
 * 更新聊天会话信息
 * 参数：
 *   - sessionId: 会话ID
 * 请求体：
 *   - title: 会话标题（可选）
 *   - summary: 会话摘要（可选）
 * 返回：
 *   - data: 更新后的会话对象
 */
router.put('/sessions/:sessionId', authenticateToken, updateSession);

/**
 * DELETE /api/v1/chat/sessions/:sessionId
 * 删除单个聊天会话（包括关联文件）
 * 
 * 权限：需要登录
 * 
 * 返回：
 *   - message: 删除成功消息
 *   - deletedFiles: 删除的文件数量
 */
router.delete('/sessions/:sessionId', authenticateToken, deleteSession);

/**
 * DELETE /api/v1/chat/sessions
 * 清除所有历史记录（删除所有会话和关联文件）
 * 
 * 权限：需要登录
 * 
 * 返回：
 *   - deletedSessions: 删除的会话数量
 *   - deletedFiles: 删除的文件数量
 */
router.delete('/sessions', authenticateToken, clearAllSessions);

/**
 * POST /api/v1/chat/sessions/:sessionId/chat
 * 流式聊天（后端处理 AI 响应和消息保存）
 * 参数：
 *   - sessionId: 会话ID
 * 请求体：
 *   - message: 用户消息
 * 返回：
 *   - 流式 SSE 响应，包含 AI 回复的每个 chunk
 */
router.post('/sessions/:sessionId/chat', authenticateToken, streamChat);

export default router;
