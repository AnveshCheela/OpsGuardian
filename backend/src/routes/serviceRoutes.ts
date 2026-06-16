import { Router } from 'express';
import { 
  getServices, 
  createService, 
  deleteService, 
  updateServiceStatus, 
} from '../controllers/serviceController';

const router = Router();

router.get('/', getServices);
router.post('/', createService);
router.delete('/:id', deleteService);
router.patch('/:id/status', updateServiceStatus);

export default router;
export { router as serviceRoutes };

