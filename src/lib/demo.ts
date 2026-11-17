/**
 * Événement de démonstration affiché sur le site Reliz (vraie app, en direct).
 * Seul cet événement a une vue équipe publique, en lecture seule.
 */
export const DEMO_SLUG = process.env.DEMO_EVENT_SLUG?.trim() || "demo-reliz";

/** Prénom affiché pour la prise en charge simulée. */
export const DEMO_WAITER = "Léa";
