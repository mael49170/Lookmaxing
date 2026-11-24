// Connexion sans mot de passe : un code à 6 chiffres et un lien, valables 15 minutes.
import { HttpError } from "./http.js";
import { sha256, randomId, now } from "./db.js";
import { sendMail, loginMail } from "./mail.js";

export async function sendCode(d, env, request, { email, key }) {
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  const linkToken = randomId(24);
  await d.prepare(`INSERT INTO login_codes (email_key, code_hash, link_hash, expires_at, attempts, ip) VALUES (?, ?, ?, ?, 0, '')
    ON CONFLICT(email_key) DO UPDATE SET code_hash = excluded.code_hash, link_hash = excluded.link_hash, expires_at = excluded.expires_at, attempts = 0`)
    .bind(key, await sha256(key + ":" + code), await sha256(linkToken), now() + 15 * 60e3).run();
  const link = `${new URL(request.url).origin}/api/auth-link?t=${linkToken}`; // pas d'adresse e-mail dans le lien
  const { sent } = await sendMail(env, { to: email, ...loginMail(code, link) });
  if (!sent && env.DEV_SHOW_CODE !== "1") throw new HttpError(503, "L'envoi des e-mails n'est pas encore branché. Réessaie plus tard.");
  return { sent, devCode: !sent ? code : undefined };
}
