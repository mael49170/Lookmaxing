// Garantie « satisfait ou remboursé », avec conditions (décidée par Maël le 25/11/2026) et vérifiée par le site :
// la 1re semaine payée (16,99 €) est remboursée si la personne a coché son plan au moins 5 jours sur les 7 de cette
// semaine, et qu'elle le demande dans les 14 jours après le prélèvement. Une seule fois. Le remboursement arrête l'abonnement.
import { now, parisDay, DAY } from "./db.js";
import { GUARANTEE, WEEK_MS } from "../src/shared/plans.js";

export async function guaranteeStatus(d, customer, sub, t = now()) {
  if (!sub) return { available: false, reason: "Pas d'abonnement." };
  if (sub.guarantee_used_at) return { available: false, used: true, reason: "Garantie déjà utilisée." };
  const start = sub.trial_end || sub.created_at; // début de la 1re semaine payée
  const deadline = start + GUARANTEE.requestWithinDays * DAY;
  const days = [];
  for (let i = 0; i < GUARANTEE.ofDays; i++) days.push(parisDay(start + i * DAY));
  const rows = (await d.prepare(`SELECT COUNT(DISTINCT day) AS n FROM task_checks WHERE customer_id = ? AND day IN (${days.map(() => "?").join(",")})`).bind(customer.id, ...days).all()).results;
  const done = rows[0]?.n || 0;
  const base = { available: true, start, end: start + WEEK_MS, deadline, done, needed: GUARANTEE.minDays };
  if (t < start) return { ...base, eligible: false, reason: "Ta 1re semaine payée n'a pas encore commencé." };
  if (t > deadline) return { ...base, eligible: false, reason: "Le délai de demande est passé." };
  if (done < GUARANTEE.minDays) return { ...base, eligible: false, reason: `Coche ton plan au moins ${GUARANTEE.minDays} jours sur les ${GUARANTEE.ofDays} de ta 1re semaine payée (${done} pour l'instant).` };
  return { ...base, eligible: true };
}
