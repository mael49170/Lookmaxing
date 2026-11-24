import { handle, HttpError } from "../../lib/http.js";
import { now, track, DAY } from "../../lib/db.js";
import { currentQuiz, createSession, sessionCookie } from "../../lib/identity.js";
import { createMember, offerSnapshot } from "../../lib/members.js";

const redirect = (to, cookie) => new Response(null, { status: 303, headers: { location: to, ...(cookie ? { "set-cookie": cookie } : {}) } });

// GET : retour de la page de paiement. Vérifie le paiement, crée le membre et son plan, ouvre sa session.
export const onRequestGet = handle(async ({ request, env }) => {
  const url = new URL(request.url);
  const { d, quiz } = await currentQuiz(request, env);
  const lead = await d.prepare("SELECT * FROM leads WHERE quiz_id = ?").bind(quiz.id).first();
  if (!lead) throw new HttpError(400, "Paiement introuvable.");
  let customer;
  if (url.searchParams.get("session_id") && env.STRIPE_SECRET_KEY) {
    const { confirmCheckout } = await import("../../lib/stripe.js");
    customer = await confirmCheckout(env, d, { sessionId: url.searchParams.get("session_id"), quiz, lead });
  } else if (url.searchParams.get("essai") === "1" && env.DEV_FAKE_PAY === "1" && !env.STRIPE_SECRET_KEY) {
    // paiement d'essai, en local seulement
    const snap = offerSnapshot(url.searchParams.get("offre")) || offerSnapshot("mois");
    customer = await createMember(d, { quiz, email: lead.email, emailKey: lead.email_key, subscription: { id: "essai_" + quiz.id, ...snap, status: "active", current_period_end: now() + 30 * DAY, withdrawal_waived_at: now() } });
  } else {
    throw new HttpError(400, "Paiement introuvable.");
  }
  await track(d, "paye", { variant: quiz.variant, source: quiz.utm_source });
  const token = await createSession(d, customer.id);
  return redirect("/app/?bienvenue=1", sessionCookie(token, request));
});
