import { json, handle, HttpError } from "../../lib/http.js";
import { now, uuid, hit, track, DAY } from "../../lib/db.js";
import { currentQuiz, checkTurnstile, clientIp } from "../../lib/identity.js";
import { parseImage, runScan } from "../../lib/scan.js";

// En 4G, beaucoup de gens partagent la même adresse IP (BUG-002) : limite large, réglable.
// Ce sont l'anti-robot et « 1 scan par quiz » qui protègent vraiment le budget.
const scansPerIp = (env) => Math.max(1, parseInt(env.SCANS_PER_IP || "10", 10) || 10);

// POST { face, profil, turnstile } (photos en data URL) -> analyse. Les photos ne sont gardées nulle part.
// La réponse ne contient pas les notes : elles s'affichent après le paiement.
export const onRequestPost = handle(async ({ request, env }) => {
  const text = await request.text();
  if (text.length > 4_500_000) throw new HttpError(413, "Photos trop lourdes.");
  let body;
  try { body = JSON.parse(text); } catch { throw new HttpError(400, "Envoi illisible."); }
  const { d, quiz } = await currentQuiz(request, env, { preferCustomer: true });
  if (!quiz.scan_consent_at) throw new HttpError(403, "Il faut d'abord accepter l'analyse de tes photos.");
  const existing = await d.prepare("SELECT id FROM scans WHERE quiz_id = ?").bind(quiz.id).first();
  if (existing) return json({ ok: true, already: true });
  const images = [parseImage(body.face), parseImage(body.profil)];
  const ip = clientIp(request);
  if (await checkTurnstile(env, body.turnstile, ip) !== "ok") throw new HttpError(403, "Vérification anti-robot à refaire.");
  if (!(await hit(d, "scan-ip:" + quiz.ip_hash, scansPerIp(env), DAY))) throw new HttpError(429, "Trop d'analyses depuis cette connexion aujourd'hui. Continue sans scan ou réessaie demain.");
  const r = await runScan(env, images, { genre: quiz.gender || "" });
  if (!r.ok) {
    await track(d, "scan_" + r.problem, { variant: quiz.variant, source: quiz.utm_source });
    return json({ ok: false, problem: r.problem, message: r.message });
  }
  await d.prepare(`INSERT INTO scans (id, quiz_id, score_now, score_max, factors, model, cost_microusd, delete_after, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(quiz_id) DO NOTHING`)
    .bind(uuid(), quiz.id, r.now, r.max, JSON.stringify(r.factors), r.model, r.cost, now() + 30 * DAY, now()).run();
  await track(d, "scan_ok", { variant: quiz.variant, source: quiz.utm_source });
  return json({ ok: true });
});
