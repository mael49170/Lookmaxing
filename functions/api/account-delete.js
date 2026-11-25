import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { now } from "../../lib/db.js";
import { currentCustomer, clearSession } from "../../lib/identity.js";
import { chargePending } from "../../lib/members.js";

// POST { confirme: true } -> supprime vraiment tout : compte, plan, suivi, quiz, notes, e-mail des relances.
// Les factures restent chez Stripe (obligation légale de 10 ans en France).
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 500);
  if (body.confirme !== true) throw new HttpError(400, "Confirme la suppression.");
  const { d, customer } = await currentCustomer(request, env);
  const subs = (await d.prepare("SELECT * FROM subscriptions WHERE customer_id = ?").bind(customer.id).all()).results;
  const pending = subs.find((s) => chargePending(s, now()));
  if (pending && !pending.cancel_at_period_end) throw new HttpError(409, "Résilie d'abord ton abonnement, puis supprime ton compte.");
  if (pending) throw new HttpError(409, `Ta semaine d'engagement sera prélevée le ${new Date(pending.current_period_end).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}. Tu pourras supprimer ton compte juste après.`);
  const quizzes = (await d.prepare("SELECT quiz_id FROM leads WHERE email_key = ?").bind(customer.email_key).all()).results.map((r) => r.quiz_id);
  if (customer.quiz_id) quizzes.push(customer.quiz_id);
  const stmts = [d.prepare("DELETE FROM customers WHERE id = ?").bind(customer.id), d.prepare("DELETE FROM login_codes WHERE email_key = ?").bind(customer.email_key)];
  for (const q of new Set(quizzes)) stmts.push(d.prepare("DELETE FROM quizzes WHERE id = ?").bind(q)); // efface aussi notes et e-mail (en cascade)
  await d.batch(stmts);
  return json({ ok: true }, 200, { "set-cookie": clearSession() });
});
