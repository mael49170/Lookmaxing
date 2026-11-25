import { json, handle } from "../../lib/http.js";
import { now } from "../../lib/db.js";
import { currentQuiz } from "../../lib/identity.js";
import { reservation, deviceId, newDeviceId, deviceCookie } from "../../lib/offer.js";
import { OFFERS, DEFAULT_OFFER } from "../../src/shared/plans.js";

// GET -> l'offre de CE visiteur : essai à 0,99 € encore réservé (et jusqu'à quand), ou prix normal.
// Le premier appel démarre la réservation de 15 minutes (à l'arrivée sur la page de paiement).
export const onRequestGet = handle(async ({ request, env }) => {
  const { d, quiz } = await currentQuiz(request, env);
  // l'e-mail n'est demandé qu'au paiement (décidé par Maël le 25/11/2026) : la réservation tient au téléphone
  const lead = await d.prepare("SELECT email_key FROM leads WHERE quiz_id = ?").bind(quiz.id).first();
  let device = deviceId(request);
  const headers = {};
  if (!device) { device = newDeviceId(); headers["set-cookie"] = deviceCookie(device, request); }
  const r = await reservation(d, { emailKey: lead?.email_key, device });
  return json({ ...r, now: now(), offer: DEFAULT_OFFER, details: OFFERS[DEFAULT_OFFER] }, 200, headers);
});
