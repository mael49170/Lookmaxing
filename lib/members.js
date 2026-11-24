// Création du membre après paiement, et lecture de son espace.
import { now, uuid, parisDay, daysBetween } from "./db.js";
import { buildPlan, taskText, taskDomain, PLAN_DAYS } from "./plan.js";
import { FACTORS, outOf10 } from "../src/shared/factors.js";
import { OFFERS } from "../src/shared/plans.js";

// Crée (ou retrouve) le client lié à un quiz payé, son abonnement et son plan. Idempotent.
export async function createMember(d, { quiz, email, emailKey, stripeCustomer = "", subscription }) {
  let customer = await d.prepare("SELECT * FROM customers WHERE email_key = ?").bind(emailKey).first();
  const t = now();
  let created = false;
  if (!customer) {
    created = true;
    customer = { id: uuid(), email, email_key: emailKey, quiz_id: quiz?.id || null, stripe_customer: stripeCustomer, reminder_optin: 0 };
    const answers = quiz ? JSON.parse(quiz.answers || "{}") : {};
    customer.reminder_optin = answers.rappel === true ? 1 : 0;
    // le retour du paiement et le webhook de Stripe arrivent parfois en même temps : un seul crée le client
    const ins = await d.prepare("INSERT INTO customers (id, email, email_key, quiz_id, stripe_customer, reminder_optin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email_key) DO NOTHING")
      .bind(customer.id, email, emailKey, customer.quiz_id, stripeCustomer, customer.reminder_optin, t, t).run();
    if (!ins.meta?.changes) { created = false; customer = await d.prepare("SELECT * FROM customers WHERE email_key = ?").bind(emailKey).first(); }
  } else if (quiz && customer.quiz_id !== quiz.id) {
    await d.prepare("UPDATE customers SET quiz_id = ?, stripe_customer = CASE WHEN ? <> '' THEN ? ELSE stripe_customer END, updated_at = ? WHERE id = ?")
      .bind(quiz.id, stripeCustomer, stripeCustomer, t, customer.id).run();
    customer.quiz_id = quiz.id;
  }
  if (subscription) {
    const s = subscription;
    await d.prepare(`INSERT INTO subscriptions (id, customer_id, kind, offer, intro_cents, renew_cents, currency, interval, status, cancel_at_period_end, current_period_end, withdrawal_waived_at, created_at, updated_at)
      VALUES (?, ?, 'membre', ?, ?, ?, 'eur', ?, ?, 0, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET status = excluded.status, current_period_end = excluded.current_period_end, updated_at = excluded.updated_at`)
      .bind(s.id, customer.id, s.offer, s.intro_cents, s.renew_cents, s.interval, s.status, s.current_period_end, s.withdrawal_waived_at || null, t, t).run();
  }
  const hasPlan = await d.prepare("SELECT 1 FROM plans WHERE customer_id = ?").bind(customer.id).first();
  if (!hasPlan) {
    const answers = quiz ? JSON.parse(quiz.answers || "{}") : {};
    const scan = quiz ? await d.prepare("SELECT factors FROM scans WHERE quiz_id = ?").bind(quiz.id).first() : null;
    const plan = buildPlan(answers, scan ? JSON.parse(scan.factors) : null);
    await d.prepare("INSERT INTO plans (customer_id, library_version, days, start_day, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(customer.id, plan.library_version, JSON.stringify(plan.days), parisDay(), t, t).run();
  }
  // le scan d'un client n'est plus effacé au bout de 30 jours : il le garde tant qu'il a un compte
  if (quiz) await d.prepare("UPDATE scans SET delete_after = ? WHERE quiz_id = ?").bind(Number.MAX_SAFE_INTEGER, quiz.id).run();
  return Object.assign(customer, { _created: created });
}

export function offerSnapshot(key) {
  const o = OFFERS[key];
  return o ? { offer: key, intro_cents: o.intro, renew_cents: o.renew, interval: o.count === 3 ? "quarter" : "month" } : null;
}

// Tout ce que l'espace membre affiche
export async function memberView(d, customer) {
  const quiz = customer.quiz_id ? await d.prepare("SELECT answers, bet FROM quizzes WHERE id = ?").bind(customer.quiz_id).first() : null;
  const scan = customer.quiz_id ? await d.prepare("SELECT score_now, score_max, factors FROM scans WHERE quiz_id = ?").bind(customer.quiz_id).first() : null;
  const sub = await d.prepare("SELECT * FROM subscriptions WHERE customer_id = ? AND kind = 'membre' ORDER BY created_at DESC LIMIT 1").bind(customer.id).first();
  const planRow = await d.prepare("SELECT * FROM plans WHERE customer_id = ?").bind(customer.id).first();
  const today = parisDay();
  let plan = null;
  if (planRow) {
    const days = JSON.parse(planRow.days);
    const index = Math.max(0, Math.min(PLAN_DAYS - 1, daysBetween(planRow.start_day, today)));
    const checks = (await d.prepare("SELECT task_id FROM task_checks WHERE customer_id = ? AND day = ?").bind(customer.id, today).all()).results.map((r) => r.task_id);
    const doneDays = (await d.prepare("SELECT COUNT(DISTINCT day) AS n FROM task_checks WHERE customer_id = ?").bind(customer.id).first())?.n || 0;
    plan = {
      day: index + 1, total: PLAN_DAYS, date: today, doneDays,
      tasks: days[index].tasks.map((id) => ({ id, text: taskText(id), domain: taskDomain(id), done: checks.includes(id) })),
    };
  }
  let report = null;
  if (scan) {
    const factors = JSON.parse(scan.factors).map((f) => ({ ...f, label: FACTORS.find((x) => x.id === f.id)?.label || f.id, group: FACTORS.find((x) => x.id === f.id)?.group }));
    const sorted = [...factors].sort((a, b) => b.note - a.note);
    report = { now: outOf10(scan.score_now), max: outOf10(scan.score_max), nowRaw: scan.score_now, maxRaw: scan.score_max, factors, strengths: sorted.slice(0, 3), weaknesses: sorted.slice(-3).reverse(), bet: quiz?.bet || null, verdict: quiz?.bet ? betVerdict(quiz.bet, scan.score_now) : null };
  }
  return {
    email: customer.email,
    hasCard: Boolean(customer.stripe_customer),
    subscription: sub ? { offer: sub.offer, status: sub.status, renew_cents: sub.renew_cents, interval: sub.interval, current_period_end: sub.current_period_end, cancel_at_period_end: Boolean(sub.cancel_at_period_end) } : null,
    report, plan,
  };
}

// Le pronostic du S12 comparé à la note réelle
export function betVerdict(bet, scoreNow) {
  const ranges = { a_travailler: [0, 45], moyen: [45, 55], correct: [55, 63], beau: [63, 72], canon: [72, 101] };
  const r = ranges[bet];
  if (!r) return null;
  if (scoreNow >= r[0] && scoreNow < r[1]) return "juste";
  return scoreNow >= r[1] ? "mieux" : "moins";
}
