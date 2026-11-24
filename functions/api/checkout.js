import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { track } from "../../lib/db.js";
import { currentQuiz } from "../../lib/identity.js";
import { OFFERS } from "../../src/shared/plans.js";

// POST { offer, waiver } -> adresse de la page de paiement.
// waiver : la case « je veux mon rapport tout de suite et je renonce au délai de 14 jours » (obligatoire en France
// pour livrer un contenu numérique avant la fin du délai de rétractation).
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 2_000);
  const offer = OFFERS[body.offer] ? body.offer : null;
  if (!offer) throw new HttpError(400, "Choisis une offre.");
  if (body.waiver !== true) throw new HttpError(400, "Coche la case pour recevoir ton rapport tout de suite.");
  const { d, quiz } = await currentQuiz(request, env);
  const lead = await d.prepare("SELECT * FROM leads WHERE quiz_id = ?").bind(quiz.id).first();
  if (!lead) throw new HttpError(400, "Ajoute ton e-mail d'abord.");
  await track(d, "paiement_ouvert", { variant: quiz.variant, source: quiz.utm_source });
  if (env.STRIPE_SECRET_KEY) {
    // branché à l'étape « backend » (Stripe Checkout)
    const { createCheckout } = await import("../../lib/stripe.js");
    return json({ url: await createCheckout(env, request, { quiz, lead, offer, waiverAt: Date.now() }) });
  }
  if (env.DEV_FAKE_PAY === "1") return json({ url: `/api/checkout-done?essai=1&offre=${offer}` });
  throw new HttpError(503, "Le paiement n'est pas encore branché.");
});
