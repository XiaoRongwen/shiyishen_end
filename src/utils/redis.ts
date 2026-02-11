import { createClient, RedisClientType } from 'redis';
import { config } from '@/config';

let redisClient: RedisClientType | null = null;

/**
 * 获取或创建Redis客户端
 */
export const getRedisClient = async (): Promise<RedisClientType> => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: config.redis.url,
      password: config.redis.password || undefined,
      database: config.redis.db,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis 连接失败，已超过最大重试次数');
            return new Error('Redis 连接失败');
          }
          return retries * 100;
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis 客户端错误:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis 连接成功');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ 创建 Redis 客户端失败:', error);
    throw error;
  }
};

/**
 * 关闭Redis连接
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
};

/**
 * 验证码在Redis中的键前缀
 */
const CAPTCHA_KEY_PREFIX = 'captcha:';

/**
 * 存储验证码到Redis
 */
export const storeCaptcha = async (sessionId: string, captchaText: string, expirySeconds: number = 300): Promise<void> => {
  try {
    const client = await getRedisClient();
    const key = `${CAPTCHA_KEY_PREFIX}${sessionId}`;
    await client.setEx(key, expirySeconds, captchaText.toLowerCase());
  } catch (error) {
    console.error('❌ 存储验证码失败:', error);
  }
};

/**
 * 从Redis获取验证码
 */
export const getCaptcha = async (sessionId: string): Promise<string | null> => {
  try {
    const client = await getRedisClient();
    const key = `${CAPTCHA_KEY_PREFIX}${sessionId}`;
    return await client.get(key);
  } catch (error) {
    console.error('❌ 获取验证码失败:', error);
    return null;
  }
};

/**
 * 从Redis删除验证码
 */
export const deleteCaptcha = async (sessionId: string): Promise<void> => {
  try {
    const client = await getRedisClient();
    const key = `${CAPTCHA_KEY_PREFIX}${sessionId}`;
    await client.del(key);
  } catch (error) {
    console.error('❌ 删除验证码失败:', error);
  }
};
