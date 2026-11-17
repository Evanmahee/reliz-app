/** Mots de passe trop courants, refusés même s'ils sont assez longs. */
const COMMON = new Set([
  "password", "password1", "password123", "motdepasse", "motdepasse1",
  "azertyuiop", "azerty123", "qwertyuiop", "123456789", "1234567890",
  "0123456789", "iloveyou", "reliz12345", "traiteur123", "bonjour123",
  "soleil1234", "luxembourg", "admin12345", "changeme123", "welcome123",
]);

export const PASSWORD_MIN = 10;
/** Supabase (bcrypt) ignore au-delà de 72 octets. */
export const PASSWORD_MAX = 72;

export type PasswordProblem = "court" | "long" | "faible" | "email";

/**
 * Règles communes : 10 caractères minimum, pas un mot de passe courant,
 * pas le début de l'email, au moins deux types de caractères.
 */
export function checkPassword(password: string, email?: string): PasswordProblem | null {
  if (password.length < PASSWORD_MIN) return "court";
  if (new TextEncoder().encode(password).length > PASSWORD_MAX) return "long";
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return "faible";
  const local = (email ?? "").split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 4 && lower.includes(local)) return "email";
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  if (kinds < 2 || /^(.)\1+$/.test(password)) return "faible";
  return null;
}
