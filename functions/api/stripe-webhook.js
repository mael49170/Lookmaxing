import { json, handle, HttpError } from "../../lib/http.js";
import { db, now } from "../../lib/db.js";
import { verifyWebhook, memberFromSession, saveSub, stripe } from "../../lib/stripe.js";
import { sendMail, welcomeMail, paymentFailedMail } from "../../lib/mail.js";

// Messages de Stripe. Signature vérifiée ; chaque événement n'est traité qu'une fois (Stripe en renvoie parfois deux fois).
export const onRequestPost = handle(async ({ request, env }) => {
  if (!env.STRIPE_WEBHOOK_SECRET) throw new HttpError(503, "Webhook non branché");
  const payload = await request.text();
  if (!(await verifyWebhook(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET))) throw new HttpError(400, "Signature invalide");
  const event = JSON.parse(payload);
  const d = await db(env);
  const first = await d.prepare("INSERT INTO stripe_events (id, type, processed_at) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING").bind(event.id, event.type, now()).run();
  if (!first.meta?.changes) return json({ ok: true, deja: true });
  try {
    const o = event.data.object;
    const origin = new URL(request.url).origin;
    if (event.type === "checkout.session.completed" && o.mode === "subscription") {
      const customer = await memberFromSession(env, d, o);
      if (customer._created) await sendMail(env, { to: customer.email, ...welcomeMail(origin + "/app/") }).catch((e) => console.error("E-mail de bienvenue", e.message));
    } else if (["customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      await saveSub(d, o);
    } else if (event.type === "invoice.paid" && o.subscription) {
      await saveSub(d, await stripe(env, "GET", "subscriptions/" + o.subscription));
    } else if (event.type === "invoice.payment_failed" && o.subscription) {
      await saveSub(d, await stripe(env, "GET", "subscriptions/" + o.subscription));
      const c = await d.prepare("SELECT c.email, c.stripe_customer FROM customers c JOIN subscriptions s ON s.customer_id = c.id WHERE s.id = ?").bind(o.subscription).first();
      if (c) await sendMail(env, { to: c.email, ...paymentFailedMail(origin + "/app/") }).catch((e) => console.error("E-mail de paiement refusé", e.message));
    }
  } catch (err) {
    // en cas d'échec, on oublie l'événement pour que Stripe le renvoie
    await d.prepare("DELETE FROM stripe_events WHERE id = ?").bind(event.id).run();
    throw err;
  }
  return json({ ok: true });
});
