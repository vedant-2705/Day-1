/*
  Warnings:

  - You are about to drop the column `profile_picture` on the `password_reset_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `contacts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "contact_email_unique_idx";

-- AlterTable
ALTER TABLE "password_reset_tokens" DROP COLUMN "profile_picture";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_picture" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "contact_email_unique_idx" ON "contacts"("email") WHERE ("deleted_at" IS NULL);
