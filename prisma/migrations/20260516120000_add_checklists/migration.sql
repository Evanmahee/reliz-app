-- CreateTable
CREATE TABLE IF NOT EXISTS "Checklist" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "blocks"    JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "ownerId"   TEXT NOT NULL,
  CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Checklist_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Checklist_ownerId_idx" ON "Checklist" ("ownerId");
