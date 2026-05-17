import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const githubCredentialsSchema = pgTable(
  "github_credentials",
  {
    id: uuid().primaryKey().defaultRandom(),
    installationId: text("installation_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("github_credentials_installation_id_idx").on(
      table.installationId,
    ),
  ],
);

export type ISelectGithubCredentials =
  typeof githubCredentialsSchema.$inferSelect;
export type IInsertGithubCredentials =
  typeof githubCredentialsSchema.$inferInsert;
