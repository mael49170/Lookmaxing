import { json, readJson, handle } from "../../lib/http.js";
import { db, track, hit, DAY } from "../../lib/db.js";
import { ipHash } from "../../lib/identity.js";
import { SCREEN_IDS } from "../../src/shared/questions.js";
const STEPS = new Set(SCREEN_IDS);

// POST { step, variant, source } -> +1 au compteur de cet écran (aucune donnée personnelle)
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 2_000);
  const d = await db(env);
  // seulement les vrais écrans du parcours, et au plus 300 par connexion et par jour (pas de remplissage de la base)
  if (d && STEPS.has(body.step) && (await hit(d, "track-ip:" + (await ipHash(request, env)), 300, DAY))) await track(d, body.step, { variant: body.variant === "b" ? "b" : "a", source: body.source });
  return json({ ok: true });
});
