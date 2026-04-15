import type { Request, Response } from "express";

import {
  getProfileByUserId,
  getProfileByUsername,
  listPublishedPostsByUsername,
  toggleFollow,
} from "../services/users.service.js";

export async function getProfileById(req: Request, res: Response): Promise<void> {
  const data = await getProfileByUserId(req.params.userId);
  res.json(data);
}

export async function getProfileByUsernameHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const username = req.params.username.toLowerCase();
  const viewerId = req.user?.userId ?? null;
  const data = await getProfileByUsername(username, viewerId);
  res.json(data);
}

export async function getUserPosts(req: Request, res: Response): Promise<void> {
  const username = req.params.username.toLowerCase();
  const data = await listPublishedPostsByUsername(username);
  res.json(data);
}

export async function postFollow(req: Request, res: Response): Promise<void> {
  const followerId = req.user!.userId;
  const { userId: followingId } = req.params;
  const result = await toggleFollow(followerId, followingId);
  res.json(result);
}
