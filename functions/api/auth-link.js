import { handle } from "../../lib/http.js";
import { db, sha256, now } from "../../lib/db.js";
import { createSession, sessionCookie } from "../../lib/identity.js";

// GET ?t=jeton -> connexion par le lien de l'e-mail, puis l'espace membre
export const onRequestGet = handle(async ({ request, env }) => {
  const t = String(new URL(request.url).searchParams.get("t") || "");
  const go = (to, cookie) => new Response(null, { status: 302, headers: { location: to, ...(cookie ? { "set-cookie": cookie } : {}) } });
  const d = await db(env);
  if (!d || !t) return go("/connexion/?lien=expire");
  const row = await d.prepare("SELECT * FROM login_codes WHERE link_hash = ?").bind(await sha256(t)).first();
  if (!row || row.expires_at < now()) return go("/connexion/?lien=expire");
  const customer = await d.prepare("SELECT id FROM customers WHERE email_key = ?").bind(row.email_key).first();
  if (!customer) return go("/connexion/?lien=expire");
  await d.prepare("DELETE FROM login_codes WHERE email_key = ?").bind(row.email_key).run();
  return go("/app/", sessionCookie(await createSession(d, customer.id), request));
});
