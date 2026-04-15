import type { Request, Response } from "express";

import type { PostStatus } from "../generated/prisma/client.js";
import {
  listPostsWithAuthors,
  removePostTagAdmin,
  restoreAdminPost,
  softDeleteAdminPost,
} from "../services/admin-posts.service.js";

const POST_STATUSES: PostStatus[] = ["draft", "published", "unlisted", "archived"];

function parseStatus(raw: unknown): PostStatus | undefined {
  if (typeof raw !== "string" || !POST_STATUSES.includes(raw as PostStatus)) {
    return undefined;
  }
  return raw as PostStatus;
}

export async function getAdminPosts(req: Request, res: Response): Promise<void> {
  const status = parseStatus(req.query.status);
  const includeDeleted =
    req.query.includeDeleted === "1" || req.query.includeDeleted === "true";
  const authorId = typeof req.query.authorId === "string" ? req.query.authorId : undefined;
  const page = req.query.page ? Number(req.query.page) : undefined;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
  const data = await listPostsWithAuthors({
    status,
    includeDeleted,
    authorId,
    page,
    pageSize,
  });
  res.json(data);
}

export async function postAdminPostSoftDelete(req: Request, res: Response): Promise<void> {
  const data = await softDeleteAdminPost(req.params.postId);
  res.json(data);
}

export async function postAdminPostRestore(req: Request, res: Response): Promise<void> {
  const data = await restoreAdminPost(req.params.postId);
  res.json(data);
}

export async function deleteAdminPostTagHandler(req: Request, res: Response): Promise<void> {
  await removePostTagAdmin(req.params.postId, req.params.tagId);
  res.status(204).send();
}
