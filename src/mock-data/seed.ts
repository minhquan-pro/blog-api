import type {
  Comment,
  NotificationItem,
  Post,
  Publication,
  PublicationMember,
  Tag,
  User,
  UserProfile,
} from "@/types/domain";

const now = new Date().toISOString();

export const SEED_USERS: User[] = [
  {
    id: "u-demo",
    email: "demo@editorial.local",
    isAdmin: false,
    createdAt: now,
  },
  {
    id: "u-1",
    email: "lan@example.com",
    isAdmin: false,
    createdAt: now,
  },
  {
    id: "u-2",
    email: "minh@example.com",
    isAdmin: false,
    createdAt: now,
  },
];

export const SEED_PROFILES: UserProfile[] = [
  {
    userId: "u-demo",
    displayName: "Bạn (demo)",
    username: "demo",
    bio: "Đang khám phá Editorial.",
    avatarUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=128&h=128&fit=crop",
  },
  {
    userId: "u-1",
    displayName: "Lan Anh",
    username: "lananh",
    bio: "Viết về sản phẩm và ngôn ngữ.",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop",
  },
  {
    userId: "u-2",
    displayName: "Minh Quân",
    username: "minhquan",
    bio: "Frontend & hệ thống phân tán.",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop",
  },
];

export const SEED_TAGS: Tag[] = [
  { id: "t-1", name: "TypeScript", slug: "typescript" },
  { id: "t-2", name: "React", slug: "react" },
  { id: "t-3", name: "Database", slug: "database" },
  { id: "t-4", name: "Design", slug: "design" },
];

export const SEED_PUBLICATIONS: Publication[] = [
  {
    id: "pub-1",
    name: "The Stack Journal",
    slug: "stack-journal",
    description: "Bài viết dài về kỹ thuật, có biên tập.",
    avatarUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=200&fit=crop",
    createdAt: now,
  },
];

export const SEED_PUBLICATION_MEMBERS: PublicationMember[] = [
  {
    publicationId: "pub-1",
    userId: "u-1",
    role: "owner",
    createdAt: now,
  },
  {
    publicationId: "pub-1",
    userId: "u-2",
    role: "editor",
    createdAt: now,
  },
  {
    publicationId: "pub-1",
    userId: "u-demo",
    role: "editor",
    createdAt: now,
  },
];

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

export const SEED_POSTS: Post[] = [
  {
    id: "p-1",
    authorId: "u-1",
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
    publishedAt: "2026-04-01T08:00:00.000Z",
    readingTimeMinutes: 6,
    likeCount: 128,
    responseCount: 2,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    tagIds: ["t-3", "t-1"],
  },
  {
    id: "p-2",
    authorId: "u-2",
    publicationId: "pub-1",
    title: "Vite, React và một giao diện editorial",
    slug: "vite-react-editorial",
    subtitle: "Không cần gradient tím để trông professional",
    body: body2,
    excerpt: "Gợi ý stack và cảm quan đọc cho SPA blog.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=600&fit=crop",
    status: "published",
    publishedAt: "2026-04-05T10:30:00.000Z",
    readingTimeMinutes: 4,
    likeCount: 64,
    responseCount: 1,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    tagIds: ["t-2", "t-4"],
  },
  {
    id: "p-3",
    authorId: "u-demo",
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
    likeCount: 0,
    responseCount: 0,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    tagIds: ["t-1"],
  },
  {
    id: "p-4",
    authorId: "u-1",
    publicationId: null,
    title: "Component design tokens trong thực tế",
    slug: "design-tokens",
    subtitle: "Một nguồn sự thật cho màu và bán kính",
    body: "Tokens giúp dark mode và white-label sau này.",
    excerpt: "Tóm tắt ngắn về cách dùng CSS variables với Tailwind v4.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop",
    status: "published",
    publishedAt: "2026-03-20T14:00:00.000Z",
    readingTimeMinutes: 5,
    likeCount: 42,
    responseCount: 0,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    tagIds: ["t-4"],
  },
];

export const SEED_COMMENTS: Comment[] = [
  {
    id: "c-1",
    postId: "p-1",
    authorId: "u-2",
    parentId: null,
    body: "Phần slug unique theo author rất hợp lý cho URL /@user/slug.",
    deletedAt: null,
    createdAt: "2026-04-02T09:00:00.000Z",
    updatedAt: "2026-04-02T09:00:00.000Z",
  },
  {
    id: "c-2",
    postId: "p-1",
    authorId: "u-demo",
    parentId: "c-1",
    body: "Đồng ý — mình sẽ map route `/p/:username/:slug` như vậy.",
    deletedAt: null,
    createdAt: "2026-04-02T11:00:00.000Z",
    updatedAt: "2026-04-02T11:00:00.000Z",
  },
  {
    id: "c-3",
    postId: "p-2",
    authorId: "u-1",
    parentId: null,
    body: "Typography pairing Fraunces + sans trông ổn cho editorial.",
    deletedAt: null,
    createdAt: "2026-04-06T08:00:00.000Z",
    updatedAt: "2026-04-06T08:00:00.000Z",
  },
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    userId: "u-demo",
    type: "new_comment",
    payload: { postId: "p-1", actorId: "u-2", snippet: "Phần slug unique..." },
    readAt: null,
    createdAt: "2026-04-02T09:05:00.000Z",
  },
  {
    id: "n-2",
    userId: "u-demo",
    type: "new_follow",
    payload: { actorId: "u-1" },
    readAt: "2026-04-01T12:00:00.000Z",
    createdAt: "2026-04-01T12:00:00.000Z",
  },
];
