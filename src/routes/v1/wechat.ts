import { Router } from 'express';
import { getWechatOpenId, getWechatAuthUrl } from '@/controllers/v1/wechatController';

const router = Router();

/**
 * 微信相关路由
 * 前缀: /api/v1/wechat
 */

/**
 * GET /api/v1/wechat/auth-url
 * 获取微信授权URL (公开路由)
 * 用于前端跳转进行微信登录
 */
router.get('/auth-url', getWechatAuthUrl);

/**
 * POST /api/v1/wechat/openid
 * 通过授权码获取openid (公开路由)
 * 请求体: { code: string } - 微信授权码
 * 返回: { openid: string }
 */
router.post('/openid', getWechatOpenId);

export default router;
