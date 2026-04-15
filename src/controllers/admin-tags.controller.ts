import type { Request, Response } from "express";

import {
  createAdminTag,
  deleteAdminTag,
  listAdminTags,
  updateAdminTag,
} from "../services/admin-tags.service.js";

export async function getAdminTagsList(_req: Request, res: Response): Promise<void> {
  const data = await listAdminTags();
  res.json(data);
}

export async function postAdminTag(req: Request, res: Response): Promise<void> {
  const data = await createAdminTag(req.body);
  res.status(201).json(data);
}

export async function patchAdminTagHandler(req: Request, res: Response): Promise<void> {
  const data = await updateAdminTag(req.params.tagId, req.body);
  res.json(data);
}

export async function deleteAdminTagHandler(req: Request, res: Response): Promise<void> {
  await deleteAdminTag(req.params.tagId);
  res.status(204).send();
}
