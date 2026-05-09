import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizationSchema } from "./organization.schema";
import { userSchema } from "./user.schema";

export const memberSchema = pgTable(
  "member",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationSchema.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userSchema.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const memberSchemaRelations = relations(memberSchema, ({ one }) => ({
  organization: one(organizationSchema, {
    fields: [memberSchema.organizationId],
    references: [organizationSchema.id],
  }),
  user: one(userSchema, {
    fields: [memberSchema.userId],
    references: [userSchema.id],
  }),
}));
