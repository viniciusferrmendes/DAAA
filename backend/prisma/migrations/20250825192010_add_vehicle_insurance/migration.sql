-- AlterTable
ALTER TABLE "public"."Vehicle" ADD COLUMN     "insuranceCompany" TEXT,
ADD COLUMN     "insuranceEnd" TIMESTAMP(3),
ADD COLUMN     "insurancePolicyNum" TEXT,
ADD COLUMN     "insuranceStart" TIMESTAMP(3);
