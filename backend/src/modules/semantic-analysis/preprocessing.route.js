import { Router } from "express";
import { preprocessText } from './preprocessing.controller.js';

const router = Router();

router.post('/', preprocessText);

export default router;
