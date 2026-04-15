import { prisma } from "./prisma.js";

export async function isUserAdmin(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  return u?.isAdmin === true;
}
