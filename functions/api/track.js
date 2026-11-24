import { json, readJson, handle } from "../../lib/http.js";
import { db, track } from "../../lib/db.js";

// POST { step, variant, source } -> +1 au compteur de cet écran (aucune donnée personnelle)
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 2_000);
  const d = await db(env);
  if (d) await track(d, body.step, { variant: body.variant === "b" ? "b" : "a", source: body.source });
  return json({ ok: true });
});
