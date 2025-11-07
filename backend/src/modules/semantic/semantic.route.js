import express from 'express';
import { semanticController } from './semantic.controller.js';

const router = express.Router();
router.post('/analyze', semanticController);

export default router;
