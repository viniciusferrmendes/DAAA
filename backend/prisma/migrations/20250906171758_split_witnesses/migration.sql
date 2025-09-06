/*
  Warnings:

  - You are about to drop the column `witnesses` on the `Accident` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Accident" DROP COLUMN "witnesses",
ADD COLUMN     "witnessesA" JSONB,
ADD COLUMN     "witnessesB" JSONB;
