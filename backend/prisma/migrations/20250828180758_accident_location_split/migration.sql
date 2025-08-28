/*
  Warnings:

  - You are about to drop the column `location` on the `Accident` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Accident" DROP COLUMN "location",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "geoLat" DOUBLE PRECISION,
ADD COLUMN     "geoLng" DOUBLE PRECISION;
