// Stripe, sans bibliothèque : appels HTTP directs (comme Kadrio).
// Les prix et les réductions de 1re période se créent tout seuls (retrouvés par leur « lookup key » ou leur id) :
// rien à préparer dans le tableau de bord Stripe. Mode test d'abord (clé sk_test_...).
import { HttpError } from "./http.js";
import { now } from "./db.js";
import { OFFERS, CURRENCY } from "../src/shared/plans.js";
import { createMember } from "./members.js";
import { emailKey } from "./identity.js";

const API_VERSION = "2024-06-20";
const PRODUCT = "Lookmaxing · plan et suivi";

export function encode(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (x && typeof x === "object" ? encode(x, `${key}[${i}]`, out) : out.push([`${key}[${i}]`, String(x)])));
    else if (typeof v === "object") encode(v, key, out);
    else out.push([key, String(v)]);
  }
  return out;
}

export async function stripe(env, method, path, params = {}, { idempotency } = {}) {
  if (!env.STRIPE_SECRET_KEY) throw new HttpError(503, "Paiement non branché");
  const qs = new URLSearchParams(encode(params)).toString();
  const res = await (env.FETCH || fetch)("https://api.stripe.com/v1/" + path + (method === "GET" && qs ? "?" + qs : ""), {
    method,
    headers: {
      authorization: "Bearer " + env.STRIPE_SECRET_KEY,
      "stripe-version": API_VERSION,
      ...(method === "GET" ? {} : { "content-type": "application/x-www-form-urlencoded" }),
      ...(idempotency ? { "idempotency-key": idempotency } : {}),
    },
    body: method === "GET" ? undefined : qs,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new HttpError(res.status === 402 ? 402 : 502, "Stripe : " + (data?.error?.message || res.status));
    e.stripe = data?.error || {};
    throw e;
  }
  return data;
}

// Un prix Stripe ne se modifie pas : changer un tarif dans plans.js change sa lookup key, donc crée un nouveau prix.
const lookupKey = (k, o) => `lm_${k}_${o.renew}_${o.count}m`;
const couponId = (k, o) => `lm_intro_${k}_${o.renew - o.intro}`;

let cache = null;
export async function catalog(env) {
  if (cache) return cache;
  const out = {};
  const found = await stripe(env, "GET", "prices", { lookup_keys: Object.entries(OFFERS).map(([k, o]) => lookupKey(k, o)), active: "true", limit: 20 });
  for (const p of found.data || []) out[p.lookup_key] = p.id;
  let product = found.data?.[0]?.product;
  for (const [k, o] of Object.entries(OFFERS)) {
    const lk = lookupKey(k, o);
    if (!out[lk]) {
      product ||= (await stripe(env, "POST", "products", { name: PRODUCT }, { idempotency: "lm-product" })).id;
      out[lk] = (await stripe(env, "POST", "prices", {
        product, currency: CURRENCY, unit_amount: o.renew, lookup_key: lk, tax_behavior: "inclusive",
        recurring: { interval: o.interval, interval_count: o.count },
      }, { idempotency: "lm-price-" + lk })).id;
    }
    if (o.intro < o.renew) {
      const id = couponId(k, o);
      try { await stripe(env, "GET", "coupons/" + id); }
      catch (err) {
        if (err.stripe?.code !== "resource_missing") throw err;
        await stripe(env, "POST", "coupons", { id, amount_off: o.renew - o.intro, currency: CURRENCY, duration: "once", name: "1re période" }, { idempotency: "lm-coupon-" + id });
      }
    }
  }
  cache = { prices: out };
  return cache;
}

const renewSentence = (o) => `Aujourd'hui ${(o.intro / 100).toFixed(2).replace(".", ",")} €, puis ${(o.renew / 100).toFixed(2).replace(".", ",")} € ${o.count === 1 ? "chaque mois" : `tous les ${o.count} mois`} jusqu'à résiliation. Résiliable en ligne à tout moment.`;

// Page de paiement Stripe Checkout (carte, Apple Pay, Google Pay, Link)
export async function createCheckout(env, request, { quiz, lead, offer, waiverAt }) {
  const o = OFFERS[offer];
  const { prices } = await catalog(env);
  const origin = new URL(request.url).origin;
  const session = await stripe(env, "POST", "checkout/sessions", {
    mode: "subscription",
    line_items: [{ price: prices[lookupKey(offer, o)], quantity: 1 }],
    ...(o.intro < o.renew ? { discounts: [{ coupon: couponId(offer, o) }] } : { allow_promotion_codes: "false" }),
    customer_email: lead.email,
    client_reference_id: quiz.id,
    locale: "fr",
    metadata: { quiz_id: quiz.id, offer, waiver_at: String(waiverAt) },
    subscription_data: { metadata: { quiz_id: quiz.id, offer } },
    custom_text: { submit: { message: renewSentence(o) } },
    success_url: `${origin}/api/checkout-done?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/q/?retour=paiement`,
  }, { idempotency: `lm-co-${quiz.id}-${offer}-${Math.floor(now() / 60e3)}` });
  return session.url;
}

// Abonnement Stripe -> ligne de notre table
export function subRow(sub, fallbackOffer) {
  const offer = sub.metadata?.offer || fallbackOffer;
  const o = OFFERS[offer] || {};
  const status = { active: "active", trialing: "active", past_due: "past_due", unpaid: "past_due", canceled: "canceled", incomplete_expired: "canceled" }[sub.status] || "incomplete";
  const end = sub.current_period_end || sub.items?.data?.[0]?.current_period_end || 0;
  return {
    id: sub.id, offer, intro_cents: o.intro || 0, renew_cents: o.renew || 0, interval: o.count === 3 ? "quarter" : "month",
    status, cancel_at_period_end: sub.cancel_at_period_end ? 1 : 0, current_period_end: end * 1000,
  };
}

// Paiement fini : on vérifie chez Stripe (jamais ce que dit le navigateur), puis on crée le membre. Sert au retour du paiement et au webhook.
export async function memberFromSession(env, d, session) {
  if (session.status !== "complete" || !["paid", "no_payment_required"].includes(session.payment_status)) throw new HttpError(402, "Le paiement n'est pas terminé.");
  const quiz = await d.prepare("SELECT * FROM quizzes WHERE id = ?").bind(session.client_reference_id).first();
  const lead = quiz ? await d.prepare("SELECT * FROM leads WHERE quiz_id = ?").bind(quiz.id).first() : null;
  const email = session.customer_details?.email || lead?.email || session.customer_email;
  const sub = typeof session.subscription === "object" ? session.subscription : await stripe(env, "GET", "subscriptions/" + session.subscription);
  const row = subRow(sub, session.metadata?.offer);
  return createMember(d, {
    quiz, email, emailKey: emailKey(email), stripeCustomer: typeof session.customer === "string" ? session.customer : session.customer?.id || "",
    subscription: { ...row, withdrawal_waived_at: Number(session.metadata?.waiver_at) || now() },
  });
}

export async function confirmCheckout(env, d, { sessionId, quiz }) {
  const session = await stripe(env, "GET", "checkout/sessions/" + encodeURIComponent(sessionId), { expand: ["subscription"] });
  if (session.client_reference_id !== quiz.id) throw new HttpError(403, "Ce paiement ne correspond pas à ce navigateur. Connecte-toi avec ton e-mail.");
  return memberFromSession(env, d, session);
}

// Met à jour notre copie d'un abonnement (webhooks, résiliation)
export async function saveSub(d, sub) {
  const r = subRow(sub);
  await d.prepare("UPDATE subscriptions SET status = ?, cancel_at_period_end = ?, current_period_end = ?, updated_at = ? WHERE id = ?")
    .bind(r.status, r.cancel_at_period_end, r.current_period_end, now(), sub.id).run();
}

export async function verifyWebhook(payload, header, secret, toleranceSec = 300) {
  const parts = Object.fromEntries(String(header || "").split(",").map((kv) => kv.split("=")).filter((a) => a.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const sigs = String(header || "").split(",").filter((kv) => kv.trim().startsWith("v1=")).map((kv) => kv.trim().slice(3));
  const t = parseInt(parts.t, 10);
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => s.length === hex.length && [...s].reduce((acc, ch, i) => acc | (ch.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0);
}
