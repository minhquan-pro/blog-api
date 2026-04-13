import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { COOKIE_NAME, signToken } from "../lib/jwt.js";
import { mapProfile, mapUser } from "../lib/mappers.js";
import { HttpError } from "../lib/http-error.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

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

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const email = body.email.toLowerCase().trim();
    const username = body.username.toLowerCase().trim();

    const [emailExists, usernameExists] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.userProfile.findUnique({ where: { username } }),
    ]);
    if (emailExists || usernameExists) {
      throw new HttpError(409, "Email hoặc username đã được dùng");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            displayName: body.displayName.trim(),
            username,
            bio: "",
            avatarUrl: "",
          },
        },
      },
      include: { profile: true },
    });

    const token = await signToken({ sub: user.id, email: user.email });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(201).json({
      user: mapUser(user),
      profile: user.profile ? mapProfile(user.profile) : null,
    });
  }),
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const email = body.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new HttpError(401, "Sai email hoặc mật khẩu");
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, "Sai email hoặc mật khẩu");
    }

    const token = await signToken({ sub: user.id, email: user.email });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    res.json({
      user: mapUser(user),
      profile: profile ? mapProfile(profile) : null,
    });
  }),
);

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(204).send();
});

router.get(
  "/me",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { profile: true },
    });
    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }
    res.json({
      user: mapUser(user),
      profile: user.profile ? mapProfile(user.profile) : null,
    });
  }),
);

export { router as authRouter };
