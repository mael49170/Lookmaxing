import { handle, HttpError } from "../../lib/http.js";
import { now, track, DAY } from "../../lib/db.js";
import { currentQuiz, createSession, sessionCookie } from "../../lib/identity.js";
import { createMember, offerSnapshot } from "../../lib/members.js";
import { OFFERS, DEFAULT_OFFER } from "../../src/shared/plans.js";
import { sendMail, welcomeMail } from "../../lib/mail.js";
import { welcomeLink } from "../../lib/auth.js";
import { welcomeTerms } from "../../lib/members.js";

const redirect = (to, cookie) => new Response(null, { status: 303, headers: { location: to, ...(cookie ? { "set-cookie": cookie } : {}) } });

// GET : retour de la page de paiement. Vérifie le paiement chez Stripe, crée le membre et son plan, ouvre sa session.
export const onRequestGet = handle(async ({ request, env }) => {
  const url = new URL(request.url);
  const { d, quiz } = await currentQuiz(request, env, { required: false });
  // paiement fait dans un autre navigateur (sans le cookie du quiz) : le compte est créé par le webhook, la personne se connecte par e-mail
  if (!quiz) return redirect("/connexion/?paye=1");
  const lead = await d.prepare("SELECT * FROM leads WHERE quiz_id = ?").bind(quiz.id).first();
  if (!lead) throw new HttpError(400, "Paiement introuvable.");
  let customer;
  if (url.searchParams.get("session_id") && env.STRIPE_SECRET_KEY) {
    const { confirmCheckout } = await import("../../lib/stripe.js");
    customer = await confirmCheckout(env, d, { sessionId: url.searchParams.get("session_id"), quiz });
  } else if (url.searchParams.get("essai") === "1" && env.DEV_FAKE_PAY === "1" && !env.STRIPE_SECRET_KEY) {
    // paiement d'essai, en local seulement
    const snap = offerSnapshot(url.searchParams.get("offre")) || offerSnapshot(DEFAULT_OFFER);
    const withTrial = url.searchParams.get("t") !== "0";
    const end = now() + (withTrial ? OFFERS[snap.offer].trialDays : 7) * DAY;
    customer = await createMember(d, { quiz, email: lead.email, emailKey: lead.email_key, subscription: { id: "essai_" + quiz.id, ...snap, status: "active", current_period_end: end, trial_end: withTrial ? end : null, withdrawal_waived_at: now() } });
  } else {
    throw new HttpError(400, "Paiement introuvable.");
  }
  if (customer._created) {
    await track(d, "paye", { variant: quiz.variant, source: quiz.utm_source });
    await sendMail(env, { to: customer.email, ...welcomeMail(await welcomeLink(d, request, customer.email_key), await welcomeTerms(d, customer)) }).catch((e) => console.error("E-mail de bienvenue", e.message));
  }
  return redirect("/app/?bienvenue=1", sessionCookie(await createSession(d, customer.id), request));
});
