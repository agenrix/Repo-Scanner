import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizationSchema } from "./organization.schema";
import { userSchema } from "./user.schema";

export const invitationSchema = pgTable(
  "invitation",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationSchema.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: uuid("inviter_id")
      .notNull()
      .references(() => userSchema.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const invitationSchemaRelations = relations(
  invitationSchema,
  ({ one }) => ({
    organization: one(organizationSchema, {
      fields: [invitationSchema.organizationId],
      references: [organizationSchema.id],
    }),
    user: one(userSchema, {
      fields: [invitationSchema.inviterId],
      references: [userSchema.id],
    }),
  }),
);
