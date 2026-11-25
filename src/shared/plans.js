// L'offre d'abonnement. Une seule source : la page de paiement, Stripe, les e-mails et les CGV la lisent.
// Décidé par Maël le 25/11/2026 : 0,99 € les 3 premiers jours, puis une 1re semaine obligatoire à 16,99 €,
// puis 16,99 € par semaine jusqu'à résiliation. Montants en centimes TTC.
export const OFFERS = {
  semaine: { label: "Accès complet", trialDays: 3, intro: 99, renew: 1699, interval: "week", commitPeriods: 1 },
};
export const DEFAULT_OFFER = "semaine";
export const CURRENCY = "eur";
export const WEEK_MS = 7 * 864e5;

export const euros = (cents) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
// Le minimum à payer : les jours d'essai + la (ou les) semaine(s) d'engagement
export const minimumCents = (o) => o.intro + o.renew * o.commitPeriods;
export const perDay = (o) => euros(Math.round(o.renew / 7));
export const renewText = (o) => `puis ${euros(o.renew)} par semaine`;

// Les phrases de prix, identiques partout (page de paiement, Stripe, e-mail) : la clarté protège des litiges
export function priceLines(o) {
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
