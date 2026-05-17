import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const verificationSchema = pgTable(
  "verification",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export type ISelectVerification = typeof verificationSchema.$inferSelect;
export type IInsertVerification = typeof verificationSchema.$inferInsert;
