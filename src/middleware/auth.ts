import type { NextFunction, Request, Response } from "express";

import { COOKIE_NAME, verifyToken } from "../lib/jwt.js";
import type { RequestUser } from "../lib/auth-types.js";
import { HttpError } from "../lib/http-error.js";

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const raw = req.cookies?.[COOKIE_NAME];
    if (!raw || typeof raw !== "string") {
      next();
      return;
    }
    const { sub, email } = await verifyToken(raw);
    req.user = { userId: sub, email } satisfies RequestUser;
    next();
  } catch {
    next();
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }
  next();
}
