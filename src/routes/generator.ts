import { Router } from 'express';
import {
  ImageArrayGenerator,
  PageImageGenerator,
  SingalImageGenerator,
} from '@/controllers/generator';

const router = Router();
router.post('/page', PageImageGenerator);
router.post('/array', ImageArrayGenerator);
// router.post('/singal', SingalImageGenerator);
export default router;
