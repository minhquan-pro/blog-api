import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../lib/http-error.js";
import { assertUserNotLocked } from "../lib/user-lock.js";

/** Gọi sau `requireAuth`. */
export async function requireNotLocked(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }
  try {
    await assertUserNotLocked(req.user.userId);
    next();
  } catch (e) {
    next(e);
  }
}
