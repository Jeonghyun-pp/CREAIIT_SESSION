import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Load .env.local for Prisma CLI
import { config } from "dotenv";
config({ path: path.join(__dirname, ".env.local") });

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
});
