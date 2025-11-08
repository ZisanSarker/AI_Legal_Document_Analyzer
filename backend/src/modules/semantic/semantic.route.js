import express from 'express';
import multer from 'multer';
import { semanticController } from './semantic.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/analyze', upload.single('file'), semanticController);

export default router;
