import { json, handle } from "../../lib/http.js";
import { currentQuiz } from "../../lib/identity.js";
import { FACTORS, outOf10 } from "../../src/shared/factors.js";
import { buildPlan } from "../../lib/plan.js";
import { PROTOCOL_BY_ID, protocolFor } from "../../lib/protocols.js";

// GET -> un VRAI aperçu avant le paiement, pour donner envie sans rien inventer :
// - son max (vrai) et les points à gagner ; sa note actuelle reste cachée ;
// - ses 3 meilleurs et 3 moins bons critères : les vraies notes, mais PAS leur nom (seulement sa longueur, pour le flou) ;
// - son vrai plan : les 14 premiers jours en clair (le même plan que celui qu'il recevra), le reste caché.
export const onRequestGet = handle(async ({ request, env }) => {
  const { d, quiz } = await currentQuiz(request, env);
  const answers = JSON.parse(quiz.answers || "{}");
  const scan = await d.prepare("SELECT score_now, score_max, factors FROM scans WHERE quiz_id = ?").bind(quiz.id).first();
  const factors = scan ? JSON.parse(scan.factors) : null;
  const plan = buildPlan(answers, factors);
  // ses protocoles (ceux de son vrai plan) : le titre et le « pourquoi » en clair, les étapes floutées (jamais leur texte)
  const modules = plan.protocols.map((id) => protocolFor(PROTOCOL_BY_ID[id], answers.genre)).map((p) => ({
    title: p.title, why: p.why, steps: p.weeks.map((w) => w.length), daily: p.daily.length,
  }));
  const habits = new Set(plan.days.flatMap((dd) => dd.tasks).filter((t) => /:d\d+$/.test(t))).size;
  const out = { scanned: Boolean(scan), planDays: plan.days.length, modules, habits };
  if (!scan) return json(out);
  const sorted = [...factors].sort((a, b) => b.note - a.note);
  const label = (id) => FACTORS.find((f) => f.id === id)?.label || id;
  const hidden = (f) => ({ note: f.note, len: label(f.id).length });
  const holding = factors.filter((f) => f.note < 55 && FACTORS.find((x) => x.id === f.id)?.changeable >= 0.5);
  return json({
    ...out,
    max: outOf10(scan.score_max),
    gain: outOf10(scan.score_max - scan.score_now),
    strength: { label: label(sorted[0].id), note: sorted[0].note },
    strengths: sorted.slice(0, 3).map(hidden),
    weaknesses: sorted.slice(-3).reverse().map(hidden),
    holding: holding.length,
  });
});
