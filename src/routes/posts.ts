import { Router } from "express";

import {
  deletePost,
  getById,
  getByPath,
  getComments,
  getFeed,
  getForEdit,
  getSearch,
  patchPost,
  patchPostStatus,
  postBookmark,
  postComment,
  postCreate,
  putClap,
  putLike,
} from "../controllers/posts.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { requireNotLocked } from "../middleware/require-unlocked.js";

const router = Router();

router.get("/posts/feed", getFeed);

router.get("/posts/search", getSearch);

router.get("/posts/by-path/:username/:slug", optionalAuth, getByPath);

router.post("/posts", optionalAuth, requireAuth, requireNotLocked, postCreate);

router.get("/posts/:postId/edit", optionalAuth, requireAuth, requireNotLocked, getForEdit);

router.get("/posts/:postId", optionalAuth, getById);

router.patch(
  "/posts/:postId/status",
  optionalAuth,
  requireAuth,
  requireNotLocked,
  patchPostStatus,
);

router.delete("/posts/:postId", optionalAuth, requireAuth, requireNotLocked, deletePost);

router.patch("/posts/:postId", optionalAuth, requireAuth, requireNotLocked, patchPost);

router.get("/posts/:postId/comments", getComments);

router.post("/posts/:postId/comments", optionalAuth, requireAuth, requireNotLocked, postComment);

router.put("/posts/:postId/clap", optionalAuth, requireAuth, requireNotLocked, putClap);

router.put("/posts/:postId/like", optionalAuth, requireAuth, requireNotLocked, putLike);

router.post("/posts/:postId/bookmark", optionalAuth, requireAuth, requireNotLocked, postBookmark);

export { router as postsRouter };
