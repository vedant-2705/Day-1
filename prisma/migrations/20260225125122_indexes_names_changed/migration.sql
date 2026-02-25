/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `contacts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "contact_email_unique_idx";

-- CreateIndex
CREATE UNIQUE INDEX "contact_email_unique_idx" ON "contacts"("email") WHERE ("deleted_at" IS NULL);

-- RenameIndex
ALTER INDEX "audit_entity_type_entity_id_idx" RENAME TO "audit_log_entity_type_entity_id_idx";
