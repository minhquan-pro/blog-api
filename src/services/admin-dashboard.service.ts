import type { PostStatus } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

const ALLOWED_DAYS = new Set([7, 30, 90]);
const TOP_POSTS = 8;
const TOP_TAGS = 10;

export interface AdminDashboardTimePoint {
  date: string;
  publishedPosts: number;
  newUsers: number;
  comments: number;
}

export interface AdminDashboardTopPost {
  id: string;
  title: string;
  slug: string;
  clapCount: number;
  responseCount: number;
}

export interface AdminDashboardTopTag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export interface AdminDashboardResult {
  days: number;
  totals: {
    users: number;
    posts: number;
    postsPublished: number;
    comments: number;
    bookmarks: number;
    claps: number;
    tags: number;
    publications: number;
    userFollows: number;
    notifications: number;
  };
  postsByStatus: Record<PostStatus, number>;
  timeSeries: AdminDashboardTimePoint[];
  topPosts: AdminDashboardTopPost[];
  topTags: AdminDashboardTopTag[];
}

function parseDays(raw: unknown): number {
  const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : 30;
  if (!Number.isFinite(n)) return 30;
  const rounded = Math.round(n);
  if (ALLOWED_DAYS.has(rounded)) return rounded;
  return 30;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function addDaysLocal(d: Date, delta: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}

/** Merge sparse daily rows into a full series of `days` ending today (local). */
function buildTimeSeries(
  days: number,
  published: Map<string, number>,
  users: Map<string, number>,
  comments: Map<string, number>,
): AdminDashboardTimePoint[] {
  const end = startOfTodayLocal();
  const start = addDaysLocal(end, -(days - 1));
  const out: AdminDashboardTimePoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDaysLocal(start, i);
    const key = toYmd(d);
    out.push({
      date: key,
      publishedPosts: published.get(key) ?? 0,
      newUsers: users.get(key) ?? 0,
      comments: comments.get(key) ?? 0,
    });
  }
  return out;
}

function rowMap(rows: { day: string | Date; c: bigint }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const key = typeof r.day === "string" ? r.day : toYmd(new Date(r.day));
    m.set(key, Number(r.c));
  }
  return m;
}

export async function getAdminDashboard(params?: { days?: unknown }): Promise<AdminDashboardResult> {
  const days = parseDays(params?.days);
  const rangeEnd = addDaysLocal(startOfTodayLocal(), 1);
  const rangeStart = addDaysLocal(startOfTodayLocal(), -(days - 1));

  const [
    usersCount,
    postsCount,
    postsPublishedCount,
    commentsCount,
    bookmarksCount,
    clapsSum,
    tagsCount,
    publicationsCount,
    userFollowsCount,
    notificationsCount,
    statusGroups,
    publishedDaily,
    usersDaily,
    commentsDaily,
    topPostRows,
    tagGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.post.count({
      where: { deletedAt: null, status: "published" },
    }),
    prisma.comment.count({ where: { deletedAt: null } }),
    prisma.bookmark.count(),
    prisma.postClap.aggregate({ _sum: { count: true } }),
    prisma.tag.count(),
    prisma.publication.count(),
    prisma.userFollow.count(),
    prisma.notification.count(),
    prisma.post.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ day: string; c: bigint }[]>`
      SELECT DATE_FORMAT(published_at, '%Y-%m-%d') AS day, COUNT(*) AS c
      FROM posts
      WHERE status = 'published'
        AND deleted_at IS NULL
        AND published_at IS NOT NULL
        AND published_at >= ${rangeStart}
        AND published_at < ${rangeEnd}
      GROUP BY DATE_FORMAT(published_at, '%Y-%m-%d')
    `,
    prisma.$queryRaw<{ day: string; c: bigint }[]>`
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS c
      FROM users
      WHERE created_at >= ${rangeStart}
        AND created_at < ${rangeEnd}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    `,
    prisma.$queryRaw<{ day: string; c: bigint }[]>`
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS c
      FROM comments
      WHERE deleted_at IS NULL
        AND created_at >= ${rangeStart}
        AND created_at < ${rangeEnd}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    `,
    prisma.post.findMany({
      where: { deletedAt: null },
      orderBy: [{ clapCount: "desc" }, { updatedAt: "desc" }],
      take: TOP_POSTS,
      select: {
        id: true,
        title: true,
        slug: true,
        clapCount: true,
        responseCount: true,
      },
    }),
    prisma.postTag.groupBy({
      by: ["tagId"],
      _count: { tagId: true },
      orderBy: { _count: { tagId: "desc" } },
      take: TOP_TAGS,
    }),
  ]);

  const postsByStatus: Record<PostStatus, number> = {
    draft: 0,
    published: 0,
    unlisted: 0,
    archived: 0,
  };
  for (const g of statusGroups) {
    postsByStatus[g.status] = g._count._all;
  }

  const tagIds = tagGroups.map((t) => t.tagId);
  const tagRows =
    tagIds.length > 0
      ? await prisma.tag.findMany({
          where: { id: { in: tagIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
  const tagById = new Map(tagRows.map((t) => [t.id, t]));

  const topTags: AdminDashboardTopTag[] = tagGroups
    .map((g) => {
      const t = tagById.get(g.tagId);
      if (!t) return null;
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        postCount: g._count.tagId,
      };
    })
    .filter((x): x is AdminDashboardTopTag => x !== null);

  const timeSeries = buildTimeSeries(
    days,
    rowMap(publishedDaily),
    rowMap(usersDaily),
    rowMap(commentsDaily),
  );

  return {
    days,
    totals: {
      users: usersCount,
      posts: postsCount,
      postsPublished: postsPublishedCount,
      comments: commentsCount,
      bookmarks: bookmarksCount,
      claps: Number(clapsSum._sum.count ?? 0),
      tags: tagsCount,
      publications: publicationsCount,
      userFollows: userFollowsCount,
      notifications: notificationsCount,
    },
    postsByStatus,
    timeSeries,
    topPosts: topPostRows.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      clapCount: p.clapCount,
      responseCount: p.responseCount,
    })),
    topTags,
  };
}
