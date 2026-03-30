import { Request, Response, NextFunction } from 'express';
import { success, badRequest, notFound } from '../../utils/response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** 生成公司邀请码 */
const generateCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/** 创建公司（同名时返回已存在的公司信息，让前端决定是加入还是新建） */
export const createCompany = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const userId = req.user?.userId;
  const { name, forceCreate } = req.body;
  if (!name) return badRequest(res, '请输入公司名称');

  // 检查同名
  const existing = await prisma.company.findFirst({ where: { name } });
  if (existing && !forceCreate) {
    // 检查是否已加入
    const joined = await prisma.userCompany.findUnique({
      where: { userId_companyId: { userId: userId!, companyId: existing.id } }
    });
    return success(res, {
      conflict: true,
      company: existing,
      alreadyJoined: !!joined
    }, '存在同名组织');
  }

  let code = generateCode();
  while (await prisma.company.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const company = await prisma.company.create({ data: { name, code } });
  const count = await prisma.userCompany.count({ where: { userId: userId! } });
  await prisma.userCompany.create({
    data: { userId: userId!, companyId: company.id, role: 'owner', isDefault: count === 0 }
  });
  if (count === 0) {
    await prisma.userCompany.updateMany({
      where: { userId: userId!, companyId: { not: company.id } },
      data: { isDefault: false }
    });
  }

  return success(res, { conflict: false, company }, '组织创建成功', 201);
};

/** 通过邀请码加入公司 */
export const joinCompany = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const userId = req.user?.userId;
  const { code } = req.body;
  if (!code) return badRequest(res, '请输入邀请码');

  const company = await prisma.company.findUnique({ where: { code: code.toUpperCase() } });
  if (!company) return notFound(res, '邀请码无效');

  const exists = await prisma.userCompany.findUnique({
    where: { userId_companyId: { userId: userId!, companyId: company.id } }
  });
  if (exists) return badRequest(res, '已加入该公司');

  // 检查是否有其他公司，没有则设为默认
  const count = await prisma.userCompany.count({ where: { userId: userId! } });
  await prisma.userCompany.create({
    data: { userId: userId!, companyId: company.id, role: 'member', isDefault: count === 0 }
  });

  return success(res, { company }, '加入成功', 201);
};

/** 获取我的公司列表 */
export const getMyCompanies = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const userId = req.user?.userId;
  const list = await prisma.userCompany.findMany({
    where: { userId: userId! },
    include: { company: true },
    orderBy: { joinedAt: 'asc' }
  });

  const companies = list.map(uc => ({
    ...uc.company,
    role: uc.role,
    isDefault: uc.isDefault
  }));

  return success(res, { companies });
};

/** 切换当前公司 */
export const switchCompany = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const userId = req.user?.userId;
  const { companyId } = req.body;
  if (!companyId) return badRequest(res, '缺少公司ID');

  const uc = await prisma.userCompany.findUnique({
    where: { userId_companyId: { userId: userId!, companyId: parseInt(companyId) } }
  });
  if (!uc) return badRequest(res, '未加入该公司');

  await prisma.userCompany.updateMany({ where: { userId: userId! }, data: { isDefault: false } });
  await prisma.userCompany.update({
    where: { userId_companyId: { userId: userId!, companyId: parseInt(companyId) } },
    data: { isDefault: true }
  });

  return success(res, null, '切换成功');
};

/** 获取当前默认公司 */
export const getCurrentCompany = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const userId = req.user?.userId;
  const uc = await prisma.userCompany.findFirst({
    where: { userId: userId!, isDefault: true },
    include: { company: true }
  });

  return success(res, { company: uc ? { ...uc.company, role: uc.role } : null });
};

/** 解绑组织 */
export const leaveCompany = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const userId = req.user?.userId;
  const { companyId } = req.body;
  if (!companyId) return badRequest(res, '缺少组织ID');

  const uc = await prisma.userCompany.findUnique({
    where: { userId_companyId: { userId: userId!, companyId: parseInt(companyId) } }
  });
  if (!uc) return badRequest(res, '未加入该组织');

  await prisma.userCompany.delete({
    where: { userId_companyId: { userId: userId!, companyId: parseInt(companyId) } }
  });

  // 如果解绑的是默认组织，自动切换到第一个
  if (uc.isDefault) {
    const next = await prisma.userCompany.findFirst({ where: { userId: userId! } });
    if (next) await prisma.userCompany.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return success(res, null, '已解绑');
};
