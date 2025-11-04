import { Router } from 'express';
import { handleSemanticAnalysis } from './semantic.controller.js';

const router = Router();

router.post('/analyze', handleSemanticAnalysis);

export default router;

