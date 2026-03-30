import { Router } from 'express';
import authRoutes from './auth';
import batchRoutes from './batch';
import companyRoutes from './company';
import ossRoutes from './oss';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'API v1 is working!', version: '1.0.0' });
});

router.use('/auth', authRoutes);
router.use('/batches', batchRoutes);
router.use('/companies', companyRoutes);
router.use('/oss', ossRoutes);

console.log('✅ All v1 routes registered');

export default router;
