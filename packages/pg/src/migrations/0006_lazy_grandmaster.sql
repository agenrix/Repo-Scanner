CREATE TYPE "public"."agent_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN "status" "agent_status_enum" DEFAULT 'PENDING' NOT NULL;