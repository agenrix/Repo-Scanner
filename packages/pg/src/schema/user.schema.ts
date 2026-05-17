import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { accountSchema } from "./account.schema";
import { invitationSchema } from "./invitation.schema";
import { memberSchema } from "./member.schema";
import { sessionSchema } from "./session.schema";

export const userSchema = pgTable("user", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type ISelectUser = typeof userSchema.$inferSelect;
export type IInsertUser = typeof userSchema.$inferInsert;

export const userSchemaRelations = relations(userSchema, ({ many }) => ({
  sessions: many(sessionSchema),
  accounts: many(accountSchema),
  members: many(memberSchema),
  invitations: many(invitationSchema),
}));
