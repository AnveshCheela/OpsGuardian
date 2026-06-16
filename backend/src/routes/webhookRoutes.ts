import { Router } from 'express';
import { handleWebhook } from '../controllers/webhookController';
import { checkIdempotency } from '../middleware/idempotency';

const router = Router();

// Endpoint: POST /api/v1/webhooks/trigger
router.post('/trigger', checkIdempotency, handleWebhook);

export default router;
export { router as webhookRoutes };
