import { createPostgres } from "@agenrix/pg";
import { env } from "./env.config";

export const postgres = createPostgres({ url: env.persistence.pg.url });
