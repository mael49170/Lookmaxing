import { json, readJson, handle } from "../../lib/http.js";
import { sha256 } from "../../lib/db.js";
import { currentCustomer, clearSession } from "../../lib/identity.js";

// POST { partout } -> ferme cette session (ou toutes, sur tous les appareils)
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 500).catch(() => ({}));
  const { d, customer, token } = await currentCustomer(request, env, { required: false });
  if (customer) {
    if (body.partout) await d.prepare("DELETE FROM sessions WHERE customer_id = ?").bind(customer.id).run();
    else await d.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  }
  return json({ ok: true }, 200, { "set-cookie": clearSession() });
});
