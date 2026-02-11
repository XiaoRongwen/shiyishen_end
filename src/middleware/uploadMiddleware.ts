import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { config } from '@/config';

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 保留原文件名+时间戳
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    // 使用 Buffer 正确处理中文文件名
    const decodedName = Buffer.from(nameWithoutExt, 'latin1').toString('utf8');
    // 清理文件名中的特殊字符，只保留字母、数字、中文、下划线和连字符
    const cleanName = decodedName.replace(/[^\w\u4e00-\u9fa5-]/g, '_');
    cb(null, `${cleanName}_${timestamp}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  
  // 获取最新的允许类型列表
  const allowedTypes = config.upload.allowedTypes;
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}。允许的类型: ${allowedTypes.join(', ')}`));
  }
};

// 创建 multer 实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize
  }
});

// 单文件上传中间件
export const uploadSingle = (fieldName: string = 'file') => {
  return upload.single(fieldName);
};

// 多文件上传中间件
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};

// 错误处理中间件
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `文件大小超过限制 (${config.upload.maxFileSize / 1024 / 1024}MB)`,
        timestamp: new Date().toISOString()
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超过限制',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  if (error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  next(error);
};
