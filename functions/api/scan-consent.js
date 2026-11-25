import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { now, track } from "../../lib/db.js";
import { currentQuiz } from "../../lib/identity.js";

export const CONSENT_VERSION = "biometrie-v2"; // v2 (25/11/2026) : « Qui les voit » précisé

// POST { agree } -> enregistre (ou retire) le consentement biométrique, avec la version du texte accepté
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 2_000);
  const { d, quiz } = await currentQuiz(request, env);
  if (body.agree === true) {
    await d.prepare("UPDATE quizzes SET scan_consent_at = ?, scan_consent_version = ?, updated_at = ? WHERE id = ?").bind(now(), CONSENT_VERSION, now(), quiz.id).run();
    await track(d, "consentement_oui", { variant: quiz.variant, source: quiz.utm_source });
  } else {
    await d.prepare("UPDATE quizzes SET scan_consent_at = NULL, scan_consent_version = NULL, updated_at = ? WHERE id = ?").bind(now(), quiz.id).run();
    await d.prepare("DELETE FROM scans WHERE quiz_id = ?").bind(quiz.id).run();
    await track(d, "consentement_non", { variant: quiz.variant, source: quiz.utm_source });
  }
  return json({ ok: true, version: CONSENT_VERSION });
});
