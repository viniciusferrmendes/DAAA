/*
  Warnings:

  - Added the required column `createdBy` to the `Accident` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Accident" ADD COLUMN     "createdBy" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."AccidentParty" ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE INDEX "Accident_createdBy_idx" ON "public"."Accident"("createdBy");

-- CreateIndex
CREATE INDEX "AccidentParty_userId_idx" ON "public"."AccidentParty"("userId");

-- AddForeignKey
ALTER TABLE "public"."Accident" ADD CONSTRAINT "Accident_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccidentParty" ADD CONSTRAINT "AccidentParty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
