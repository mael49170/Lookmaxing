import { json, handle } from "../../lib/http.js";

// Clé publiable seulement si elle est du même mode que la clé secrète (live avec live, test avec test) :
// sinon le paiement dans la page plante, et on passe par la page Stripe classique.
const mode = (k) => (/^(sk|pk|rk)_live_/.test(k || "") ? "live" : /^(sk|pk|rk)_test_/.test(k || "") ? "test" : "");
const sameMode = (env) => Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY && mode(env.STRIPE_SECRET_KEY) === mode(env.STRIPE_PUBLISHABLE_KEY));

// GET -> réglages publics pour le site (clé publique de l'anti-robot)
export const onRequestGet = handle(async ({ env }) => json({ turnstile: env.TURNSTILE_SITE_KEY || "", waiverInStripe: Boolean(env.STRIPE_SECRET_KEY), stripeKey: sameMode(env) ? env.STRIPE_PUBLISHABLE_KEY : "", support: env.SUPPORT_EMAIL || "", fakePay: env.DEV_FAKE_PAY === "1" && !env.STRIPE_SECRET_KEY, pixel: env.META_PIXEL_ID || "" }, 200, { "cache-control": "public, max-age=300" }));
