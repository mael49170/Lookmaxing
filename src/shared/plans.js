// Les offres d'abonnement. Une seule source : le paywall, Stripe et les CGV la lisent.
// PROVISOIRE : les vrais prix se décident à l'étape /replica-launch (avec Maël).
// Montants en centimes TTC. intro = prix de la 1re période, renew = prix des suivantes.
export const OFFERS = {
  mois: { label: "1 mois", intro: 999, renew: 1999, interval: "month", count: 1, perDayRef: 30 },
  trimestre: { label: "3 mois", intro: 2499, renew: 3999, interval: "month", count: 3, perDayRef: 90, best: true },
};
export const DEFAULT_OFFER = "trimestre";
export const CURRENCY = "eur";

export const euros = (cents) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
export function renewText(o) {
  const every = o.count === 1 ? "chaque mois" : `tous les ${o.count} mois`;
  return `puis ${euros(o.renew)} ${every}, sans engagement`;
}
export const perDay = (o) => euros(Math.round(o.intro / o.perDayRef));
