// Le vrai minuteur (réservation de l'essai), l'aperçu sans fuite, le paiement dans la page, la garantie.
// node test/offer.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { localD1 } from "../dev/d1.mjs";
import { db, now, DAY, parisDay } from "../lib/db.js";
import { reservation } from "../lib/offer.js";
import { createCheckout } from "../lib/stripe.js";
import { createMember, offerSnapshot } from "../lib/members.js";
import * as quizApi from "../functions/api/quiz.js";
import * as consent from "../functions/api/scan-consent.js";
import * as scanApi from "../functions/api/scan.js";
import * as lead from "../functions/api/lead.js";
import * as offerApi from "../functions/api/offer.js";
import * as teaser from "../functions/api/teaser.js";
import * as checkout from "../functions/api/checkout.js";
import * as done from "../functions/api/checkout-done.js";
import * as me from "../functions/api/me.js";
import * as guarantee from "../functions/api/guarantee.js";
import * as check from "../functions/api/plan-check.js";

const IMG = "data:image/jpeg;base64," + Buffer.from("faux jpeg ".repeat(200)).toString("base64");
function client(env, jar = {}) {
  const call = async (mod, path, { method = "POST", body, query = "" } = {}) => {
    const headers = { cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ") };
    if (body) headers["content-type"] = "application/json";
    const res = await mod["onRequest" + method[0] + method.slice(1).toLowerCase()]({ request: new Request("http://localhost/api/" + path + query, { method, headers, body: body ? JSON.stringify(body) : undefined }), env, params: {} });
    for (const c of res.headers.getSetCookie()) { const [kv] = c.split(";"); const [k, v] = kv.split("="); if (/Max-Age=0/.test(c)) delete jar[k]; else jar[k] = v; }
    return { status: res.status, data: res.headers.get("content-type")?.includes("json") ? await res.json() : null, location: res.headers.get("location") };
  };
  call.jar = jar;
  return call;
}
async function toPaywall(call, email, { scan = false } = {}) {
  await call(quizApi, "quiz", { body: { answers: { genre: "homme", age: "25-34", difficultes: ["peau"] } } });
  if (scan) { await call(consent, "scan-consent", { body: { agree: true } }); await call(scanApi, "scan", { body: { face: IMG, profil: IMG } }); }
  await call(lead, "lead", { body: { email } });
}

test("réservation : 15 minutes, jamais remise à zéro, par e-mail ET par téléphone", async () => {
  const d = await db({ DB: localD1(), LEADS_ENABLED: "1" });
  const a = await reservation(d, { emailKey: "a@x.fr", device: "dev1dev1dev1dev1" });
  assert.equal(a.trial, true);
  assert.ok(Math.abs(a.expires_at - (now() + 15 * 60e3)) < 2000);
  const again = await reservation(d, { emailKey: "a@x.fr", device: "dev1dev1dev1dev1" });
  assert.equal(again.expires_at, a.expires_at, "recommencer ne relance pas le minuteur");
  await d.prepare("UPDATE offer_claims SET expires_at = ?").bind(now() - 1).run();
  assert.equal((await reservation(d, { emailKey: "a@x.fr", device: "autre-telephone-1234" })).trial, false, "même e-mail, autre téléphone : fini");
  assert.equal((await reservation(d, { emailKey: "nouveau@x.fr", device: "dev1dev1dev1dev1" })).trial, false, "même téléphone, autre e-mail : fini");
  assert.equal((await reservation(d, { emailKey: "nouveau2@x.fr", device: "tout-neuf-12345678" })).trial, true);
});

test("le serveur décide de l'essai au paiement : après 15 minutes, plus d'essai à 0,99 €", async () => {
  const env = { DB: localD1(), LEADS_ENABLED: "1", DEV_FAKE_PAY: "1" };
  const call = client(env);
  await toPaywall(call, "b@example.com");
  let r = await call(offerApi, "offer", { method: "GET" });
  assert.equal(r.data.trial, true); assert.ok(call.jar.lm_d, "cookie du téléphone posé");
  r = await call(checkout, "checkout", { body: { waiver: true } });
  assert.equal(r.data.trial, true); assert.match(r.data.url, /t=1/);
  await env.DB.prepare("UPDATE offer_claims SET expires_at = ?").bind(now() - 1).run();
  r = await call(offerApi, "offer", { method: "GET" });
  assert.equal(r.data.trial, false);
  r = await call(checkout, "checkout", { body: { waiver: true } });
  assert.equal(r.data.trial, false); assert.match(r.data.url, /t=0/);
  await call(done, "checkout-done", { method: "GET", query: new URL(r.data.url, "http://x").search + "&essai=1&email=b%40example.com" });
  r = await call(me, "me", { method: "GET" });
  assert.equal(r.data.subscription.in_trial, false, "sans essai : abonnement à la semaine tout de suite");
});

test("aperçu avant paiement : vraies notes, noms des critères cachés, vrai plan", async () => {
  const env = { DB: localD1(), LEADS_ENABLED: "1", DEV_FAKE_SCAN: "1" };
  const call = client(env);
  await toPaywall(call, "c@example.com", { scan: true });
  const r = await call(teaser, "teaser", { method: "GET" });
  assert.equal(r.data.scanned, true);
  assert.equal(r.data.strengths.length, 3); assert.equal(r.data.weaknesses.length, 3);
  assert.ok(r.data.strengths.every((f) => Number.isInteger(f.note) && f.len > 0 && !("label" in f) && !("id" in f)), "aucun nom de critère dans les notes");
  assert.ok(r.data.strengths[0].note >= r.data.weaknesses[0].note);
  assert.equal(r.data.planDays, 28); assert.equal(r.data.modules.length, 4);
  assert.ok(r.data.modules.every((m) => m.title && m.why && m.steps.length === 4 && m.steps.every((n) => Number.isInteger(n))), "titres et pourquoi en clair, étapes seulement en longueur");
  const { PROTOCOLS } = await import("../lib/protocols.js");
  const json = JSON.stringify(r.data);
  assert.ok(!PROTOCOLS.some((p) => (Array.isArray(p.weeks) ? p.weeks : Object.values(p.weeks).flat()).some((w) => json.includes(w.slice(0, 40)))), "le texte des étapes ne doit jamais partir avant le paiement");
  assert.ok(!("now" in r.data) && !JSON.stringify(r.data).includes("score_now"), "la note actuelle reste cachée");
});

test("paiement dans la page : Stripe en mode intégré, sans essai si la réservation est passée", async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url); const body = Object.fromEntries(new URLSearchParams(init.body || ""));
    calls.push({ path: u.pathname, method: init.method, body });
    const ok = (o) => new Response(JSON.stringify(o), { status: 200 });
    if (u.pathname === "/v1/prices" && init.method === "GET") return ok({ data: [{ lookup_key: "lm_semaine_1699_1w", id: "p_w", product: "prod" }, { lookup_key: "lm_semaine_essai_99_3j", id: "p_i", product: "prod" }] });
    if (u.pathname === "/v1/checkout/sessions") return ok({ client_secret: "cs_secret_123", url: "https://checkout.stripe.com/x" });
    return ok({});
  };
  const env = { STRIPE_SECRET_KEY: "sk_test_x", FETCH: fetchImpl };
  const r = await createCheckout(env, new Request("https://site.fr/api/checkout"), { quiz: { id: "q2" }, lead: { email: "e@example.com" }, offer: "semaine", trial: false, embedded: true });
  assert.equal(r.clientSecret, "cs_secret_123");
  const co = calls.find((c) => c.path === "/v1/checkout/sessions").body;
  assert.equal(co.ui_mode, "embedded"); assert.match(co.return_url, /checkout-done\?session_id=/);
  assert.equal(co.success_url, undefined);
  assert.equal(co["line_items[1][price]"], undefined, "pas de ligne d'essai");
  assert.equal(co["subscription_data[trial_period_days]"], undefined, "pas de jours d'essai");
  assert.match(co["custom_text[submit][message]"].replace(/\s+/g, " "), /16,99 € pour ta 1re semaine/);
  // sans e-mail connu (cas normal depuis le 25/11/2026) : Stripe le demande dans son formulaire
  calls.length = 0;
  await createCheckout(env, new Request("https://site.fr/api/checkout"), { quiz: { id: "q3" }, lead: null, offer: "semaine", trial: true, embedded: true });
  assert.equal(calls.find((c) => c.path === "/v1/checkout/sessions").body.customer_email, undefined);
});

test("garantie : refusée avant 5 jours cochés, remboursée après, une seule fois", async () => {
  const env = { DB: localD1(), LEADS_ENABLED: "1" };
  const d = await db(env);
  const start = now() - 6 * DAY; // la 1re semaine payée a commencé il y a 6 jours
  const c = await createMember(d, { quiz: null, email: "g@example.com", emailKey: "g@example.com", subscription: { id: "essai_g", ...offerSnapshot("semaine"), status: "active", current_period_end: start + 7 * DAY, trial_end: start } });
  const { createSession, sessionCookie } = await import("../lib/identity.js");
  const token = await createSession(d, c.id);
  const call = client(env, { lm_s: token });
  let r = await call(me, "me", { method: "GET" });
  assert.equal(r.data.guarantee.eligible, false); assert.match(r.data.guarantee.reason, /5 jours/);
  assert.equal((await call(guarantee, "guarantee", { body: { confirme: true } })).status, 409);
  for (let i = 0; i < 5; i++) await d.prepare("INSERT INTO task_checks (customer_id, day, task_id, done_at) VALUES (?, ?, 'x', ?)").bind(c.id, parisDay(start + i * DAY + 3600e3), now()).run();
  r = await call(me, "me", { method: "GET" });
  assert.equal(r.data.guarantee.done, 5); assert.equal(r.data.guarantee.eligible, true);
  r = await call(guarantee, "guarantee", { body: { confirme: true } });
  assert.equal(r.status, 200); assert.equal(r.data.refunded_cents, 1699);
  r = await call(me, "me", { method: "GET" });
  assert.equal(r.data.subscription.status, "canceled");
  assert.equal(r.data.guarantee.used, true);
  assert.equal((await call(guarantee, "guarantee", { body: { confirme: true } })).status, 409, "une seule fois");
});

test("garantie chez Stripe : rembourse la 1re facture de la semaine, puis arrête l'abonnement", async () => {
  const sent = [];
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url); sent.push({ path: u.pathname, method: init.method, body: Object.fromEntries(new URLSearchParams(init.body || "")) });
    const ok = (o) => new Response(JSON.stringify(o), { status: 200 });
    if (u.pathname === "/v1/invoices") return ok({ data: [{ amount_paid: 99, payment_intent: "pi_essai", created: 1 }, { amount_paid: 1699, payment_intent: "pi_s2", created: 3 }, { amount_paid: 1699, payment_intent: "pi_s1", created: 2 }] });
    if (u.pathname === "/v1/refunds") return ok({ id: "re_1" });
    if (u.pathname.startsWith("/v1/subscriptions/")) return ok({ id: "sub_g", status: "canceled", current_period_end: 1, metadata: { offer: "semaine" } });
    return ok({});
  };
  const env = { DB: localD1(), LEADS_ENABLED: "1", STRIPE_SECRET_KEY: "sk_test_x", FETCH: fetchImpl };
  const d = await db(env);
  const start = now() - 6 * DAY;
  const c = await createMember(d, { quiz: null, email: "h@example.com", emailKey: "h@example.com", subscription: { id: "sub_g", ...offerSnapshot("semaine"), status: "active", current_period_end: start + 7 * DAY, trial_end: start } });
  for (let i = 0; i < 5; i++) await d.prepare("INSERT INTO task_checks (customer_id, day, task_id, done_at) VALUES (?, ?, 'x', ?)").bind(c.id, parisDay(start + i * DAY + 3600e3), now()).run();
  const { createSession } = await import("../lib/identity.js");
  const call = client(env, { lm_s: await createSession(d, c.id) });
  const r = await call(guarantee, "guarantee", { body: { confirme: true } });
  assert.equal(r.status, 200);
  assert.equal(sent.find((x) => x.path === "/v1/refunds").body.payment_intent, "pi_s1", "la 1re semaine, pas l'essai ni la 2e semaine");
  assert.ok(sent.some((x) => x.method === "DELETE" && x.path === "/v1/subscriptions/sub_g"));
});
