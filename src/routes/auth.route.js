import { Router } from 'express';

import register from '../auth/auth.controller.js';

const router = Router();

router.post('/register', register);

export default router;
