import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { invitationSchema } from "./invitation.schema";
import { memberSchema } from "./member.schema";

export const organizationSchema = pgTable(
  "organization",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const organizationSchemaRelations = relations(
  organizationSchema,
  ({ many }) => ({
    members: many(memberSchema),
    invitations: many(invitationSchema),
  }),
);
