import { json, handle, HttpError } from "../../lib/http.js";
import { now } from "../../lib/db.js";
import { currentCustomer } from "../../lib/identity.js";
import { stripe, saveSub } from "../../lib/stripe.js";

// POST -> résiliation en un clic : plus aucun prélèvement, accès gardé jusqu'à la fin de la période payée
export const onRequestPost = handle(async ({ request, env }) => {
  const { d, customer } = await currentCustomer(request, env);
  const subs = (await d.prepare("SELECT * FROM subscriptions WHERE customer_id = ? AND status IN ('active','past_due') AND cancel_at_period_end = 0").bind(customer.id).all()).results;
  if (!subs.length) throw new HttpError(400, "Aucun abonnement en cours.");
  for (const s of subs) {
    if (s.id.startsWith("sub_")) await saveSub(d, await stripe(env, "POST", "subscriptions/" + s.id, { cancel_at_period_end: "true" }, { idempotency: "lm-cancel-" + s.id }));
    else await d.prepare("UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = ? WHERE id = ?").bind(now(), s.id).run(); // abonnement d'essai (local)
  }
  return json({ ok: true });
});
