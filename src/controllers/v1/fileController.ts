import { Request, Response, NextFunction } from 'express';
import { success, badRequest, notFound, error, unauthorized } from '@/utils/response';
import { prisma } from '@/utils/database';
import path from 'path';
import fs from 'fs';
import { config } from '@/config';

/**
 * 上传文件
 */
export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    if (!req.file) {
      return badRequest(res, '没有上传文件');
    }

    const userId = req.user?.userId;
    if (!userId) {
      return unauthorized(res, '请先登录');
    }

    const fileRecord = await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        userId: userId
      }
    });

    return success(res, {
      originalName: fileRecord.originalName,
      filename: fileRecord.filename,
      size: fileRecord.size,
      mimetype: fileRecord.mimetype,
      url: `/static/${fileRecord.filename}`,
    }, '文件上传成功', 200);

  } catch (err) {
    next(err);
  }
};

// getFile 函数已移除 - 使用静态资源访问替代

/**
 * 删除文件
 */
export const deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return badRequest(res, '无效的文件ID');
    }

    // 查找文件记录
    const fileRecord = await prisma.file.findUnique({
      where: { id: Number(id) }
    });

    if (!fileRecord) {
      return notFound(res, '文件不存在');
    }

    // 检查文件所有权 (req.user 由 authenticateToken 中间件保证存在)
    if (fileRecord.userId !== req.user!.userId) {
      return error(res, '无权删除此文件', 403);
    }

    // 删除物理文件
    const filePath = path.join(process.cwd(), config.upload.dir, fileRecord.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await prisma.file.delete({
      where: { id: Number(id) }
    });

    return success(res, null, '文件删除成功');

  } catch (err) {
    next(err);
  }
};

