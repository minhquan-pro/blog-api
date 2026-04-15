import { Router } from "express";

import {
  getProfileById,
  getProfileByUsernameHandler,
  getUserPosts,
  postFollow,
} from "../controllers/users.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { requireNotLocked } from "../middleware/require-unlocked.js";

const router = Router();

router.get("/users/id/:userId/profile", asyncHandler(getProfileById));

router.get(
  "/users/:username/profile",
  optionalAuth,
  asyncHandler(getProfileByUsernameHandler),
);

router.get("/users/:username/posts", asyncHandler(getUserPosts));

router.post(
  "/users/:userId/follow",
  optionalAuth,
  requireAuth,
  requireNotLocked,
  asyncHandler(postFollow),
);

export { router as usersRouter };
