import { Router } from 'express';
import { ImageGenerator } from '@/controllers/generator';

const router = Router();
// router.get('/', ImageGenerator);
router.post('/', ImageGenerator);
export default router;
