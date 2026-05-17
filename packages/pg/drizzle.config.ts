import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL as string,
  },
  casing: "snake_case",
  out: "./src/migrations",
  schema: "./src/schema/index.ts",
});
