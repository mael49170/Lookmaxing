// Stripe, sans bibliothèque : appels HTTP directs (comme Kadrio).
// Les prix et les réductions de 1re période se créent tout seuls (retrouvés par leur « lookup key » ou leur id) :
// rien à préparer dans le tableau de bord Stripe. Mode test d'abord (clé sk_test_...).
import { HttpError } from "./http.js";
import { now } from "./db.js";
import { OFFERS, CURRENCY, priceLines } from "../src/shared/plans.js";
import { createMember } from "./members.js";
import { emailKey } from "./identity.js";

const API_VERSION = "2024-06-20";
const PRODUCT = "MOGX · plan et suivi";

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

// version : seulement pour le paiement dans notre page (ui_mode « custom » demande l'API basil), le reste garde API_VERSION
export const CUSTOM_UI_VERSION = "2025-03-31.basil";
export async function stripe(env, method, path, params = {}, { idempotency, version } = {}) {
  if (!env.STRIPE_SECRET_KEY) throw new HttpError(503, "Paiement non branché");
  const qs = new URLSearchParams(encode(params)).toString();
  const res = await (env.FETCH || fetch)("https://api.stripe.com/v1/" + path + (method === "GET" && qs ? "?" + qs : ""), {
    method,
    headers: {
      authorization: "Bearer " + env.STRIPE_SECRET_KEY,
      "stripe-version": version || API_VERSION,
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
const lookupKey = (k, o) => `lm_${k}_${o.renew}_1w`;          // le prix de la semaine (récurrent)
const introKey = (k, o) => `lm_${k}_essai_${o.intro}_${o.trialDays}j`; // les jours d'essai (payés une fois)

let cache = null;
export async function catalog(env) {
  if (cache) return cache;
  const out = {};
  const keys = Object.entries(OFFERS).flatMap(([k, o]) => [lookupKey(k, o), introKey(k, o)]);
  const found = await stripe(env, "GET", "prices", { lookup_keys: keys, active: "true", limit: 20 });
  for (const p of found.data || []) out[p.lookup_key] = p.id;
  let product = found.data?.[0]?.product;
  const ensureProduct = async () => (product ||= (await stripe(env, "POST", "products", { name: PRODUCT }, { idempotency: "lm-product" })).id);
  for (const [k, o] of Object.entries(OFFERS)) {
    const lk = lookupKey(k, o);
    if (!out[lk]) {
      out[lk] = (await stripe(env, "POST", "prices", {
        product: await ensureProduct(), currency: CURRENCY, unit_amount: o.renew, lookup_key: lk, tax_behavior: "inclusive",
        recurring: { interval: o.interval, interval_count: 1 },
      }, { idempotency: "lm-price-" + lk })).id;
    }
    const ik = introKey(k, o);
    if (!out[ik]) {
      out[ik] = (await stripe(env, "POST", "prices", {
        currency: CURRENCY, unit_amount: o.intro, lookup_key: ik, tax_behavior: "inclusive",
        product_data: { name: `${o.trialDays} jours d'essai` },
      }, { idempotency: "lm-price-" + ik })).id;
    }
  }
  cache = { prices: out };
  return cache;
}

// Page de paiement Stripe Checkout (carte, Apple Pay, Google Pay, Link).
// Aujourd'hui : les jours d'essai (paiement unique). Puis l'abonnement à la semaine démarre à la fin de l'essai.
// trial : l'essai à 0,99 € est-il encore réservé (minuteur de 15 minutes, vérifié par le serveur) ?
// embedded : le paiement s'affiche DANS notre page (Apple Pay / Google Pay en premier), sans redirection.
export async function createCheckout(env, request, { quiz, lead, offer, trial = true, embedded = false, custom = false }) {
  const o = OFFERS[offer];
  const { prices } = await catalog(env);
  const origin = new URL(request.url).origin;
  const lines = priceLines(o, trial);
  const back = `${origin}/api/checkout-done?session_id={CHECKOUT_SESSION_ID}`;
  const session = await stripe(env, "POST", "checkout/sessions", {
    mode: "subscription",
    // carte seulement (Apple Pay et Google Pay en font partie) : pas de Klarna, Amazon Pay, Satispay… qui alourdissent le paiement
    payment_method_types: ["card"],
    line_items: trial
      ? [{ price: prices[lookupKey(offer, o)], quantity: 1 }, { price: prices[introKey(offer, o)], quantity: 1 }]
      : [{ price: prices[lookupKey(offer, o)], quantity: 1 }],
    // sans e-mail connu, Stripe le demande dans le formulaire de paiement (le compte est créé avec)
    ...(lead?.email ? { customer_email: lead.email } : {}),
    client_reference_id: quiz.id,
    locale: "fr",
    metadata: { quiz_id: quiz.id, offer, trial: trial ? "1" : "0" },
    subscription_data: { ...(trial ? { trial_period_days: o.trialDays } : {}), metadata: { quiz_id: quiz.id, offer, trial: trial ? "1" : "0" } },
    // renonciation au délai de 14 jours (contenu livré tout de suite) : case obligatoire sur la page Stripe.
    // Il faut une adresse de CGV dans Stripe (Paramètres -> Public details -> Terms of service).
    // En mode « custom » (formulaire sombre dans notre page, 28/11/2026), la case est sur notre page et sa preuve
    // est gardée chez Stripe (metadata waiver_at, voir recordWaiver) juste avant le paiement.
    ...(custom ? {} : { consent_collection: { terms_of_service: "required" }, custom_text: {
      submit: { message: lines.full },
      terms_of_service_acceptance: { message: trial
        ? `J'accepte les CGV, l'engagement minimum (${lines.today}, puis 1 semaine à ${(o.renew / 100).toFixed(2).replace(".", ",")} €) et je veux mon résultat tout de suite : je renonce à mon droit de rétractation de 14 jours une fois le résultat ouvert.`
        : `J'accepte les CGV et je veux mon résultat tout de suite : je renonce à mon droit de rétractation de 14 jours une fois le résultat ouvert.` },
    } }),
    ...(custom ? { ui_mode: "custom", return_url: back } : embedded ? { ui_mode: "embedded", return_url: back } : { success_url: back, cancel_url: `${origin}/q/?retour=paiement` }),
  }, { idempotency: `lm-co-${quiz.id}-${offer}-${trial ? 1 : 0}-${custom ? "c" : embedded ? "e" : "r"}-${Math.floor(now() / 60e3)}`, ...(custom ? { version: CUSTOM_UI_VERSION } : {}) });
  return custom || embedded ? { clientSecret: session.client_secret } : { url: session.url };
}

// La case « je renonce à mon droit de rétractation » cochée sur notre page : la preuve (date, texte) est écrite
// sur la session Stripe, avant le paiement. La session doit être celle de ce quiz.
export async function recordWaiver(env, { sessionId, quiz, text }) {
  const session = await stripe(env, "GET", "checkout/sessions/" + encodeURIComponent(sessionId), {}, { version: CUSTOM_UI_VERSION });
  if (session.client_reference_id !== quiz.id) throw new HttpError(403, "Ce paiement ne correspond pas à ce navigateur.");
  await stripe(env, "POST", "checkout/sessions/" + encodeURIComponent(sessionId), { metadata: { ...session.metadata, waiver_at: new Date().toISOString(), waiver_text: text.slice(0, 450) } }, { version: CUSTOM_UI_VERSION });
}

// Abonnement Stripe -> ligne de notre table
export function subRow(sub, fallbackOffer) {
  const offer = sub.metadata?.offer || fallbackOffer;
  const o = OFFERS[offer] || {};
  const status = { active: "active", trialing: "active", past_due: "past_due", unpaid: "past_due", canceled: "canceled", incomplete_expired: "canceled" }[sub.status] || "incomplete";
  const end = (sub.current_period_end || sub.items?.data?.[0]?.current_period_end || 0) * 1000;
  const endsAt = sub.cancel_at ? sub.cancel_at * 1000 : sub.cancel_at_period_end ? end : null;
  return {
    id: sub.id, offer, intro_cents: o.intro || 0, renew_cents: o.renew || 0, interval: o.interval || "week",
    status, cancel_at_period_end: endsAt ? 1 : 0, current_period_end: end,
    trial_end: sub.trial_end ? sub.trial_end * 1000 : null, ends_at: endsAt,
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
    subscription: { ...row, withdrawal_waived_at: session.consent?.terms_of_service === "accepted" ? (session.created || 0) * 1000 || now() : Number(session.metadata?.waiver_at) || null },
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
  await d.prepare("UPDATE subscriptions SET status = ?, cancel_at_period_end = ?, current_period_end = ?, trial_end = ?, ends_at = ?, updated_at = ? WHERE id = ?")
    .bind(r.status, r.cancel_at_period_end, r.current_period_end, r.trial_end, r.ends_at, now(), sub.id).run();
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
