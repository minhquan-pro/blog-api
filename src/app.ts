import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { postsRouter } from "./routes/posts.js";
import { publicationsRouter } from "./routes/publications.js";
import { tagsRouter } from "./routes/tags.js";
import { usersRouter } from "./routes/users.js";

export function createApp(): express.Application {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  const origin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
  app.use(
    cors({
      origin,
      credentials: true,
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/me", meRouter);
  app.use("/api", tagsRouter);
  app.use("/api", publicationsRouter);
  app.use("/api", usersRouter);
  app.use("/api", postsRouter);

  app.use(errorHandler);
  return app;
}
