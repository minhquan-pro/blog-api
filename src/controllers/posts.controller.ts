import type { Request, Response } from "express";
import { z } from "zod";

import { asyncHandler } from "../lib/async-handler.js";
import {
  createComment,
  createPost,
  getPostById,
  getPostByPath,
  getPostForEdit,
  listComments,
  listFeed,
  searchPosts,
  setClap,
  setLike,
  softDeletePostByAuthor,
  toggleBookmark,
  updatePost,
  updatePostStatusOnly,
  type EditorInput,
} from "../services/posts.service.js";

const editorSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    body: z.string(),
    excerpt: z.string(),
    coverImageUrl: z.string(),
    tagSlugs: z.array(z.string()),
    status: z.enum(["draft", "published", "unlisted", "archived"]),
    publicationId: z.string().uuid().nullable(),
  })
  .superRefine((data, ctx) => {
    const has =
      data.title.trim().length > 0 ||
      data.subtitle.trim().length > 0 ||
      data.body.trim().length > 0 ||
      data.excerpt.trim().length > 0;
    if (!has) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bài viết cần có ít nhất tiêu đề, nội dung, phụ đề hoặc tóm tắt.",
        path: ["body"],
      });
    }
  });

const commentSchema = z.object({
  body: z.string().min(1),
  parentId: z.string().uuid().nullable(),
});

const clapSchema = z.object({
  count: z.number().int().min(0).max(1),
});

const likeSchema = z.object({
  liked: z.boolean(),
});

const quickStatusSchema = z.object({
  status: z.enum(["archived", "published", "unlisted"]),
});

function parseEditor(req: Request): EditorInput {
  const body = editorSchema.parse(req.body);
  return {
    title: body.title,
    subtitle: body.subtitle,
    body: body.body,
    excerpt: body.excerpt,
    coverImageUrl: body.coverImageUrl,
    tagSlugs: body.tagSlugs,
    status: body.status,
    publicationId: body.publicationId,
  };
}

export const getFeed = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listFeed();
  res.json(data);
});

export const getSearch = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "");
  const data = await searchPosts(q);
  res.json(data);
});

export const getByPath = asyncHandler(async (req: Request, res: Response) => {
  const username = req.params.username.toLowerCase();
  const { slug } = req.params;
  const viewerId = req.user?.userId ?? null;

  const result = await getPostByPath(username, slug, viewerId);
  if ("notFound" in result && result.notFound) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if ("forbidden" in result && result.forbidden) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result);
});

export const postCreate = asyncHandler(async (req: Request, res: Response) => {
  const input = parseEditor(req);
  if (input.status === "draft") {
    res.status(400).json({
      error: "Không tạo bản nháp trên máy chủ.",
      hint: "Lưu bản nháp trên thiết bị từ trang viết bài.",
    });
    return;
  }
  const authorId = req.user!.userId;
  const post = await createPost(authorId, input);
  res.status(201).json(post);
});

export const getForEdit = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.user!.userId;
  const post = await getPostForEdit(postId, userId);
  res.json(post);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const viewerId = req.user?.userId ?? null;
  const result = await getPostById(postId, viewerId);
  if ("notFound" in result && result.notFound) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if ("forbidden" in result && result.forbidden) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result);
});

export const patchPostStatus = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.user!.userId;
  const { status } = quickStatusSchema.parse(req.body);
  const post = await updatePostStatusOnly(postId, userId, status);
  res.json(post);
});

export const patchPost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.user!.userId;
  const input = parseEditor(req);
  const post = await updatePost(postId, userId, input);
  res.json(post);
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.user!.userId;
  const post = await softDeletePostByAuthor(postId, userId);
  res.json(post);
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const data = await listComments(postId);
  res.json(data);
});

export const postComment = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const authorId = req.user!.userId;
  const body = commentSchema.parse(req.body);
  const comment = await createComment(postId, authorId, {
    body: body.body,
    parentId: body.parentId,
  });
  res.status(201).json(comment);
});

export const putClap = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.user!.userId;
  const { count } = clapSchema.parse(req.body);
  const post = await setClap(postId, userId, count);
  res.json(post);
});

export const putLike = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.user!.userId;
  const { liked } = likeSchema.parse(req.body);
  const post = await setLike(postId, userId, liked);
  res.json(post);
});

export const postBookmark = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.user!.userId;
  const result = await toggleBookmark(postId, userId);
  res.json(result);
});
