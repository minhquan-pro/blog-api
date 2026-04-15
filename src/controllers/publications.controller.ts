import type { Request, Response } from "express";

import { asyncHandler } from "../lib/async-handler.js";
import {
  getPublicationBySlug,
  listPublicationMembers,
  listPublicationPosts,
  listPublications,
  patchPublicationMember,
} from "../services/publications.service.js";

export const getPublications = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listPublications();
  res.json(data);
});

export const getPublication = asyncHandler(async (req: Request, res: Response) => {
  const data = await getPublicationBySlug(req.params.slug);
  res.json(data);
});

export const getPublicationPosts = asyncHandler(async (req: Request, res: Response) => {
  const data = await listPublicationPosts(req.params.slug);
  res.json(data);
});

export const getPublicationMembers = asyncHandler(async (req: Request, res: Response) => {
  const data = await listPublicationMembers(req.params.slug);
  res.json(data);
});

export const patchMember = asyncHandler(async (req: Request, res: Response) => {
  const { slug, userId } = req.params;
  const viewerId = req.user!.userId;
  const out = await patchPublicationMember(slug, userId, req.body, viewerId);
  res.json(out);
});
