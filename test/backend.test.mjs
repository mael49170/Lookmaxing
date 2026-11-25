// Connexion, droits, résiliation, suppression, Stripe (simulé), tâches du jour. Aucun appel réseau réel.
// node test/backend.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { localD1 } from "../dev/d1.mjs";
import { createMember, offerSnapshot } from "../lib/members.js";
import { db, now, DAY } from "../lib/db.js";
import { createCheckout, verifyWebhook } from "../lib/stripe.js";
import { unsubLink } from "../lib/mail.js";
import * as authStart from "../functions/api/auth-start.js";
import * as authVerify from "../functions/api/auth-verify.js";
import * as authLink from "../functions/api/auth-link.js";
import * as me from "../functions/api/me.js";
import * as cancel from "../functions/api/subscription-cancel.js";
import * as del from "../functions/api/account-delete.js";
import * as logout from "../functions/api/logout.js";
import * as webhook from "../functions/api/stripe-webhook.js";
import * as cron from "../functions/api/cron.js";
import * as unsubscribe from "../functions/api/unsubscribe.js";

function client(env) {
  const jar = {};
  const call = async (mod, path, { method = "POST", body, headers = {}, raw } = {}) => {
    const h = { cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; "), ...headers };
    if (body) h["content-type"] = "application/json";
    const request = new Request("http://localhost/api/" + path, { method, headers: h, body: raw ?? (body ? JSON.stringify(body) : undefined) });
    const res = await mod["onRequest" + method[0] + method.slice(1).toLowerCase()]({ request, env, params: {} });
    for (const c of res.headers.getSetCookie()) { const [kv] = c.split(";"); const [k, v] = kv.split("="); if (/Max-Age=0/.test(c)) delete jar[k]; else jar[k] = v; }
    const data = res.headers.get("content-type")?.includes("json") ? await res.json() : await res.text();
    return { status: res.status, data, location: res.headers.get("location") };
  };
  call.jar = jar;
  return call;
}

async function member(env, email, opts = {}) {
  const d = await db(env);
  return createMember(d, { quiz: null, email, emailKey: email, subscription: { id: "essai_" + email, ...offerSnapshot("semaine"), status: "active", current_period_end: now() + 30 * DAY, ...opts } });
}

test("connexion par code, et un client ne voit que ses données", async () => {
  const env = { DB: localD1(), DEV_SHOW_CODE: "1" };
  await member(env, "a@example.com"); await member(env, "b@example.com");
  const A = client(env), B = client(env);
  let r = await A(authStart, "auth-start", { body: { email: "inconnu@example.com" } });
  assert.equal(r.status, 200); assert.equal(r.data.devCode, undefined, "aucun code pour une adresse inconnue");
  r = await A(authStart, "auth-start", { body: { email: "a@example.com" } });
  const code = r.data.devCode; assert.match(code, /^\d{6}$/);
  r = await A(authVerify, "auth-verify", { body: { email: "a@example.com", code: code === "000000" ? "111111" : "000000" } });
  assert.equal(r.status, 400);
  r = await A(authVerify, "auth-verify", { body: { email: "a@example.com", code } });
  assert.equal(r.status, 200);
  r = await A(authVerify, "auth-verify", { body: { email: "a@example.com", code } });
  assert.equal(r.status, 400, "un code ne sert qu'une fois");
  assert.equal((await A(me, "me", { method: "GET" })).data.email, "a@example.com");
  assert.equal((await B(me, "me", { method: "GET" })).status, 401);
  await B(authStart, "auth-start", { body: { email: "b@example.com" } }).then((x) => B(authVerify, "auth-verify", { body: { email: "b@example.com", code: x.data.devCode } }));
  assert.equal((await B(me, "me", { method: "GET" })).data.email, "b@example.com");
  // B résilie : l'abonnement de A ne bouge pas
  await B(cancel, "subscription-cancel");
  assert.equal((await A(me, "me", { method: "GET" })).data.subscription.cancel_at_period_end, false);
  assert.equal((await B(me, "me", { method: "GET" })).data.subscription.cancel_at_period_end, true);
});

test("lien de connexion : une seule fois, sans e-mail dans l'adresse", async () => {
  const env = { DB: localD1(), DEV_SHOW_CODE: "1" };
  await member(env, "c@example.com");
  const logs = []; const orig = console.log; console.log = (m) => logs.push(String(m));
  await client(env)(authStart, "auth-start", { body: { email: "c@example.com" } });
  console.log = orig;
  const link = logs.join("\n").match(/http:\/\/localhost\/api\/auth-link\?t=[\w-]+/)[0];
  assert.ok(!link.includes("example.com"));
  const C = client(env);
  let r = await C(authLink, "auth-link?t=" + link.split("t=")[1], { method: "GET" });
  assert.equal(r.location, "/app/");
  r = await client(env)(authLink, "auth-link?t=" + link.split("t=")[1], { method: "GET" });
  assert.match(r.location, /expire/);
});

test("suppression : refusée tant que l'abonnement court, puis tout est effacé", async () => {
  const env = { DB: localD1(), DEV_SHOW_CODE: "1" };
  await member(env, "d@example.com");
  const D = client(env);
  const s = await D(authStart, "auth-start", { body: { email: "d@example.com" } });
  await D(authVerify, "auth-verify", { body: { email: "d@example.com", code: s.data.devCode } });
  assert.equal((await D(del, "account-delete", { body: { confirme: true } })).status, 409);
  await D(cancel, "subscription-cancel");
  assert.equal((await D(del, "account-delete", { body: { confirme: true } })).status, 200);
  for (const t of ["customers", "subscriptions", "plans", "sessions"]) assert.equal((await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${t}`).first()).n, 0, t);
  assert.equal((await D(me, "me", { method: "GET" })).status, 401);
});

test("déconnexion de tous les appareils", async () => {
  const env = { DB: localD1(), DEV_SHOW_CODE: "1" };
  await member(env, "e@example.com");
  const one = client(env), two = client(env);
  for (const c of [one, two]) { const s = await c(authStart, "auth-start", { body: { email: "e@example.com" } }); await c(authVerify, "auth-verify", { body: { email: "e@example.com", code: s.data.devCode } }); }
  await one(logout, "logout", { body: { partout: true } });
  assert.equal((await two(me, "me", { method: "GET" })).status, 401);
});

// --- Stripe simulé ---
function fakeStripe() {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url); const body = Object.fromEntries(new URLSearchParams(init.body || ""));
    calls.push({ path: u.pathname, method: init.method, body, query: Object.fromEntries(u.searchParams) });
    const ok = (o) => new Response(JSON.stringify(o), { status: 200 });
    if (u.hostname === "api.resend.com") return ok({ id: "mail" });
    if (u.pathname === "/v1/prices" && init.method === "GET") return ok({ data: [] });
    if (u.pathname === "/v1/products") return ok({ id: "prod_1" });
    if (u.pathname === "/v1/prices") return ok({ id: "price_" + body.lookup_key });
    if (u.pathname.startsWith("/v1/coupons/")) return new Response(JSON.stringify({ error: { code: "resource_missing" } }), { status: 404 });
    if (u.pathname === "/v1/coupons") return ok({ id: body.id });
    if (u.pathname === "/v1/checkout/sessions") return ok({ url: "https://checkout.stripe.com/c/pay/test" });
    if (u.pathname.startsWith("/v1/subscriptions/")) return ok({ id: u.pathname.split("/").pop(), status: "past_due", cancel_at_period_end: false, current_period_end: Math.floor(Date.now() / 1000) + 86400, metadata: { offer: "semaine" } });
    return new Response("{}", { status: 404 });
  };
  return { calls, fetchImpl };
}

test("page de paiement Stripe : 3 jours à 0,99 €, puis 16,99 € par semaine, engagement écrit en clair", async () => {
  const { calls, fetchImpl } = fakeStripe();
  const env = { STRIPE_SECRET_KEY: "sk_test_x", FETCH: fetchImpl };
  const { url } = await createCheckout(env, new Request("https://site.fr/api/checkout"), { quiz: { id: "q1" }, lead: { email: "f@example.com" }, offer: "semaine" });
  assert.match(url, /checkout\.stripe\.com/);
  const co = calls.find((c) => c.path === "/v1/checkout/sessions").body;
  assert.equal(co.mode, "subscription"); assert.equal(co.client_reference_id, "q1"); assert.equal(co.customer_email, "f@example.com");
  // l'abonnement à la semaine + les 3 jours d'essai payés une fois
  assert.equal(co["subscription_data[trial_period_days]"], "3");
  assert.equal(co["line_items[0][price]"], "price_lm_semaine_1699_1w");
  assert.equal(co["line_items[1][price]"], "price_lm_semaine_essai_99_3j");
  const prices = calls.filter((c) => c.path === "/v1/prices" && c.method === "POST").map((c) => c.body);
  assert.equal(prices.find((p) => p.lookup_key === "lm_semaine_1699_1w")["recurring[interval]"], "week");
  assert.equal(prices.find((p) => p.lookup_key === "lm_semaine_essai_99_3j").unit_amount, "99");
  // tout est écrit en clair sur la page Stripe, au-dessus du bouton
  assert.match(co["custom_text[submit][message]"].replace(/\s+/g, " "), /0,99 € pour 3 jours, puis 16,99 € par semaine/);
  assert.match(co["custom_text[submit][message]"].replace(/\s+/g, " "), /17,98 €/);
  assert.equal(co["consent_collection[terms_of_service]"], "required", "la renonciation aux 14 jours est sur la page Stripe");
  assert.match(co["custom_text[terms_of_service_acceptance][message]"], /engagement minimum.*rétractation/);
  assert.ok(!calls.some((c) => c.path.startsWith("/v1/coupons")), "plus de réduction : l'essai est un prix à part");
});

async function signed(secret, event) {
  const payload = JSON.stringify(event); const t = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { payload, header: `t=${t},v1=${mac}` };
}

test("webhook Stripe : signature, une seule fois par événement, membre créé, e-mail de bienvenue unique", async () => {
  const { calls, fetchImpl } = fakeStripe();
  const env = { DB: localD1(), STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_t", RESEND_API_KEY: "re_x", FETCH: fetchImpl };
  const d = await db(env);
  await d.prepare("INSERT INTO quizzes (id, answers, created_at, updated_at) VALUES ('q9', '{\"difficultes\":[\"peau\"]}', 1, 1)").run();
  await d.prepare("INSERT INTO leads (quiz_id, email, email_key, created_at) VALUES ('q9', 'g@example.com', 'g@example.com', 1)").run();
  const event = { id: "evt_1", type: "checkout.session.completed", data: { object: { mode: "subscription", status: "complete", payment_status: "paid", client_reference_id: "q9", customer: "cus_1", customer_details: { email: "g@example.com" }, metadata: { offer: "semaine", waiver_at: "5" },
    subscription: { id: "sub_1", status: "active", cancel_at_period_end: false, current_period_end: Math.floor(Date.now() / 1000) + 2592000, metadata: { offer: "semaine" } } } } };
  const W = client(env);
  assert.equal((await W(webhook, "stripe-webhook", { raw: JSON.stringify(event), headers: { "stripe-signature": "t=1,v1=00" } })).status, 400);
  const s = await signed("whsec_t", event);
  assert.equal((await W(webhook, "stripe-webhook", { raw: s.payload, headers: { "stripe-signature": s.header } })).status, 200);
  const again = await W(webhook, "stripe-webhook", { raw: s.payload, headers: { "stripe-signature": s.header } });
  assert.equal(again.data.deja, true);
  assert.equal((await d.prepare("SELECT COUNT(*) AS n FROM customers").first()).n, 1);
  assert.equal((await d.prepare("SELECT status FROM subscriptions WHERE id = 'sub_1'").first()).status, "active");
  assert.equal(calls.filter((c) => c.path === "/emails").length, 1);
  // paiement refusé : statut mis à jour + e-mail
  const failed = await signed("whsec_t", { id: "evt_2", type: "invoice.payment_failed", data: { object: { subscription: "sub_1" } } });
  await W(webhook, "stripe-webhook", { raw: failed.payload, headers: { "stripe-signature": failed.header } });
  assert.equal((await d.prepare("SELECT status FROM subscriptions WHERE id = 'sub_1'").first()).status, "past_due");
  assert.equal(calls.filter((c) => c.path === "/emails").length, 2);
});

test("tâches du jour : secret, nettoyage, rappel une fois par jour, relances limitées, désinscription", async () => {
  const { calls, fetchImpl } = fakeStripe();
  const env = { DB: localD1(), CRON_SECRET: "s3cret", RESEND_API_KEY: "re_x", UNSUB_SECRET: "u", FETCH: fetchImpl };
  const d = await db(env);
  const C = client(env);
  assert.equal((await C(cron, "cron", { headers: { authorization: "Bearer faux" } })).status, 401);
  // un vieux scan sans achat, un client qui veut son rappel, deux e-mails laissés (un seul a coché la case)
  await d.prepare("INSERT INTO quizzes (id, answers, created_at, updated_at) VALUES ('old', '{}', 1, 1), ('l1', '{}', ?, ?), ('l2', '{}', ?, ?)").bind(now(), now(), now(), now()).run();
  await d.prepare("INSERT INTO scans (id, quiz_id, score_now, score_max, factors, model, delete_after, created_at) VALUES ('s', 'old', 50, 60, '[]', 'x', 1, 1)").run();
  await d.prepare("INSERT INTO leads (quiz_id, email, email_key, marketing_optin, created_at) VALUES ('l1', 'h@example.com', 'h@example.com', 1, ?), ('l2', 'i@example.com', 'i@example.com', 0, ?)").bind(now() - 1.5 * DAY, now() - 1.5 * DAY).run();
  const c = await member(env, "j@example.com");
  await d.prepare("UPDATE customers SET reminder_optin = 1 WHERE id = ?").bind(c.id).run();
  const auth = { headers: { authorization: "Bearer s3cret" } };
  let r = await C(cron, "cron", auth);
  assert.equal(r.data.notes_effacees, 1); assert.equal(r.data.quiz_effaces, 1);
  assert.equal(r.data.rappels, 1); assert.equal(r.data.relances, 1);
  r = await C(cron, "cron", auth);
  assert.equal(r.data.rappels, 0, "un seul rappel par jour"); assert.equal(r.data.relances, 0, "J+3 pas encore atteint");
  assert.equal(calls.filter((x) => x.path === "/emails").length, 2);
  // désinscription par lien signé
  const link = await unsubLink(env, "http://localhost", "c:" + c.id);
  assert.ok(!link.includes("example.com"));
  r = await C(unsubscribe, link.replace("http://localhost/api/", ""), { method: "GET" });
  assert.match(r.data, /C'est fait/);
  r = await C(unsubscribe, link.replace(/t=\w+/, "t=faux").replace("http://localhost/api/", ""), { method: "GET" });
  assert.match(r.data, /ne marche plus/);
  assert.equal((await d.prepare("SELECT reminder_optin FROM customers WHERE id = ?").bind(c.id).first()).reminder_optin, 0);
});

test("résilier pendant les 3 jours : la semaine d'engagement reste due, puis tout s'arrête ; suppression après", async () => {
  const env = { DB: localD1(), DEV_SHOW_CODE: "1" };
  const trialEnd = now() + 2 * DAY;
  await member(env, "k@example.com", { current_period_end: trialEnd, trial_end: trialEnd });
  const K = client(env);
  const s = await K(authStart, "auth-start", { body: { email: "k@example.com" } });
  await K(authVerify, "auth-verify", { body: { email: "k@example.com", code: s.data.devCode } });
  let r = await K(me, "me", { method: "GET" });
  assert.equal(r.data.subscription.in_trial, true);
  r = await K(cancel, "subscription-cancel");
  assert.equal(r.data.ends_at, trialEnd + 7 * DAY, "fin = fin de l'essai + 1 semaine");
  r = await K(me, "me", { method: "GET" });
  assert.equal(r.data.subscription.cancel_at_period_end, true);
  assert.equal(r.data.subscription.charge_pending, true, "la semaine d'engagement reste à prélever");
  r = await K(del, "account-delete", { body: { confirme: true } });
  assert.equal(r.status, 409); assert.match(r.data.error, /semaine d'engagement/);
  // une fois la semaine payée (fin de période = fin d'engagement), plus rien de prévu : suppression possible
  await env.DB.prepare("UPDATE subscriptions SET current_period_end = ends_at").run();
  r = await K(del, "account-delete", { body: { confirme: true } });
  assert.equal(r.status, 200);
});

test("résilier chez Stripe pendant l'essai : cancel_at à la fin de la semaine d'engagement, sans prorata", async () => {
  const sent = [];
  const trialEnd = Math.floor(Date.now() / 1000) + 2 * 86400;
  const fetchImpl = async (url, init = {}) => {
    const body = Object.fromEntries(new URLSearchParams(init.body || ""));
    sent.push({ method: init.method, body });
    const base = { id: "sub_9", status: "trialing", trial_end: trialEnd, current_period_end: trialEnd, cancel_at_period_end: false, metadata: { offer: "semaine" } };
    return new Response(JSON.stringify(init.method === "POST" ? { ...base, cancel_at: Number(body.cancel_at) } : base), { status: 200 });
  };
  const env = { DB: localD1(), DEV_SHOW_CODE: "1", STRIPE_SECRET_KEY: "sk_test_x", FETCH: fetchImpl };
  const d = await db(env);
  const c = await createMember(d, { quiz: null, email: "m@example.com", emailKey: "m@example.com", subscription: { id: "sub_9", ...offerSnapshot("semaine"), status: "active", current_period_end: trialEnd * 1000, trial_end: trialEnd * 1000 } });
  const M = client(env);
  const s = await M(authStart, "auth-start", { body: { email: "m@example.com" } });
  await M(authVerify, "auth-verify", { body: { email: "m@example.com", code: s.data.devCode } });
  const r = await M(cancel, "subscription-cancel");
  assert.equal(r.status, 200);
  const post = sent.find((x) => x.method === "POST").body;
  assert.equal(Number(post.cancel_at), trialEnd + 7 * 86400);
  assert.equal(post.proration_behavior, "none");
  const row = await d.prepare("SELECT * FROM subscriptions WHERE id = 'sub_9'").first();
  assert.equal(row.ends_at, (trialEnd + 7 * 86400) * 1000); assert.equal(row.cancel_at_period_end, 1);
  assert.ok(c.id);
});

test("signature Stripe trop vieille refusée", async () => {
  assert.equal(await verifyWebhook("{}", "t=1000,v1=abc", "s"), false);
});

test("durées de conservation promises : e-mail sans achat et vieux comptes effacés après 3 ans", async () => {
  const env = { DB: localD1(), CRON_SECRET: "s" };
  const d = await db(env);
  const old = now() - 3 * 365 * DAY - DAY;
  await d.prepare("INSERT INTO quizzes (id, answers, created_at, updated_at) VALUES ('vieux', '{}', ?, ?), ('recent', '{}', ?, ?)").bind(old, old, now(), now()).run();
  await d.prepare("INSERT INTO leads (quiz_id, email, email_key, created_at) VALUES ('vieux', 'v@example.com', 'v@example.com', ?), ('recent', 'r@example.com', 'r@example.com', ?)").bind(old, now()).run();
  const gone = await createMember(d, { quiz: null, email: "parti@example.com", emailKey: "parti@example.com", subscription: { id: "essai_parti", ...offerSnapshot("semaine"), status: "canceled", current_period_end: old } });
  await d.prepare("UPDATE customers SET created_at = ? WHERE id = ?").bind(old, gone.id).run();
  const kept = await member(env, "actif@example.com");
  await d.prepare("UPDATE customers SET created_at = ? WHERE id = ?").bind(old, kept.id).run();
  const r = await client(env)(cron, "cron", { headers: { authorization: "Bearer s" } });
  assert.equal(r.data.emails_effaces, 1); assert.equal(r.data.comptes_effaces, 1);
  assert.equal((await d.prepare("SELECT COUNT(*) AS n FROM leads").first()).n, 1);
  assert.ok(await d.prepare("SELECT 1 FROM customers WHERE id = ?").bind(kept.id).first(), "un client actif n'est jamais effacé");
});
