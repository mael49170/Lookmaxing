import { json, handle } from "../../lib/http.js";
import { db, now } from "../../lib/db.js";

// GET -> le VRAI nombre de personnes qui ont commencé leur analyse dans la dernière heure (quiz créés).
// Aucun chiffre inventé, aucune adresse e-mail montrée (règle du projet, DGCCRF et RGPD). Le site ne l'affiche qu'à partir de 3.
export const onRequestGet = handle(async ({ env }) => {
  const d = await db(env);
  const row = await d.prepare("SELECT COUNT(*) AS n FROM quizzes WHERE created_at > ?").bind(now() - 3600e3).first();
  return json({ lastHour: row?.n || 0 }, 200, { "cache-control": "public, max-age=60" });
});
