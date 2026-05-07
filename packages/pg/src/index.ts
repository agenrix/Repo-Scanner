import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const pgClient = postgres(process.env.POSTGRES_URL as string);
export const pg = drizzle({
  casing: "snake_case",
  client: pgClient,
  schema,
});
