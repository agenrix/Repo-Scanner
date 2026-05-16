import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizationSchema } from "./organization.schema";
import { userSchema } from "./user.schema";

export const appNameEnum = pgEnum("app_name_enum", ["github"]);

export const integrationsSchema = pgTable(
  "integrations",
  {
    id: uuid().primaryKey().defaultRandom(),
    appName: appNameEnum("app_name").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationSchema.id),
    connectedBy: uuid("connected_by")
      .notNull()
      .references(() => userSchema.id),
    credentialId: uuid("credential_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("integrations_organization_id_app_name_idx").on(
      table.organizationId,
      table.appName,
    ),
  ],
);

export type ISelectIntegration = typeof integrationsSchema.$inferSelect;
export type IInsertIntegration = typeof integrationsSchema.$inferInsert;

export const integrationsSchemaReferences = relations(
  integrationsSchema,
  ({ one }) => ({
    organization: one(organizationSchema, {
      fields: [integrationsSchema.organizationId],
      references: [organizationSchema.id],
    }),
    connectedBy: one(userSchema, {
      fields: [integrationsSchema.connectedBy],
      references: [userSchema.id],
    }),
  }),
);
