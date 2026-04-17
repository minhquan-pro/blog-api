import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma.js";
import { mapProfile, mapUser } from "../lib/mappers.js";
import { HttpError } from "../lib/http-error.js";
import { signToken } from "../lib/jwt.js";

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  username: string;
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase().trim();
  const username = input.username.toLowerCase().trim();

  const [emailExists, usernameExists] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.userProfile.findUnique({ where: { username } }),
  ]);
  if (emailExists || usernameExists) {
    throw new HttpError(409, "Email hoặc username đã được dùng");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          displayName: input.displayName.trim(),
          username,
          bio: "",
          avatarUrl: "",
        },
      },
    },
    include: { profile: true },
  });

  const token = await signToken({ sub: user.id, email: user.email });
  return {
    token,
    user: mapUser(user),
    profile: user.profile ? mapProfile(user.profile) : null,
  };
}

export async function loginUser(emailRaw: string, password: string) {
  const email = emailRaw.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    throw new HttpError(401, "Sai email hoặc mật khẩu");
  }
  if (user.isLocked) {
    throw new HttpError(403, "Tài khoản đã bị khóa");
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, "Sai email hoặc mật khẩu");
  }

  const token = await signToken({ sub: user.id, email: user.email });
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  return {
    token,
    user: mapUser(user),
    profile: profile ? mapProfile(profile) : null,
  };
}

export async function getAuthUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (user.isLocked) {
    throw new HttpError(403, "Tài khoản đã bị khóa");
  }
  return {
    user: mapUser(user),
    profile: user.profile ? mapProfile(user.profile) : null,
  };
}
