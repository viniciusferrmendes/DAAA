/*
  Warnings:

  - You are about to drop the column `date` on the `Accident` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Accident` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Accident" DROP COLUMN "date",
DROP COLUMN "time",
ADD COLUMN     "dateTime" TIMESTAMP(3);
