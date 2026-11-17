import type { Metadata } from "next";
import { DemoBoard } from "@/components/demo/demo-board";

export const metadata: Metadata = {
  title: "Reliz — démonstration côté équipe",
  robots: { index: false, follow: false },
};

/** Vue équipe publique de la démo (lecture seule), intégrée au site Reliz. */
export default function DemoEquipePage() {
  return <DemoBoard />;
}
