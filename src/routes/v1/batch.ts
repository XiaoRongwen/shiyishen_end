import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware';
import {
  createBatch, getMyBatches, getBatchDetail, deleteBatch,
  uploadPhoto, getBatchPhotos, deletePhoto, getBatchStats,
  auditBatch, getAllBatches,
} from '../../controllers/v1/batchController';
import { exportBatchPdf } from '../../controllers/v1/exportController';

const router = Router();

router.use(authenticateToken);

// 普通用户接口
router.get('/stats', getBatchStats);
router.post('/', createBatch);
router.get('/', getMyBatches);
router.get('/:id', getBatchDetail);
router.delete('/:id', deleteBatch);
router.post('/:id/photos', uploadPhoto);
router.get('/:id/photos', getBatchPhotos);
router.delete('/:id/photos/:photoId', deletePhoto);
router.get('/:id/export-pdf', exportBatchPdf);

// admin / auditor 专属接口
router.get('/admin/all', requireRole('admin', 'auditor'), getAllBatches);
router.patch('/:id/audit', requireRole('admin', 'auditor'), auditBatch);

// admin 专属：删除他人照片（管理员编辑权限）
router.delete('/admin/:id/photos/:photoId', requireRole('admin'), deletePhoto);

export default router;
