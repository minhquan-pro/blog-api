import type { NextFunction, Request, Response } from "express";
import type { ZodError } from "zod";

import { Prisma } from "../generated/prisma/client.js";
import { HttpError } from "../lib/http-error.js";

function isZodError(e: unknown): e is ZodError {
  return typeof e === "object" && e !== null && (e as ZodError).name === "ZodError";
}

const isDev = process.env.NODE_ENV !== "production";

function jsonError(
  res: Response,
  status: number,
  message: string,
  extra?: Record<string, unknown>,
): void {
  res.status(status).json({ error: message, ...extra });
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

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2022") {
      jsonError(res, 503, "Database không khớp schema Prisma (thiếu cột hoặc bảng).", {
        code: err.code,
        hint: "Chạy trong thư mục Blog-api: npx prisma migrate dev",
        ...(isDev && { meta: err.meta }),
      });
      console.error(err);
      return;
    }
    if (err.code === "P2002") {
      jsonError(res, 409, "Dữ liệu trùng (unique constraint).", {
        code: err.code,
        ...(isDev && { meta: err.meta }),
      });
      console.error(err);
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    jsonError(res, 503, "Không kết nối được database.", {
      ...(isDev && { detail: err.message }),
    });
    console.error(err);
    return;
  }

  console.error(err);

  if (err instanceof Error) {
    const msg = err.message || "Internal server error";
    if (isDev) {
      res.status(500).json({
        error: msg.startsWith("JWT_SECRET") ? "Thiếu hoặc JWT_SECRET không hợp lệ (cần ≥ 16 ký tự trong .env)" : msg,
        detail: msg,
      });
      return;
    }
  }

  res.status(500).json({ error: "Internal server error" });
}
