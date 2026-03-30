import { Request, Response, NextFunction } from 'express';
import { success, badRequest, notFound } from '../../utils/response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** 生成批次号：BATCH-YYYYMMDD-XXXX */
const generateBatchNo = (): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BATCH-${date}-${rand}`;
};

/** 新建批次 */
export const createBatch = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const userId = req.user?.userId;
  const { productName, productBatchNo, componentName, componentBatchNo } = req.body;

  if (!productName || !productBatchNo || !componentName || !componentBatchNo) {
    return badRequest(res, '请填写完整批次信息');
  }

  // 获取当前默认公司
  const uc = await prisma.userCompany.findFirst({ where: { userId: userId!, isDefault: true } });
  if (!uc) return badRequest(res, '请先绑定或选择公司');

  const batch = await prisma.batch.create({
    data: {
      batchNo: generateBatchNo(),
      productName, productBatchNo, componentName, componentBatchNo,
      userId: userId!,
      companyId: uc.companyId,
    },
  });

  return success(res, { batch }, '批次创建成功', 201);
};

/** 获取当前用户的批次列表 */
export const getMyBatches = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const userId = req.user?.userId;
  const { keyword, auditStatus, page = '1', pageSize = '20' } = req.query as Record<string, string>;

  // 获取当前默认公司
  const uc = await prisma.userCompany.findFirst({ where: { userId: userId!, isDefault: true } });
  if (!uc) return success(res, { batches: [], total: 0, page: 1, pageSize: 20 });

  const where: any = { userId, companyId: uc.companyId };
  if (auditStatus) where.auditStatus = auditStatus;
  if (keyword) {
    where.OR = [
      { productName: { contains: keyword } },
      { batchNo: { contains: keyword } },
      { componentName: { contains: keyword } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const [batches, total] = await Promise.all([
    prisma.batch.findMany({
      where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(pageSize),
      select: { id: true, batchNo: true, productName: true, productBatchNo: true, componentName: true, componentBatchNo: true, auditStatus: true, createdAt: true },
    }),
    prisma.batch.count({ where }),
  ]);

  return success(res, { batches, total, page: parseInt(page), pageSize: parseInt(pageSize) });
};

/** 删除批次（仅限待审核状态） */
export const deleteBatch = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const batch = await prisma.batch.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!batch) return notFound(res, '批次不存在');
    if (batch.auditStatus !== 'pending') return badRequest(res, '仅可删除待审核的批次');

    await prisma.batch.delete({ where: { id: parseInt(id) } });

    return success(res, null, '删除成功');
  } catch (error) {
    next(error);
  }
};
export const getBatchDetail = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const batch = await prisma.batch.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!batch) return notFound(res, '批次不存在');

    return success(res, { batch });
  } catch (error) {
    next(error);
  }
};

/** 上传照片（单张，指定分类） */
export const uploadPhoto = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { category, url } = req.body;

    if (!category || !url) return badRequest(res, '缺少分类或图片地址');
    if (category < 1 || category > 14) return badRequest(res, '无效的照片分类');

    const batch = await prisma.batch.findFirst({ where: { id: parseInt(id), userId } });
    if (!batch) return notFound(res, '批次不存在');

    const photo = await prisma.batchPhoto.create({
      data: { batchId: parseInt(id), category: parseInt(category), url },
    });

    return success(res, { photo }, '上传成功', 201);
  } catch (error) {
    next(error);
  }
};

/** 获取批次所有照片（按分类分组） */
export const getBatchPhotos = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const batch = await prisma.batch.findFirst({ where: { id: parseInt(id), userId } });
    if (!batch) return notFound(res, '批次不存在');

    const photos = await prisma.batchPhoto.findMany({
      where: { batchId: parseInt(id) },
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    });

    // 按分类分组
    const grouped: Record<number, typeof photos> = {};
    photos.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });

    return success(res, { grouped });
  } catch (error) {
    next(error);
  }
};

/** 删除照片 */
export const deletePhoto = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;
    const { id, photoId } = req.params;

    const batch = await prisma.batch.findFirst({ where: { id: parseInt(id), userId } });
    if (!batch) return notFound(res, '批次不存在');

    await prisma.batchPhoto.delete({ where: { id: parseInt(photoId) } });

    return success(res, null, '删除成功');
  } catch (error) {
    next(error);
  }
};

/** 批次统计（按状态分组计数） */
export const getBatchStats = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const userId = req.user?.userId;
  const uc = await prisma.userCompany.findFirst({ where: { userId: userId!, isDefault: true } });
  if (!uc) return success(res, { pending: 0, approved: 0, rejected: 0, total: 0 });

  const [pending, approved, rejected, total] = await Promise.all([
    prisma.batch.count({ where: { userId, companyId: uc.companyId, auditStatus: 'pending' } }),
    prisma.batch.count({ where: { userId, companyId: uc.companyId, auditStatus: 'approved' } }),
    prisma.batch.count({ where: { userId, companyId: uc.companyId, auditStatus: 'rejected' } }),
    prisma.batch.count({ where: { userId, companyId: uc.companyId } }),
  ]);

  return success(res, { pending, approved, rejected, total });
};

/** 审核批次（admin / auditor 可操作） */
export const auditBatch = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { auditStatus, auditRemark } = req.body;

    if (!['approved', 'rejected'].includes(auditStatus)) {
      return badRequest(res, '审核状态只能是 approved 或 rejected');
    }

    const batch = await prisma.batch.findUnique({ where: { id: parseInt(id) } });
    if (!batch) return notFound(res, '批次不存在');
    if (batch.auditStatus !== 'pending') return badRequest(res, '只能审核待审核状态的批次');

    const updated = await prisma.batch.update({
      where: { id: parseInt(id) },
      data: { auditStatus, auditRemark: auditRemark || null },
    });

    return success(res, { batch: updated }, '审核完成');
  } catch (error) {
    next(error);
  }
};

/** 获取所有批次（admin / auditor 可操作，支持按公司/状态筛选） */
export const getAllBatches = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { keyword, auditStatus, companyId, page = '1', pageSize = '20' } = req.query as Record<string, string>;

    const where: any = {};
    if (auditStatus) where.auditStatus = auditStatus;
    if (companyId) where.companyId = parseInt(companyId);
    if (keyword) {
      where.OR = [
        { productName: { contains: keyword } },
        { batchNo: { contains: keyword } },
        { componentName: { contains: keyword } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(pageSize),
        select: {
          id: true, batchNo: true, productName: true, productBatchNo: true,
          componentName: true, componentBatchNo: true, auditStatus: true,
          auditRemark: true, createdAt: true,
          user: { select: { id: true, nickname: true, avatar: true } },
          company: { select: { id: true, name: true } },
        },
      }),
      prisma.batch.count({ where }),
    ]);

    return success(res, { batches, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    next(error);
  }
};
