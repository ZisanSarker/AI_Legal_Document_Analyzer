import { Router } from "express";
import { extractData } from "./document.controller.js";
import multer from "multer";
const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/extract", upload.single("file"), extractData);

export default router;
