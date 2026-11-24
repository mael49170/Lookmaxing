import { handle } from "../../lib/http.js";
import { db, now } from "../../lib/db.js";
import { unsubToken } from "../../lib/mail.js";

const page = (msg) => new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Désinscription</title><body style="font-family:system-ui,sans-serif;max-width:480px;margin:48px auto;padding:0 16px"><p>${msg}</p><p><a href="/">Retour</a></p></body></html>`, { headers: { "content-type": "text/html; charset=utf-8" } });

async function unsub(request, env) {
  const url = new URL(request.url);
  const ref = String(url.searchParams.get("r") || "");
  const t = String(url.searchParams.get("t") || "");
  const d = await db(env);
  if (!d || !/^[cl]:[\w-]{8,64}$/.test(ref) || t !== await unsubToken(env, ref)) return page("Ce lien ne marche plus.");
  const [kind, id] = ref.split(":");
  if (kind === "c") await d.prepare("UPDATE customers SET reminder_optin = 0, unsubscribed_at = ? WHERE id = ?").bind(now(), id).run();
  else await d.prepare("UPDATE leads SET marketing_optin = 0, unsubscribed_at = ? WHERE quiz_id = ?").bind(now(), id).run();
  return page("C'est fait : tu ne recevras plus ces e-mails.");
}
// GET : clic dans l'e-mail. POST : désinscription en un clic depuis la messagerie (List-Unsubscribe-Post).
export const onRequestGet = handle(({ request, env }) => unsub(request, env));
export const onRequestPost = handle(({ request, env }) => unsub(request, env));
