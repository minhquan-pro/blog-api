import type { RequestUser } from "../lib/auth-types.js";

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export {};
