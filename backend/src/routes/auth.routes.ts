import { Router } from 'express';
import { signup, login, getMe, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, getMe);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
