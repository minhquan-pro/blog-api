import type { Request, Response } from "express";

import { asyncHandler } from "../lib/async-handler.js";
import { listPostsByTagSlug, listTags } from "../services/tags.service.js";

export const getTags = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listTags();
  res.json(data);
});

export const getTagPosts = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const data = await listPostsByTagSlug(slug);
  res.json(data);
});
