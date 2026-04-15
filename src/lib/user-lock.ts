import { HttpError } from "./http-error.js";
import { prisma } from "./prisma.js";

/** Gọi sau khi đã xác thực JWT. Khóa tài khoản không xóa dữ liệu nhưng chặn mọi thao tác đăng nhập. */
export async function assertUserNotLocked(userId: string): Promise<void> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isLocked: true },
  });
  if (!u) {
    throw new HttpError(401, "Unauthorized");
  }
  if (u.isLocked) {
    throw new HttpError(403, "Tài khoản đã bị khóa");
  }
}
