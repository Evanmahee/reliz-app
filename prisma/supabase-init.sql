-- =============================================================================
-- Reliz — schéma PostgreSQL pour Supabase
-- Coller dans : Supabase → SQL Editor → New query → Run
--
-- Correspond au schéma Prisma (User → Event → MenuItem / GuestRequest)
-- =============================================================================

-- Nettoyage (décommenter uniquement si tu repars de zéro)
-- DROP TABLE IF EXISTS "GuestRequest" CASCADE;
-- DROP TABLE IF EXISTS "MenuItem" CASCADE;
-- DROP TABLE IF EXISTS "Event" CASCADE;
-- DROP TABLE IF EXISTS "User" CASCADE;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "User" (
  "id"           TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "name"         TEXT,
  "passwordHash" TEXT NOT NULL,
  "createdAt"    TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Event" (
  "id"           TEXT NOT NULL,
  "publicSlug"   TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "venue"        TEXT NOT NULL DEFAULT '',
  "startsAt"     TIMESTAMPTZ(3),
  "endsAt"       TIMESTAMPTZ(3),
  "instructions" TEXT NOT NULL DEFAULT '',
  "instructionsBlocks" JSONB,
  "status"       TEXT NOT NULL DEFAULT 'LIVE',
  "createdAt"    TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ(3) NOT NULL,
  "ownerId"      TEXT NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Event_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Ancienne base créée sans JSON : ajouter la colonne (sans erreur si déjà présente)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "instructionsBlocks" JSONB;

CREATE TABLE IF NOT EXISTS "MenuItem" (
  "id"          TEXT NOT NULL,
  "eventId"     TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "outOfStock"  BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MenuItem_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "GuestRequest" (
  "id"          TEXT NOT NULL,
  "eventId"     TEXT NOT NULL,
  "tableNumber" TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "message"     TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt"   TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuestRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GuestRequest_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- Index & contraintes d'unicité
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Event_publicSlug_key" ON "Event" ("publicSlug");
CREATE INDEX IF NOT EXISTS "Event_ownerId_idx" ON "Event" ("ownerId");
CREATE INDEX IF NOT EXISTS "Event_status_idx" ON "Event" ("status");
CREATE INDEX IF NOT EXISTS "MenuItem_eventId_idx" ON "MenuItem" ("eventId");
CREATE INDEX IF NOT EXISTS "GuestRequest_eventId_idx" ON "GuestRequest" ("eventId");
CREATE INDEX IF NOT EXISTS "GuestRequest_status_idx" ON "GuestRequest" ("status");

-- -----------------------------------------------------------------------------
-- Checklists (modèles réutilisables pour consignes / cases à cocher)
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- Compte démo (demo@reliz.app / demo1234)
-- Mot de passe hashé avec bcrypt (10 rounds)
-- -----------------------------------------------------------------------------

INSERT INTO "User" ("id", "email", "name", "passwordHash", "createdAt", "updatedAt")
VALUES (
  'cldemo0000000000000000001',
  'demo@reliz.app',
  'Démo Traiteur',
  '$2b$10$92xupzQ3VCC4THAeqgpvIuXBdcj/Dyu5iXRUfQYonpNMRMGbUHA8m',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "passwordHash" = EXCLUDED."passwordHash",
  "updatedAt" = NOW();

-- -----------------------------------------------------------------------------
-- Exemple optionnel : un événement + plats + demandes (décommenter si besoin)
-- -----------------------------------------------------------------------------

/*
INSERT INTO "Event" (
  "id", "publicSlug", "name", "venue", "startsAt", "status",
  "instructions", "createdAt", "updatedAt", "ownerId"
) VALUES (
  'clevent000000000000000001',
  'mariage-dubois-demo',
  'Mariage Dubois',
  'Château de Bellevue',
  NOW(),
  'LIVE',
  'Service cocktail 19h, passage en salle à 20h30.',
  NOW(),
  NOW(),
  'cldemo0000000000000000001'
)
ON CONFLICT ("publicSlug") DO NOTHING;

INSERT INTO "MenuItem" ("id", "eventId", "name", "description", "sortOrder", "outOfStock") VALUES
  ('clmenu000000000000000001', 'clevent000000000000000001', 'Tataki de thon', '', 0, FALSE),
  ('clmenu000000000000000002', 'clevent000000000000000001', 'Risotto aux cèpes', '', 1, FALSE),
  ('clmenu000000000000000003', 'clevent000000000000000001', 'Magret de canard', '', 2, TRUE)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "GuestRequest" ("id", "eventId", "tableNumber", "type", "message", "status", "createdAt") VALUES
  ('clreq0000000000000000001', 'clevent000000000000000001', '12', 'ORDER', 'Saumon', 'PENDING', NOW() - INTERVAL '3 minutes'),
  ('clreq0000000000000000002', 'clevent000000000000000001', '7', 'STAFF', 'Personnel à table', 'PENDING', NOW() - INTERVAL '7 minutes')
ON CONFLICT ("id") DO NOTHING;
*/
