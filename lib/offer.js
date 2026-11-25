// Réservation de l'essai à 0,99 € : VRAIMENT 15 minutes, une seule fois par adresse e-mail et par téléphone.
// Le minuteur affiché est donc vrai : à zéro, l'essai disparaît pour de bon (on ne le redonne pas en recommençant le quiz).
import { now, randomId } from "./db.js";
import { readCookie } from "./identity.js";
import { RESERVATION_MIN } from "../src/shared/plans.js";

export const DEVICE_COOKIE = "lm_d";
export function deviceId(request) {
  const v = readCookie(request, DEVICE_COOKIE);
  return /^[\w-]{16,64}$/.test(v) ? v : "";
}
export function deviceCookie(id, request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${DEVICE_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${365 * 86400}${secure}`;
}
export const newDeviceId = () => randomId(18);

// Démarre la réservation si elle n'existe pas encore (la première date gagne), puis renvoie l'état.
export async function reservation(d, { emailKey, device }) {
  const t = now();
  const keys = [emailKey && "e:" + emailKey, device && "d:" + device].filter(Boolean);
  for (const k of keys) {
    await d.prepare("INSERT INTO offer_claims (key, expires_at, created_at) VALUES (?, ?, ?) ON CONFLICT(key) DO NOTHING").bind(k, t + RESERVATION_MIN * 60e3, t).run();
  }
  if (!keys.length) return { trial: false, expires_at: 0 };
  const rows = (await d.prepare(`SELECT expires_at FROM offer_claims WHERE key IN (${keys.map(() => "?").join(",")})`).bind(...keys).all()).results;
  const expires = Math.min(...rows.map((r) => r.expires_at));
  return { trial: t < expires, expires_at: expires };
}
