// Parcours complet côté serveur, sans réseau : quiz -> consentement -> scan (mode essai) -> e-mail -> paiement d'essai -> espace membre.
// node test/flow.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { localD1 } from "../dev/d1.mjs";
import * as quiz from "../functions/api/quiz.js";
import * as consent from "../functions/api/scan-consent.js";
import * as scan from "../functions/api/scan.js";
import * as lead from "../functions/api/lead.js";
import * as checkout from "../functions/api/checkout.js";
import * as done from "../functions/api/checkout-done.js";
import * as me from "../functions/api/me.js";
import * as check from "../functions/api/plan-check.js";

const IMG = "data:image/jpeg;base64," + Buffer.from("faux jpeg ".repeat(200)).toString("base64");

function client(env) {
  const jar = {};
  return async (mod, path, { method = "POST", body, query = "" } = {}) => {
    const headers = { cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ") };
    if (body) headers["content-type"] = "application/json";
    const request = new Request("http://localhost/api/" + path + query, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const fn = mod["onRequest" + method[0] + method.slice(1).toLowerCase()];
    const res = await fn({ request, env, params: {} });
    for (const c of res.headers.getSetCookie()) { const [kv] = c.split(";"); const [k, v] = kv.split("="); if (/Max-Age=0/.test(c)) delete jar[k]; else jar[k] = v; }
    const data = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
    return { status: res.status, data, location: res.headers.get("location") };
  };
}

test("parcours complet avec scan", async () => {
  const env = { DB: localD1(), DEV_FAKE_SCAN: "1", DEV_FAKE_PAY: "1" };
  const call = client(env);
  let r = await call(quiz, "quiz", { body: { answers: { genre: "homme", age: "25-34" }, variant: "a", utm: { source: "meta" } } });
  assert.equal(r.status, 200); assert.ok(r.data.id);
  // scan refusé sans consentement
  r = await call(scan, "scan", { body: { face: IMG, profil: IMG } });
  assert.equal(r.status, 403);
  await call(consent, "scan-consent", { body: { agree: true } });
  r = await call(scan, "scan", { body: { face: IMG, profil: IMG } });
  assert.equal(r.status, 200); assert.equal(r.data.ok, true);
  assert.equal(r.data.now, undefined, "les notes ne partent pas avant le paiement");
  // aucune photo enregistrée, nulle part
  const dump = JSON.stringify((await env.DB.prepare("SELECT * FROM scans").all()).results) + JSON.stringify((await env.DB.prepare("SELECT * FROM quizzes").all()).results);
  assert.ok(!dump.includes(IMG.slice(30, 80)), "une photo a été écrite en base");
  // réponses inconnues ignorées
  await call(quiz, "quiz", { body: { answers: { difficultes: ["confiance", "pirate"], pari: "moyen", morpho: "mince", temps: true, rappel: true } } });
  const q = await env.DB.prepare("SELECT answers, bet FROM quizzes").first();
  assert.deepEqual(JSON.parse(q.answers).difficultes, ["confiance"]); assert.equal(q.bet, "moyen");
  r = await call(lead, "lead", { body: { email: "pas-un-mail" } });
  assert.equal(r.status, 400);
  r = await call(lead, "lead", { body: { email: "Test@Example.com", optin: false } });
  assert.equal(r.status, 200); assert.equal(r.data.scanned, true);
  assert.equal((await env.DB.prepare("SELECT marketing_optin FROM leads").first()).marketing_optin, 0);
  r = await call(checkout, "checkout", { body: { offer: "semaine" } });
  assert.equal(r.status, 400, "la case de renonciation est obligatoire");
  r = await call(checkout, "checkout", { body: { offer: "semaine", waiver: true } });
  assert.equal(r.status, 200);
  const u = new URL(r.data.url, "http://localhost");
  r = await call(done, "checkout-done", { method: "GET", query: u.search });
  assert.equal(r.status, 303); assert.equal(r.location, "/app/?bienvenue=1");
  r = await call(me, "me", { method: "GET" });
  assert.equal(r.status, 200);
  assert.ok(r.data.report && r.data.report.factors.length === 15);
  assert.ok(Number(r.data.report.max) >= Number(r.data.report.now));
  assert.equal(r.data.plan.day, 1);
  const task = r.data.plan.tasks[0].id;
  r = await call(check, "plan-check", { body: { task_id: task } });
  assert.equal(r.status, 200);
  r = await call(check, "plan-check", { body: { task_id: "pas_aujourdhui" } });
  assert.equal(r.status, 400);
  r = await call(me, "me", { method: "GET" });
  assert.equal(r.data.plan.tasks[0].done, true);
  assert.equal(r.data.plan.doneDays, 1);
  // la note d'un client n'est plus effacée au bout de 30 jours
  assert.ok((await env.DB.prepare("SELECT delete_after FROM scans").first()).delete_after > Date.now() + 1e12);
});

test("moins de 18 ans : rien n'est gardé", async () => {
  const env = { DB: localD1() };
  const call = client(env);
  await call(quiz, "quiz", { body: { answers: { genre: "homme" } } });
  assert.equal((await env.DB.prepare("SELECT COUNT(*) AS n FROM quizzes").first()).n, 1);
  const r = await call(quiz, "quiz", { body: { answers: { age: "-18" } } });
  assert.equal(r.data.stopped, true);
  assert.equal((await env.DB.prepare("SELECT COUNT(*) AS n FROM quizzes").first()).n, 0);
});

test("refus du scan : plan sans note, et les notes déjà faites sont effacées", async () => {
  const env = { DB: localD1(), DEV_FAKE_SCAN: "1", DEV_FAKE_PAY: "1" };
  const call = client(env);
  await call(quiz, "quiz", { body: { answers: { genre: "femme", age: "18-24" } } });
  await call(consent, "scan-consent", { body: { agree: true } });
  await call(scan, "scan", { body: { face: IMG, profil: IMG } });
  await call(consent, "scan-consent", { body: { agree: false } });
  assert.equal((await env.DB.prepare("SELECT COUNT(*) AS n FROM scans").first()).n, 0);
  await call(lead, "lead", { body: { email: "b@example.com" } });
  const { data } = await call(checkout, "checkout", { body: { offer: "semaine", waiver: true } });
  await call(done, "checkout-done", { method: "GET", query: new URL(data.url, "http://x").search });
  const r = await call(me, "me", { method: "GET" });
  assert.equal(r.data.report, null);
  assert.ok(r.data.plan.tasks.length >= 2);
});

// BUG-002 : en 4G, beaucoup de gens partagent la même adresse IP. La limite par IP est large (10 par défaut),
// réglable (SCANS_PER_IP), et c'est l'anti-robot + 1 scan par quiz qui protègent le budget.
async function scansUntilBlocked(env, max) {
  for (let n = 0; n < max; n++) {
    const call = client(env);
    await call(quiz, "quiz", { body: { answers: { genre: "homme", age: "25-34" } } });
    await call(consent, "scan-consent", { body: { agree: true } });
    const r = await call(scan, "scan", { body: { face: IMG, profil: IMG } });
    if (r.status === 429) return n;
  }
  return max;
}
test("limite de scans par connexion : 10 par défaut, réglable", async () => {
  assert.equal(await scansUntilBlocked({ DB: localD1(), DEV_FAKE_SCAN: "1" }, 12), 10);
  assert.equal(await scansUntilBlocked({ DB: localD1(), DEV_FAKE_SCAN: "1", SCANS_PER_IP: "2" }, 5), 2);
});

test("un seul scan payant par quiz", async () => {
  const env = { DB: localD1(), DEV_FAKE_SCAN: "1" };
  const call = client(env);
  await call(quiz, "quiz", { body: { answers: { genre: "homme", age: "25-34" } } });
  await call(consent, "scan-consent", { body: { agree: true } });
  await call(scan, "scan", { body: { face: IMG, profil: IMG } });
  const r = await call(scan, "scan", { body: { face: IMG, profil: IMG } });
  assert.equal(r.data.already, true);
  assert.equal((await env.DB.prepare("SELECT COUNT(*) AS n FROM scans").first()).n, 1);
});

test("sans paiement d'essai ni Stripe, le paiement est fermé", async () => {
  const env = { DB: localD1() };
  const call = client(env);
  await call(quiz, "quiz", { body: { answers: { genre: "homme", age: "25-34" } } });
  await call(lead, "lead", { body: { email: "c@example.com" } });
  const r = await call(checkout, "checkout", { body: { offer: "semaine", waiver: true } });
  assert.equal(r.status, 503);
  const d = await call(done, "checkout-done", { method: "GET", query: "?essai=1&offre=semaine" });
  assert.equal(d.status, 400, "le faux paiement ne marche pas en ligne");
});
