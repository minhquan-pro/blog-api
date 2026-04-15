import type { Request, Response } from "express";

import { listAdminComments, moderateAdminComment } from "../services/admin-comments.service.js";

export async function getAdminCommentsList(req: Request, res: Response): Promise<void> {
  const postId = typeof req.query.postId === "string" ? req.query.postId : undefined;
  const includeDeleted = req.query.includeDeleted === "1" || req.query.includeDeleted === "true";
  const page = req.query.page ? Number(req.query.page) : undefined;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
  const data = await listAdminComments({ postId, includeDeleted, page, pageSize });
  res.json(data);
}

export async function patchAdminCommentHandler(req: Request, res: Response): Promise<void> {
  const deleted = Boolean(req.body?.deleted);
  const data = await moderateAdminComment(req.params.commentId, deleted);
  res.json(data);
}
