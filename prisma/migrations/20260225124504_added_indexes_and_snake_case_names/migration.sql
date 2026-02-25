-- Contacts table: rename camelCase columns to snake_case
ALTER TABLE "contacts" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "contacts" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "contacts" RENAME COLUMN "deletedAt" TO "deleted_at";

-- ContactArchive table: rename camelCase columns to snake_case
ALTER TABLE "contacts_archive" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "contacts_archive" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "contacts_archive" RENAME COLUMN "deletedAt" TO "deleted_at";
ALTER TABLE "contacts_archive" RENAME COLUMN "archivedAt" TO "archived_at";

-- AuditLog table: rename camelCase columns to snake_case
ALTER TABLE "audit_logs" RENAME COLUMN "entityType" TO "entity_type";
ALTER TABLE "audit_logs" RENAME COLUMN "entityId"   TO "entity_id";
ALTER TABLE "audit_logs" RENAME COLUMN "oldData"    TO "old_data";
ALTER TABLE "audit_logs" RENAME COLUMN "newData"    TO "new_data";
ALTER TABLE "audit_logs" RENAME COLUMN "performedBy" TO "performed_by";
ALTER TABLE "audit_logs" RENAME COLUMN "ipAddress"  TO "ip_address";
ALTER TABLE "audit_logs" RENAME COLUMN "userAgent"  TO "user_agent";
ALTER TABLE "audit_logs" RENAME COLUMN "createdAt"  TO "created_at";

-- Drop old indexes that referenced old column names
-- (Prisma will recreate them with new names below)
DROP INDEX IF EXISTS "audit_logs_entityType_entityId_idx";
DROP INDEX IF EXISTS "contacts_archive_deletedAt_idx";

-- Recreate indexes with correct snake_case names
CREATE INDEX "audit_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_created_at_idx"             ON "audit_logs"("created_at");
CREATE INDEX "audit_action_idx"                 ON "audit_logs"("action");

CREATE INDEX "contact_deleted_at_idx"           ON "contacts"("deleted_at");
CREATE INDEX "contact_created_at_id_idx"        ON "contacts"("created_at" DESC, "id" DESC);
CREATE INDEX "contact_name_idx"                 ON "contacts"("name");
CREATE INDEX "contact_email_idx"                ON "contacts"("email");

CREATE INDEX "contact_archive_deleted_at_idx"   ON "contacts_archive"("deleted_at");

-- Fix the partial unique index on email
-- Old one referenced "deletedAt", new one references "deleted_at"
DROP INDEX IF EXISTS "contact_email_unique_idx";
CREATE UNIQUE INDEX "contact_email_unique_idx"  ON "contacts"("email") WHERE "deleted_at" IS NULL;