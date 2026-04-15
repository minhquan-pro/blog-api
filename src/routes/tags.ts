import { Router } from "express";

import { getTagPosts, getTags } from "../controllers/tags.controller.js";

const router = Router();

router.get("/tags", getTags);

router.get("/tags/:slug/posts", getTagPosts);

export { router as tagsRouter };
