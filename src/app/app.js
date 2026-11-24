// Espace membre : le rapport (S28) et le plan du jour (S29).
import { GROUPS } from "/shared/factors.js";
import { euros } from "/shared/plans.js";

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const DOMAINS = { peau: "Peau", cheveux: "Cheveux", corps: "Corps", style: "Style", presence: "Présence" };
const BETS = { a_travailler: "Il y a du boulot", moyen: "Dans la moyenne", correct: "Correct", beau: "Plutôt beau", canon: "Canon" };
let me = null;
let tab = new URLSearchParams(location.search).get("bienvenue") ? "rapport" : "plan";

async function api(path, body) {
  const res = await fetch("/api/" + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Erreur"), { status: res.status });
  return data;
}

function reportView(r) {
  if (!r) return `<div class="alert">Pas de scan pour ce compte : ton plan a été fait d'après tes réponses.</div>`;
  const verdict = { juste: "Tu avais vu juste.", mieux: "Tu t'es sous-estimé.", moins: "Tu étais un peu optimiste. Ton plan est là pour ça." }[r.verdict];
  const groups = Object.entries(GROUPS).map(([g, label]) => `<h2 class="section-title">${esc(label)}</h2>
    ${r.factors.filter((f) => f.group === g).map((f) => `<div class="factor"><span>${esc(f.label)}<small>${esc(f.phrase)}</small></span><b>${f.note}</b></div>`).join("")}`).join("");
  return `
    <h1 class="title" tabindex="-1">Ton résultat</h1>
    <div class="scores">
      <div class="score"><div class="score__label">Aujourd'hui</div><div class="score__value">${esc(r.now)}</div></div>
      <div class="score"><div class="score__label">Ton max</div><div class="score__value score__value--high">${esc(r.max)}</div></div>
    </div>
    <div class="gauge" role="img" aria-label="${r.nowRaw} sur 100"><i style="left:${r.nowRaw}%"></i></div>
    ${r.bet ? `<div class="verdict"><b>Ton pronostic : ${esc(BETS[r.bet])}.</b> ${esc(verdict || "")}</div>` : ""}
    <p class="lead">Une note est l'avis d'un logiciel sur 2 photos, avec une lumière et un angle. Elle ne mesure pas ta valeur. Une autre photo donne une autre note.</p>
    <h2 class="section-title">Tes points forts</h2>
    ${r.strengths.map((f) => `<div class="factor"><span>${esc(f.label)}</span><b>${f.note}</b></div>`).join("")}
    <h2 class="section-title">Ce qui se travaille en premier</h2>
    ${r.weaknesses.map((f) => `<div class="factor"><span>${esc(f.label)}<small>${esc(f.phrase)}</small></span><b>${f.note}</b></div>`).join("")}
    ${groups}`;
}

function planView(p) {
  if (!p) return `<div class="alert">Ton plan n'est pas encore prêt. Recharge la page dans un instant.</div>`;
  const done = p.tasks.filter((t) => t.done).length;
  return `
    <span class="eyebrow">Jour ${p.day} sur ${p.total}</span>
    <h1 class="title" tabindex="-1">${done === p.tasks.length ? "Journée faite." : "Aujourd'hui"}</h1>
    <p class="lead">${done} sur ${p.tasks.length} fait${done > 1 ? "s" : ""}. ${p.doneDays} jour${p.doneDays > 1 ? "s" : ""} suivi${p.doneDays > 1 ? "s" : ""} depuis le début.</p>
    <div class="stack">${p.tasks.map((t) => `<label class="task"><input type="checkbox" data-task="${esc(t.id)}" ${t.done ? "checked" : ""}><span><b>${esc(DOMAINS[t.domain] || "")}</b> · ${esc(t.text)}</span></label>`).join("")}</div>`;
}

function accountView(m) {
  const s = m.subscription;
  const status = !s ? "Pas d'abonnement." : s.cancel_at_period_end ? `Résilié : accès jusqu'au ${new Date(s.current_period_end).toLocaleDateString("fr-FR")}.`
    : s.status === "active" ? `Abonnement actif : ${euros(s.renew_cents)} ${s.interval === "quarter" ? "tous les 3 mois" : "par mois"}, prochain prélèvement le ${new Date(s.current_period_end).toLocaleDateString("fr-FR")}.` : "Paiement en attente.";
  return `<div class="account"><span>${esc(m.email)}</span><span>${esc(status)}</span>
    ${s && !s.cancel_at_period_end ? '<button data-cancel>Résilier mon abonnement</button>' : ""}
    <button data-logout>Me déconnecter</button></div>`;
}

function render() {
  app.innerHTML = `<div class="brand">Lookmaxing</div>
    <div class="tabs" role="tablist">
      <button role="tab" aria-selected="${tab === "plan"}" data-tab="plan">Mon plan</button>
      <button role="tab" aria-selected="${tab === "rapport"}" data-tab="rapport">Mon rapport</button>
    </div>
    <section class="stack" role="tabpanel">${tab === "plan" ? planView(me.plan) : reportView(me.report)}</section>
    ${accountView(me)}`;
}

app.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.tab) { tab = b.dataset.tab; render(); return; }
  if (b.hasAttribute("data-logout")) { await api("logout", {}).catch(() => {}); location.href = "/connexion/"; }
  if (b.hasAttribute("data-cancel")) {
    if (!confirm("Résilier ? Tu gardes l'accès jusqu'à la fin de la période payée, et rien ne sera plus prélevé.")) return;
    try { await api("subscription-cancel", {}); me = await api("me"); render(); } catch (err) { alert(err.message); }
  }
});
app.addEventListener("change", async (e) => {
  const id = e.target.dataset.task;
  if (!id) return;
  const t = me.plan.tasks.find((x) => x.id === id);
  t.done = e.target.checked;
  try { await api("plan-check", { task_id: id, done: t.done }); me = await api("me"); } catch { t.done = !t.done; e.target.checked = t.done; }
  render();
});

try {
  me = await api("me");
  render();
} catch (err) {
  if (err.status === 401) location.href = "/connexion/";
  else app.innerHTML = `<div class="brand">Lookmaxing</div><div class="alert" role="alert">${esc(err.message)}</div>`;
}
