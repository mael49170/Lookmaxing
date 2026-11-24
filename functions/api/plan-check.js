import { json, readJson, handle, HttpError } from "../../lib/http.js";
import { now, parisDay, daysBetween } from "../../lib/db.js";
import { currentCustomer } from "../../lib/identity.js";
import { PLAN_DAYS } from "../../lib/plan.js";

// POST { task_id, done } -> coche ou décoche une tâche du jour (jour de Paris)
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, 1_000);
  const { d, customer } = await currentCustomer(request, env);
  const plan = await d.prepare("SELECT days, start_day FROM plans WHERE customer_id = ?").bind(customer.id).first();
  if (!plan) throw new HttpError(404, "Plan introuvable.");
  const today = parisDay();
  const index = Math.max(0, Math.min(PLAN_DAYS - 1, daysBetween(plan.start_day, today)));
  const id = String(body.task_id || "");
  if (!JSON.parse(plan.days)[index].tasks.includes(id)) throw new HttpError(400, "Cette tâche n'est pas au programme aujourd'hui.");
  if (body.done === false) await d.prepare("DELETE FROM task_checks WHERE customer_id = ? AND day = ? AND task_id = ?").bind(customer.id, today, id).run();
  else await d.prepare("INSERT INTO task_checks (customer_id, day, task_id, done_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING").bind(customer.id, today, id, now()).run();
  return json({ ok: true });
});
