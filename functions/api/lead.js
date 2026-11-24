import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { now, track } from "../../lib/db.js";
import { currentQuiz, emailKey } from "../../lib/identity.js";
import { OFFERS, DEFAULT_OFFER } from "../../src/shared/plans.js";

// POST { email, optin } -> garde l'e-mail (la case marketing est décochée par défaut) et renvoie les offres
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 2_000);
  const email = String(body.email || "").trim();
  const key = emailKey(email);
  if (!key) throw new HttpError(400, "Cette adresse ne semble pas complète.");
  const { d, quiz } = await currentQuiz(request, env);
  await d.prepare(`INSERT INTO leads (quiz_id, email, email_key, marketing_optin, created_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(quiz_id) DO UPDATE SET email = excluded.email, email_key = excluded.email_key, marketing_optin = excluded.marketing_optin`)
    .bind(quiz.id, email, key, body.optin === true ? 1 : 0, now()).run();
  await track(d, "email", { variant: quiz.variant, source: quiz.utm_source });
  const scan = await d.prepare("SELECT 1 FROM scans WHERE quiz_id = ?").bind(quiz.id).first();
  return json({ ok: true, offers: OFFERS, defaultOffer: DEFAULT_OFFER, scanned: Boolean(scan) });
});
