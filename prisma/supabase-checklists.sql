-- =============================================================================
-- Reliz — Table Checklist uniquement (Supabase / PostgreSQL)
-- SQL Editor → New query → Run une fois.
--
-- Prérequis : la table "User" doit déjà exister.
-- =============================================================================

-- Si tu as une vieille table Checklist cassée, décommente puis RUN une fois :
-- DROP TABLE IF EXISTS "Checklist" CASCADE;

CREATE TABLE IF NOT EXISTS "Checklist" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "blocks"    JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ownerId"   TEXT NOT NULL,
  CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Checklist_ownerId_idx" ON "Checklist" ("ownerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Checklist_ownerId_fkey'
  ) THEN
    ALTER TABLE "Checklist"
      ADD CONSTRAINT "Checklist_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
