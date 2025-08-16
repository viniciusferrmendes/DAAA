-- CreateEnum
CREATE TYPE "public"."AccidentStatus" AS ENUM ('draft', 'awaiting_other_party', 'both_in_draft', 'ready_to_sign', 'signed_by_one', 'signed_by_both', 'pdf_generated', 'submitted');

-- CreateEnum
CREATE TYPE "public"."PartyRole" AS ENUM ('A', 'B');

-- CreateTable
CREATE TABLE "public"."Accident" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3),
    "time" TEXT,
    "location" JSONB,
    "injuries" BOOLEAN NOT NULL DEFAULT false,
    "materialDamages" JSONB,
    "witnesses" JSONB,
    "circumstances" JSONB,
    "collisionPoint" JSONB,
    "visibleDamages" JSONB,
    "sketchUrl" TEXT,
    "observations" JSONB,
    "signatures" JSONB,
    "status" "public"."AccidentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccidentParty" (
    "id" SERIAL NOT NULL,
    "accidentId" INTEGER NOT NULL,
    "role" "public"."PartyRole" NOT NULL,
    "insured" JSONB,
    "vehicle" JSONB,
    "insurance" JSONB,
    "driver" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccidentParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QrSession" (
    "id" SERIAL NOT NULL,
    "accidentId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" SERIAL NOT NULL,
    "accidentId" INTEGER,
    "userId" INTEGER,
    "party" "public"."PartyRole",
    "action" TEXT NOT NULL,
    "block" TEXT,
    "ip" TEXT,
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Accident_status_idx" ON "public"."Accident"("status");

-- CreateIndex
CREATE INDEX "AccidentParty_accidentId_idx" ON "public"."AccidentParty"("accidentId");

-- CreateIndex
CREATE UNIQUE INDEX "AccidentParty_accidentId_role_key" ON "public"."AccidentParty"("accidentId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "QrSession_token_key" ON "public"."QrSession"("token");

-- CreateIndex
CREATE INDEX "QrSession_accidentId_idx" ON "public"."QrSession"("accidentId");

-- CreateIndex
CREATE INDEX "QrSession_expiresAt_idx" ON "public"."QrSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_accidentId_idx" ON "public"."AuditLog"("accidentId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_ts_idx" ON "public"."AuditLog"("ts");

-- CreateIndex
CREATE INDEX "Vehicle_userId_idx" ON "public"."Vehicle"("userId");

-- AddForeignKey
ALTER TABLE "public"."AccidentParty" ADD CONSTRAINT "AccidentParty_accidentId_fkey" FOREIGN KEY ("accidentId") REFERENCES "public"."Accident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QrSession" ADD CONSTRAINT "QrSession_accidentId_fkey" FOREIGN KEY ("accidentId") REFERENCES "public"."Accident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_accidentId_fkey" FOREIGN KEY ("accidentId") REFERENCES "public"."Accident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
