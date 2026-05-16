import Link from "next/link";
import { CreateChecklistForm } from "@/components/dashboard/create-checklist-form";
import { outlineButtonClassName } from "@/components/ui/button";

export default async function NouvelleChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <Link href="/dashboard/checklists" className={outlineButtonClassName}>
          ← Checklists
        </Link>
        <p className="mt-5 text-xs font-medium text-zinc-400">Nouveau</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Nouvelle checklist
        </h1>
      </div>

      <CreateChecklistForm showNameError={sp.erreur === "nom"} />
    </div>
  );
}
