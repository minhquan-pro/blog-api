# API quản trị (`/api/admin`)

Tất cả route dưới đây yêu cầu **đã đăng nhập** (cookie `auth_token`) và tài khoản **`isAdmin: true`**. Phản hồi lỗi thường gặp: `401 Unauthorized`, `403` khi không phải admin.

## CURL — cookie session

```bash
export API=http://localhost:3000   # thay bằng URL API thực tế
export COOKIE_JAR=/tmp/blog-admin.cookies

curl -s -c "$COOKIE_JAR" -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Mọi lệnh admin sau dùng -b "$COOKIE_JAR"
```

---

## Users

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/admin/users?query=&page=&pageSize=` | Danh sách (tìm email, username, display name) |
| GET | `/api/admin/users/:userId` | Chi tiết |
| PATCH | `/api/admin/users/:userId` | Body: `{ "isAdmin": true \| false }` |
| PATCH | `/api/admin/users/:userId/profile` | Body: `{ "displayName"?, "username"?, "bio"?, "avatarUrl"? }` |

```bash
curl -s -b "$COOKIE_JAR" "$API/api/admin/users?page=1&pageSize=20"
curl -s -b "$COOKIE_JAR" -X PATCH "$API/api/admin/users/UUID" \
  -H "Content-Type: application/json" -d '{"isAdmin":true}'
```

---

## Tags

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/admin/tags` | Danh sách |
| POST | `/api/admin/tags` | `{ "name", "slug?" }` |
| PATCH | `/api/admin/tags/:tagId` | `{ "name"?, "slug"? }` |
| DELETE | `/api/admin/tags/:tagId` | Xóa (409 nếu còn bài gắn tag) |

```bash
curl -s -b "$COOKIE_JAR" -X POST "$API/api/admin/tags" \
  -H "Content-Type: application/json" \
  -d '{"name":"DevOps","slug":"devops"}'
```

---

## Publications & thành viên

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/admin/publications` | Danh sách |
| POST | `/api/admin/publications` | `{ "name", "slug?", "description?", "avatarUrl?" }` |
| GET | `/api/admin/publications/:id` | Chi tiết |
| PATCH | `/api/admin/publications/:id` | Partial cùng field |
| DELETE | `/api/admin/publications/:id` | Xóa publication |
| GET | `/api/admin/publications/:id/members` | Thành viên (+ profile) |
| POST | `/api/admin/publications/:id/members` | `{ "userId", "role": "owner"|"editor"|"writer" }` |
| PATCH | `/api/admin/publications/:id/members/:userId` | `{ "role" }` |
| DELETE | `/api/admin/publications/:id/members/:userId` | Xóa thành viên |

---

## Bài viết (admin)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/admin/posts?status=&includeDeleted=&authorId=&page=&pageSize=` | Danh sách phân trang |
| POST | `/api/admin/posts/:postId/delete` | Xóa mềm (`deletedAt`) |
| POST | `/api/admin/posts/:postId/restore` | Khôi phục |
| DELETE | `/api/admin/posts/:postId/tags/:tagId` | Gỡ tag khỏi bài |

Chỉnh sửa nội dung bài vẫn dùng **`PATCH /api/posts/:postId`** (đã hỗ trợ admin).

```bash
curl -s -b "$COOKIE_JAR" "$API/api/admin/posts?includeDeleted=true&page=1"
```

---

## Bình luận

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/admin/comments?postId=&includeDeleted=&page=&pageSize=` | Danh sách |
| PATCH | `/api/admin/comments/:commentId` | `{ "deleted": true \| false }` (kiểm duyệt mềm) |

---

## Tương tác (lọc + xóa bản ghi)

### Post clap

- GET `/api/admin/post-claps?userId=&postId=&page=&pageSize=`
- DELETE `/api/admin/post-claps?userId=&postId=` (bắt buộc đủ query)

### Bookmark

- GET `/api/admin/bookmarks?userId=&postId=&page=&pageSize=`
- DELETE `/api/admin/bookmarks?userId=&postId=`

### Follow

- GET `/api/admin/user-follows?followerId=&followingId=&page=&pageSize=`
- DELETE `/api/admin/user-follows?followerId=&followingId=`

### Thông báo

- GET `/api/admin/notifications?userId=&page=&pageSize=`
- PATCH `/api/admin/notifications/:id` — `{ "readAt": "<ISO8601>" | null }`
- DELETE `/api/admin/notifications/:id`

```bash
curl -s -b "$COOKIE_JAR" -X DELETE \
  "$API/api/admin/post-claps?userId=UUID&postId=UUID"
```
