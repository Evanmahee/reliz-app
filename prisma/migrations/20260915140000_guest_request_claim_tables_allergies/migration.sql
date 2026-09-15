-- AlterTable
ALTER TABLE "Event" ADD COLUMN "escaladeDelayMinutes" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "GuestRequest" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'OTHER';
ALTER TABLE "GuestRequest" ADD COLUMN "isVip" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GuestRequest" ADD COLUMN "claimedById" TEXT;
ALTER TABLE "GuestRequest" ADD COLUMN "claimedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "zone" TEXT NOT NULL DEFAULT '',
    "isVip" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestAllergy" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "GuestAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestRequest_claimedById_idx" ON "GuestRequest"("claimedById");

-- CreateIndex
CREATE INDEX "GuestRequest_category_idx" ON "GuestRequest"("category");

-- CreateIndex
CREATE INDEX "Table_eventId_idx" ON "Table"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_eventId_number_key" ON "Table"("eventId", "number");

-- CreateIndex
CREATE INDEX "GuestAllergy_eventId_idx" ON "GuestAllergy"("eventId");

-- CreateIndex
CREATE INDEX "GuestAllergy_eventId_tableNumber_idx" ON "GuestAllergy"("eventId", "tableNumber");

-- AddForeignKey
ALTER TABLE "GuestRequest" ADD CONSTRAINT "GuestRequest_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestAllergy" ADD CONSTRAINT "GuestAllergy_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
