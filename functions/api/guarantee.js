import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { now } from "../../lib/db.js";
import { currentCustomer } from "../../lib/identity.js";
import { guaranteeStatus } from "../../lib/guarantee.js";
import { stripe, saveSub } from "../../lib/stripe.js";

// POST { confirme: true } -> rembourse la 1re semaine payée si les conditions sont remplies, et arrête l'abonnement.
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 500);
  if (body.confirme !== true) throw new HttpError(400, "Confirme la demande.");
  const { d, customer } = await currentCustomer(request, env);
  const sub = await d.prepare("SELECT * FROM subscriptions WHERE customer_id = ? AND kind = 'membre' ORDER BY created_at DESC LIMIT 1").bind(customer.id).first();
  const g = await guaranteeStatus(d, customer, sub);
  if (!g.eligible) throw new HttpError(409, g.reason);
  // on marque d'abord (une seule fois, même si on clique deux fois)
  const mark = await d.prepare("UPDATE subscriptions SET guarantee_used_at = ? WHERE id = ? AND guarantee_used_at IS NULL").bind(now(), sub.id).run();
  if (!mark.meta?.changes) throw new HttpError(409, "Garantie déjà utilisée.");
  try {
    if (sub.id.startsWith("sub_")) {
      const invoices = await stripe(env, "GET", "invoices", { subscription: sub.id, status: "paid", limit: 10 });
      const first = (invoices.data || []).filter((i) => i.amount_paid === sub.renew_cents).sort((a, b) => a.created - b.created)[0];
      if (!first) throw new HttpError(409, "Ta 1re semaine n'a pas encore été prélevée.");
      await stripe(env, "POST", "refunds", first.payment_intent ? { payment_intent: first.payment_intent } : { charge: first.charge }, { idempotency: "lm-garantie-" + sub.id });
      await saveSub(d, await stripe(env, "DELETE", "subscriptions/" + sub.id, {}, { idempotency: "lm-garantie-stop-" + sub.id }));
    } else {
      await d.prepare("UPDATE subscriptions SET status = 'canceled', cancel_at_period_end = 1, ends_at = ?, updated_at = ? WHERE id = ?").bind(now(), now(), sub.id).run();
    }
  } catch (err) {
    await d.prepare("UPDATE subscriptions SET guarantee_used_at = NULL WHERE id = ?").bind(sub.id).run(); // on pourra réessayer
    throw err;
  }
  return json({ ok: true, refunded_cents: sub.renew_cents });
});
