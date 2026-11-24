import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { db, sha256, now } from "../../lib/db.js";
import { emailKey, createSession, sessionCookie } from "../../lib/identity.js";

// POST { email, code } -> ouvre la session (5 essais au plus par code)
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 2_000);
  const key = emailKey(body.email);
  const code = String(body.code || "").replace(/\D/g, "");
  if (!key || code.length !== 6) throw new HttpError(400, "Entre le code à 6 chiffres reçu par e-mail.");
  const d = await db(env);
  if (!d) throw new HttpError(503, "Base de données non branchée");
  const row = await d.prepare("SELECT * FROM login_codes WHERE email_key = ?").bind(key).first();
  if (!row || row.expires_at < now()) throw new HttpError(400, "Ce code a expiré. Demandes-en un nouveau.");
  if (row.attempts >= 5) throw new HttpError(429, "Trop d'essais. Demande un nouveau code.");
  if (row.code_hash !== await sha256(key + ":" + code)) {
    await d.prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE email_key = ?").bind(key).run();
    throw new HttpError(400, "Code incorrect.");
  }
  const customer = await d.prepare("SELECT id FROM customers WHERE email_key = ?").bind(key).first();
  if (!customer) throw new HttpError(404, "Aucun compte avec cette adresse.");
  await d.prepare("DELETE FROM login_codes WHERE email_key = ?").bind(key).run();
  const token = await createSession(d, customer.id);
  return json({ ok: true }, 200, { "set-cookie": sessionCookie(token, request) });
});
