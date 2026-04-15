import type { NextFunction, Request, Response } from "express";

import { isUserAdmin } from "../lib/admin-helpers.js";
import { HttpError } from "../lib/http-error.js";

/** Gọi sau `requireAuth`. */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }
  const ok = await isUserAdmin(req.user.userId);
  if (!ok) {
    next(new HttpError(403, "Cần quyền quản trị"));
    return;
  }
  next();
}
