ALTER TABLE "session" ADD COLUMN "active_organization_id" uuid;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "onboarded";