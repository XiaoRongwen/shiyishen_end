import OSS from 'ali-oss';
import { config } from '../config';

let client: OSS | null = null;

const getClient = (): OSS => {
  if (!client) {
    client = new OSS({
      region: config.oss.region,
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
      bucket: config.oss.bucket,
    });
  }
  return client;
};

/**
 * 生成预签名上传 URL（PUT 方式，前端直传）
 * @param objectKey  OSS 对象路径，如 batch/123/photo.jpg
 * @param expires    有效秒数，默认 300s
 */
export const generatePresignedPutUrl = (objectKey: string, contentType = 'image/jpeg', expires = 300): string => {
  const oss = getClient();
  return oss.signatureUrl(objectKey, {
    method: 'PUT',
    expires,
    'Content-Type': contentType,
  });
};

/**
 * 拼接文件的公开访问 URL
 */
export const getPublicUrl = (objectKey: string): string => {
  if (config.oss.cdnDomain) {
    return `https://${config.oss.cdnDomain}/${objectKey}`;
  }
  return `https://${config.oss.bucket}.${config.oss.region}.aliyuncs.com/${objectKey}`;
};

/**
 * 删除 OSS 对象
 */
export const deleteObject = async (objectKey: string): Promise<void> => {
  const oss = getClient();
  await oss.delete(objectKey);
};
