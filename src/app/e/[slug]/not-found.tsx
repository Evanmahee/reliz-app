import { getT } from "@/i18n/server";

/** QR code périmé ou mal recopié : message clair et traduit pour l'invité. */
export default async function GuestNotFound() {
  const { t } = await getT();
  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center">
        <div className="w-full rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-zinc-900">{t("guest.notFound")}</p>
          <p className="mt-2 text-sm text-zinc-500">{t("guest.notFoundHint")}</p>
        </div>
      </div>
    </div>
  );
}
