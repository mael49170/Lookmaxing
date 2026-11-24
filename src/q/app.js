// Le quiz : un écran à la fois, décrit dans /shared/questions.js.
import { SCREENS, S11_TEXT } from "/shared/questions.js";
import { OFFERS, DEFAULT_OFFER, euros, renewText, perDay } from "/shared/plans.js";

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ICON_BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const ICON_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

// ---------- État (gardé dans l'onglet pour survivre à un rechargement) ----------
const KEY = "lm_quiz_v1";
let S = load() || fresh();
function fresh() {
  const p = new URLSearchParams(location.search);
  return {
    i: 0, history: [], answers: {}, consent: null, scan: "idle", scanError: "", lead: false,
    variant: p.get("v") === "a" || p.get("v") === "b" ? p.get("v") : Math.random() < 0.5 ? "a" : "b",
    utm: { source: p.get("utm_source") || "", campaign: p.get("utm_campaign") || "", content: p.get("utm_content") || "" },
    offers: null, offer: DEFAULT_OFFER,
  };
}
function load() { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; } }
function save() { try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch { /* navigation privée : tant pis */ } }

// ---------- Serveur ----------
async function api(path, body, { method = "POST" } = {}) {
  const res = await fetch("/api/" + path, { method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined, credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Une erreur est survenue. Réessaie."), { status: res.status });
  return data;
}
const syncQuiz = () => api("quiz", { answers: S.answers, variant: S.variant, utm: S.utm }).catch(() => {});
const trackStep = (step) => api("track", { step, variant: S.variant, source: S.utm.source }).catch(() => {});

// ---------- Navigation ----------
const visible = (s) => !(s.skipIf && s.skipIf({ consent: S.consent }));
function go(index, { push = true } = {}) {
  if (push) S.history.push(S.i);
  S.i = index;
  while (S.i < SCREENS.length - 1 && !visible(SCREENS[S.i])) S.i++;
  save(); render();
}
const next = () => go(S.i + 1);
const goTo = (id) => go(SCREENS.findIndex((s) => s.id === id));
function back() {
  if (!S.history.length) return;
  S.i = S.history.pop();
  save(); render({ back: true });
}
window.addEventListener("popstate", () => back());

// Progression : seulement sur les écrans de questions
const qIndexes = SCREENS.map((s, i) => [s, i]).filter(([s]) => ["single", "multi", "hero_message", "recap"].includes(s.type)).map(([, i]) => i);
const progress = () => Math.round((Math.max(0, qIndexes.filter((i) => i <= S.i).length) / qIndexes.length) * 100);

function topbar(withProgress = true) {
  return `<div class="topbar">${S.history.length ? `<button class="topbar__back" data-back aria-label="Retour">${ICON_BACK}</button>` : '<span style="width:48px"></span>'}
    ${withProgress ? `<div class="progress" role="progressbar" aria-label="Avancement" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress()}"><span style="width:${progress()}%"></span></div>` : '<div class="brand" style="flex:1">Lookmaxing</div><span style="width:48px"></span>'}</div>`;
}
const footer = (html) => `<div class="screen__footer"><div class="stack">${html}</div></div>`;

// ---------- Écrans ----------
const VIEWS = {
  landing() {
    // Variante B : on passe directement à la première question, avec le titre de l'accueil
    if (S.variant === "b") return VIEWS.single(SCREENS[1], { title: "Ta vraie note de visage, et comment la monter", lead: "Commence par nous dire qui tu es." });
    return `<main class="screen">
      <div class="brand">Lookmaxing</div>
      <div class="sample-card" aria-label="Exemple de résultat">
        <span class="sample">Exemple</span>
        <div class="scores">
          <div class="score"><div class="score__label">Aujourd'hui</div><div class="score__value">6.4</div></div>
          <div class="score"><div class="score__label">Après 12 semaines</div><div class="score__value score__value--high">7.6</div></div>
        </div>
        <div class="gauge" role="img" aria-label="Exemple : de 64 à 76 sur 100"><i style="left:64%"></i></div>
        <div class="chips"><span class="chip">Peau <b>+9</b></span><span class="chip">Coupe <b>+12</b></span><span class="chip">Posture <b>+8</b></span><span class="chip">Tenue <b>+10</b></span></div>
      </div>
      <h1 class="title" tabindex="-1">Ta note de visage. <em>Et le plan pour la monter.</em></h1>
      <p class="lead">Découvre ce qui te tire vers le bas, et ce que tu peux changer dès cette semaine.</p>
      ${footer(`<button class="btn btn--primary" data-next>Commencer</button><div class="points"><span>3 minutes</span><span>Photos jamais enregistrées</span><span>Dès 18 ans</span></div>`)}
    </main>`;
  },

  single(s, override = {}) {
    const val = S.answers[s.id];
    return `<main class="screen">
      ${s.id === "genre" || s.id === "age" ? topbar(false) : topbar()}
      ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
      <h1 class="title" tabindex="-1">${esc(override.title || s.title)}</h1>
      ${override.lead || s.lead ? `<p class="lead">${esc(override.lead || s.lead)}</p>` : ""}
      <fieldset class="options"><legend class="sr-only">${esc(s.title)}</legend>
        ${s.options.map((x) => `<label class="option option--radio"><input type="radio" name="${s.id}" value="${x.id}" ${val === x.id ? "checked" : ""}>
          ${x.emoji ? `<span class="option__emoji" aria-hidden="true">${x.emoji}</span>` : ""}
          <span class="option__text"><span class="option__label">${esc(x.label)}</span>${x.hint ? `<span class="option__hint">${esc(x.hint)}</span>` : ""}</span><span class="option__check"></span></label>`).join("")}
      </fieldset>
      ${s.confirm ? footer(`${s.note ? `<p class="note">${esc(s.note)}</p>` : ""}<button class="btn btn--primary" data-confirm ${val ? "" : "disabled"}>${esc(s.confirm)}</button>`) : ""}
    </main>`;
  },

  multi(s) {
    const val = S.answers[s.id] || [];
    return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">${esc(s.title)}</h1>
      ${s.lead ? `<p class="lead">${esc(s.lead)}</p>` : ""}
      <fieldset class="options"><legend class="sr-only">${esc(s.title)}</legend>
        ${s.options.map((x) => `<label class="option"><input type="checkbox" name="${s.id}" value="${x.id}" ${val.includes(x.id) ? "checked" : ""}>
          <span class="option__emoji" aria-hidden="true">${x.emoji}</span>
          <span class="option__text"><span class="option__label">${esc(x.label)}</span></span><span class="option__check">${ICON_CHECK}</span></label>`).join("")}
      </fieldset>
      ${footer(`<button class="btn btn--primary" data-multi ${val.length ? "" : "disabled"}>Continuer</button>`)}
    </main>`;
  },

  info(s) {
    return `<main class="screen">${topbar()}
      ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
      <h1 class="title" tabindex="-1">${esc(s.title)}</h1>
      ${s.lead ? `<p class="lead">${esc(s.lead)}</p>` : ""}
      ${s.steps ? `<ol class="steps-list">${s.steps.map(([e, b, t]) => `<li><span class="option__emoji" aria-hidden="true">${e}</span><span><b>${esc(b)}</b><span>${esc(t)}</span></span></li>`).join("")}</ol>` : ""}
      ${s.source ? `<p class="source">Source : ${esc(s.source)}</p>` : ""}
      ${footer(`<button class="btn btn--primary" data-next>${esc(s.cta || "Continuer")}</button>`)}
    </main>`;
  },

  consent() {
    return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">Avant les photos, ton accord</h1>
      <p class="lead">L'analyse lit la forme et les proportions de ton visage : ce sont des données biométriques. On a besoin de ton accord écrit.</p>
      <div class="consent">
        <h3>Ce qu'on en fait</h3><p>On mesure ton visage sur 2 photos pour calculer ta note et régler ton plan. Rien d'autre : pas d'identification, pas de comparaison avec d'autres personnes, pas d'entraînement d'IA.</p>
        <h3>Qui les voit</h3><p>Notre prestataire d'IA (Anthropic), le temps de l'analyse, puis plus personne.</p>
        <h3>Combien de temps</h3><p>Tes photos ne sont jamais enregistrées. Tes notes sont gardées 30 jours si tu n'achètes pas, puis effacées.</p>
        <h3>Si tu changes d'avis</h3><p>Dis non ici : tu auras quand même un plan, fait d'après tes réponses. <a href="/biometrie/" target="_blank" rel="noopener">Tout le détail</a>.</p>
      </div>
      ${footer(`<button class="btn btn--primary" data-consent="yes">J'accepte, on continue</button><button class="btn btn--ghost" data-consent="no">Pas maintenant</button>`)}
    </main>`;
  },

  photos() {
    return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">Deux photos, en pleine lumière</h1>
      <p class="lead">Face à une fenêtre, téléphone à hauteur des yeux, sans lunettes ni casquette.</p>
      <div class="shots">
        ${["face", "profil"].map((k) => `<label class="shot ${shots[k] ? "shot--done" : ""}">
          <input type="file" accept="image/*" capture="user" data-shot="${k}" aria-label="Photo de ${k}">
          ${shots[k] ? `<img src="${shots[k]}" alt="Ta photo de ${k}">` : `<span class="option__emoji" aria-hidden="true">${k === "face" ? "🙂" : "👤"}</span><span class="shot__label">De ${k}</span><span class="shot__hint">Touche pour prendre la photo</span>`}
        </label>`).join("")}
      </div>
      <ul class="tips"><li>Visage entier, cheveux compris</li><li>Expression neutre</li><li>Seul sur la photo</li></ul>
      <div id="ts"></div>
      <div id="photo-error"></div>
      ${footer(`<button class="btn btn--primary" data-scan ${shots.face && shots.profil ? "" : "disabled"}>Lancer l'analyse</button><button class="btn btn--ghost" data-noscan>Continuer sans photo</button>`)}
    </main>`;
  },

  plan_intro() {
    return `<main class="screen">${topbar()}
      <div class="scores" aria-label="Notes encore cachées">
        <div class="score"><div class="score__label">Aujourd'hui</div><div class="score__value">?.?</div></div>
        <div class="score"><div class="score__label">Ton max</div><div class="score__value">?.?</div></div>
      </div>
      <h1 class="title" tabindex="-1">${S.scan === "running" ? "Ton analyse tourne. Pendant ce temps, ton plan." : "Maintenant, ton plan"}</h1>
      <p class="lead">Tes réponses décident de l'ordre de ton plan. Encore 2 minutes.</p>
      ${footer(`<button class="btn btn--primary" data-next>Continuer</button>`)}
    </main>`;
  },

  hero_message(s) {
    const first = (S.answers.difficultes || [])[0] || "progresser";
    const [title, lead] = S11_TEXT[first] || S11_TEXT.progresser;
    return `<main class="screen"><div class="hero">${topbar()}
        <span class="eyebrow">D'après tes réponses</span>
        <h1 class="title" tabindex="-1">${esc(title)}</h1>
      </div>
      <p class="lead">${esc(lead)}</p>
      ${footer(`<button class="btn btn--primary" data-next>${esc(s.cta)}</button>`)}
    </main>`;
  },

  recap(s) {
    const morpho = { mince: "Mince → plus de carrure", moyenne: "Moyenne → plus dessinée", musclee: "Musclée → plus nette", enrobee: "Enrobée → plus affinée" }[S.answers.morpho] || "D'après tes réponses";
    const step = (emoji, label, hint, done) => `<div class="step ${done ? "" : "step--next"}">${done ? `<span class="step__done" aria-hidden="true">${ICON_CHECK}</span>` : `<span class="option__emoji" aria-hidden="true">${emoji}</span>`}
      <span class="option__text"><span class="option__label">${label}</span><span class="option__hint">${esc(hint)}</span></span>${done ? '<span class="sr-only">fait</span>' : '<span class="step__tag">ENSUITE</span>'}</div>`;
    return `<main class="screen"><div class="hero">${topbar()}
        <span class="eyebrow">Ton plan prend forme</span>
        <h1 class="title" tabindex="-1">Reste ce qu'une photo ne montre pas.</h1>
      </div>
      <div class="stack">
        ${step("📸", "Visage", S.scan === "done" || S.scan === "running" ? "D'après ton scan" : "D'après tes réponses", true)}
        ${step("💪", "Corps", morpho, true)}
        ${step("🔁", "Habitudes", "Réglées pour que tu tiennes", true)}
        ${step("🧠", "Assurance", "Regard, posture, aisance", false)}
      </div>
      ${footer(`<button class="btn btn--primary" data-next>${esc(s.cta)}</button>`)}
    </main>`;
  },

  building(s) {
    return `<main class="screen">
      <div class="brand">Lookmaxing</div>
      <h1 class="title" tabindex="-1">On prépare ton plan</h1>
      <p class="lead">${S.consent ? "On termine l'analyse de tes photos et on range tes 28 jours." : "On range tes 28 jours d'après tes réponses."}</p>
      <div class="bars">
        ${[["🧴", "Peau et soins"], ["💪", "Corps et style"], ["🧠", "Assurance"]].map(([e, l], k) => `<div><div class="bar__row"><span><span aria-hidden="true">${e}</span> ${l}</span><b data-pct="${k}">0 %</b></div><div class="progress"><span data-bar="${k}" style="width:0%"></span></div></div>`).join("")}
      </div>
      <div id="build-error"></div>
      <div id="sheet"></div>
      ${footer(`<button class="btn btn--primary" data-tomail disabled aria-busy="true">Ton plan se prépare</button>`)}
    </main>`;
  },

  email() {
    return `<main class="screen">
      <div class="brand">Lookmaxing</div>
      <h1 class="title" tabindex="-1">Ton plan est prêt. Où on te l'envoie ?</h1>
      <p class="lead">Ta note, ton max et ton plan, rattachés à ton adresse.</p>
      ${S.scan === "done" ? `<div class="scores" aria-label="Notes encore cachées">
        <div class="score"><div class="score__label">Aujourd'hui</div><div class="score__value">?.?</div></div>
        <div class="score"><div class="score__label">Ton max</div><div class="score__value">?.?</div></div>
      </div>` : ""}
      <form id="mail-form" class="stack" novalidate>
        <div class="field"><label for="email">Ton e-mail</label>
          <input id="email" class="input" type="email" inputmode="email" autocomplete="email" placeholder="prenom@exemple.fr" required>
          <span id="email-err" class="field__error" hidden></span></div>
        <label class="check"><input type="checkbox" id="optin"><span>J'accepte de recevoir des conseils et des offres par e-mail. Désinscription en un clic.</span></label>
        <p class="legal">On ne vend pas ton adresse. <a href="/confidentialite/" target="_blank" rel="noopener">Confidentialité</a></p>
        ${footer(`<button class="btn btn--primary" type="submit">Voir mon résultat</button>`)}
      </form>
    </main>`;
  },

  paywall() {
    const offers = S.offers || OFFERS;
    const chosen = offers[S.offer] || offers[DEFAULT_OFFER];
    return `<main class="screen">
      <div class="brand">Lookmaxing</div>
      <h1 class="title" tabindex="-1">Débloque ta note et ton plan</h1>
      ${S.scanned ? `<div class="scores" aria-label="Notes encore cachées">
        <div class="score"><div class="score__label">Aujourd'hui</div><div class="score__value">?.?</div></div>
        <div class="score"><div class="score__label">Ton max</div><div class="score__value">?.?</div></div>
      </div>` : ""}
      <fieldset class="options"><legend class="sr-only">Choisis ton offre</legend>
        ${Object.entries(offers).map(([k, o]) => `<label class="offer">${o.best ? '<span class="offer__tag">Le moins cher par jour</span>' : ""}
          <input type="radio" name="offer" value="${k}" ${k === S.offer ? "checked" : ""}>
          <span class="offer__main"><span class="offer__name">${esc(o.label)}</span><span class="offer__renew">${esc(euros(o.intro))} aujourd'hui, ${esc(renewText(o))}</span></span>
          <span class="offer__price">${esc(euros(o.intro))}<span class="offer__day">soit ${esc(perDay(o))} par jour</span></span></label>`).join("")}
      </fieldset>
      <ul class="includes">
        ${S.lead && S.scanned ? "<li>Ta note sur 15 critères, tes points forts et tes points à travailler</li>" : "<li>Ton bilan d'après tes réponses</li>"}
        <li>Ton plan de 28 jours, 5 à 10 minutes par jour</li>
        <li>Le suivi jour par jour dans ton espace</li>
        <li>Résiliable en ligne à tout moment, en 2 clics</li>
      </ul>
      <label class="check"><input type="checkbox" id="waiver"><span>Je veux accéder à mon rapport tout de suite. Je reconnais perdre mon droit de rétractation de 14 jours une fois le rapport ouvert.</span></label>
      <div id="pay-error"></div>
      <p class="legal">Aujourd'hui : ${esc(euros(chosen.intro))}. Ensuite : ${esc(euros(chosen.renew))} ${chosen.count === 1 ? "chaque mois" : `tous les ${chosen.count} mois`}, jusqu'à résiliation. Paiement sécurisé par Stripe. <a href="/cgv/" target="_blank" rel="noopener">CGV</a></p>
      ${footer(`<button class="btn btn--primary" data-pay>Payer ${esc(euros(chosen.intro))}</button>`)}
    </main>`;
  },

  stop() {
    return `<main class="screen">${topbar(false)}
      <h1 class="title" tabindex="-1">Réservé aux adultes</h1>
      <p class="lead">Ce service est fait pour les 18 ans et plus. On ne te demande donc ni photo, ni e-mail, ni paiement, et on n'a rien gardé de tes réponses.</p>
      ${footer(`<button class="btn btn--secondary" data-back>Retour</button>`)}
    </main>`;
  },
};

// ---------- Photos : réduites dans le téléphone (1 024 px, JPEG) avant l'envoi ----------
const shots = { face: null, profil: null };
async function shrink(file, max = 1024) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bmp) throw new Error("Cette image ne s'ouvre pas. Reprends la photo.");
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

// Anti-robot (Cloudflare Turnstile), seulement s'il est réglé
let tsKey = null, tsToken = "";
async function mountTurnstile() {
  if (tsKey === null) tsKey = (await api("config", null, { method: "GET" }).catch(() => ({}))).turnstile || "";
  if (!tsKey) return;
  if (!window.turnstile) {
    await new Promise((ok) => { const sc = document.createElement("script"); sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; sc.onload = ok; sc.onerror = ok; document.head.append(sc); });
  }
  const box = document.getElementById("ts");
  if (box && window.turnstile) window.turnstile.render(box, { sitekey: tsKey, size: "flexible", callback: (t) => { tsToken = t; } });
}

// L'analyse part en arrière-plan : le quiz continue pendant qu'elle tourne
let scanPromise = null;
function startScan() {
  S.scan = "running"; S.scanError = ""; save();
  scanPromise = api("scan", { face: shots.face, profil: shots.profil, turnstile: tsToken })
    .then((r) => { if (r.ok) S.scan = "done"; else { S.scan = "failed"; S.scanError = r.message; } })
    .catch((e) => { S.scan = "failed"; S.scanError = e.message; })
    .finally(() => { shots.face = shots.profil = null; save(); }); // on oublie les photos tout de suite
}

// ---------- Rendu et événements ----------
function render() {
  const s = SCREENS[S.i];
  const view = s.id === "age" && S.answers.age === "-18" ? VIEWS.stop() : (VIEWS[s.type] || VIEWS.info)(s);
  app.innerHTML = view;
  history.replaceState(null, "", location.pathname + location.search);
  if (S.history.length) history.pushState({ i: S.i }, "");
  app.querySelector("h1")?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  trackStep(s.id === "accueil" && S.variant === "b" ? "genre" : s.id);
  if (s.type === "photos") mountTurnstile();
  if (s.type === "building") runBuilding();
}

app.addEventListener("click", async (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  const s = SCREENS[S.i];
  if (t.hasAttribute("data-back")) {
    if (s.id === "age" && S.answers.age === "-18") { delete S.answers.age; save(); return render(); }
    return back();
  }
  if (t.hasAttribute("data-next")) return next();
  if (t.hasAttribute("data-confirm")) { syncQuiz(); return next(); }
  if (t.hasAttribute("data-multi")) { syncQuiz(); return next(); }
  if (t.dataset.consent) {
    S.consent = t.dataset.consent === "yes";
    api("scan-consent", { agree: S.consent }).catch(() => {});
    return next();
  }
  if (t.hasAttribute("data-noscan")) {
    S.consent = false; api("scan-consent", { agree: false }).catch(() => {});
    return next();
  }
  if (t.hasAttribute("data-scan")) { startScan(); return next(); }
  if (t.hasAttribute("data-tomail")) return goTo("email");
  if (t.dataset.sheet) return answerSheet(t.dataset.sheet, t.dataset.v === "1");
  if (t.hasAttribute("data-retake")) { S.consent = true; return goTo("photos"); }
  if (t.hasAttribute("data-pay")) return pay(t);
});

app.addEventListener("change", async (e) => {
  const input = e.target;
  const s = SCREENS[S.i];
  if (input.dataset.shot) {
    const file = input.files?.[0];
    if (!file) return;
    try { shots[input.dataset.shot] = await shrink(file); render(); }
    catch (err) { document.getElementById("photo-error").innerHTML = `<div class="alert" role="alert">${esc(err.message)}</div>`; }
    return;
  }
  if (input.name === "offer") { S.offer = input.value; save(); return render(); }
  if (input.type === "radio" && (s.type === "single" || (s.type === "landing" && S.variant === "b"))) {
    // au clavier, les flèches déplacent seulement le choix ; Entrée ou Espace valide (BUG-001)
    const advance = !arrowNav;
    arrowNav = false;
    return chooseSingle(input, advance);
  }
  if (input.type === "checkbox" && s.type === "multi") {
    const solo = ["rien", "jamais"]; // « Rien encore » / « Jamais » excluent les autres réponses
    let list = [...app.querySelectorAll(`input[name="${s.id}"]:checked`)].map((x) => x.value);
    if (input.checked) list = solo.includes(input.value) ? [input.value] : list.filter((v) => !solo.includes(v));
    S.answers[s.id] = list;
    app.querySelectorAll(`input[name="${s.id}"]`).forEach((x) => { x.checked = S.answers[s.id].includes(x.value); });
    app.querySelector("[data-multi]").disabled = !S.answers[s.id].length;
    save();
  }
});

// Choix unique : enregistre la réponse, puis passe à l'écran suivant (sauf si on se déplace aux flèches)
let arrowNav = false;
async function chooseSingle(input, advance) {
  const s = SCREENS[S.i];
  const scr = s.type === "landing" ? SCREENS[1] : s;
  S.answers[scr.id] = input.value; save();
  if (scr.id === "age" && input.value === "-18") {
    if (!advance) return;
    await api("quiz", { answers: { age: "-18" } }).catch(() => {});
    try { sessionStorage.removeItem(KEY); } catch {}
    return render();
  }
  if (scr.confirm) { app.querySelector("[data-confirm]").disabled = false; return; }
  if (!advance) return;
  syncQuiz();
  // variante B : la question du genre est sur l'accueil, on saute l'écran genre
  setTimeout(() => (s.type === "landing" ? go(2) : next()), 250);
}
app.addEventListener("keydown", (e) => {
  const t = e.target;
  if (t.type !== "radio" || !t.name || t.name === "offer") return;
  if (e.key.startsWith("Arrow")) arrowNav = true;
  else if ((e.key === "Enter" || e.key === " ") && t.checked) { e.preventDefault(); arrowNav = false; chooseSingle(t, true); }
});

app.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email");
  const err = document.getElementById("email-err");
  const btn = e.target.querySelector("button[type=submit]");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
    email.setAttribute("aria-invalid", "true"); email.setAttribute("aria-describedby", "email-err");
    err.textContent = "Cette adresse ne semble pas complète."; err.hidden = false; email.focus(); return;
  }
  btn.setAttribute("aria-busy", "true");
  try {
    const r = await api("lead", { email: email.value.trim(), optin: document.getElementById("optin").checked });
    S.lead = true; S.scanned = r.scanned; S.offers = r.offers; S.offer = r.defaultOffer;
    next();
  } catch (ex) {
    btn.removeAttribute("aria-busy");
    err.textContent = ex.status === 401 ? "Ta session a expiré. Recommence le quiz." : ex.message; err.hidden = false;
  }
});

// Écran S24 : les barres avancent ; 2 questions rapides ; on attend la fin de l'analyse
let sheetResolve = null;
function answerSheet(id, yes) {
  S.answers[id] = yes; save(); syncQuiz();
  document.getElementById("sheet").innerHTML = "";
  sheetResolve?.();
}
function ask(sheet) {
  return new Promise((ok) => {
    sheetResolve = ok;
    document.getElementById("sheet").innerHTML = `<div class="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sq">
      <span class="eyebrow">Une question</span><h2 id="sq" class="title" style="font-size:var(--fs-lg);line-height:var(--lh-lg)" tabindex="-1">${esc(sheet.title)}</h2>
      <button class="btn btn--secondary" data-sheet="${sheet.id}" data-v="1">Oui</button><button class="btn btn--secondary" data-sheet="${sheet.id}" data-v="0">Non</button></div></div>`;
    document.getElementById("sq").focus();
  });
}
async function runBuilding() {
  const s = SCREENS[S.i];
  const set = (k, p) => { const b = app.querySelector(`[data-bar="${k}"]`); if (b) { b.style.width = p + "%"; app.querySelector(`[data-pct="${k}"]`).textContent = p + " %"; } };
  const animate = (k, from, to, ms) => new Promise((ok) => { const t0 = performance.now(); const step = (t) => { const p = Math.min(1, (t - t0) / ms); set(k, Math.round(from + (to - from) * p)); p < 1 ? requestAnimationFrame(step) : ok(); }; requestAnimationFrame(step); });
  await animate(0, 0, 60, 1500);
  await ask(s.sheets[0]);
  await animate(0, 60, 100, 800); await animate(1, 0, 50, 1200);
  await ask(s.sheets[1]);
  await animate(1, 50, 100, 800);
  await animate(2, 0, 70, 1000);
  if (scanPromise) await scanPromise; // la barre reste à 70 % tant que l'analyse n'est pas finie
  await animate(2, 70, 100, 500);
  if (SCREENS[S.i] !== s) return;
  const btn = app.querySelector("[data-tomail]");
  if (S.scan === "failed") {
    document.getElementById("build-error").innerHTML = `<div class="alert" role="alert">${esc(S.scanError || "L'analyse de tes photos n'a pas marché.")}</div>
      <button class="btn btn--secondary" data-retake>Reprendre les photos</button>`;
  }
  btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = S.scan === "failed" ? "Continuer sans scan" : "Voir mon résultat";
}

async function pay(btn) {
  const box = document.getElementById("pay-error");
  if (!document.getElementById("waiver").checked) { box.innerHTML = '<div class="alert" role="alert">Coche la case juste au-dessus pour recevoir ton rapport tout de suite.</div>'; document.getElementById("waiver").focus(); box.scrollIntoView({ block: "center" }); return; }
  btn.setAttribute("aria-busy", "true");
  try { const { url } = await api("checkout", { offer: S.offer, waiver: true }); location.href = url; }
  catch (e) { btn.removeAttribute("aria-busy"); box.innerHTML = `<div class="alert" role="alert">${esc(e.message)}</div>`; box.scrollIntoView({ block: "center" }); }
}

// Si l'onglet a été rechargé pendant l'analyse, les photos sont perdues : on propose de les reprendre
if (S.scan === "running") { S.scan = "failed"; S.scanError = "La page a été rechargée pendant l'analyse."; }
render();
