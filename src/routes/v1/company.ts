import { Router } from 'express';
import { authenticateToken } from '../../middleware/authMiddleware';
import { createCompany, joinCompany, getMyCompanies, switchCompany, getCurrentCompany, leaveCompany } from '../../controllers/v1/companyController';

const router = Router();
router.use(authenticateToken);

router.post('/', createCompany);
router.post('/join', joinCompany);
router.get('/', getMyCompanies);
router.get('/current', getCurrentCompany);
router.post('/switch', switchCompany);
router.post('/leave', leaveCompany);

export default router;
