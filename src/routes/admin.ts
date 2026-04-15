import { Router } from "express";

import {
  deleteAdminBookmarkHandler,
  deleteAdminNotificationHandler,
  deleteAdminPostClapHandler,
  deleteAdminUserFollowHandler,
  getAdminBookmarks,
  getAdminNotifications,
  getAdminPostClaps,
  getAdminUserFollows,
  patchAdminNotificationHandler,
} from "../controllers/admin-engagement.controller.js";
import {
  getAdminCommentsList,
  patchAdminCommentHandler,
} from "../controllers/admin-comments.controller.js";
import { getAdminDashboardHandler } from "../controllers/admin-dashboard.controller.js";
import {
  deleteAdminPostTagHandler,
  getAdminPosts,
  postAdminPostRestore,
  postAdminPostSoftDelete,
} from "../controllers/admin-posts.controller.js";
import {
  deleteAdminPublicationHandler,
  deleteAdminPublicationMemberHandler,
  getAdminPublicationById,
  getAdminPublicationMembersHandler,
  getAdminPublicationsList,
  patchAdminPublicationHandler,
  patchAdminPublicationMemberHandler,
  postAdminPublication,
  postAdminPublicationMemberHandler,
} from "../controllers/admin-publications.controller.js";
import {
  deleteAdminTagHandler,
  getAdminTagsList,
  patchAdminTagHandler,
  postAdminTag,
} from "../controllers/admin-tags.controller.js";
import {
  getAdminUserById,
  getAdminUsersList,
  patchAdminUserHandler,
  patchAdminUserProfileHandler,
} from "../controllers/admin-users.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/require-admin.js";

const router = Router();

const adminChain = [optionalAuth, requireAuth, requireAdmin] as const;

router.get("/dashboard", ...adminChain, asyncHandler(getAdminDashboardHandler));

router.get("/users", ...adminChain, asyncHandler(getAdminUsersList));
router.get("/users/:userId", ...adminChain, asyncHandler(getAdminUserById));
router.patch("/users/:userId", ...adminChain, asyncHandler(patchAdminUserHandler));
router.patch("/users/:userId/profile", ...adminChain, asyncHandler(patchAdminUserProfileHandler));

router.get("/tags", ...adminChain, asyncHandler(getAdminTagsList));
router.post("/tags", ...adminChain, asyncHandler(postAdminTag));
router.patch("/tags/:tagId", ...adminChain, asyncHandler(patchAdminTagHandler));
router.delete("/tags/:tagId", ...adminChain, asyncHandler(deleteAdminTagHandler));

router.get("/publications", ...adminChain, asyncHandler(getAdminPublicationsList));
router.post("/publications", ...adminChain, asyncHandler(postAdminPublication));
router.get("/publications/:id", ...adminChain, asyncHandler(getAdminPublicationById));
router.patch("/publications/:id", ...adminChain, asyncHandler(patchAdminPublicationHandler));
router.delete("/publications/:id", ...adminChain, asyncHandler(deleteAdminPublicationHandler));
router.get("/publications/:id/members", ...adminChain, asyncHandler(getAdminPublicationMembersHandler));
router.post("/publications/:id/members", ...adminChain, asyncHandler(postAdminPublicationMemberHandler));
router.patch(
  "/publications/:id/members/:userId",
  ...adminChain,
  asyncHandler(patchAdminPublicationMemberHandler),
);
router.delete(
  "/publications/:id/members/:userId",
  ...adminChain,
  asyncHandler(deleteAdminPublicationMemberHandler),
);

router.get("/posts", ...adminChain, asyncHandler(getAdminPosts));
router.post("/posts/:postId/delete", ...adminChain, asyncHandler(postAdminPostSoftDelete));
router.post("/posts/:postId/restore", ...adminChain, asyncHandler(postAdminPostRestore));
router.delete(
  "/posts/:postId/tags/:tagId",
  ...adminChain,
  asyncHandler(deleteAdminPostTagHandler),
);

router.get("/comments", ...adminChain, asyncHandler(getAdminCommentsList));
router.patch("/comments/:commentId", ...adminChain, asyncHandler(patchAdminCommentHandler));

router.get("/post-claps", ...adminChain, asyncHandler(getAdminPostClaps));
router.delete("/post-claps", ...adminChain, asyncHandler(deleteAdminPostClapHandler));

router.get("/bookmarks", ...adminChain, asyncHandler(getAdminBookmarks));
router.delete("/bookmarks", ...adminChain, asyncHandler(deleteAdminBookmarkHandler));

router.get("/user-follows", ...adminChain, asyncHandler(getAdminUserFollows));
router.delete("/user-follows", ...adminChain, asyncHandler(deleteAdminUserFollowHandler));

router.get("/notifications", ...adminChain, asyncHandler(getAdminNotifications));
router.patch("/notifications/:id", ...adminChain, asyncHandler(patchAdminNotificationHandler));
router.delete("/notifications/:id", ...adminChain, asyncHandler(deleteAdminNotificationHandler));

export { router as adminRouter };
