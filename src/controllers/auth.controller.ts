import type { Request, Response } from "express";
import { z } from "zod";

import { COOKIE_NAME } from "../lib/jwt.js";
import { asyncHandler } from "../lib/async-handler.js";
import { getAuthUser, loginUser, registerUser } from "../services/auth.service.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(120),
  username: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_-]+$/i, "Username chỉ gồm chữ, số, _ và -"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export const postRegister = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const { token, user, profile } = await registerUser({
    email: body.email,
    password: body.password,
    displayName: body.displayName,
    username: body.username,
  });
  setAuthCookie(res, token);
  res.status(201).json({ user, profile });
});

export const postLogin = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const { token, user, profile } = await loginUser(body.email, body.password);
  setAuthCookie(res, token);
  res.json({ user, profile });
});

export function postLogout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(204).send();
}

export const getAuthMe = asyncHandler(async (req: Request, res: Response) => {
  const payload = await getAuthUser(req.user!.userId);
  res.json(payload);
});
