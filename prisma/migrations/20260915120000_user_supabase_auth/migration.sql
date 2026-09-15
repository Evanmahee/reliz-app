-- Aligné avec prisma/supabase-auth-user-profile.sql (à exécuter aussi manuellement si besoin)

TRUNCATE TABLE
  "GuestRequest",
  "MenuItem",
  "EventAccessory",
  "StaffTask",
  "StaffEventAccess",
  "ShoppingList",
  "Event",
  "Checklist"
CASCADE;

DROP TABLE IF EXISTS public."User" CASCADE;

CREATE TABLE public."User" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'OWNER',
  "employerId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "User_employerId_fkey"
    FOREIGN KEY ("employerId") REFERENCES public."User"(id) ON DELETE CASCADE
);

CREATE INDEX "User_employerId_idx" ON public."User"("employerId");
CREATE INDEX "User_role_idx" ON public."User"(role);

ALTER TABLE "Checklist"
  ADD CONSTRAINT "Checklist_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON DELETE CASCADE;

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON DELETE CASCADE;

ALTER TABLE "ShoppingList"
  ADD CONSTRAINT "ShoppingList_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON DELETE CASCADE;

ALTER TABLE "StaffEventAccess"
  ADD CONSTRAINT "StaffEventAccess_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;

ALTER TABLE "StaffTask"
  ADD CONSTRAINT "StaffTask_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON DELETE CASCADE;

ALTER TABLE "StaffTask"
  ADD CONSTRAINT "StaffTask_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON DELETE SET NULL;
