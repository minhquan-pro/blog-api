import path from "node:path";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler } from "./middleware/error-handler.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { postsRouter } from "./routes/posts.js";
import { publicationsRouter } from "./routes/publications.js";
import { tagsRouter } from "./routes/tags.js";
import { uploadsRouter } from "./routes/uploads.js";
import { usersRouter } from "./routes/users.js";

export function createApp(): express.Application {
  const app = express();
  app.use(
    helmet({
      // Cho phép trình duyệt đọc response từ origin khác (Blog-ui 5173, Blog-admin 5174)
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  /** Luôn cho phép hai app Vite local; thêm domain từ CLIENT_ORIGIN (không bị ghi đè). */
  const fromEnv = (process.env.CLIENT_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const originList = [
    ...new Set([
      "http://localhost:5173",
      "http://localhost:5174",
      ...fromEnv,
    ]),
  ];
  app.use(
    cors({
      origin: (requestOrigin, cb) => {
        if (!requestOrigin || originList.includes(requestOrigin)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
      credentials: true,
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  const uploadsPath = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsPath));

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/me", meRouter);
  app.use("/api", tagsRouter);
  app.use("/api", publicationsRouter);
  app.use("/api", usersRouter);
  app.use("/api", uploadsRouter);
  app.use("/api", postsRouter);

  app.use(errorHandler);
  return app;
}
