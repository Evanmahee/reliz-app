/** Longueurs maximales des champs texte, par nom de champ (défaut : 500). */
const MAX: Record<string, number> = {
  name: 120,
  title: 160,
  venue: 160,
  email: 254,
  zone: 60,
  number: 20,
  description: 500,
  note: 1000,
  notes: 1000,
  content: 500,
  quantity: 6,
  // Contenus JSON déjà validés bloc par bloc (80 blocs max).
  instructionsPayload: 1_200_000,
  blocksPayload: 1_200_000,
};

/**
 * Lit un champ texte de formulaire : nettoyé, sans caractères de contrôle,
 * tronqué à une longueur raisonnable (aucune saisie géante en base).
 */
export function field(formData: FormData, key: string, max?: number): string {
  const raw = formData.get(key);
  if (typeof raw !== "string") return "";
  const limit = max ?? MAX[key] ?? 500;
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, limit);
}
