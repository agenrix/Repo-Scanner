import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizationSchema } from "./organization.schema";

export const agentClassificationEnum = pgEnum("agent_classification_enum", [
  "AGENT",
  "POSSIBLE_AGENT",
  "NOT_AGENT",
]);

export const agentConfidenceEnum = pgEnum("agent_confidence_enum", [
  "high",
  "medium",
  "low",
]);

export const agentStatusEnum = pgEnum("agent_status_enum", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);

export const agentSchema = pgTable(
  "agent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationSchema.id, { onDelete: "cascade" }),
    repoId: text("repo_id").notNull(),
    repoName: text("repo_name").notNull(),
    repoLink: text("repo_link").notNull(),
    classification: agentClassificationEnum("classification"),
    confidence: agentConfidenceEnum("confidence"),
    status: agentStatusEnum("status").default("PENDING").notNull(),
    agentSignals: jsonb("agent_signals")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    evidenceFiles: jsonb("evidence_files")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    frameworksDetected: jsonb("frameworks_detected")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    reasoning: text("reasoning"),
    agentId: text("agent_id"),
    agentName: text("agent_name"),
    agentDescription: text("agent_description"),
    agentOwner: text("agent_owner"),
    agentContributors: jsonb("agent_contributors")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    agentAccessRights: jsonb("agent_access_rights").$type<{
      files: string[];
      tools: string[];
      data_nodes: string[];
      apis: string[];
      servers: string[];
    }>(),
    agentIntegrationDetails: jsonb("agent_integration_details").$type<{
      apis: string[];
      tools: string[];
      frameworks: string[];
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("agent_organization_repo_id_uidx").on(
      table.organizationId,
      table.repoId,
    ),
    uniqueIndex("agent_organization_repo_link_uidx").on(
      table.organizationId,
      table.repoLink,
    ),
    index("agent_organization_id_idx").on(table.organizationId),
    index("agent_classification_idx").on(table.classification),
  ],
);

export type ISelectAgent = typeof agentSchema.$inferSelect;
export type IInsertAgent = typeof agentSchema.$inferInsert;
