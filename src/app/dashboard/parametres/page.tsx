import { redirect } from "next/navigation";

/** Ancienne page paramètres — profil / déconnexion sont dans la sidebar. */
export default function ParametresPage() {
  redirect("/dashboard");
}
