import { randomBytes } from "node:crypto";
import path from "node:path";

import { Router } from "express";
import multer from "multer";

import { postCoverUpload, postAvatarUpload } from "../controllers/uploads.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { requireNotLocked } from "../middleware/require-unlocked.js";

const uploadDir = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    const base = `${Date.now()}-${randomBytes(8).toString("hex")}`;
    cb(null, `${base}${ext}`);
  },
});

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowed.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận JPEG, PNG, WebP hoặc GIF"));
    }
  },
});

const router = Router();

router.post(
  "/uploads/cover",
  optionalAuth,
  requireAuth,
  requireNotLocked,
  upload.single("file"),
  asyncHandler(postCoverUpload),
);

router.post(
  "/uploads/avatar",
  optionalAuth,
  requireAuth,
  requireNotLocked,
  upload.single("file"),
  asyncHandler(postAvatarUpload),
);

export { router as uploadsRouter };
