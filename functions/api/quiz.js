import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { now, uuid, track } from "../../lib/db.js";
import { currentQuiz, quizCookie, ipHash } from "../../lib/identity.js";
import { cleanAnswers } from "../../src/shared/questions.js";

const AGES = new Set(["18-24", "25-34", "35-44", "45-54", "55+"]);
const BETS = new Set(["a_travailler", "moyen", "correct", "beau", "canon"]);
const clip = (s, n = 60) => String(s || "").replace(/[^\w.-]/g, "").slice(0, n);

// POST { answers, variant, utm } -> crée ou met à jour le quiz de ce navigateur.
// « Moins de 18 ans » : on efface tout et on n'enregistre rien.
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 20_000);
  const { d, quiz } = await currentQuiz(request, env, { required: false });
  const raw = body.answers || {};
  if (raw.age === "-18") {
    if (quiz) await d.prepare("DELETE FROM quizzes WHERE id = ?").bind(quiz.id).run();
    return json({ stopped: true }, 200, { "set-cookie": quizCookie("", request).replace(/Max-Age=\d+/, "Max-Age=0") });
  }
  const answers = { ...(quiz ? JSON.parse(quiz.answers || "{}") : {}), ...cleanAnswers(raw) };
  const gender = ["homme", "femme"].includes(raw.genre) ? raw.genre : quiz?.gender || null;
  const age = AGES.has(raw.age) ? raw.age : quiz?.age_band || null;
  const bet = BETS.has(raw.pari) ? raw.pari : quiz?.bet || null;
  const t = now();
  if (!quiz) {
    const id = uuid();
    const utm = body.utm || {};
    const variant = body.variant === "b" ? "b" : "a";
    await d.prepare(`INSERT INTO quizzes (id, variant, gender, age_band, answers, bet, utm_source, utm_campaign, utm_content, ip_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, variant, gender, age, JSON.stringify(answers), bet, clip(utm.source), clip(utm.campaign), clip(utm.content), await ipHash(request, env), t, t).run();
    await track(d, "quiz_cree", { variant, source: clip(utm.source) });
    return json({ id }, 200, { "set-cookie": quizCookie(id, request) });
  }
  await d.prepare("UPDATE quizzes SET gender = ?, age_band = ?, answers = ?, bet = ?, updated_at = ? WHERE id = ?")
    .bind(gender, age, JSON.stringify(answers), bet, t, quiz.id).run();
  return json({ id: quiz.id });
});
