import { json, handle } from "../../lib/http.js";
import { db } from "../../lib/db.js";

// GET -> ce qui est branché (jamais la valeur d'une clé)
export const onRequestGet = handle(async ({ env }) => {
  const d = await db(env).catch(() => null);
  return json({
    base: Boolean(d),
    analyse: env.ANTHROPIC_API_KEY ? "claude" : env.DEV_FAKE_SCAN === "1" ? "essai" : "non",
    paiement: env.STRIPE_SECRET_KEY ? (env.STRIPE_SECRET_KEY.startsWith("sk_live") ? "live" : "test") : env.DEV_FAKE_PAY === "1" ? "essai" : "non",
    webhook: Boolean(env.STRIPE_WEBHOOK_SECRET),
    emails: Boolean(env.RESEND_API_KEY),
    anti_robot: Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET),
    taches_du_jour: Boolean(env.CRON_SECRET),
    desinscription: Boolean(env.UNSUB_SECRET),
  });
});
