// Espace membre : le rapport (S28) et le plan du jour (S29).
import { GROUPS } from "/shared/factors.js";
import { euros, OFFERS } from "/shared/plans.js";
import { initConsent, track, reopenConsent } from "/shared/consent.js";

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
  // pas encore d'analyse (photos refusées, ou analyse qui n'a pas marché avant le paiement) : on la propose ici
  if (!r) return `<div class="rescan">
      <h1 class="title" tabindex="-1">Ton analyse de visage t'attend.</h1>
      <p class="lead">2 selfies, une minute, et tu as ta note, ton max et tes 15 critères. Ton plan s'appuie déjà sur tes réponses.</p>
      <a class="btn btn--primary" href="/q/?analyse=1&g=${esc(me?.genre || "homme")}">Faire mon analyse</a>
    </div>`;
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
    ${r.weaknesses.map((f) => `<div class="factor"><span>${esc(f.label)}<small>${esc(f.phrase)}</small>${f.protocol ? `<button class="factor__proto" data-goplan>Ton protocole : ${esc(f.protocol)} →</button>` : ""}</span><b>${f.note}</b></div>`).join("")}
    ${r.faceShape ? faceShapeView(r.faceShape) : ""}
    ${groups}`;
}

// La forme du visage lue par l'analyse : un dessin de la forme, et les coupes qui vont / à éviter
const SHAPES = {
  ovale: '<ellipse cx="50" cy="65" rx="34" ry="50"/>',
  rond: '<ellipse cx="50" cy="65" rx="42" ry="46"/>',
  carre: '<path d="M14 24 Q14 14 24 14 H76 Q86 14 86 24 V96 Q86 116 64 116 H36 Q14 116 14 96 Z"/>',
  long: '<ellipse cx="50" cy="65" rx="28" ry="58"/>',
  coeur: '<path d="M10 30 Q10 12 30 12 H70 Q90 12 90 30 Q90 70 50 118 Q10 70 10 30 Z"/>',
  losange: '<path d="M50 8 Q72 30 90 60 Q72 96 50 120 Q28 96 10 60 Q28 30 50 8 Z"/>',
};
function faceShapeView(fs) {
  return `<h2 class="section-title">Ta forme de visage</h2>
    <div class="faceshape">
      <svg class="faceshape__art" viewBox="0 0 100 130" aria-hidden="true">${SHAPES[fs.id] || SHAPES.ovale}</svg>
      <div class="faceshape__txt"><b>${esc(fs.label)}</b><span>${esc(fs.why)}</span></div>
    </div>
    <div class="cuts"><div class="cuts__col cuts__col--yes"><b>Les coupes qui te vont</b><ul>${fs.yes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="cuts__col cuts__col--no"><b>À éviter</b><ul>${fs.no.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
    <p class="note">Montre cette liste à ton coiffeur, avec 3 photos de coupes sur des visages proches du tien.</p>`;
}

// Ses protocoles en entier : pourquoi, les 4 semaines (la semaine en cours en avant), les gestes du jour, l'astuce
function programsView(list, week) {
  if (!list?.length) return "";
  return `<h2 class="section-title">Mes programmes</h2>
    ${list.map((p, i) => `<details class="program"${i === 0 ? " open" : ""}><summary><span>${esc(p.title)}</span><small>Semaine ${week} sur 4</small></summary>
      <p class="program__why">${esc(p.why)}</p>
      ${p.daily.length ? `<b class="program__h">Tous les jours</b><ul>${p.daily.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <b class="program__h">Semaine par semaine</b>
      <ol class="program__weeks">${p.weeks.map((x, k) => `<li class="${k + 1 === week ? "now" : k + 1 < week ? "past" : ""}">${esc(x)}</li>`).join("")}</ol>
      ${p.tip ? `<p class="program__tip"><b>L'astuce :</b> ${esc(p.tip)}</p>` : ""}
    </details>`).join("")}`;
}

function planView(p) {
  if (!p) return `<div class="alert">Ton plan n'est pas encore prêt. Recharge la page dans un instant.</div>`;
  const done = p.tasks.filter((t) => t.done).length;
  return `
    <span class="eyebrow">Jour ${p.day} sur ${p.total}</span>
    <h1 class="title" tabindex="-1">${done === p.tasks.length ? "Journée faite." : "Aujourd'hui"}</h1>
    <p class="lead">${done} sur ${p.tasks.length} fait${done > 1 ? "s" : ""}. ${p.doneDays} jour${p.doneDays > 1 ? "s" : ""} suivi${p.doneDays > 1 ? "s" : ""} depuis le début.</p>
    <div class="stack">${p.tasks.map((t) => `<label class="task"><input type="checkbox" data-task="${esc(t.id)}" ${t.done ? "checked" : ""}><span><b>${esc(DOMAINS[t.domain] || t.domain || "")}</b>${esc(t.text)}</span></label>`).join("")}</div>
    ${programsView(me.protocols, p.week || 1)}`;
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
    <button data-delete>Supprimer mon compte et mes données</button>
    <a href="/cgv/">Conditions générales de vente</a><a href="/confidentialite/">Confidentialité</a><a href="/mentions-legales/">Mentions légales</a><button data-cookies>Cookies</button></div>`;
}

// Garantie « satisfait ou remboursé » : où il en est, et le bouton quand c'est gagné
function guaranteeView(g) {
  if (!g || !g.available) return g?.used ? `<div class="guarantee"><b>Garantie utilisée</b><span>Ta 1re semaine t'a été remboursée.</span></div>` : "";
  const day = (t) => new Date(t).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  if (g.eligible) return `<div class="guarantee guarantee--ok"><b>Satisfait ou remboursé</b><span>Tu as suivi ton plan ${g.done} jours sur 7 : tu peux te faire rembourser ta 1re semaine jusqu'au ${day(g.deadline)}. Ça arrête aussi ton abonnement.</span><button class="btn btn--secondary" data-guarantee>Me faire rembourser ma 1re semaine</button></div>`;
  return `<div class="guarantee"><b>Satisfait ou remboursé</b><span>${esc(g.reason)}</span><div class="progress" role="progressbar" aria-label="Jours suivis pendant ta 1re semaine payée" aria-valuemin="0" aria-valuemax="${g.needed}" aria-valuenow="${Math.min(g.done, g.needed)}"><span style="width:${Math.min(100, (g.done / g.needed) * 100)}%"></span></div></div>`;
}

// Juste après le paiement : le compte est créé avec l'e-mail donné au paiement (pas de mot de passe)
function welcome() {
  app.innerHTML = `<div class="brand">MOGX</div>
    <section class="welcome">
      <span class="welcome__ok" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
      <p class="eyebrow">Paiement validé</p>
      <h1 class="title" tabindex="-1">Ton compte est créé.</h1>
      <p class="lead">Il est attaché à <b>${esc(me.email)}</b>. Pas de mot de passe : pour revenir, tu entres cette adresse et on t'envoie un code.</p>
      <p class="note">On vient de t'envoyer un e-mail avec ton lien d'accès direct et le récapitulatif de ton abonnement.</p>
      ${me.report ? `<button class="btn btn--primary" data-welcome>Voir ma note</button>`
        : `<a class="btn btn--primary" href="/q/?analyse=1&g=${esc(me.genre || "homme")}">Faire mon analyse de visage</a><button class="btn btn--ghost" data-welcome>Voir mon plan d'abord</button>`}
    </section>`;
  app.querySelector("h1").focus();
}

// Après le paiement : la note se révèle (compteur + jauge), puis le détail
const fr = (n) => String(n).replace(".", ",");
function reveal(r) {
  app.innerHTML = `<div class="brand">MOGX</div>
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
  app.innerHTML = `<div class="brand">MOGX</div>
    <div class="tabs" role="tablist">
      <button role="tab" aria-selected="${tab === "plan"}" data-tab="plan">Mon plan</button>
      <button role="tab" aria-selected="${tab === "rapport"}" data-tab="rapport">Mon rapport</button>
    </div>
    <section class="stack" role="tabpanel">${tab === "plan" ? planView(me.plan) : reportView(me.report)}</section>
    ${guaranteeView(me.guarantee)}
    ${accountView(me)}`;
}

app.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.tab) { tab = b.dataset.tab; render(); return; }
  if (b.hasAttribute("data-cookies")) { reopenConsent(); return; }
  if (b.hasAttribute("data-goplan")) { tab = "plan"; render(); app.querySelector(".program")?.scrollIntoView({ block: "start" }); return; }
  if (b.hasAttribute("data-welcome")) { if (me.report) reveal(me.report); else render(); return; }
  if (b.hasAttribute("data-logout") || b.hasAttribute("data-logout-all")) { await api("logout", { partout: b.hasAttribute("data-logout-all") }).catch(() => {}); location.href = "/connexion/"; }
  if (b.hasAttribute("data-portal")) { try { location.href = (await api("portal", {})).url; } catch (err) { alert(err.message); } }
  if (b.hasAttribute("data-guarantee")) {
    if (!confirm("Te faire rembourser ta 1re semaine ? Ton abonnement s'arrête tout de suite.")) return;
    try { await api("guarantee", { confirme: true }); me = await api("me"); render(); alert("C'est fait : le remboursement part sur ta carte (quelques jours selon ta banque)."); } catch (err) { alert(err.message); }
  }
  if (b.hasAttribute("data-delete")) {
    if (!confirm("Supprimer ton compte ? Ton rapport, ton plan et ton suivi seront effacés pour de bon.")) return;
    try { await api("account-delete", { confirme: true }); location.href = "/"; } catch (err) { alert(err.message); }
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

// pixel Meta (seulement après accord) : le lien « Cookies » du compte permet de changer d'avis
const cfgReady = fetch("/api/config").then((r) => r.json()).then((c) => initConsent(c.pixel)).catch(() => {});
try {
  me = await api("me");
  if (new URLSearchParams(location.search).get("analyse") && me.report) { history.replaceState(null, "", "/app/"); reveal(me.report); }
  else if (new URLSearchParams(location.search).get("bienvenue")) {
    history.replaceState(null, "", "/app/");
    welcome();
    // pour les pubs Meta : l'achat, avec le vrai montant payé aujourd'hui (seulement si la personne a accepté les cookies)
    await cfgReady;
    const sub = me.subscription;
    if (sub) {
      const value = (sub.in_trial ? OFFERS[sub.offer]?.intro ?? 0 : sub.renew_cents) / 100;
      track("Purchase", { value, currency: "EUR" });
      if (sub.in_trial) track("StartTrial", { value, currency: "EUR" });
    }
  }
  else render();
} catch (err) {
  if (err.status === 401) location.href = "/connexion/";
  else app.innerHTML = `<div class="brand">MOGX</div><div class="alert" role="alert">${esc(err.message)}</div>`;
}
