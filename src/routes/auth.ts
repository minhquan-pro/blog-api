import { Router } from "express";

import { getAuthMe, postLogin, postLogout, postRegister } from "../controllers/auth.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { requireNotLocked } from "../middleware/require-unlocked.js";

const router = Router();

router.post("/register", postRegister);
router.post("/login", postLogin);
router.post("/logout", postLogout);

router.get("/me", optionalAuth, requireAuth, requireNotLocked, getAuthMe);

export { router as authRouter };
