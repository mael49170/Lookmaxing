import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { currentQuiz } from "../../lib/identity.js";
import { WAIVER_TEXT } from "../../src/shared/plans.js";

// POST { session } -> la case de renonciation cochée sur notre page : la preuve est écrite sur la session Stripe,
// juste avant le paiement (formulaire dans notre page, 28/11/2026). Le texte vient du serveur, jamais du navigateur.
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 2_000);
  const sessionId = String(body.session || "");
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) throw new HttpError(400, "Paiement introuvable.");
  if (!env.STRIPE_SECRET_KEY) throw new HttpError(503, "Le paiement n'est pas encore branché.");
  const { quiz } = await currentQuiz(request, env);
  const { recordWaiver } = await import("../../lib/stripe.js");
  await recordWaiver(env, { sessionId, quiz, text: WAIVER_TEXT });
  return json({ ok: true });
});
