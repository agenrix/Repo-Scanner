import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type PgClientType = ReturnType<typeof postgres>;

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: PgClientType | undefined;
};

const pgClient =
  globalForDb.client ?? postgres(process.env.POSTGRES_URL as string);

if (process.env.NODE_ENV !== "production") globalForDb.client = pgClient;

export const pg = drizzle({
  casing: "snake_case",
  client: pgClient,
  schema,
});
