ALTER TABLE "agent" ALTER COLUMN "classification" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agent" ALTER COLUMN "confidence" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agent" ALTER COLUMN "reasoning" DROP NOT NULL;