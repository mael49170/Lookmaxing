import { json, handle, HttpError } from "../../lib/http.js";
import { currentCustomer } from "../../lib/identity.js";
import { stripe } from "../../lib/stripe.js";

// POST -> page Stripe pour changer de carte et voir les factures
export const onRequestPost = handle(async ({ request, env }) => {
  const { customer } = await currentCustomer(request, env);
  if (!customer.stripe_customer) throw new HttpError(400, "Pas de paiement enregistré pour ce compte.");
  const s = await stripe(env, "POST", "billing_portal/sessions", { customer: customer.stripe_customer, return_url: new URL(request.url).origin + "/app/", locale: "fr" });
  return json({ url: s.url });
});
