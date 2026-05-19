-- AlterTable User
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'OWNER';
ALTER TABLE "User" ADD COLUMN "employerId" TEXT;

-- AlterTable Event
ALTER TABLE "Event" ADD COLUMN "menuHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable MenuItem
ALTER TABLE "MenuItem" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable GuestRequest
ALTER TABLE "GuestRequest" ADD COLUMN "tableLocation" TEXT NOT NULL DEFAULT '';

-- CreateTable StaffEventAccess
CREATE TABLE "StaffEventAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffEventAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable StaffTask
CREATE TABLE "StaffTask" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "title" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable ShoppingList
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "ownerId" TEXT NOT NULL,
    "eventId" TEXT,
    "sentAt" TIMESTAMP(3),
    "sentTo" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable EventAccessory
CREATE TABLE "EventAccessory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_employerId_idx" ON "User"("employerId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "StaffEventAccess_userId_eventId_key" ON "StaffEventAccess"("userId", "eventId");
CREATE INDEX "StaffEventAccess_userId_idx" ON "StaffEventAccess"("userId");
CREATE INDEX "StaffEventAccess_eventId_idx" ON "StaffEventAccess"("eventId");
CREATE INDEX "StaffTask_eventId_idx" ON "StaffTask"("eventId");
CREATE INDEX "StaffTask_assignedToId_idx" ON "StaffTask"("assignedToId");
CREATE INDEX "StaffTask_status_idx" ON "StaffTask"("status");
CREATE INDEX "ShoppingList_ownerId_idx" ON "ShoppingList"("ownerId");
CREATE INDEX "ShoppingList_eventId_idx" ON "ShoppingList"("eventId");
CREATE INDEX "EventAccessory_eventId_idx" ON "EventAccessory"("eventId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffEventAccess" ADD CONSTRAINT "StaffEventAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffEventAccess" ADD CONSTRAINT "StaffEventAccess_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffTask" ADD CONSTRAINT "StaffTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffTask" ADD CONSTRAINT "StaffTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffTask" ADD CONSTRAINT "StaffTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventAccessory" ADD CONSTRAINT "EventAccessory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
