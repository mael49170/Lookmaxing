import { json, handle } from "../../lib/http.js";
import { currentQuiz } from "../../lib/identity.js";
import { FACTORS, outOf10 } from "../../src/shared/factors.js";

// GET -> un VRAI aperçu du résultat avant le paiement : le point fort, le nombre de critères qui freinent,
// et les points à gagner. Jamais la note elle-même ni le détail (ils restent pour après le paiement).
export const onRequestGet = handle(async ({ request, env }) => {
  const { d, quiz } = await currentQuiz(request, env);
  const scan = await d.prepare("SELECT score_now, score_max, factors FROM scans WHERE quiz_id = ?").bind(quiz.id).first();
  if (!scan) return json({ scanned: false });
  const factors = JSON.parse(scan.factors);
  const best = [...factors].sort((a, b) => b.note - a.note)[0];
  const label = (id) => FACTORS.find((f) => f.id === id)?.label || id;
  const holding = factors.filter((f) => f.note < 55 && FACTORS.find((x) => x.id === f.id)?.changeable >= 0.5);
  return json({
    scanned: true,
    strength: { label: label(best.id), note: best.note },
    gain: outOf10(scan.score_max - scan.score_now),
    holding: holding.length,
    holdingLabels: holding.slice(0, 3).map((f) => label(f.id)), // affichés floutés sur l'aperçu
  });
});
