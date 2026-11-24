import { json, handle } from "../../lib/http.js";
import { currentCustomer } from "../../lib/identity.js";
import { memberView } from "../../lib/members.js";

// GET -> tout ce que l'espace membre affiche (rapport, plan du jour, abonnement)
export const onRequestGet = handle(async ({ request, env }) => {
  const { d, customer } = await currentCustomer(request, env);
  return json(await memberView(d, customer));
});
