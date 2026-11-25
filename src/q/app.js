// Le quiz : un écran à la fois, décrit dans /shared/questions.js.
import { SCREENS, S11_TEXT, DIFFICULTES, profile, PROFILE_DIMS } from "/shared/questions.js";
import { OFFERS, DEFAULT_OFFER, euros, priceLines, guaranteeText } from "/shared/plans.js";
import { FACTORS } from "/shared/factors.js";
import { faceMesh } from "/q/mesh.js";

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ICON_BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const ICON_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
// ---------- Dessins maison (aucune photo de vraie personne) ----------
const ICON_CAM = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const ICON_GALLERY = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="15" height="13" rx="2"/><path d="M7 2h12a2 2 0 0 1 2 2v11"/><path d="m3 15 4-4 5 5 2-2 4 4"/></svg>';
const ICON_SHIELD = '<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--c-success)" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke="var(--c-bg)" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
const AVATARS = {
  homme: `<svg class="avatar" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="var(--c-surface-alt)"/><path d="M11 46c1.5-8 6.5-11.5 13-11.5S35.5 38 37 46" fill="var(--c-accent-line)"/><ellipse cx="24" cy="22" rx="8.5" ry="10.5" fill="var(--c-gold)"/><path d="M15 20c-.5-7.5 4.5-11 9.5-11s10 3.5 8.5 11c-1.5-3.5-5.5-5-8.5-5S16.5 16.5 15 20z" fill="var(--c-text)"/></svg>`,
  femme: `<svg class="avatar" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="var(--c-surface-alt)"/><path d="M13 36c-3-9-2-26 11-26s14 17 11 26z" fill="var(--c-accent)"/><path d="M11 46c1.5-8 6.5-11.5 13-11.5S35.5 38 37 46" fill="var(--c-accent-line)"/><ellipse cx="24" cy="23" rx="8" ry="10" fill="var(--c-gold)"/><path d="M15.5 21c0-6.5 4-9.5 8.5-9.5s8.5 3 8.5 9.5c-3-2-6-5-8.5-5.5-1.5 2.5-4.5 4.5-8.5 5.5z" fill="var(--c-accent)"/></svg>`,
};
// Silhouettes de corps, dessinées (demi-largeurs : épaules, taille, ventre)
const BODY = { musclee: [26, 15, 0, true], mince: [17, 12, 0], moyenne: [21, 17, 2], enrobee: [23, 21, 9] };
function bodyArt(id) {
  const [sh, wa, be, mus] = BODY[id] || BODY.moyenne;
  const c = 40;
  const torso = `M${c - sh} 34 C${c - sh} 28 ${c + sh} 28 ${c + sh} 34 C${c + sh + 1} 56 ${c + wa + be} 74 ${c + wa} 100 L${c - wa} 100 C${c - wa - be} 74 ${c - sh - 1} 56 ${c - sh} 34Z`;
  const arms = `M${c - sh} 34 C${c - sh - 9} 46 ${c - sh - 8} 70 ${c - sh - 6} 92 M${c + sh} 34 C${c + sh + 9} 46 ${c + sh + 8} 70 ${c + sh + 6} 92`;
  const lines = mus ? `<path d="M${c - 12} 50 Q${c - 6} 56 ${c} 50 Q${c + 6} 56 ${c + 12} 50 M${c} 58 V90 M${c - 8} 66 H${c + 8} M${c - 8} 76 H${c + 8}" stroke="var(--c-accent)" stroke-width="1.4" fill="none" opacity=".8"/>` : "";
  return `<svg class="body-art" viewBox="0 0 80 104" aria-hidden="true"><circle cx="${c}" cy="15" r="10" fill="var(--c-gold)"/><path d="M${c - 4} 24h8v6h-8z" fill="var(--c-gold)"/><path d="${arms}" stroke="var(--c-gold)" stroke-width="${mus ? 9 : be > 5 ? 9 : 7}" stroke-linecap="round" fill="none"/><path d="${torso}" fill="var(--c-gold)"/>${lines}</svg>`;
}
// Le profil (2e selfie), dessiné au trait avec quelques points « thermiques »
const PROFILE_ART = `<svg class="mesh" viewBox="0 0 100 130" aria-hidden="true"><path d="M40 16C62 8 80 24 78 44l-1 8 8 13-8 3 2 8c0 6-4 8-8 8l1 7c0 8-8 12-16 12l-2 14H28l2-22C20 86 18 68 20 50c1-18 8-30 20-34Z" fill="none" stroke="var(--c-accent)" stroke-width="1.6" stroke-linejoin="round"/>${[[70, 46], [81, 64], [72, 84], [60, 98], [44, 60], [52, 40], [36, 80]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${1.6 + (i % 3) * 0.5}" fill="${["var(--c-gold)", "var(--c-warning)", "var(--c-accent)"][i % 3]}"/>`).join("")}</svg>`;
// « Aujourd'hui / avec ton plan » : construit avec SES réponses, sans promesse de résultat
const OUTCOME = {
  confiance: "Une assurance qui se travaille chaque jour", rencontres: "Une première impression soignée", invisible: "Une présence qu'on remarque",
  visage: "Un visage mis en valeur : peau, coupe, barbe", poids: "Une silhouette qui s'affine, semaine après semaine", peau: "Une routine de peau que tu tiens",
  cheveux: "Une coupe choisie pour ton visage", presence: "Un regard et une voix plus posés", progresser: "Des progrès suivis jour après jour",
};

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
const visible = (s) => !(s.skipIf && s.skipIf({ consent: S.consent, scan: S.scan }));
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
    ${withProgress ? `<div class="progress" role="progressbar" aria-label="Avancement" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress()}"><span style="width:${progress()}%"></span></div>` : '<div class="brand" style="flex:1">MOGX</div><span style="width:48px"></span>'}</div>`;
}
const footer = (html) => `<div class="screen__footer"><div class="stack">${html}</div></div>`;
// Une phrase qui reprend ses propres réponses : il voit qu'on l'écoute
const echoHtml = (s) => { const t = s.echo ? s.echo(S.answers) : ""; return t ? `<p class="echo">${esc(t)}</p>` : ""; };
const fr = (n) => String(n).replace(".", ",");

// ---------- Écrans ----------
const VIEWS = {
  landing() {
    // Variante B : on passe directement à la première question, avec le titre de l'accueil
    if (S.variant === "b") return VIEWS.single(SCREENS[1], { title: "Ce que les autres voient de toi en 3 secondes.", lead: "Une analyse franche de ton visage, et un plan pour faire monter ta note. On commence : tu es…" });
    return `<main class="screen">
      <div class="brand">MOGX</div>
      <div class="landing-art">${faceMesh({ className: "mesh mesh--idle" })}
        <span class="tag" style="left:-6%;top:44%">Mâchoire</span>
        <span class="tag" style="right:-8%;top:30%">Peau</span>
        <span class="tag" style="right:-4%;top:66%">Posture</span>
      </div>
      <h1 class="title title--hero" tabindex="-1">Ce que les autres voient de toi en 3 secondes. Et comment le changer.</h1>
      <p class="lead">15 critères passés au crible, une note sans filtre, et un plan de 28 jours pour la faire monter.</p>
      ${footer(`<button class="btn btn--primary" data-next>Lancer mon analyse</button><div class="reassure"><span>3 minutes, dès 18 ans.</span><span>Tes photos ne sont jamais enregistrées.</span></div><nav class="mini-legal" aria-label="Informations légales"><a href="/cgv/">CGV</a><a href="/confidentialite/">Confidentialité</a><a href="/mentions-legales/">Mentions légales</a></nav>`)}
    </main>`;
  },

  single(s, override = {}) {
    const val = S.answers[s.id];
    return `<main class="screen">
      ${s.id === "genre" || s.id === "age" ? topbar(false) : topbar()}
      ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
      <h1 class="title" tabindex="-1">${esc(override.title || s.title)}</h1>
      ${override.lead || s.lead ? `<p class="lead">${esc(override.lead || s.lead)}</p>` : ""}
      ${echoHtml(s)}
      <fieldset class="options ${s.grid ? "options--grid" : ""}"><legend class="sr-only">${esc(s.title)}</legend>
        ${s.options.map((x) => `<label class="option option--radio ${s.grid ? "option--tile" : ""}"><input type="radio" name="${s.id}" value="${x.id}" ${val === x.id ? "checked" : ""}>
          ${s.grid ? bodyArt(x.id) : s.avatars && AVATARS[x.id] ? AVATARS[x.id] : x.emoji ? `<span class="option__emoji" aria-hidden="true">${x.emoji}</span>` : ""}
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
      ${echoHtml(s)}
      <fieldset class="options"><legend class="sr-only">${esc(s.title)}</legend>
        ${s.options.map((x) => `<label class="option"><input type="checkbox" name="${s.id}" value="${x.id}" ${val.includes(x.id) ? "checked" : ""}>
          ${x.emoji ? `<span class="option__emoji" aria-hidden="true">${x.emoji}</span>` : ""}
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
      ${s.steps ? `<ol class="steps-list">${s.steps.map(([e, b, t]) => `<li><span><b>${esc(b)}</b><span>${esc(t)}</span></span></li>`).join("")}</ol>` : ""}
      ${s.source ? `<p class="source">Source : ${esc(s.source)}</p>` : ""}
      ${s.sources ? `<ul class="sources">${s.sources.map(([f, c]) => `<li><b>${esc(f)}</b><span>${esc(c)}</span></li>`).join("")}</ul>` : ""}
      ${echoHtml(s)}
      ${footer(`<button class="btn btn--primary" data-next>${esc(s.cta || "Continuer")}</button>`)}
    </main>`;
  },

  consent() {
    return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">Avant les photos, ton accord.</h1>
      <p class="lead">L'analyse lit la forme et les proportions de ton visage : ce sont des données biométriques. On a besoin de ton accord écrit.</p>
      <div class="consent">
        <h3>Ce qu'on en fait</h3><p>On mesure ton visage sur 2 photos pour calculer ta note et régler ton plan. Rien d'autre : pas d'identification, pas de comparaison avec d'autres personnes, pas d'entraînement d'IA.</p>
        <h3>Qui les voit</h3><p>Notre prestataire d'IA (Anthropic), pour l'analyse seulement, sans s'en servir pour entraîner ses modèles. Personne chez MOGX ne les regarde.</p>
        <h3>Combien de temps</h3><p>Tes photos ne sont jamais enregistrées. Tes notes sont gardées 30 jours si tu n'achètes pas, puis effacées.</p>
        <h3>Si tu changes d'avis</h3><p>Dis non ici : tu auras quand même un plan, fait d'après tes réponses. <a href="/biometrie/" target="_blank" rel="noopener">Tout le détail</a>.</p>
      </div>
      ${footer(`<button class="btn btn--primary" data-consent="yes">J'accepte, on continue</button><button class="btn btn--ghost" data-consent="no">Pas maintenant</button>`)}
    </main>`;
  },

  selfies() {
    return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">2 selfies, et ton analyse démarre.</h1>
      <div class="examples">
        <figure class="example"><div class="example__art">${faceMesh({ className: "mesh" })}</div><span class="example__num">1</span><figcaption>De face</figcaption></figure>
        <figure class="example"><div class="example__art">${PROFILE_ART}</div><span class="example__num">2</span><figcaption>De profil</figcaption></figure>
      </div>
      <ul class="tips"><li>Pleine lumière, face à une fenêtre</li><li>Sans lunettes ni casquette, expression neutre</li><li>Seul sur la photo</li></ul>
      <p class="safe">${ICON_SHIELD}<span>Tes selfies ne sont vus par personne et ne sont jamais enregistrés.</span></p>
      ${footer(`<button class="btn btn--primary" data-next>${ICON_CAM} Prendre mes selfies</button><button class="btn btn--ghost" data-noscan>Continuer sans photo</button>`)}
    </main>`;
  },

  photos() {
    const k = cam.step;
    const name = k === "face" ? "de face" : "de profil";
    if (cam.phase === "fallback") return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">Choisis 2 photos.</h1>
      <p class="lead">On n'a pas accès à ta caméra. Choisis une photo de face et une de profil, ou autorise la caméra dans les réglages de ton navigateur.</p>
      <div class="shots">
        ${["face", "profil"].map((x) => `<label class="shot ${shots[x] ? "shot--done" : ""}">
          <input type="file" accept="image/*" capture="user" data-shot="${x}" aria-label="Photo ${x === "face" ? "de face" : "de profil"}">
          ${shots[x] ? `<img src="${shots[x]}" alt="Ta photo ${x === "face" ? "de face" : "de profil"}">` : `<span class="shot__label">${x === "face" ? "De face" : "De profil"}</span><span class="shot__hint">Touche pour choisir</span>`}
        </label>`).join("")}
      </div>
      <div id="ts"></div><div id="photo-error"></div>
      ${footer(`<button class="btn btn--primary" data-scan ${shots.face && shots.profil ? "" : "disabled"}>Lancer l'analyse</button><button class="btn btn--ghost" data-noscan>Continuer sans photo</button>`)}
    </main>`;
    if (cam.phase === "review") return `<main class="screen screen--cam">${topbar()}
      <h1 class="sr-only" tabindex="-1">Ton selfie ${name} : on le garde ?</h1>
      <div class="cam"><img class="cam__shot" src="${shots[k]}" alt="Ton selfie ${name}"><span class="cam__step">${k === "face" ? "1/2" : "2/2"} · ${k === "face" ? "De face" : "De profil"}</span></div>
      <div id="ts"></div><div id="photo-error"></div>
      ${footer(`<button class="btn btn--primary" data-keep>C'est bon</button><button class="btn btn--ghost" data-reshoot>Je la reprends</button>`)}
    </main>`;
    return `<main class="screen screen--cam">${topbar()}
      <h1 class="sr-only" tabindex="-1">Selfie ${name}</h1>
      <div class="cam">
        <video id="cam-video" playsinline muted autoplay></video>
        <svg class="cam__oval" viewBox="0 0 100 133" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="50" cy="60" rx="32" ry="${k === "face" ? 40 : 42}"/></svg>
        <span class="cam__step">${k === "face" ? "1/2" : "2/2"} · ${k === "face" ? "De face" : "De profil"}</span>
        <div class="cam__example" aria-hidden="true">${k === "face" ? faceMesh({ className: "mesh" }) : PROFILE_ART}</div>
        <label class="cam__gallery"><input type="file" accept="image/*" data-shot="${k}" aria-label="Choisir une photo ${name} dans ta galerie">${ICON_GALLERY}</label>
        <button class="cam__shutter" data-shoot aria-label="Prendre la photo ${name}"></button>
      </div>
      <p class="cam__tip">${k === "face" ? "Visage dans l'ovale, regard droit, pleine lumière." : "Tourne la tête sur le côté : on doit voir ton oreille."}</p>
      <div id="ts"></div><div id="photo-error"></div>
      ${footer(`<button class="btn btn--ghost" data-noscan>Continuer sans photo</button>`)}
    </main>`;
  },

  ember(s) {
    return `<main class="screen screen--ember">${topbar()}
      ${s.eyebrow ? `<p class="eyebrow">${esc(s.eyebrow)}</p>` : ""}
      <h1 class="title title--hero" tabindex="-1">${esc(s.title)}</h1>
      <p class="lead">${esc(s.lead)}</p>
      ${echoHtml(s)}
      ${footer(`<button class="btn btn--primary" data-next>${esc(s.cta || "Continuer")}</button>`)}
    </main>`;
  },

  contrast() {
    const picked = (S.answers.difficultes || []).filter((d) => d !== "progresser");
    const ids = picked.length ? picked.slice(0, 5) : ["progresser"];
    const left = ids.map((id) => id === "progresser" ? "Pas de vrai blocage, juste l'envie de progresser" : DIFFICULTES.find((x) => x.id === id)?.label);
    return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">Ce que tu as coché. Et ce que ton plan travaille.</h1>
      <div class="vs">
        <div class="vs__col"><h2 class="vs__title">Aujourd'hui</h2><ul>${left.map((t) => `<li class="vs__no">${esc(t)}</li>`).join("")}</ul></div>
        <div class="vs__col vs__col--hot"><h2 class="vs__title">Avec ton plan</h2><ul>${ids.map((id) => `<li class="vs__yes">${esc(OUTCOME[id])}</li>`).join("")}</ul></div>
      </div>
      <p class="legal">Ton plan travaille ces points chaque jour. Le résultat dépend de ta régularité.</p>
      ${footer(`<button class="btn btn--primary" data-next>Continuer</button>`)}
    </main>`;
  },

  projection() {
    const t = S.teaser;
    if (S.scan === "running") return `<main class="screen">${topbar()}
      <p class="eyebrow">Encore un instant</p>
      <h1 class="title" tabindex="-1">Ton analyse se termine…</h1>
      <div class="scanner scanner--small">${faceMesh({ animated: true, className: "mesh mesh--live" })}</div>
      ${footer(`<button class="btn btn--primary" disabled aria-busy="true">On calcule ton potentiel</button>`)}
    </main>`;
    if (S.scan === "done" && t?.scanned && Number(t.gain) > 0) return `<main class="screen screen--ember">${topbar()}
      <p class="eyebrow">D'après ton scan et tes réponses</p>
      <h1 class="title title--hero" tabindex="-1">Jusqu'à <span class="big-gain">+${esc(fr(t.gain))}</span> point en 12 semaines.</h1>
      <p class="lead">En suivant ton plan 5 à 10 minutes par jour. Ta note de départ reste cachée jusqu'au résultat.</p>
      <p class="legal">Une estimation calculée seulement sur ce qui se travaille (peau, coupe, posture, style…), jamais sur l'ossature. Pas une promesse : ça dépend de toi.</p>
      ${footer(`<button class="btn btn--primary" data-next>Je veux ces points</button>`)}
    </main>`;
    return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">Ton plan se construit d'après tes réponses.</h1>
      <p class="lead">${S.scan === "failed" ? "L'analyse de tes photos n'a pas abouti : tu pourras la refaire juste avant ton résultat." : "On continue."}</p>
      ${footer(`<button class="btn btn--primary" data-next>Continuer</button>`)}
    </main>`;
  },

  profile() {
    const p = profile(S.answers);
    if (!p) return VIEWS.ember({ title: "Ton plan prend forme.", lead: "Encore une étape et on assemble tout.", cta: "Continuer" });
    return `<main class="screen">${topbar()}
      <p class="eyebrow">Ton profil, d'après tes réponses</p>
      <h1 class="title title--hero" tabindex="-1">${esc(p.title)}.</h1>
      <div class="bars">${p.dims.map((d) => `<div><div class="bar__row"><span>${esc(d.label)}</span><b>${d.score}</b></div><div class="progress"><span style="width:${d.score}%"></span></div></div>`).join("")}</div>
      <p class="lead">Ton plan commence par « ${esc(PROFILE_DIMS[p.weakest].label.toLowerCase())} » : c'est là que tu as le plus à gagner.</p>
      <p class="legal">Un résumé de tes réponses, pas un test psychologique.</p>
      ${footer(`<button class="btn btn--primary" data-next>Assembler mon plan</button>`)}
    </main>`;
  },

  plan_intro() {
    return `<main class="screen">${topbar()}
      <div class="scores" aria-label="Notes encore cachées">
        <div class="score"><div class="score__label">Aujourd'hui</div><div class="score__value">?,?</div></div>
        <div class="score score--hot"><div class="score__label">Ton max</div><div class="score__value score__value--high">?,?</div></div>
      </div>
      <h1 class="title" tabindex="-1">${S.scan === "running" || S.scan === "done" ? "Pendant que l'analyse finit, on construit ton plan." : "Maintenant, ton plan."}</h1>
      <p class="lead">Tes réponses décident de ce qu'on attaque en premier. Encore 2 minutes.</p>
      ${footer(`<button class="btn btn--primary" data-next>Continuer</button>`)}
    </main>`;
  },

  hero_message(s) {
    const first = (S.answers.difficultes || [])[0] || "progresser";
    const [title, lead] = S11_TEXT[first] || S11_TEXT.progresser;
    return `<main class="screen"><div class="hero">${topbar()}
        <p class="eyebrow">D'après tes réponses</p>
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
        <p class="eyebrow">Ton plan prend forme</p>
        <h1 class="title" tabindex="-1">Il reste ce qu'une photo ne montre pas.</h1>
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

  building() {
    const p = scanPhotos;
    const bars = [...(S.consent ? [["Rapport de ton visage"]] : []), ["Plan d'assurance"], ["Programme peau"], ["Conseils de style"]];
    return `<main class="screen">
      <div class="brand">MOGX</div>
      ${p.face ? `<div class="tilted tilted--small"><div class="tilted__card tilted__card--a"><img src="${p.face}" alt=""></div>${p.profil ? `<div class="tilted__card tilted__card--b"><img src="${p.profil}" alt=""></div>` : ""}</div>` : ""}
      <h1 class="title" tabindex="-1">On prépare ton rapport.</h1>
      <div class="bars">
        ${bars.map(([l], k) => `<div><div class="bar__row"><span>${l}</span><b data-pct="${k}">0 %</b></div><div class="progress"><span data-bar="${k}" style="width:0%"></span></div></div>`).join("")}
      </div>
      <div id="build-error"></div>
      <div id="sheet"></div>
      ${footer(`<button class="btn btn--primary" data-tomail disabled aria-busy="true">Ton plan se prépare</button>`)}
    </main>`;
  },

  email() {
    return `<main class="screen">
      <div class="brand">MOGX</div>
      <h1 class="title" tabindex="-1">${S.scan === "done" ? "Ton résultat t'attend." : "Ton plan est prêt."}</h1>
      <p class="lead">Où on te l'envoie ? Il reste attaché à ton adresse, sans mot de passe.</p>
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
    const o = OFFERS[DEFAULT_OFFER];
    const pw = S.pw;
    if (!pw) return `<main class="screen"><div class="brand">MOGX</div><h1 class="title" tabindex="-1">On prépare ta page…</h1><div class="skel"></div><div class="skel"></div></main>`;
    const t = pw.teaser || {};
    const trial = pw.offer.trial;
    const lines = priceLines(o, trial);
    const lock = '<svg class="lock" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1Zm2 0h8V8a4 4 0 1 0-8 0v2Z"/></svg>';
    const row = (f, kind) => `<div class="hidden-row"><span class="hidden-row__name" style="width:${Math.min(70, 18 + f.len * 2.6)}%" aria-hidden="true">${lock}</span><span class="sr-only">Critère caché jusqu'au paiement :</span><b class="hidden-row__note hidden-row__note--${kind}">${f.note}</b></div>`;
    const days = (from) => (t.plan || []).slice(from, from + 7).map((txt, k) => `<div class="day"><span>Jour ${from + k + 1}</span><b>${esc(txt)}</b></div>`).join("");
    return `<main class="screen screen--sales">
      <div class="brand">MOGX</div>
      ${t.scanned ? `
      <div class="duo">
        <div class="duo__card">${scanPreview ? `<img src="${scanPreview}" alt="Ta photo">` : faceMesh({ className: "mesh" })}<span class="duo__tag">Aujourd'hui</span><span class="duo__lock">${lock}</span></div>
        <div class="duo__card duo__card--hot"><span class="duo__label">Ton max</span><span class="duo__max">${esc(fr(t.max))}</span><span class="duo__gain">+${esc(fr(t.gain))} possible</span></div>
      </div>
      <h1 class="title title--hero" tabindex="-1">Tu peux monter jusqu'à ${esc(fr(t.max))}.</h1>
      <p class="lead">Ta note actuelle, tes 15 critères et ton plan sont prêts. Il ne reste qu'à les débloquer.</p>
      <section class="block"><h2 class="block__title">Tes points forts</h2><p class="block__lead">Ce qui joue déjà pour toi.</p>${t.strengths.map((f) => row(f, "hot")).join("")}</section>
      <section class="block"><h2 class="block__title">Ce qui te freine</h2><p class="block__lead">${t.holding} critère${t.holding > 1 ? "s" : ""} qui se travaille${t.holding > 1 ? "nt" : ""}. C'est là que sont tes points.</p>${t.weaknesses.map((f) => row(f, "low")).join("")}</section>`
      : `<h1 class="title title--hero" tabindex="-1">Ton plan de 28 jours est prêt.</h1>
      <p class="lead">Fait d'après tes réponses, dans l'ordre de ce qui te pèse le plus.</p>`}
      <button class="btn btn--primary" data-gopay>Débloquer mon résultat</button>
      <section class="block"><h2 class="block__title">Ton plan, jour par jour</h2><p class="block__lead">Ton vrai plan, fait pour toi. Les 2 premières semaines :</p>
        <div class="week"><span class="week__label">Semaine 1</span><div class="days">${days(0)}</div></div>
        <div class="week"><span class="week__label">Semaine 2</span><div class="days">${days(7)}</div></div>
        <div class="week week--locked" aria-hidden="true"><span class="week__label">Semaines 3 et 4</span><div class="days">${Array.from({ length: 7 }, (_, k) => `<div class="day"><span>Jour ${15 + k}</span><b>████</b></div>`).join("")}</div><span class="week__lock">${lock} Dans ton plan complet</span></div>
      </section>
      <section class="block"><h2 class="block__title">Ce que tu débloques</h2>
        <ul class="includes">
          ${t.scanned ? "<li>Ta note, ton max et tes 15 critères, avec une phrase claire pour chacun</li>" : "<li>Ton bilan d'après tes réponses</li>"}
          <li>Ton plan de 28 jours, 5 à 10 minutes par jour</li>
          <li>Le suivi jour par jour, et un rappel chaque matin si tu veux</li>
          <li>Résiliable en ligne en un clic${trial ? ", après l'engagement" : ""}</li>
        </ul>
      </section>
      <section class="block block--guarantee">
        <div class="guarantee-head"><h2 class="block__title">Satisfait ou remboursé</h2>${seal()}</div>
        <p class="block__lead">${esc(guaranteeText(o))}</p>
        <p class="block__lead">Pas de justificatif à envoyer : ton suivi dans ton espace suffit. <a href="/cgv/#garantie" target="_blank" rel="noopener">Les conditions en détail</a></p>
      </section>
      <section class="block" id="pay"><h2 class="block__title">${trial ? "Ton essai est réservé" : "Ton accès"}</h2>
        ${trial ? "" : `<p class="block__lead">La réservation de l'essai à ${esc(euros(o.intro))} est terminée pour toi.</p>`}
        <div class="offer offer--single">
          <span class="offer__main"><span class="offer__name">${esc(o.label)}</span><span class="offer__renew">${esc(lines.today)}, ${esc(lines.then)}</span></span>
          <span class="offer__price">${esc(euros(trial ? o.intro : o.renew))}<span class="offer__day">${trial ? `pour ${o.trialDays} jours` : "la 1re semaine"}</span></span>
        </div>
        <div class="terms" role="note"><p><b>Aujourd'hui : ${esc(lines.today)}.</b></p><p>Ensuite : ${esc(euros(o.renew))} par semaine, jusqu'à résiliation.</p><p>${esc(lines.minimum)}</p></div>
        ${pw.stripeKey ? `<div id="checkout" class="checkout"></div>` : `
          ${pw.waiverOnSite ? `<label class="check"><input type="checkbox" id="waiver"><span>Je veux accéder à mon résultat tout de suite. Je reconnais perdre mon droit de rétractation de 14 jours une fois le résultat ouvert.</span></label>` : ""}
          <button class="btn btn--primary" data-pay>Débloquer mon résultat, ${esc(euros(trial ? o.intro : o.renew))}</button>`}
        <div id="pay-error"></div>
        <p class="legal">Apple Pay, Google Pay ou carte, paiement sécurisé par Stripe. <a href="/cgv/" target="_blank" rel="noopener">CGV</a></p>
      </section>
      <section class="block block--card">
        <h2 class="block__title">Tes infos sont en sécurité</h2>
        <p class="block__lead">On ne vend ni ne partage tes données, à personne. Tes photos ne sont jamais enregistrées : elles servent à l'analyse, puis elles disparaissent.</p>
        <p class="block__lead"><a href="/confidentialite/" target="_blank" rel="noopener">Comment on protège tes données</a></p>
      </section>
      ${pw.support ? `<section class="block block--card">
        <h2 class="block__title">Une question avant de payer ?</h2>
        <p class="block__lead">Écris-nous, une vraie personne te répond.</p>
        <a class="btn btn--secondary" href="mailto:${esc(pw.support)}">Écrire à ${esc(pw.support)}</a>
      </section>` : ""}
      <div class="sticky-pay" role="region" aria-label="Paiement">
        <div class="sticky-pay__info">${trial
          ? `<span class="sticky-pay__timer" id="timer" aria-live="off">--:--</span><span class="sticky-pay__sub">essai à ${esc(euros(o.intro))} réservé</span>`
          : `<span class="sticky-pay__timer">${esc(euros(o.renew))}</span><span class="sticky-pay__sub">par semaine</span>`}</div>
        <button class="btn btn--primary" data-gopay>Débloquer</button>
      </div>
    </main>`;
  },

  scanning() {
    const p = scanPhotos;
    const art = p.face
      ? `<div class="tilted"><div class="tilted__card tilted__card--a"><img src="${p.face}" alt="Ton selfie de face">${faceMesh({ animated: true, className: "mesh mesh--live" })}</div>${p.profil ? `<div class="tilted__card tilted__card--b"><img src="${p.profil}" alt="Ton selfie de profil"></div>` : ""}</div>`
      : `<div class="scanner">${faceMesh({ animated: true, className: "mesh mesh--live" })}</div>`;
    return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">On lit ton visage.</h1>
      ${art}
      <p class="reading" id="reading" aria-live="polite">Calage du visage…</p>
      <p class="lead">L'analyse prend un peu de temps : elle se termine pendant que tu réponds aux questions suivantes.</p>
      ${footer(`<button class="btn btn--primary" data-next>Continuer</button>`)}
    </main>`;
  },

  teaser() {
    const t = S.teaser || {};
    return `<main class="screen">
      <div class="brand">MOGX</div>
      <p class="eyebrow">Aperçu de ton analyse</p>
      <h1 class="title" tabindex="-1">Tu as plus de marge que tu ne crois.</h1>
      <div class="teaser">
        <div class="teaser__row"><span>Ton point fort</span><b>${esc(t.strength?.label || "")}</b></div>
        <div class="teaser__row teaser__row--hot"><span>Points que tu peux gagner</span><b>+${fr(t.gain || "0.0")}</b></div>
        <div class="teaser__row"><span>Critères qui te freinent</span><b>${t.holding ?? "?"}</b></div>
        ${(t.holdingLabels || []).length ? `<div class="teaser__row"><span class="blurred" aria-hidden="true">${esc(t.holdingLabels.join(", "))}</span><span class="sr-only">Le détail s'affiche avec ton résultat</span></div>` : ""}
      </div>
      ${footer(`<button class="btn btn--primary" data-next>Voir ma note</button>`)}
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
let scanPreview = null; // la photo de face, en mémoire seulement, pour l'écran d'analyse
let scanPhotos = {}; // les 2 selfies, en mémoire seulement (jamais enregistrés), pour les écrans d'analyse
// ---------- Caméra dans la page : ovale, face puis profil, « C'est bon / Je la reprends » ----------
const cam = { step: "face", phase: "live", stream: null };
function stopCam() { cam.stream?.getTracks().forEach((t) => t.stop()); cam.stream = null; }
async function startCam() {
  const v = document.getElementById("cam-video");
  if (!v) return;
  if (!navigator.mediaDevices?.getUserMedia) { cam.phase = "fallback"; return render(); }
  try {
    if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
    const now = document.getElementById("cam-video");
    if (!now) return stopCam();
    now.srcObject = cam.stream;
    await now.play().catch(() => {});
  } catch {
    cam.phase = "fallback"; render();
  }
}
function snap() {
  const v = document.getElementById("cam-video");
  if (!v || !v.videoWidth) return;
  const k = Math.min(1, 1024 / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
  c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
  shots[cam.step] = c.toDataURL("image/jpeg", 0.85);
  cam.phase = "review"; stopCam(); render();
}
function keepShot() {
  if (cam.step === "face") { cam.step = "profil"; cam.phase = "live"; return render(); }
  launchScan();
}
function launchScan() {
  stopCam();
  scanPreview = shots.face; scanPhotos = { face: shots.face, profil: shots.profil };
  startScan(); next();
}
async function loadTeaser() { S.teaser = await api("teaser", null, { method: "GET" }).catch(() => null); save(); }
// Écran d'analyse : on montre les critères que l'analyse lit vraiment
function runScanning() {
  const el = document.getElementById("reading");
  const labels = FACTORS.map((f) => f.label);
  let k = 0;
  const tick = setInterval(() => {
    if (!document.getElementById("reading")) return clearInterval(tick);
    el.textContent = `Lecture : ${labels[k % labels.length]}…`;
    if (++k > labels.length) { clearInterval(tick); el.textContent = "C'est noté. Le reste se calcule pendant tes réponses."; }
  }, 260);
}
function startScan() {
  S.scan = "running"; S.scanError = ""; save();
  scanPromise = api("scan", { face: shots.face, profil: shots.profil, turnstile: tsToken })
    .then((r) => { if (r.ok) S.scan = "done"; else { S.scan = "failed"; S.scanError = r.message; } })
    .catch((e) => { S.scan = "failed"; S.scanError = e.message; })
    .finally(() => { shots.face = shots.profil = null; save(); }); // on oublie les photos tout de suite
}

let projWaiting = false;
async function runProjection() {
  if (S.scan === "running" && scanPromise && !projWaiting) {
    projWaiting = true; await scanPromise; projWaiting = false;
    if (S.scan === "done") await loadTeaser();
    if (SCREENS[S.i].type === "projection") render();
  } else if (S.scan === "done" && S.teaser === undefined) {
    await loadTeaser(); if (S.teaser === null) S.teaser = {};
    if (SCREENS[S.i].type === "projection") render();
  }
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
  if (s.type !== "photos") stopCam();
  if (s.type === "photos") { mountTurnstile(); if (cam.phase === "live") startCam(); }
  if (s.type === "projection") runProjection();
  if (s.type === "building") runBuilding();
  if (s.type === "scanning") runScanning();
  if (s.type === "paywall") { if (!S.pw) loadPaywall().catch((e) => { app.querySelector("h1").textContent = e.message; }); else { startTimer(); mountCheckout(); } }
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
  if (t.hasAttribute("data-scan")) return launchScan();
  if (t.hasAttribute("data-shoot")) return snap();
  if (t.hasAttribute("data-keep")) return keepShot();
  if (t.hasAttribute("data-reshoot")) { cam.phase = "live"; return render(); }
  if (t.hasAttribute("data-tomail")) { if (S.scan === "done") await loadTeaser(); return next(); }
  if (t.dataset.sheet) return answerSheet(t.dataset.sheet, t.dataset.v === "1");
  if (t.hasAttribute("data-retake")) { S.consent = true; cam.step = "face"; cam.phase = "live"; shots.face = shots.profil = null; return goTo("photos"); }
  if (t.hasAttribute("data-pay")) return pay(t);
  if (t.hasAttribute("data-gopay")) { const box = document.getElementById("pay"); box?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); box?.querySelector("h2")?.setAttribute("tabindex", "-1"); box?.querySelector("h2")?.focus({ preventScroll: true }); return; }
});

app.addEventListener("change", async (e) => {
  const input = e.target;
  const s = SCREENS[S.i];
  if (input.dataset.shot) {
    const file = input.files?.[0];
    if (!file) return;
    try {
      shots[input.dataset.shot] = await shrink(file);
      if (cam.phase !== "fallback") { stopCam(); cam.step = input.dataset.shot; cam.phase = "review"; }
      render();
    }
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
    S.lead = true; S.scanned = r.scanned; S.offers = r.offers; S.offer = r.defaultOffer; S.pw = null;
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
  const n = app.querySelectorAll("[data-bar]").length;
  const face = n === 4; // la 1re barre est le rapport du visage : elle ne finit qu'avec la vraie analyse
  let q = 0;
  for (let k = 0; k < n; k++) {
    await animate(k, 0, face && k === 0 ? 85 : 60, 1100);
    if (s.sheets[q]) await ask(s.sheets[q++]);
    if (!(face && k === 0)) await animate(k, 60, 100, 700);
  }
  if (face) { if (scanPromise) await scanPromise; await animate(0, 85, 100, 500); }
  if (SCREENS[S.i] !== s) return;
  const btn = app.querySelector("[data-tomail]");
  if (S.scan === "failed") {
    document.getElementById("build-error").innerHTML = `<div class="alert" role="alert">${esc(S.scanError || "L'analyse de tes photos n'a pas marché.")}</div>
      <button class="btn btn--secondary" data-retake>Reprendre les photos</button>`;
  }
  btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = S.scan === "failed" ? "Continuer sans scan" : "Voir mon résultat";
}

// ---------- Page de paiement ----------
// Le sceau de la garantie : notre propre dessin, avec nos vraies conditions (1re semaine, demande sous 14 jours)
function seal() {
  return `<svg class="seal" viewBox="0 0 120 120" role="img" aria-label="Garantie : 1re semaine remboursée, demande sous 14 jours">
    <defs><linearGradient id="seal-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--c-gold)"/><stop offset=".55" stop-color="var(--c-warning)"/><stop offset="1" stop-color="var(--c-accent)"/></linearGradient>
      <path id="seal-arc" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"/></defs>
    <circle cx="60" cy="60" r="56" fill="none" stroke="url(#seal-g)" stroke-width="4" stroke-dasharray="3 3"/>
    <circle cx="60" cy="60" r="50" fill="url(#seal-g)"/>
    <circle cx="60" cy="60" r="34" fill="var(--c-bg)"/>
    <text font-family="Inter, sans-serif" font-size="10.5" font-weight="800" fill="var(--c-on-accent)"><textPath href="#seal-arc" textLength="268" lengthAdjust="spacing">SATISFAIT OU REMBOURSÉ ✦ 1RE SEMAINE ✦</textPath></text>
    <text x="60" y="62" text-anchor="middle" font-family="Archivo, sans-serif" font-size="26" font-weight="800" fill="var(--c-gold)">14</text>
    <text x="60" y="76" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" font-weight="700" fill="var(--c-text)">JOURS</text>
  </svg>`;
}
// Charge tout ce que la page affiche (aperçu réel, réservation de l'essai, réglages), puis lance le minuteur et le paiement
async function loadPaywall() {
  const [teaser, offer, config] = await Promise.all([
    api("teaser", null, { method: "GET" }).catch(() => ({})),
    api("offer", null, { method: "GET" }),
    api("config", null, { method: "GET" }).catch(() => ({})),
  ]);
  S.pw = { teaser, offer, stripeKey: config.stripeKey || "", waiverOnSite: !config.waiverInStripe, support: config.support || "" };
  save(); render();
}
let timerTick = null;
function startTimer() {
  clearInterval(timerTick);
  const el = document.getElementById("timer");
  if (!el || !S.pw?.offer.trial) return;
  // le décalage d'horloge du téléphone ne compte pas : on part de l'heure du serveur
  const skew = S.pw.offer.now - Date.now();
  const update = () => {
    const left = S.pw.offer.expires_at - (Date.now() + skew);
    if (left <= 0) { clearInterval(timerTick); S.pw = null; save(); loadPaywall().catch(() => {}); return; }
    const m = Math.floor(left / 60e3), s = Math.floor((left % 60e3) / 1e3);
    el.textContent = `${m}:${String(s).padStart(2, "0")}`;
  };
  update(); timerTick = setInterval(update, 1000);
}
let embedded = null;
async function mountCheckout() {
  const box = document.getElementById("checkout");
  if (!box || !S.pw?.stripeKey) return;
  try {
    if (!window.Stripe) await new Promise((ok, ko) => { const sc = document.createElement("script"); sc.src = "https://js.stripe.com/v3/"; sc.onload = ok; sc.onerror = ko; document.head.append(sc); });
    embedded?.destroy();
    embedded = await window.Stripe(S.pw.stripeKey).initEmbeddedCheckout({
      fetchClientSecret: async () => (await api("checkout", { offer: DEFAULT_OFFER, embedded: true })).clientSecret,
    });
    embedded.mount(box);
  } catch (e) {
    document.getElementById("pay-error").innerHTML = `<div class="alert" role="alert">Le paiement ne s'affiche pas. Recharge la page.</div>`;
  }
}

async function pay(btn) {
  const box = document.getElementById("pay-error");
  if (document.getElementById("waiver") && !document.getElementById("waiver").checked) { box.innerHTML = '<div class="alert" role="alert">Coche la case juste au-dessus pour recevoir ton résultat tout de suite.</div>'; document.getElementById("waiver").focus(); box.scrollIntoView({ block: "center" }); return; }
  btn.setAttribute("aria-busy", "true");
  try { const { url } = await api("checkout", { offer: DEFAULT_OFFER, waiver: Boolean(document.getElementById("waiver")?.checked) }); location.href = url; }
  catch (e) { btn.removeAttribute("aria-busy"); box.innerHTML = `<div class="alert" role="alert">${esc(e.message)}</div>`; box.scrollIntoView({ block: "center" }); }
}

// Si l'onglet a été rechargé pendant l'analyse, les photos sont perdues : on propose de les reprendre
if (S.scan === "running") { S.scan = "failed"; S.scanError = "La page a été rechargée pendant l'analyse."; }
render();
