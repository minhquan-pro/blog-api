import { z } from "zod";

import { HttpError } from "../lib/http-error.js";
import { mapProfile, mapUser } from "../lib/mappers.js";
import { prisma } from "../lib/prisma.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface AdminUserListItem {
  user: ReturnType<typeof mapUser>;
  profile: ReturnType<typeof mapProfile> | null;
}

export interface AdminUserListResult {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

const patchUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

const patchProfileSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  username: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_-]+$/i, "Username chỉ gồm chữ, số, _ và -")
    .optional(),
  bio: z.string().max(5000).optional(),
  avatarUrl: z.string().max(2048).optional(),
});

async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { isAdmin: true } });
}

export async function listAdminUsers(params: {
  query?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminUserListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const q = params.query?.trim().toLowerCase() ?? "";

  const where =
    q.length > 0
      ? {
          OR: [
            { email: { contains: q } },
            { profile: { username: { contains: q } } },
            { profile: { displayName: { contains: q } } },
          ],
        }
      : {};

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((u) => ({
      user: mapUser(u),
      profile: u.profile ? mapProfile(u.profile) : null,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getAdminUser(userId: string): Promise<AdminUserListItem> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!u) {
    throw new HttpError(404, "Không tìm thấy người dùng");
  }
  return {
    user: mapUser(u),
    profile: u.profile ? mapProfile(u.profile) : null,
  };
}

export async function patchAdminUser(
  userId: string,
  body: unknown,
  actorUserId: string,
): Promise<AdminUserListItem> {
  const parsed = patchUserSchema.parse(body);
  if (parsed.isAdmin === undefined && parsed.isLocked === undefined) {
    throw new HttpError(400, "Không có trường cập nhật");
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new HttpError(404, "Không tìm thấy người dùng");
  }

  if (parsed.isLocked === true && userId === actorUserId) {
    throw new HttpError(400, "Không thể khóa chính tài khoản của mình");
  }

  if (parsed.isLocked === true && existing.isAdmin) {
    const otherUnlockedAdmins = await prisma.user.count({
      where: {
        isAdmin: true,
        isLocked: false,
        id: { not: userId },
      },
    });
    if (otherUnlockedAdmins === 0) {
      throw new HttpError(400, "Không thể khóa admin duy nhất còn hoạt động");
    }
  }

  if (parsed.isAdmin === false && userId === actorUserId) {
    const admins = await countAdmins();
    if (admins <= 1 && existing.isAdmin) {
      throw new HttpError(400, "Không thể gỡ quyền admin của chính mình khi chỉ còn một quản trị viên");
    }
  }

  const u = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(parsed.isAdmin !== undefined ? { isAdmin: parsed.isAdmin } : {}),
      ...(parsed.isLocked !== undefined ? { isLocked: parsed.isLocked } : {}),
    },
    include: { profile: true },
  });

  return {
    user: mapUser(u),
    profile: u.profile ? mapProfile(u.profile) : null,
  };
}

export async function patchAdminUserProfile(
  userId: string,
  body: unknown,
): Promise<AdminUserListItem> {
  const parsed = patchProfileSchema.parse(body);
  if (Object.keys(parsed).length === 0) {
    throw new HttpError(400, "Không có trường cập nhật");
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!existing) {
    throw new HttpError(404, "Không tìm thấy người dùng");
  }
  if (!existing.profile) {
    throw new HttpError(400, "Người dùng chưa có profile");
  }

  const usernameRaw = parsed.username ?? existing.profile.username;
  const username = usernameRaw.toLowerCase();

  if (parsed.username !== undefined && username !== existing.profile.username) {
    const taken = await prisma.userProfile.findUnique({
      where: { username },
    });
    if (taken && taken.userId !== userId) {
      throw new HttpError(409, "Username đã được dùng");
    }
  }

  const updated = await prisma.userProfile.update({
    where: { userId },
    data: {
      ...(parsed.displayName !== undefined ? { displayName: parsed.displayName } : {}),
      ...(parsed.username !== undefined ? { username } : {}),
      ...(parsed.bio !== undefined ? { bio: parsed.bio } : {}),
      ...(parsed.avatarUrl !== undefined ? { avatarUrl: parsed.avatarUrl } : {}),
    },
  });

  const u = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { profile: true },
  });

  return {
    user: mapUser(u),
    profile: mapProfile(updated),
  };
}
