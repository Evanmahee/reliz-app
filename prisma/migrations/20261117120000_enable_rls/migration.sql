-- Active la Row Level Security sur toutes les tables du schéma public.
-- Aucune policy : la clé anon / authenticated (API REST Supabase) ne voit plus rien.
-- Prisma se connecte avec le rôle postgres (DATABASE_URL), qui ignore la RLS :
-- l'application continue de fonctionner normalement.
-- Idempotent : peut être relancé sans risque.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
