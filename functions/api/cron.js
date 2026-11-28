import { json, handle, HttpError } from "../../lib/http.js";
import { db, now, parisDay, DAY } from "../../lib/db.js";
import { memberView } from "../../lib/members.js";
import { sendMail, reminderMail, nudgeMail, unsubLink } from "../../lib/mail.js";

const MAX_MAILS = 40; // reste sous la limite d'appels d'une fonction Cloudflare ; le reste part le lendemain

// POST, une fois par jour vers 8 h (heure de Paris), par le petit Worker de dev/cron-worker.js.
// En-tête « Authorization: Bearer <CRON_SECRET> ».
export const onRequestPost = handle(async ({ request, env }) => {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== "Bearer " + env.CRON_SECRET) throw new HttpError(401, "Non autorisé");
  const d = await db(env);
  const origin = new URL(request.url).origin;
  const t = now();
  const out = { notes_effacees: 0, quiz_effaces: 0, rappels: 0, relances: 0, erreurs: 0 };

  // 1. Nettoyage (politique biométrique) : notes sans achat après 30 jours, quiz sans e-mail après 90 jours
  out.notes_effacees = (await d.prepare("DELETE FROM scans WHERE delete_after < ?").bind(t).run()).meta.changes || 0;
  await d.prepare("DELETE FROM scan_extras WHERE quiz_id NOT IN (SELECT quiz_id FROM scans)").run(); // la forme du visage part avec les notes
  out.quiz_effaces = (await d.prepare("DELETE FROM quizzes WHERE created_at < ? AND id NOT IN (SELECT quiz_id FROM leads) AND id NOT IN (SELECT quiz_id FROM customers WHERE quiz_id IS NOT NULL)").bind(t - 90 * DAY).run()).meta.changes || 0;
  // Durées promises dans la politique de confidentialité : e-mail sans achat effacé 3 ans après le dernier contact,
  // compte client effacé 3 ans après la fin de son dernier abonnement
  const Y3 = 3 * 365 * DAY;
  out.emails_effaces = (await d.prepare(`DELETE FROM quizzes WHERE id IN (SELECT l.quiz_id FROM leads l WHERE MAX(l.created_at, COALESCE(l.last_nudge_at, 0)) < ?
    AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.email_key = l.email_key))`).bind(t - Y3).run()).meta.changes || 0;
  const oldCustomers = (await d.prepare(`SELECT c.id, c.quiz_id FROM customers c WHERE c.created_at < ? AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.customer_id = c.id
    AND (s.status IN ('active','past_due') OR MAX(s.current_period_end, COALESCE(s.ends_at, 0)) > ?))`).bind(t - Y3, t - Y3).all()).results;
  for (const c of oldCustomers) {
    await d.batch([d.prepare("DELETE FROM customers WHERE id = ?").bind(c.id), ...(c.quiz_id ? [d.prepare("DELETE FROM quizzes WHERE id = ?").bind(c.quiz_id)] : [])]);
  }
  out.comptes_effaces = oldCustomers.length;
  await d.prepare("DELETE FROM hits WHERE reset_at < ?").bind(t).run();
  await d.prepare("DELETE FROM login_codes WHERE expires_at < ?").bind(t).run();
  await d.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(t).run();

  let budget = MAX_MAILS;
  // 2. Rappel du jour : coupé par Maël le 28/11/2026 (pas de rappel). Le code reste en place, inactif : rouvert seulement avec REMINDERS_ENABLED=1.
  const today = parisDay(t);
  const members = env.REMINDERS_ENABLED !== "1" ? [] : (await d.prepare(`SELECT c.* FROM customers c WHERE c.reminder_optin = 1 AND c.unsubscribed_at IS NULL AND c.last_reminder_day <> ?
    AND EXISTS (SELECT 1 FROM subscriptions s WHERE s.customer_id = c.id AND s.status = 'active' AND s.current_period_end > ?) LIMIT ?`).bind(today, t, budget).all()).results;
  for (const c of members) {
    try {
      const v = await memberView(d, c);
      if (!v.plan) continue;
      await sendMail(env, { to: c.email, ...reminderMail({ day: v.plan.day, tasks: v.plan.tasks.map((x) => x.text), link: origin + "/app/", unsubscribe: await unsubLink(env, origin, "c:" + c.id) }) });
      await d.prepare("UPDATE customers SET last_reminder_day = ? WHERE id = ?").bind(today, c.id).run();
      out.rappels++; budget--;
    } catch (err) { out.erreurs++; console.error("Rappel", err.message); }
  }

  // 3. Relances : e-mail laissé, case marketing cochée, pas d'achat. À J+1 puis J+3, jamais plus.
  const leads = (await d.prepare(`SELECT l.* FROM leads l WHERE l.marketing_optin = 1 AND l.unsubscribed_at IS NULL AND l.nudges < 2
    AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.email_key = l.email_key)
    AND ((l.nudges = 0 AND l.created_at < ?) OR (l.nudges = 1 AND l.created_at < ?)) AND l.created_at > ? LIMIT ?`)
    .bind(t - DAY, t - 3 * DAY, t - 10 * DAY, Math.max(0, budget)).all()).results;
  for (const l of leads) {
    try {
      await sendMail(env, { to: l.email, ...nudgeMail(l.nudges + 1, { link: origin + "/q/?retour=relance", unsubscribe: await unsubLink(env, origin, "l:" + l.quiz_id) }) });
      await d.prepare("UPDATE leads SET nudges = nudges + 1, last_nudge_at = ? WHERE quiz_id = ?").bind(t, l.quiz_id).run();
      out.relances++;
    } catch (err) { out.erreurs++; console.error("Relance", err.message); }
  }
  console.log("cron", JSON.stringify(out));
  return json(out);
});
