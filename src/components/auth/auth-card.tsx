import { RelizLogo } from "@/components/brand/reliz-logo";

/** Cadre commun des pages d'accès (mot de passe oublié, nouveau mot de passe). */
export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 ring-1 ring-brand-900/8">
        <RelizLogo height={56} />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-brand-950">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
