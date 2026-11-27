import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { db, hit } from "../../lib/db.js";
import { emailKey, ipHash } from "../../lib/identity.js";
import { sendCode } from "../../lib/auth.js";

// POST { email } -> envoie un code et un lien de connexion (seulement aux clients ; même réponse sinon, pour ne rien révéler)
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 2_000);
  const key = emailKey(body.email);
  if (!key) throw new HttpError(400, "Cette adresse ne semble pas complète.");
  const d = await db(env);
  if (!d) throw new HttpError(503, "Base de données non branchée");
  if (!(await hit(d, "login-ip:" + (await ipHash(request, env)), 20, 3600e3)) || !(await hit(d, "login-mail:" + key, 5, 3600e3))) {
    throw new HttpError(429, "Trop de demandes. Patiente quelques minutes.");
  }
  const customer = await d.prepare("SELECT email FROM customers WHERE email_key = ?").bind(key).first();
  if (!customer) return json({ ok: true });
  const r = await sendCode(d, env, request, { email: customer.email, key });
  return json({ ok: true, ...(r.devCode ? { devCode: r.devCode } : {}) });
});
