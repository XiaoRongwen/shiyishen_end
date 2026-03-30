/**
 * PDF 导出控制器
 *
 * 中文字体配置：
 *   将 NotoSansSC-Regular.ttf 放到 src/assets/fonts/ 目录下即可支持中文。
 *   下载地址：https://github.com/googlefonts/noto-cjk/releases
 *   选择 NotoSansCJKsc-Regular.otf，重命名为 NotoSansSC-Regular.ttf 放入目录。
 *   没有字体文件时 PDF 仍可生成，但中文显示为方块。
 */
import { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_NAMES: Record<number, string> = {
  1:  '原料验收',      2:  '原料检测',
  3:  '领料过程',      4:  '拆包过程',
  5:  '配料记录',      6:  '生产投料记录',
  7:  '关键点拍摄记录', 8:  '生产环节1',
  9:  '生产现场/生产记录', 10: '入库照片',
  11: '检测照片',      12: '产品标签照片',
  13: '运输环节照片',  14: '留样照片',
};

const AUDIT_LABEL: Record<string, string> = {
  pending: '待审核', approved: '已通过', rejected: '已拒绝',
};

const PAGE_W  = 595.28;
const PAGE_H  = 841.89;
const MARGIN  = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
// 单张图片最大高度
const MAX_IMG_H = 380;

/** 下载远程图片为 Buffer，并发限制由调用方控制 */
const fetchImageBuffer = async (url: string): Promise<Buffer | null> => {
  try {
    const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    return Buffer.from(resp.data);
  } catch {
    return null;
  }
};

/**
 * 计算图片在 fit 模式下的实际渲染尺寸
 * pdfkit fit 保持宽高比，取宽/高中较小的缩放比
 */
function calcFitSize(
  imgW: number, imgH: number,
  maxW: number, maxH: number
): { w: number; h: number } {
  const scale = Math.min(maxW / imgW, maxH / imgH, 1);
  return { w: imgW * scale, h: imgH * scale };
}

/**
 * 在指定页面绘制水印（不影响当前 doc.y，完全用绝对坐标）
 */
function drawWatermark(doc: PDFKit.PDFDocument, text: string) {
  doc.save();
  doc.fillColor('#cccccc').fillOpacity(0.18).fontSize(40);
  // 3x3 网格平铺
  const positions = [
    [PAGE_W * 0.25, PAGE_H * 0.25],
    [PAGE_W * 0.75, PAGE_H * 0.25],
    [PAGE_W * 0.5,  PAGE_H * 0.5 ],
    [PAGE_W * 0.25, PAGE_H * 0.75],
    [PAGE_W * 0.75, PAGE_H * 0.75],
  ];
  for (const [cx, cy] of positions) {
    doc.save();
    doc.translate(cx, cy).rotate(-45);
    doc.text(text, -100, -20, { width: 200, align: 'center', lineBreak: false });
    doc.restore();
  }
  doc.restore();
}

/**
 * 在当前页绘制分类标题栏，返回标题结束后的 y 坐标
 */
function drawCategoryHeader(
  doc: PDFKit.PDFDocument,
  catName: string,
  isContinued = false,
  startY = MARGIN
): number {
  const label = isContinued ? `${catName}（续）` : catName;
  doc.fontSize(isContinued ? 13 : 16)
     .fillColor(isContinued ? '#999' : '#333')
     .text(label, MARGIN, startY, { width: CONTENT_W });
  const lineY = doc.y + 4;
  doc.moveTo(MARGIN, lineY)
     .lineTo(PAGE_W - MARGIN, lineY)
     .strokeColor('#FF6B35').lineWidth(1.5).stroke();
  return lineY + 12;
}

/** GET /api/v1/batches/:id/export-pdf */
export const exportBatchPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId  = req.user?.userId;
    const batchId = parseInt(req.params.id);

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, userId },
      include: { company: true },
    });
    if (!batch) {
      res.status(404).json({ success: false, message: '批次不存在' });
      return;
    }

    const photos = await prisma.batchPhoto.findMany({
      where: { batchId },
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    });

    const grouped: Record<number, string[]> = {};
    photos.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p.url);
    });

    const activeCats = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    if (activeCats.length === 0) {
      res.status(400).json({ success: false, message: '该批次暂无照片' });
      return;
    }

    // ── 预下载所有图片（并发，最多 5 个同时） ──────────────
    const allUrls = activeCats.flatMap(c => grouped[c]);
    const bufferMap = new Map<string, Buffer | null>();

    const CONCURRENCY = 5;
    for (let i = 0; i < allUrls.length; i += CONCURRENCY) {
      const chunk = allUrls.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map(url => fetchImageBuffer(url)));
      chunk.forEach((url, idx) => bufferMap.set(url, results[idx]));
    }

    // ── 初始化 PDF ──────────────────────────────────────────
    const fontPath  = path.join(__dirname, '../../assets/fonts/NotoSansSC-Regular.ttf');
    const fontExists = fs.existsSync(fontPath);

    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, autoFirstPage: true });
    if (fontExists) {
      doc.registerFont('Chinese', fontPath);
      doc.font('Chinese');
    }

    const exportTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/[/:]/g, '-').replace(/\s/g, '_');
    const rawFilename = `${batch.productName}_${batch.componentName}_${exportTime}.pdf`;
    const safeFilename = encodeURIComponent(rawFilename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${safeFilename}`);
    doc.pipe(res);

    // ── 封面 ────────────────────────────────────────────────
    const auditLabel = AUDIT_LABEL[batch.auditStatus] || batch.auditStatus;
    let y = 140;

    doc.fontSize(22).fillColor('#333').text(batch.productName, MARGIN, y, { align: 'center', width: CONTENT_W });
    y = doc.y + 12;
    doc.fontSize(13).fillColor('#555').text(`批次号：${batch.batchNo}`, MARGIN, y, { align: 'center', width: CONTENT_W });
    y = doc.y + 6;
    doc.text(`计划批次：${batch.productBatchNo}`, MARGIN, y, { align: 'center', width: CONTENT_W });
    y = doc.y + 4;
    doc.text(`组件名称：${batch.componentName}`, MARGIN, y, { align: 'center', width: CONTENT_W });
    y = doc.y + 4;
    doc.text(`组件批次：${batch.componentBatchNo}`, MARGIN, y, { align: 'center', width: CONTENT_W });
    y = doc.y + 16;
    doc.fontSize(14).fillColor('#FF6B35').text(`审核状态：${auditLabel}`, MARGIN, y, { align: 'center', width: CONTENT_W });
    y = doc.y + 16;
    doc.fontSize(12).fillColor('#888').text(`所属公司：${batch.company.name}`, MARGIN, y, { align: 'center', width: CONTENT_W });
    y = doc.y + 4;
    doc.text(`导出时间：${new Date().toLocaleString('zh-CN')}`, MARGIN, y, { align: 'center', width: CONTENT_W });

    drawWatermark(doc, batch.company.name);

    // ── 各分类 ───────────────────────────────────────────────
    for (const catId of activeCats) {
      const catName = CATEGORY_NAMES[catId] || `分类${catId}`;
      const urls    = grouped[catId];

      doc.addPage();
      drawWatermark(doc, batch.company.name);
      let curY = drawCategoryHeader(doc, catName, false);

      for (let i = 0; i < urls.length; i++) {
        const imgBuf = bufferMap.get(urls[i]) ?? null;

        const LABEL_H = 20; // 序号文字高度
        const IMG_GAP = 12; // 图片间距

        // 先算出这张图实际渲染高度，再决定是否换页
        let actualW = CONTENT_W;
        let actualH = MAX_IMG_H;
        if (imgBuf) {
          const { w: rw, h: rh } = getImageDimensions(imgBuf);
          const fit = calcFitSize(rw, rh, CONTENT_W, MAX_IMG_H);
          actualW = fit.w;
          actualH = fit.h;
        }

        // 当前页剩余空间不够放序号 + 图片，才换页
        const neededH = LABEL_H + 4 + actualH + IMG_GAP;
        if (curY + neededH > PAGE_H - MARGIN) {
          doc.addPage();
          drawWatermark(doc, batch.company.name);
          curY = drawCategoryHeader(doc, catName, true);
        }

        // 绘制序号
        doc.fontSize(11).fillColor('#666')
           .text(`图片 ${i + 1} / ${urls.length}`, MARGIN, curY, { width: CONTENT_W });
        curY = doc.y + 4;

        if (imgBuf) {
          try {
            doc.image(imgBuf, MARGIN, curY, {
              fit: [CONTENT_W, MAX_IMG_H],
              align: 'center',
            });

            // 水印叠加在图片上（图片 align:center，算出实际左边起点）
            const imgX = MARGIN + (CONTENT_W - actualW) / 2;
            drawImageWatermark(doc, batch.company.name, imgX, curY, actualW, actualH);

            curY += actualH + IMG_GAP;
          } catch {
            doc.fontSize(10).fillColor('#f00').text('[图片加载失败]', MARGIN, curY, { width: CONTENT_W });
            curY = doc.y + 8;
          }
        } else {
          doc.fontSize(10).fillColor('#f00').text('[图片下载失败]', MARGIN, curY, { width: CONTENT_W });
          curY = doc.y + 8;
        }
      }
    }

    doc.end();
  } catch (err) {
    next(err);
  }
};

/**
 * 在指定图片区域上叠加水印（仅覆盖图片范围）
 */
function drawImageWatermark(
  doc: PDFKit.PDFDocument,
  text: string,
  imgX: number, imgY: number,
  imgW: number, imgH: number,
) {
  doc.save();
  doc.fillColor('#ffffff').fillOpacity(0.35).fontSize(Math.min(imgW / 6, 32));
  const cx = imgX + imgW / 2;
  const cy = imgY + imgH / 2;
  doc.translate(cx, cy).rotate(-35);
  doc.text(text, -imgW / 2, -16, { width: imgW, align: 'center', lineBreak: false });
  doc.restore();
}

/**
 * 从图片 Buffer 读取原始宽高（支持 JPEG / PNG）
 * 用于精确计算 fit 后的实际渲染高度，避免坐标偏移
 */
function getImageDimensions(buf: Buffer): { w: number; h: number } {
  try {
    // PNG: 偏移 16 开始是宽高各 4 字节
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      if (w > 0 && h > 0) return { w, h };
    }
    // JPEG: 扫描 SOF0/SOF2 marker
    let offset = 2;
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xFF) break;
      const marker = buf[offset + 1];
      const segLen  = buf.readUInt16BE(offset + 2);
      if (marker === 0xC0 || marker === 0xC2) {
        const h = buf.readUInt16BE(offset + 5);
        const w = buf.readUInt16BE(offset + 7);
        if (w > 0 && h > 0) return { w, h };
      }
      offset += 2 + segLen;
    }
  } catch { /* ignore */ }
  return { w: 1, h: 1 };
}