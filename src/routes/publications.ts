import { Router } from "express";

import {
  getPublication,
  getPublicationMembers,
  getPublicationPosts,
  getPublications,
  patchMember,
} from "../controllers/publications.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { requireNotLocked } from "../middleware/require-unlocked.js";

const router = Router();

router.get("/publications", getPublications);

router.get("/publications/:slug", getPublication);

router.get("/publications/:slug/posts", getPublicationPosts);

router.get("/publications/:slug/members", getPublicationMembers);

router.patch(
  "/publications/:slug/members/:userId",
  optionalAuth,
  requireAuth,
  requireNotLocked,
  patchMember,
);

export { router as publicationsRouter };
