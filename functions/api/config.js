import { json, handle } from "../../lib/http.js";

// GET -> réglages publics pour le site (clé publique de l'anti-robot)
export const onRequestGet = handle(async ({ env }) => json({ turnstile: env.TURNSTILE_SITE_KEY || "", waiverInStripe: Boolean(env.STRIPE_SECRET_KEY) }, 200, { "cache-control": "public, max-age=300" }));
