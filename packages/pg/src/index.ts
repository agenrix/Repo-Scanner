import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type PgClient = ReturnType<typeof postgres>;

declare global {
  var __agenrixPgClient: PgClient | undefined;
}

const pgClient =
  globalThis.__agenrixPgClient ?? postgres(process.env.POSTGRES_URL as string);

globalThis.__agenrixPgClient = pgClient;

export const pg = drizzle({
  casing: "snake_case",
  client: pgClient,
  schema,
});
