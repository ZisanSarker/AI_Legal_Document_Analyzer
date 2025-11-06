// routes/opticRoutes.mjs
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { analyzeDocument } from "./fraud.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

// Accept PDF & images; adjust as needed
function fileFilter(req, file, cb) {
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/tiff",
    "image/webp",
    "image/bmp",
  ];
  cb(null, allowed.includes(file.mimetype));
}

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB total per file - adjust as required
  fileFilter,
});

const router = express.Router();

// Use `.array('file')` to accept multiple files under the same field name 'file'.
// Frontend: <input type="file" name="file" multiple>
router.post("/", upload.array("file"), analyzeDocument);

export default router;
