import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { success, badRequest } from '../../utils/response';
import { generatePresignedPutUrl, getPublicUrl } from '../../utils/oss';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
};

/**
 * POST /oss/presign
 * 返回预签名上传 URL，前端拿到后直接 PUT 到 OSS
 * body: { filename: string, contentType: string, batchId?: number }
 */
export const getPresignUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { filename, contentType, batchId } = req.body;

    if (!filename || !contentType) {
      return badRequest(res, '缺少 filename 或 contentType');
    }

    const ext = ALLOWED_TYPES[contentType];
    if (!ext) {
      return badRequest(res, '不支持的文件类型，仅允许 jpg/png/webp');
    }

    // 构造 OSS 对象路径：batch/{batchId}/{uuid}.{ext}
    const folder = batchId ? `batch/${batchId}` : 'uploads';
    const objectKey = `${folder}/${uuidv4()}.${ext}`;

    const uploadUrl = generatePresignedPutUrl(objectKey, contentType);
    const publicUrl = getPublicUrl(objectKey);

    return success(res, { uploadUrl, publicUrl, objectKey });
  } catch (error) {
    next(error);
  }
};
