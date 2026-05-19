-- =============================================================================
-- Nouvelles fonctionnalités : équipe, tâches, courses, accessoires, menu masqué
--
-- Supabase → SQL Editor → coller tout ce fichier → Run (une fois)
-- =============================================================================

-- User : rôles traiteur / serveur
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'OWNER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "employerId" TEXT;

-- Event : masquer la carte invités
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "menuHidden" BOOLEAN NOT NULL DEFAULT false;

-- MenuItem : masquer un plat
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "hidden" BOOLEAN NOT NULL DEFAULT false;

-- GuestRequest : emplacement table (terrasse, salle…)
ALTER TABLE "GuestRequest" ADD COLUMN IF NOT EXISTS "tableLocation" TEXT NOT NULL DEFAULT '';

-- StaffEventAccess
CREATE TABLE IF NOT EXISTS "StaffEventAccess" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "eventId"   TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffEventAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StaffEventAccess_userId_eventId_key"
  ON "StaffEventAccess" ("userId", "eventId");
CREATE INDEX IF NOT EXISTS "StaffEventAccess_userId_idx" ON "StaffEventAccess" ("userId");
CREATE INDEX IF NOT EXISTS "StaffEventAccess_eventId_idx" ON "StaffEventAccess" ("eventId");

-- StaffTask
CREATE TABLE IF NOT EXISTS "StaffTask" (
  "id"           TEXT NOT NULL,
  "eventId"      TEXT NOT NULL,
  "createdById"  TEXT NOT NULL,
  "assignedToId" TEXT,
  "title"        TEXT NOT NULL,
  "note"         TEXT NOT NULL DEFAULT '',
  "status"       TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt"    TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StaffTask_eventId_idx" ON "StaffTask" ("eventId");
CREATE INDEX IF NOT EXISTS "StaffTask_assignedToId_idx" ON "StaffTask" ("assignedToId");
CREATE INDEX IF NOT EXISTS "StaffTask_status_idx" ON "StaffTask" ("status");

-- ShoppingList
CREATE TABLE IF NOT EXISTS "ShoppingList" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "items"     JSONB NOT NULL,
  "ownerId"   TEXT NOT NULL,
  "eventId"   TEXT,
  "sentAt"    TIMESTAMPTZ(3),
  "sentTo"    TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShoppingList_ownerId_idx" ON "ShoppingList" ("ownerId");
CREATE INDEX IF NOT EXISTS "ShoppingList_eventId_idx" ON "ShoppingList" ("eventId");

-- EventAccessory
CREATE TABLE IF NOT EXISTS "EventAccessory" (
  "id"        TEXT NOT NULL,
  "eventId"   TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "quantity"  INTEGER NOT NULL DEFAULT 1,
  "notes"     TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "EventAccessory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EventAccessory_eventId_idx" ON "EventAccessory" ("eventId");

-- Index User
CREATE INDEX IF NOT EXISTS "User_employerId_idx" ON "User" ("employerId");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User" ("role");

-- Clés étrangères (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_employerId_fkey') THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_employerId_fkey"
      FOREIGN KEY ("employerId") REFERENCES "User" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffEventAccess_userId_fkey') THEN
    ALTER TABLE "StaffEventAccess"
      ADD CONSTRAINT "StaffEventAccess_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffEventAccess_eventId_fkey') THEN
    ALTER TABLE "StaffEventAccess"
      ADD CONSTRAINT "StaffEventAccess_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffTask_eventId_fkey') THEN
    ALTER TABLE "StaffTask"
      ADD CONSTRAINT "StaffTask_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffTask_createdById_fkey') THEN
    ALTER TABLE "StaffTask"
      ADD CONSTRAINT "StaffTask_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffTask_assignedToId_fkey') THEN
    ALTER TABLE "StaffTask"
      ADD CONSTRAINT "StaffTask_assignedToId_fkey"
      FOREIGN KEY ("assignedToId") REFERENCES "User" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ShoppingList_ownerId_fkey') THEN
    ALTER TABLE "ShoppingList"
      ADD CONSTRAINT "ShoppingList_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ShoppingList_eventId_fkey') THEN
    ALTER TABLE "ShoppingList"
      ADD CONSTRAINT "ShoppingList_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EventAccessory_eventId_fkey') THEN
    ALTER TABLE "EventAccessory"
      ADD CONSTRAINT "EventAccessory_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
