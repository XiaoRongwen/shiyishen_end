import { Request, Response, NextFunction } from 'express';
import { success, badRequest } from '../../utils/response';
import axios from 'axios';

/**
 * 通过微信授权码获取openid
 */
export const getWechatOpenId = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { code } = req.body;

    if (!code) {
      return badRequest(res, '缺少微信授权码');
    }

    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      console.error('微信配置缺失: WECHAT_APP_ID 或 WECHAT_APP_SECRET 未设置');
      return badRequest(res, '微信配置错误');
    }

    // 调用微信接口获取access_token和openid
    const wechatUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    
    const response = await axios.get(wechatUrl);
    
    if (response.data.errcode) {
      console.error('微信接口错误:', response.data);
      return badRequest(res, `微信授权失败: ${response.data.errmsg}`);
    }

    const { openid, access_token } = response.data;

    if (!openid) {
      return badRequest(res, '获取openid失败');
    }

    return success(res, { openid }, '获取openid成功');

  } catch (error) {
    console.error('获取微信openid失败:', error);
    next(error);
  }
};

/**
 * 获取微信授权URL
 */
export const getWechatAuthUrl = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const appId = process.env.WECHAT_APP_ID;
    
    if (!appId) {
      return badRequest(res, '微信配置错误');
    }

    // 当前页面URL作为回调地址
    const { redirectUri } = req.query;
    const encodedRedirectUri = encodeURIComponent(redirectUri as string || req.get('Referer') || '');
    
    // 构建微信授权URL
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=snsapi_base&state=feedback#wechat_redirect`;

    return success(res, { authUrl }, '获取授权URL成功');

  } catch (error) {
    console.error('获取微信授权URL失败:', error);
    next(error);
  }
};
