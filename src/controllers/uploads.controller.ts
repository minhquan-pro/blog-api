import type { Request, Response } from "express";

import { HttpError } from "../lib/http-error.js";

async function respondWithUploadedFile(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw new HttpError(400, "Chưa có file ảnh");
  }
  res.status(201).json({ url: `/uploads/${file.filename}` });
}

export async function postCoverUpload(
  req: Request,
  res: Response,
): Promise<void> {
  await respondWithUploadedFile(req, res);
}

export async function postAvatarUpload(
  req: Request,
  res: Response,
): Promise<void> {
  await respondWithUploadedFile(req, res);
}
