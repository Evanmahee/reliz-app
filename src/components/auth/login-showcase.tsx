function WindowDots() {
  return (
    <div className="flex gap-1.5" aria-hidden>
      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
    </div>
  );
}

function GlassCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/15 bg-white/10 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl ${className}`}
    >
      <WindowDots />
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function LoginShowcase() {
  return (
    <aside className="relative hidden min-h-screen flex-1 overflow-hidden lg:flex lg:max-w-[52%]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 40%, #c45c26 0%, #6b2f14 35%, #2a1810 70%, #120c0a 100%)",
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 flex w-full flex-col justify-between p-8 xl:p-10">
        <p className="text-xs font-medium text-white/50">
          Reliz — gestion d&apos;événements traiteur
        </p>

        <div className="relative mx-auto my-6 w-full max-w-xl">
          <GlassCard className="absolute left-0 top-0 z-20 w-[min(100%,280px)] -rotate-1">
            <p className="text-sm font-semibold text-white">
              Demandes invités — En direct
            </p>
            <p className="mt-0.5 text-xs text-white/60">3 en attente</p>
            <ul className="mt-3 space-y-2 text-xs text-white/90">
              <li className="flex items-start justify-between gap-2 rounded-xl bg-white/10 px-2.5 py-2">
                <span>
                  <span className="font-medium">Table 12</span>
                  <span className="block text-white/65">Commande — Saumon</span>
                </span>
                <span className="shrink-0 text-[10px] text-white/45">14:32</span>
              </li>
              <li className="flex items-start justify-between gap-2 rounded-xl bg-white/10 px-2.5 py-2">
                <span>
                  <span className="font-medium">Table 7</span>
                  <span className="block text-white/65">Personnel à table</span>
                </span>
                <span className="shrink-0 text-[10px] text-white/45">14:28</span>
              </li>
              <li className="flex items-start justify-between gap-2 rounded-xl bg-white/10 px-2.5 py-2">
                <span>
                  <span className="font-medium">Table 3</span>
                  <span className="block text-white/65">Service — Verres</span>
                </span>
                <span className="shrink-0 text-[10px] text-white/45">14:25</span>
              </li>
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/10 px-2 py-2 text-center">
                <p className="text-[10px] text-white/55">Temps moyen</p>
                <p className="text-sm font-semibold text-white">4 min</p>
              </div>
              <div className="rounded-xl bg-white/10 px-2 py-2 text-center">
                <p className="text-[10px] text-white/55">Tables actives</p>
                <p className="text-sm font-semibold text-white">18</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="absolute right-0 top-24 z-30 w-[min(100%,260px)] rotate-1">
            <p className="text-sm font-semibold text-white">Événement en cours</p>
            <p className="mt-1 text-base font-medium text-white">
              Mariage Dubois
            </p>
            <dl className="mt-3 space-y-1.5 text-xs text-white/75">
              <div className="flex justify-between gap-2">
                <dt>Lieu</dt>
                <dd className="font-medium text-white">Château de Bellevue</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Invités</dt>
                <dd className="font-medium text-white">120 tables</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>QR invité</dt>
                <dd className="font-medium text-emerald-300">Actif</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] leading-relaxed text-white/80">
              Les invités scannent le QR pour commander depuis leur table.
            </p>
          </GlassCard>

          <GlassCard className="absolute bottom-8 left-4 z-10 w-[min(100%,240px)] -rotate-2">
            <p className="text-sm font-semibold text-white">Carte du soir</p>
            <ul className="mt-2 space-y-1.5 text-xs">
              <li className="flex items-center justify-between text-white/90">
                <span>Tataki de thon</span>
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                  En stock
                </span>
              </li>
              <li className="flex items-center justify-between text-white/90">
                <span>Risotto aux cèpes</span>
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                  En stock
                </span>
              </li>
              <li className="flex items-center justify-between text-white/90">
                <span>Magret de canard</span>
                <span className="rounded-full bg-amber-400/25 px-2 py-0.5 text-[10px] font-medium text-amber-100">
                  Rupture
                </span>
              </li>
            </ul>
          </GlassCard>

          <GlassCard className="absolute bottom-0 right-0 z-20 w-[min(100%,250px)] rotate-1">
            <p className="text-sm font-semibold text-white">Consignes équipe</p>
            <div className="mt-2 space-y-2">
              <p className="rounded-xl rounded-tl-sm bg-white/15 px-3 py-2 text-xs text-white/90">
                Service cocktail 19h, passage en salle à 20h30.
              </p>
              <p className="rounded-xl rounded-tr-sm bg-white/25 px-3 py-2 text-xs text-white">
                Rappel : allergènes affichés sur chaque plat de la carte.
              </p>
            </div>
            <p className="mt-2 text-[10px] text-white/50">
              Visible par l&apos;équipe sur la fiche événement
            </p>
          </GlassCard>

          <div className="invisible min-h-[420px] w-full" aria-hidden />
        </div>

        <p className="text-xs text-white/45">
          QR code, carte, demandes tables — tout depuis une seule interface.
        </p>
      </div>
    </aside>
  );
}
