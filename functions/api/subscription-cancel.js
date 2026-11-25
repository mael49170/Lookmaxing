import { json, handle, HttpError } from "../../lib/http.js";
import { now } from "../../lib/db.js";
import { currentCustomer } from "../../lib/identity.js";
import { stripe, saveSub } from "../../lib/stripe.js";
import { OFFERS, commitmentEnd } from "../../src/shared/plans.js";

// POST -> résiliation en un clic. Plus aucun prélèvement après l'engagement :
// - pendant les jours d'essai, la semaine d'engagement reste due (elle était annoncée avant le paiement), puis tout s'arrête ;
// - après, l'accès continue jusqu'à la fin de la semaine payée, sans nouveau prélèvement.
export const onRequestPost = handle(async ({ request, env }) => {
  const { d, customer } = await currentCustomer(request, env);
  const subs = (await d.prepare("SELECT * FROM subscriptions WHERE customer_id = ? AND status IN ('active','past_due') AND cancel_at_period_end = 0").bind(customer.id).all()).results;
  if (!subs.length) throw new HttpError(400, "Aucun abonnement en cours.");
  let endsAt = 0;
  for (const s of subs) {
    const o = OFFERS[s.offer] || OFFERS.semaine;
    if (s.id.startsWith("sub_")) {
      const live = await stripe(env, "GET", "subscriptions/" + s.id);
      const trialing = live.status === "trialing" && live.trial_end * 1000 > now();
      const params = trialing
        ? { cancel_at: String(Math.floor(commitmentEnd(live.trial_end * 1000, o) / 1000)), proration_behavior: "none" }
        : { cancel_at_period_end: "true" };
      const updated = await stripe(env, "POST", "subscriptions/" + s.id, params, { idempotency: "lm-cancel-" + s.id });
      await saveSub(d, updated);
      endsAt = Math.max(endsAt, updated.cancel_at ? updated.cancel_at * 1000 : (updated.current_period_end || 0) * 1000);
    } else {
      // abonnement d'essai (local) : même règle
      const e = s.trial_end && s.trial_end > now() ? commitmentEnd(s.trial_end, o) : s.current_period_end;
      await d.prepare("UPDATE subscriptions SET cancel_at_period_end = 1, ends_at = ?, updated_at = ? WHERE id = ?").bind(e, now(), s.id).run();
      endsAt = Math.max(endsAt, e);
    }
  }
  return json({ ok: true, ends_at: endsAt });
});
