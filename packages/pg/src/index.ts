import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export interface PostgresOptions {
  url: string;
}

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined;
};

export const createPostgres = ({ url }: PostgresOptions) => {
  const client = globalForDb.client ?? postgres(url);

  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
  }

  return drizzle({
    casing: "snake_case",
    client,
    schema,
  });
};

export type Postgres = PostgresJsDatabase<typeof schema> & {
  $client: postgres.Sql;
};
