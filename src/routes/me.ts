import { Router } from "express";

import {
  getMyBookmarks,
  getMyDrafts,
  getMyNotifications,
  getMyPosts,
  patchMyProfile,
} from "../controllers/me.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { requireNotLocked } from "../middleware/require-unlocked.js";

const router = Router();

router.get(
  "/posts",
  optionalAuth,
  requireAuth,
  requireNotLocked,
  asyncHandler(getMyPosts),
);

router.get(
  "/drafts",
  optionalAuth,
  requireAuth,
  requireNotLocked,
  asyncHandler(getMyDrafts),
);

router.get(
  "/bookmarks",
  optionalAuth,
  requireAuth,
  requireNotLocked,
  asyncHandler(getMyBookmarks),
);

router.get(
  "/notifications",
  optionalAuth,
  requireAuth,
  requireNotLocked,
  asyncHandler(getMyNotifications),
);

router.patch(
  "/profile",
  optionalAuth,
  requireAuth,
  requireNotLocked,
  asyncHandler(patchMyProfile),
);

export { router as meRouter };
