import type { Request, Response } from "express";
import { z } from "zod";

import {
  listMyBookmarks,
  listMyDrafts,
  listMyNotifications,
  listMyPosts,
  updateMyProfile,
} from "../services/me.service.js";

const patchProfileSchema = z
  .object({
    displayName: z.string().min(1).max(120).optional(),
    username: z
      .string()
      .min(2)
      .max(32)
      .regex(/^[a-z0-9_-]+$/i, "Username chỉ gồm chữ, số, _ và -")
      .optional(),
    bio: z.string().max(2000).optional(),
    avatarUrl: z.string().max(2048).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export async function getMyPosts(req: Request, res: Response): Promise<void> {
  const uid = req.user!.userId;
  const data = await listMyPosts(uid);
  res.json(data);
}

export async function getMyDrafts(req: Request, res: Response): Promise<void> {
  const uid = req.user!.userId;
  const data = await listMyDrafts(uid);
  res.json(data);
}

export async function getMyBookmarks(req: Request, res: Response): Promise<void> {
  const uid = req.user!.userId;
  const data = await listMyBookmarks(uid);
  res.json(data);
}

export async function getMyNotifications(req: Request, res: Response): Promise<void> {
  const uid = req.user!.userId;
  const data = await listMyNotifications(uid);
  res.json(data);
}

export async function patchMyProfile(req: Request, res: Response): Promise<void> {
  const uid = req.user!.userId;
  const body = patchProfileSchema.parse(req.body);
  const data = await updateMyProfile(uid, body);
  res.json(data);
}
