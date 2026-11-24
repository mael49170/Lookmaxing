// Petits contrôles : notes, réponses, coût, plan, règles de design.
// node test/units.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { FACTORS, overall, potential } from "../src/shared/factors.js";
import { SCREENS, cleanAnswers } from "../src/shared/questions.js";
import { toResult, costMicroUsd, parseImage } from "../lib/scan.js";
import { buildPlan, PLAN_DAYS } from "../lib/plan.js";
import { TASKS } from "../lib/tasks.js";

test("note globale et potentiel", () => {
  const all = (n) => Object.fromEntries(FACTORS.map((f) => [f.id, n]));
  assert.equal(overall(all(50)), 50);
  assert.ok(potential(all(50)) > 50 && potential(all(50)) <= 95);
  assert.equal(potential(all(99)), 99, "le max n'est jamais sous la note actuelle");
  // seuls les critères qui se travaillent font monter le max
  const s = all(60); const bone = { ...s, symetrie: 20, nez: 20 };
  assert.ok(Math.abs((potential(bone) - overall(bone)) - (potential(s) - overall(s))) <= 1);
});

test("résultat de l'IA : bornes, critères manquants, problèmes", () => {
  const crit = FACTORS.map((f) => ({ id: f.id, note: 150, phrase: "x" }));
  const r = toResult({ probleme: "aucun", criteres: crit });
  assert.ok(r.ok); assert.ok(r.factors.every((f) => f.note === 100));
  assert.equal(toResult({ probleme: "aucun", criteres: crit.slice(1) }).ok, false);
  const m = toResult({ probleme: "semble_mineur", criteres: [] });
  assert.equal(m.ok, false); assert.match(m.message, /adultes/);
});

test("coût d'un scan (Opus 5.5, ~4 600 jetons en entrée, ~2 300 en sortie)", () => {
  const c = costMicroUsd("claude-opus-5-5", { input_tokens: 4600, output_tokens: 2300 });
  assert.equal(c, 64400); // 0,0644 $
});

test("photos : seulement des images, pas trop lourdes", () => {
  assert.throws(() => parseImage("data:text/html;base64,PGI+"));
  assert.throws(() => parseImage("data:image/jpeg;base64," + "A".repeat(2_100_000)));
  assert.equal(parseImage("data:image/jpeg;base64,AAAA").media_type, "image/jpeg");
});

test("réponses : seules les valeurs prévues passent", () => {
  assert.deepEqual(cleanAnswers({ genre: "homme", difficultes: ["peau", "x"], pari: "nope", rappel: true }), { genre: "homme", difficultes: ["peau"], rappel: true });
});

test("plan : 28 jours, tâches connues, jamais 2 fois la même tâche le même jour", () => {
  const ids = new Set(TASKS.map((t) => t.id));
  for (const a of [{}, { difficultes: ["peau"], temps: false }, { difficultes: ["poids", "cheveux"], morpho: "enrobee" }]) {
    const p = buildPlan(a, FACTORS.map((f, i) => ({ id: f.id, note: 40 + i })));
    assert.equal(p.days.length, PLAN_DAYS);
    for (const d of p.days) { assert.ok(d.tasks.every((t) => ids.has(t))); assert.equal(new Set(d.tasks).size, d.tasks.length); }
  }
});

test("tous les écrans S01 à S26 existent, une fois chacun", () => {
  const sids = SCREENS.map((s) => s.sid);
  for (let i = 1; i <= 26; i++) assert.ok(sids.includes("S" + String(i).padStart(2, "0")), "manque S" + i);
  assert.equal(new Set(sids).size, sids.length);
});

test("design : pas de couleur en dur dans les composants", () => {
  for (const f of ["src/styles/components.css", "src/q/quiz.css"]) {
    const css = readFileSync(new URL("../" + f, import.meta.url), "utf8");
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css), "couleur en dur dans " + f);
  }
});

test("textes : aucun faux chiffre de preuve sociale", () => {
  const files = ["src/q/app.js", "src/shared/questions.js", "src/app/app.js"].map((f) => readFileSync(new URL("../" + f, import.meta.url), "utf8")).join("\n");
  assert.ok(!/\b\d{2,3}[ ,.]?\d{3}\+? (scans|utilisateurs|clients)/i.test(files));
  assert.ok(!/le plus choisi|tendance|★/i.test(files));
});

test("appel à Claude : format de la requête, refus géré, aucune photo dans les journaux", async () => {
  const { runScan } = await import("../lib/scan.js");
  const img = { media_type: "image/jpeg", data: "SECRETPHOTO".repeat(10) };
  let sent;
  const reply = (status, body) => async (url, init) => { sent = JSON.parse(init.body); return new Response(JSON.stringify(body), { status }); };
  const crit = FACTORS.map((f) => ({ id: f.id, note: 60, phrase: "ok" }));
  const r = await runScan({ ANTHROPIC_API_KEY: "k" }, [img, img], { fetchImpl: reply(200, { model: "claude-opus-5-5", stop_reason: "end_turn", usage: { input_tokens: 4600, output_tokens: 2300 }, content: [{ type: "text", text: JSON.stringify({ probleme: "aucun", criteres: crit }) }] }) });
  assert.equal(sent.model, "claude-opus-5-5");
  assert.equal(sent.output_config.format.type, "json_schema");
  assert.equal(sent.fallbacks, "default");
  assert.equal(sent.messages[0].content.filter((c) => c.type === "image").length, 2);
  assert.equal(sent.thinking, undefined, "pas de réglage de réflexion interdit sur ce modèle");
  assert.ok(r.ok); assert.equal(r.now, 60); assert.equal(r.cost, 64400);
  const refused = await runScan({ ANTHROPIC_API_KEY: "k" }, [img, img], { fetchImpl: reply(200, { stop_reason: "refusal", usage: {}, content: [] }) });
  assert.equal(refused.ok, false);
  const logs = []; const orig = console.error; console.error = (...a) => logs.push(a.join(" "));
  await assert.rejects(runScan({ ANTHROPIC_API_KEY: "k" }, [img, img], { fetchImpl: reply(500, { error: { type: "api_error", message: "panne" } }) }));
  console.error = orig;
  assert.ok(logs.length && !logs.join(" ").includes("SECRETPHOTO"));
});
