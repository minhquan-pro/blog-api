import type { Request, Response } from "express";

import {
  getAdminUser,
  listAdminUsers,
  patchAdminUser,
  patchAdminUserProfile,
} from "../services/admin-users.service.js";

export async function getAdminUsersList(req: Request, res: Response): Promise<void> {
  const query = typeof req.query.query === "string" ? req.query.query : undefined;
  const page = req.query.page ? Number(req.query.page) : undefined;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
  const data = await listAdminUsers({ query, page, pageSize });
  res.json(data);
}

export async function getAdminUserById(req: Request, res: Response): Promise<void> {
  const data = await getAdminUser(req.params.userId);
  res.json(data);
}

export async function patchAdminUserHandler(req: Request, res: Response): Promise<void> {
  const data = await patchAdminUser(req.params.userId, req.body, req.user!.userId);
  res.json(data);
}

export async function patchAdminUserProfileHandler(req: Request, res: Response): Promise<void> {
  const data = await patchAdminUserProfile(req.params.userId, req.body);
  res.json(data);
}
