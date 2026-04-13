import { config } from "dotenv";

config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "mysql://admin:minhquan@127.0.0.1:3306/demo_blog";
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  process.env.JWT_SECRET = "test-secret-min-32-characters-long!!";
}
if (!process.env.CLIENT_ORIGIN) {
  process.env.CLIENT_ORIGIN = "http://localhost:5173";
}
