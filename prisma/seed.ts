import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma.js";

const IDS = {
  userDemo: "10000000-0000-4000-8000-000000000001",
  userLan: "10000000-0000-4000-8000-000000000002",
  userMinh: "10000000-0000-4000-8000-000000000003",
  pub1: "20000000-0000-4000-8000-000000000001",
  tagTs: "30000000-0000-4000-8000-000000000001",
  tagReact: "30000000-0000-4000-8000-000000000002",
  tagDb: "30000000-0000-4000-8000-000000000003",
  tagDesign: "30000000-0000-4000-8000-000000000004",
  post1: "40000000-0000-4000-8000-000000000001",
  post2: "40000000-0000-4000-8000-000000000002",
  post3: "40000000-0000-4000-8000-000000000003",
  post4: "40000000-0000-4000-8000-000000000004",
  comment1: "50000000-0000-4000-8000-000000000001",
  comment2: "50000000-0000-4000-8000-000000000002",
  comment3: "50000000-0000-4000-8000-000000000003",
  notif1: "60000000-0000-4000-8000-000000000001",
  notif2: "60000000-0000-4000-8000-000000000002",
};

const body1 = `## Giới thiệu

Ứng dụng blog cần mô hình dữ liệu rõ ràng trước khi UI bám vào API.

\`\`\`ts
interface Post {
  id: string;
  slug: string;
  status: "draft" | "published";
}
\`\`\`

### Kết luận

Tách \`users\` và \`user_profiles\` giúp mở rộng OAuth sau này.`;

const body2 = `React 19 và Vite 7 mang lại DX tốt cho SPA. Kết hợp **Tailwind v4** và component library, bạn có thể ship nhanh mà vẫn giữ consistency.

> Đọc code như đọc văn — typography và spacing quyết định cảm giác "đắt tiền".`;

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("password123", 10);
  const now = new Date();

  await prisma.user.createMany({
    data: [
      {
        id: IDS.userDemo,
        email: "demo@editorial.local",
        passwordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: IDS.userLan,
        email: "lan@example.com",
        passwordHash,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: IDS.userMinh,
        email: "minh@example.com",
        passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    ],
  });

  await prisma.userProfile.createMany({
    data: [
      {
        userId: IDS.userDemo,
        displayName: "Bạn (demo)",
        username: "demo",
        bio: "Đang khám phá Editorial.",
        avatarUrl:
          "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=128&h=128&fit=crop",
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: IDS.userLan,
        displayName: "Lan Anh",
        username: "lananh",
        bio: "Viết về sản phẩm và ngôn ngữ.",
        avatarUrl:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop",
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: IDS.userMinh,
        displayName: "Minh Quân",
        username: "minhquan",
        bio: "Frontend & hệ thống phân tán.",
        avatarUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop",
        createdAt: now,
        updatedAt: now,
      },
    ],
  });

  await prisma.tag.createMany({
    data: [
      { id: IDS.tagTs, name: "TypeScript", slug: "typescript" },
      { id: IDS.tagReact, name: "React", slug: "react" },
      { id: IDS.tagDb, name: "Database", slug: "database" },
      { id: IDS.tagDesign, name: "Design", slug: "design" },
    ],
  });

  await prisma.publication.create({
    data: {
      id: IDS.pub1,
      name: "The Stack Journal",
      slug: "stack-journal",
      description: "Bài viết dài về kỹ thuật, có biên tập.",
      avatarUrl:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=200&fit=crop",
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.publicationMember.createMany({
    data: [
      {
        publicationId: IDS.pub1,
        userId: IDS.userLan,
        role: "owner",
        createdAt: now,
      },
      {
        publicationId: IDS.pub1,
        userId: IDS.userMinh,
        role: "editor",
        createdAt: now,
      },
      {
        publicationId: IDS.pub1,
        userId: IDS.userDemo,
        role: "editor",
        createdAt: now,
      },
    ],
  });

  await prisma.post.createMany({
    data: [
      {
        id: IDS.post1,
        authorId: IDS.userLan,
        publicationId: null,
        title: "Thiết kế schema cho blog giống Medium",
        slug: "schema-blog-medium",
        subtitle: "Từ users đến claps — những bảng tối thiểu",
        body: body1,
        excerpt:
          "Tách users và profiles, posts có slug, và vì sao nên denormalize counters.",
        coverImageUrl:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop",
        status: "published",
        publishedAt: new Date("2026-04-01T08:00:00.000Z"),
        readingTimeMinutes: 6,
        clapCount: 128,
        responseCount: 2,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: IDS.post2,
        authorId: IDS.userMinh,
        publicationId: IDS.pub1,
        title: "Vite, React và một giao diện editorial",
        slug: "vite-react-editorial",
        subtitle: "Không cần gradient tím để trông professional",
        body: body2,
        excerpt: "Gợi ý stack và cảm quan đọc cho SPA blog.",
        coverImageUrl:
          "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=600&fit=crop",
        status: "published",
        publishedAt: new Date("2026-04-05T10:30:00.000Z"),
        readingTimeMinutes: 4,
        clapCount: 64,
        responseCount: 1,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: IDS.post3,
        authorId: IDS.userDemo,
        publicationId: null,
        title: "Bản nháp: ý tưởng cho tuần tới",
        slug: "draft-ideas",
        subtitle: "",
        body: "Đang ghi chú...",
        excerpt: "",
        coverImageUrl: "",
        status: "draft",
        publishedAt: null,
        readingTimeMinutes: 1,
        clapCount: 0,
        responseCount: 0,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: IDS.post4,
        authorId: IDS.userLan,
        publicationId: null,
        title: "Component design tokens trong thực tế",
        slug: "design-tokens",
        subtitle: "Một nguồn sự thật cho màu và bán kính",
        body: "Tokens giúp dark mode và white-label sau này.",
        excerpt: "Tóm tắt ngắn về cách dùng CSS variables với Tailwind v4.",
        coverImageUrl:
          "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop",
        status: "published",
        publishedAt: new Date("2026-03-20T14:00:00.000Z"),
        readingTimeMinutes: 5,
        clapCount: 42,
        responseCount: 0,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
  });

  await prisma.postTag.createMany({
    data: [
      { postId: IDS.post1, tagId: IDS.tagDb },
      { postId: IDS.post1, tagId: IDS.tagTs },
      { postId: IDS.post2, tagId: IDS.tagReact },
      { postId: IDS.post2, tagId: IDS.tagDesign },
      { postId: IDS.post3, tagId: IDS.tagTs },
      { postId: IDS.post4, tagId: IDS.tagDesign },
    ],
  });

  await prisma.comment.create({
    data: {
      id: IDS.comment1,
      postId: IDS.post1,
      authorId: IDS.userMinh,
      parentId: null,
      body: "Phần slug unique theo author rất hợp lý cho URL /@user/slug.",
      deletedAt: null,
      createdAt: new Date("2026-04-02T09:00:00.000Z"),
      updatedAt: new Date("2026-04-02T09:00:00.000Z"),
    },
  });
  await prisma.comment.create({
    data: {
      id: IDS.comment2,
      postId: IDS.post1,
      authorId: IDS.userDemo,
      parentId: IDS.comment1,
      body: "Đồng ý — mình sẽ map route `/p/:username/:slug` như vậy.",
      deletedAt: null,
      createdAt: new Date("2026-04-02T11:00:00.000Z"),
      updatedAt: new Date("2026-04-02T11:00:00.000Z"),
    },
  });
  await prisma.comment.create({
    data: {
      id: IDS.comment3,
      postId: IDS.post2,
      authorId: IDS.userLan,
      parentId: null,
      body: "Typography pairing Fraunces + sans trông ổn cho editorial.",
      deletedAt: null,
      createdAt: new Date("2026-04-06T08:00:00.000Z"),
      updatedAt: new Date("2026-04-06T08:00:00.000Z"),
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        id: IDS.notif1,
        userId: IDS.userDemo,
        type: "new_comment",
        payload: { postId: IDS.post1, actorId: IDS.userMinh, snippet: "Phần slug unique..." },
        readAt: null,
        createdAt: new Date("2026-04-02T09:05:00.000Z"),
      },
      {
        id: IDS.notif2,
        userId: IDS.userDemo,
        type: "new_follow",
        payload: { actorId: IDS.userLan },
        readAt: new Date("2026-04-01T12:00:00.000Z"),
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
      },
    ],
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
