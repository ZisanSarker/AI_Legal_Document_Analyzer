import { Router } from 'express';
import { handlePreprocessing } from './preprocessing.controller.js';

const router = Router();

router.post('/preprocess', handlePreprocessing);

export default router;

