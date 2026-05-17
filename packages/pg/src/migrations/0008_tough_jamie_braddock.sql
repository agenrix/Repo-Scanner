DROP INDEX "agent_repo_id_uidx";--> statement-breakpoint
DROP INDEX "agent_repo_link_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "agent_organization_repo_id_uidx" ON "agent" USING btree ("organization_id","repo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_organization_repo_link_uidx" ON "agent" USING btree ("organization_id","repo_link");