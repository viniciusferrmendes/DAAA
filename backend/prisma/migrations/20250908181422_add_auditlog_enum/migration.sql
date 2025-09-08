/*
  Warnings:

  - You are about to drop the column `block` on the `AuditLog` table. All the data in the column will be lost.
  - Changed the type of `action` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE_ACCIDENT', 'UPDATE_GENERAL', 'UPDATE_PARTYA', 'UPDATE_PARTYB', 'UPDATE_CIRCUMSTANCES', 'UPDATE_COLLISION_POINT', 'UPDATE_VISIBLE_DAMAGES', 'UPDATE_WITNESSES', 'UPDATE_OBSERVATIONS', 'UPDATE_SIGNATURES', 'UPDATE_SKETCH', 'SIGN_PARTYA', 'SIGN_PARTYB', 'PDF_GENERATED', 'FINALIZED');

-- AlterTable
ALTER TABLE "public"."AuditLog" DROP COLUMN "block",
DROP COLUMN "action",
ADD COLUMN     "action" "public"."AuditAction" NOT NULL;
