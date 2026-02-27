/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `contacts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "contact_email_unique_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_picture_path" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "contact_email_unique_idx" ON "contacts"("email") WHERE ("deleted_at" IS NULL);
