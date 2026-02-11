import { Router } from 'express';
import { getHomeData, getHotPosts } from '@/controllers/v1/homeController';

const router = Router();

// 获取首页数据
router.get('/data', getHomeData);

// 获取热门帖子
router.get('/hot-posts', getHotPosts);

export default router;
