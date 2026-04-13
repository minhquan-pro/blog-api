import type { NextFunction, Request, Response } from "express";
import type { ZodError } from "zod";

import { HttpError } from "../lib/http-error.js";

function isZodError(e: unknown): e is ZodError {
  return typeof e === "object" && e !== null && (e as ZodError).name === "ZodError";
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  if (isZodError(err)) {
    res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
