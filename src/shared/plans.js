// L'offre d'abonnement. Une seule source : la page de paiement, Stripe, les e-mails et les CGV la lisent.
// Décidé par Maël le 25/11/2026 : 0,99 € les 3 premiers jours, puis une 1re semaine obligatoire à 16,99 €,
// puis 16,99 € par semaine jusqu'à résiliation. Montants en centimes TTC.
export const OFFERS = {
  semaine: { label: "Accès complet", trialDays: 3, intro: 99, renew: 1699, interval: "week", commitPeriods: 1 },
};
// L'essai à 0,99 € est VRAIMENT réservé 15 minutes (décidé par Maël le 25/11/2026) : passé ce délai, il disparaît
// pour cette adresse e-mail et ce téléphone, et l'abonnement démarre directement à 16,99 € la semaine.
export const RESERVATION_MIN = 15;

// Garantie « satisfait ou remboursé », avec conditions (décidé par Maël le 25/11/2026), vérifiée par le site lui-même
export const GUARANTEE = { minDays: 5, ofDays: 7, requestWithinDays: 14 };
export const guaranteeText = (o = OFFERS.semaine) =>
  `Suis ton plan au moins ${GUARANTEE.minDays} jours sur les ${GUARANTEE.ofDays} de ta 1re semaine payée (cases cochées dans ton espace). Si ça ne te convient pas, ta 1re semaine (${euros(o.renew)}) t'est remboursée en un clic, dans les ${GUARANTEE.requestWithinDays} jours qui suivent son prélèvement.`;
export const DEFAULT_OFFER = "semaine";
export const CURRENCY = "eur";
export const WEEK_MS = 7 * 864e5;

export const euros = (cents) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
// Le minimum à payer : les jours d'essai + la (ou les) semaine(s) d'engagement
export const minimumCents = (o) => o.intro + o.renew * o.commitPeriods;
export const perDay = (o) => euros(Math.round(o.renew / 7));
export const renewText = (o) => `puis ${euros(o.renew)} par semaine`;

// Les phrases de prix, identiques partout (page de paiement, Stripe, e-mail) : la clarté protège des litiges.
// trial = false : la réservation de l'essai a expiré, l'abonnement démarre tout de suite à la semaine.
export function priceLines(o, trial = true) {
  if (!trial) return {
    today: `${euros(o.renew)} pour ta 1re semaine`,
    then: `puis ${euros(o.renew)} par semaine`,
    minimum: `Sans engagement au-delà de la semaine payée : résiliable à tout moment en un clic, la résiliation prend effet à la fin de la semaine en cours.`,
    full: `Aujourd'hui ${euros(o.renew)} pour ta 1re semaine, puis ${euros(o.renew)} par semaine jusqu'à résiliation. Résiliable en ligne en un clic ; la résiliation prend effet à la fin de la semaine payée.`,
  };
  const weeks = o.commitPeriods === 1 ? "1 semaine" : `${o.commitPeriods} semaines`;
  return {
    today: `${euros(o.intro)} pour ${o.trialDays} jours`,
    then: `puis ${euros(o.renew)} par semaine`,
    minimum: `Engagement : les ${o.trialDays} jours, puis ${weeks} à ${euros(o.renew)}, soit ${euros(minimumCents(o))} au total. Ensuite, résiliable à tout moment en un clic.`,
    full: `Aujourd'hui ${euros(o.intro)} pour ${o.trialDays} jours, puis ${euros(o.renew)} par semaine jusqu'à résiliation. Engagement minimum : les ${o.trialDays} jours puis ${weeks} (${euros(minimumCents(o))} au total). Résiliable en ligne en un clic ; la résiliation prend effet à la fin de l'engagement.`,
  };
}

// Date de fin de l'engagement, à partir de la fin de l'essai
export const commitmentEnd = (trialEndMs, o) => trialEndMs + o.commitPeriods * WEEK_MS;
