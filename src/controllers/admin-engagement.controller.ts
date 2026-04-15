import type { Request, Response } from "express";

import {
  deleteAdminBookmark,
  deleteAdminNotification,
  deleteAdminPostClap,
  deleteAdminUserFollow,
  listAdminBookmarks,
  listAdminNotifications,
  listAdminPostClaps,
  listAdminUserFollows,
  patchAdminNotification,
} from "../services/admin-engagement.service.js";

function parsePage(req: Request) {
  return {
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };
}

export async function getAdminPostClaps(req: Request, res: Response): Promise<void> {
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const postId = typeof req.query.postId === "string" ? req.query.postId : undefined;
  const data = await listAdminPostClaps({ userId, postId, ...parsePage(req) });
  res.json(data);
}

export async function deleteAdminPostClapHandler(req: Request, res: Response): Promise<void> {
  const userId = typeof req.query.userId === "string" ? req.query.userId : "";
  const postId = typeof req.query.postId === "string" ? req.query.postId : "";
  await deleteAdminPostClap(userId, postId);
  res.status(204).send();
}

export async function getAdminBookmarks(req: Request, res: Response): Promise<void> {
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const postId = typeof req.query.postId === "string" ? req.query.postId : undefined;
  const data = await listAdminBookmarks({ userId, postId, ...parsePage(req) });
  res.json(data);
}

export async function deleteAdminBookmarkHandler(req: Request, res: Response): Promise<void> {
  const userId = typeof req.query.userId === "string" ? req.query.userId : "";
  const postId = typeof req.query.postId === "string" ? req.query.postId : "";
  await deleteAdminBookmark(userId, postId);
  res.status(204).send();
}

export async function getAdminUserFollows(req: Request, res: Response): Promise<void> {
  const followerId =
    typeof req.query.followerId === "string" ? req.query.followerId : undefined;
  const followingId =
    typeof req.query.followingId === "string" ? req.query.followingId : undefined;
  const data = await listAdminUserFollows({ followerId, followingId, ...parsePage(req) });
  res.json(data);
}

export async function deleteAdminUserFollowHandler(req: Request, res: Response): Promise<void> {
  const followerId = typeof req.query.followerId === "string" ? req.query.followerId : "";
  const followingId = typeof req.query.followingId === "string" ? req.query.followingId : "";
  await deleteAdminUserFollow(followerId, followingId);
  res.status(204).send();
}

export async function getAdminNotifications(req: Request, res: Response): Promise<void> {
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const data = await listAdminNotifications({ userId, ...parsePage(req) });
  res.json(data);
}

export async function patchAdminNotificationHandler(req: Request, res: Response): Promise<void> {
  const data = await patchAdminNotification(req.params.id, req.body);
  res.json(data);
}

export async function deleteAdminNotificationHandler(req: Request, res: Response): Promise<void> {
  await deleteAdminNotification(req.params.id);
  res.status(204).send();
}
