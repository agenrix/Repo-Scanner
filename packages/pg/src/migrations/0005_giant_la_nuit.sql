CREATE TYPE "public"."agent_classification_enum" AS ENUM('AGENT', 'POSSIBLE_AGENT', 'NOT_AGENT');--> statement-breakpoint
CREATE TYPE "public"."agent_confidence_enum" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TABLE "agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" text NOT NULL,
	"repo_name" text NOT NULL,
	"repo_link" text NOT NULL,
	"classification" "agent_classification_enum" NOT NULL,
	"confidence" "agent_confidence_enum" NOT NULL,
	"agent_signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"frameworks_detected" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reasoning" text NOT NULL,
	"agent_id" text,
	"agent_name" text,
	"agent_description" text,
	"agent_owner" text,
	"agent_contributors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"agent_access_rights" jsonb,
	"agent_integration_details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "agent_repo_id_uidx" ON "agent" USING btree ("repo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_repo_link_uidx" ON "agent" USING btree ("repo_link");--> statement-breakpoint
CREATE INDEX "agent_classification_idx" ON "agent" USING btree ("classification");