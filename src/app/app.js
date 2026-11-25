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
    <h1 class="title" tabindex="-1">Ton détail, critère par critère.</h1>
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
  const day = (t) => new Date(t).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  const week = s ? euros(s.renew_cents) + " par semaine" : "";
  const status = !s ? "Pas d'abonnement."
    : s.status === "past_due" ? "Le dernier paiement n'est pas passé : mets ta carte à jour."
    : s.cancel_at_period_end && s.charge_pending ? `Résilié. Ta semaine d'engagement (${euros(s.renew_cents)}) sera prélevée le ${day(s.current_period_end)}, puis plus rien. Accès jusqu'au ${day(s.ends_at)}.`
    : s.cancel_at_period_end ? `Résilié : plus aucun prélèvement. Accès jusqu'au ${day(s.ends_at || s.current_period_end)}.`
    : s.in_trial ? `Essai en cours jusqu'au ${day(s.trial_end)}. Ensuite ${week}, avec une 1re semaine d'engagement.`
    : s.status === "active" ? `Abonnement actif : ${week}, prochain prélèvement le ${day(s.current_period_end)}.` : "Paiement en attente.";
  return `<div class="account"><span>${esc(m.email)}</span><span>${esc(status)}</span>
    ${s && !s.cancel_at_period_end ? '<button data-cancel>Résilier mon abonnement</button>' : ""}
    ${s && m.hasCard ? '<button data-portal>Ma carte et mes factures</button>' : ""}
    <button data-logout>Me déconnecter</button>
    <button data-logout-all>Me déconnecter de tous mes appareils</button>
    <button data-delete>Supprimer mon compte et mes données</button></div>`;
}

// Après le paiement : la note se révèle (compteur + jauge), puis le détail
const fr = (n) => String(n).replace(".", ",");
function reveal(r) {
  app.innerHTML = `<div class="brand">Lookmaxing</div>
    <section class="reveal" aria-live="polite">
      <p class="eyebrow">Ta note</p>
      <div class="reveal__num" id="num">0,0</div>
      <div class="gauge" role="img" aria-label="${r.nowRaw} sur 100"><i id="mark" style="left:0%"></i></div>
      <p class="reveal__max" id="max">Ton max : ${esc(fr(r.max))}, soit +${esc(fr((Number(r.max) - Number(r.now)).toFixed(1)))} à aller chercher.</p>
      <button class="btn btn--primary" data-tab="rapport">Voir mon détail</button>
    </section>`;
  const target = Number(r.now), t0 = performance.now(), ms = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 1600;
  requestAnimationFrame(() => { document.getElementById("mark").style.left = r.nowRaw + "%"; });
  const step = (t) => {
    const p = Math.min(1, (t - t0) / ms), v = target * (1 - Math.pow(1 - p, 3));
    document.getElementById("num").textContent = fr(v.toFixed(1));
    if (p < 1) requestAnimationFrame(step); else document.getElementById("max").classList.add("on");
  };
  requestAnimationFrame(step);
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
  if (b.hasAttribute("data-logout") || b.hasAttribute("data-logout-all")) { await api("logout", { partout: b.hasAttribute("data-logout-all") }).catch(() => {}); location.href = "/connexion/"; }
  if (b.hasAttribute("data-portal")) { try { location.href = (await api("portal", {})).url; } catch (err) { alert(err.message); } }
  if (b.hasAttribute("data-delete")) {
    if (!confirm("Supprimer ton compte ? Ton rapport, ton plan et ton suivi seront effacés pour de bon.")) return;
    try { await api("account-delete", { confirme: true }); location.href = "/q/"; } catch (err) { alert(err.message); }
  }
  if (b.hasAttribute("data-cancel")) {
    const s = me.subscription;
    const msg = s?.in_trial ? `Résilier ? Ta semaine d'engagement (${euros(s.renew_cents)}) sera prélevée à la fin de l'essai, puis plus rien. Tu gardes l'accès jusqu'au bout.` : "Résilier ? Tu gardes l'accès jusqu'à la fin de la semaine payée, et rien ne sera plus prélevé.";
    if (!confirm(msg)) return;
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
  if (new URLSearchParams(location.search).get("bienvenue") && me.report) { history.replaceState(null, "", "/app/"); reveal(me.report); }
  else render();
} catch (err) {
  if (err.status === 401) location.href = "/connexion/";
  else app.innerHTML = `<div class="brand">Lookmaxing</div><div class="alert" role="alert">${esc(err.message)}</div>`;
}
