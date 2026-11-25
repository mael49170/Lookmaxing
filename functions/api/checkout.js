import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { track } from "../../lib/db.js";
import { currentQuiz } from "../../lib/identity.js";
import { reservation, deviceId } from "../../lib/offer.js";
import { OFFERS, DEFAULT_OFFER } from "../../src/shared/plans.js";

// POST { offer, waiver, embedded } -> le paiement Stripe (dans notre page si embedded, sinon une adresse).
// L'essai à 0,99 € n'est proposé que si la réservation de 15 minutes court encore : c'est le serveur qui décide, jamais le navigateur.
// waiver : la case « je veux mon rapport tout de suite et je renonce au délai de 14 jours » (obligatoire en France
// pour livrer un contenu numérique avant la fin du délai de rétractation). Avec Stripe, elle est sur le formulaire Stripe.
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 2_000);
  const offer = OFFERS[body.offer || DEFAULT_OFFER] ? body.offer || DEFAULT_OFFER : null;
  if (!offer) throw new HttpError(400, "Offre inconnue.");
  if (!env.STRIPE_SECRET_KEY && body.waiver !== true) throw new HttpError(400, "Coche la case pour recevoir ton rapport tout de suite.");
  const { d, quiz } = await currentQuiz(request, env);
  const lead = await d.prepare("SELECT * FROM leads WHERE quiz_id = ?").bind(quiz.id).first();
  if (!lead) throw new HttpError(400, "Ajoute ton e-mail d'abord.");
  const { trial } = await reservation(d, { emailKey: lead.email_key, device: deviceId(request) });
  await track(d, trial ? "paiement_ouvert" : "paiement_ouvert_sans_essai", { variant: quiz.variant, source: quiz.utm_source });
  if (env.STRIPE_SECRET_KEY) {
    const { createCheckout } = await import("../../lib/stripe.js");
    const embedded = body.embedded === true && Boolean(env.STRIPE_PUBLISHABLE_KEY);
    return json({ trial, ...(await createCheckout(env, request, { quiz, lead, offer, trial, embedded })), ...(embedded ? { publishableKey: env.STRIPE_PUBLISHABLE_KEY } : {}) });
  }
  if (env.DEV_FAKE_PAY === "1") return json({ trial, url: `/api/checkout-done?essai=1&offre=${offer}&t=${trial ? 1 : 0}` });
  throw new HttpError(503, "Le paiement n'est pas encore branché.");
});
