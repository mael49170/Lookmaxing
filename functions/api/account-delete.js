import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { now } from "../../lib/db.js";
import { currentCustomer, clearSession } from "../../lib/identity.js";

// POST { confirme: true } -> supprime vraiment tout : compte, plan, suivi, quiz, notes, e-mail des relances.
// Les factures restent chez Stripe (obligation légale de 10 ans en France).
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 500);
  if (body.confirme !== true) throw new HttpError(400, "Confirme la suppression.");
  const { d, customer } = await currentCustomer(request, env);
  const live = await d.prepare("SELECT 1 FROM subscriptions WHERE customer_id = ? AND status IN ('active','past_due') AND cancel_at_period_end = 0 AND current_period_end > ?").bind(customer.id, now()).first();
  if (live) throw new HttpError(409, "Résilie d'abord ton abonnement, puis supprime ton compte.");
  const quizzes = (await d.prepare("SELECT quiz_id FROM leads WHERE email_key = ?").bind(customer.email_key).all()).results.map((r) => r.quiz_id);
  if (customer.quiz_id) quizzes.push(customer.quiz_id);
  const stmts = [d.prepare("DELETE FROM customers WHERE id = ?").bind(customer.id), d.prepare("DELETE FROM login_codes WHERE email_key = ?").bind(customer.email_key)];
  for (const q of new Set(quizzes)) stmts.push(d.prepare("DELETE FROM quizzes WHERE id = ?").bind(q)); // efface aussi notes et e-mail (en cascade)
  await d.batch(stmts);
  return json({ ok: true }, 200, { "set-cookie": clearSession() });
});
