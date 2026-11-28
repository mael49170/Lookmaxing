// Le quiz : un écran à la fois, décrit dans /shared/questions.js.
import { SCREENS, S11_TEXT, DIFFICULTES, profile, PROFILE_DIMS } from "/shared/questions.js";
import { OFFERS, DEFAULT_OFFER, euros, priceLines, guaranteeText } from "/shared/plans.js";
import { FACTORS } from "/shared/factors.js";
import { faceMesh } from "/q/mesh.js";
import { initConsent, track, setAsideConsent, reopenConsent, consentEnabled } from "/shared/consent.js";

const app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ICON_BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const ICON_GO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
const ICON_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
// ---------- Dessins maison (aucune photo de vraie personne) ----------
const ICON_CAM = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const ICON_GALLERY = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="15" height="13" rx="2"/><path d="M7 2h12a2 2 0 0 1 2 2v11"/><path d="m3 15 4-4 5 5 2-2 4 4"/></svg>';
const AVATARS = {
  homme: `<svg class="avatar" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="var(--c-surface-alt)"/><path d="M11 46c1.5-8 6.5-11.5 13-11.5S35.5 38 37 46" fill="var(--c-accent-line)"/><ellipse cx="24" cy="22" rx="8.5" ry="10.5" fill="var(--c-gold)"/><path d="M15 20c-.5-7.5 4.5-11 9.5-11s10 3.5 8.5 11c-1.5-3.5-5.5-5-8.5-5S16.5 16.5 15 20z" fill="var(--c-text)"/></svg>`,
  femme: `<svg class="avatar" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="var(--c-surface-alt)"/><path d="M13 36c-3-9-2-26 11-26s14 17 11 26z" fill="var(--c-accent)"/><path d="M11 46c1.5-8 6.5-11.5 13-11.5S35.5 38 37 46" fill="var(--c-accent-line)"/><ellipse cx="24" cy="23" rx="8" ry="10" fill="var(--c-gold)"/><path d="M15.5 21c0-6.5 4-9.5 8.5-9.5s8.5 3 8.5 9.5c-3-2-6-5-8.5-5.5-1.5 2.5-4.5 4.5-8.5 5.5z" fill="var(--c-accent)"/></svg>`,
};
// Silhouettes de corps, dessinées (demi-largeurs : épaules, taille, ventre)
const BODY = { musclee: [26, 15, 0, true], mince: [17, 12, 0], moyenne: [21, 17, 2], enrobee: [23, 21, 9] };
// Photos (créées par IA, fournies par Maël) : on les utilise dès qu'elles existent, sinon le dessin.
// Silhouettes : seulement quand les 4 photos du genre sont là (sinon le mélange photo / dessin fait bricolé).
const PHOTOS = new Set(["profil-homme", "profil-femme", "morpho-homme-musclee", "morpho-homme-moyenne", "morpho-homme-mince", "morpho-homme-enrobee", "morpho-femme-musclee", "morpho-femme-mince", "morpho-femme-moyenne", "morpho-femme-enrobee"]);
const genreKey = () => (S.answers.genre === "femme" ? "femme" : "homme");
const morphoPhotos = () => ["musclee", "mince", "moyenne", "enrobee"].every((m) => PHOTOS.has(`morpho-${genreKey()}-${m}`));
const profileArt = () => (PHOTOS.has(`profil-${genreKey()}`) ? `<img src="/img/profil-${genreKey()}.webp" alt="" width="600" height="800" decoding="async">` : PROFILE_ART);
function bodyArt(id) {
  if (morphoPhotos()) return `<img class="body-photo" src="/img/morpho-${genreKey()}-${id}.webp" alt="" width="480" height="480" decoding="async">`;
  const [sh, wa, be, mus] = BODY[id] || BODY.moyenne;
  const c = 40;
  const torso = `M${c - sh} 34 C${c - sh} 28 ${c + sh} 28 ${c + sh} 34 C${c + sh + 1} 56 ${c + wa + be} 74 ${c + wa} 100 L${c - wa} 100 C${c - wa - be} 74 ${c - sh - 1} 56 ${c - sh} 34Z`;
  const arms = `M${c - sh} 34 C${c - sh - 9} 46 ${c - sh - 8} 70 ${c - sh - 6} 92 M${c + sh} 34 C${c + sh + 9} 46 ${c + sh + 8} 70 ${c + sh + 6} 92`;
  const lines = mus ? `<path d="M${c - 12} 50 Q${c - 6} 56 ${c} 50 Q${c + 6} 56 ${c + 12} 50 M${c} 58 V90 M${c - 8} 66 H${c + 8} M${c - 8} 76 H${c + 8}" stroke="var(--c-accent)" stroke-width="1.4" fill="none" opacity=".8"/>` : "";
  return `<svg class="body-art" viewBox="0 0 80 104" aria-hidden="true"><circle cx="${c}" cy="15" r="10" fill="var(--c-gold)"/><path d="M${c - 4} 24h8v6h-8z" fill="var(--c-gold)"/><path d="${arms}" stroke="var(--c-gold)" stroke-width="${mus ? 9 : be > 5 ? 9 : 7}" stroke-linecap="round" fill="none"/><path d="${torso}" fill="var(--c-gold)"/>${lines}</svg>`;
}
// Le profil (2e selfie), dessiné au trait avec quelques points « thermiques »
const PROFILE_ART = `<svg class="profile-art" viewBox="0 0 100 130" aria-hidden="true"><defs>
  <linearGradient id="pf-fill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--c-bg)"/><stop offset="1" stop-color="var(--c-surface-alt)"/></linearGradient>
  <linearGradient id="pf-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--c-gold)"/><stop offset=".55" stop-color="var(--c-accent)"/><stop offset="1" stop-color="var(--c-heat-deep)"/></linearGradient>
  <radialGradient id="pf-glow" cx="78%" cy="45%" r="45%"><stop offset="0" stop-color="var(--c-glow)" stop-opacity=".35"/><stop offset="1" stop-color="var(--c-glow)" stop-opacity="0"/></radialGradient></defs>
  <rect width="100" height="130" fill="url(#pf-glow)"/>
  <g transform="translate(-8 6)">
  <path d="M30 130C28 112 21 97 21 77C21 41 35 15 56 15C71 15 79 25 79 39L80 47C81 51 87 56 89 59C90 61 87 62 83 63C83 65 85 67 84 69C83 70 81 71 82 73C83 75 82 77 80 78C80 82 80 86 77 89C73 92 67 92 63 93L65 130Z" fill="url(#pf-fill)"/>
  <path d="M56 15C71 15 79 25 79 39L80 47C81 51 87 56 89 59C90 61 87 62 83 63C83 65 85 67 84 69C83 70 81 71 82 73C83 75 82 77 80 78C80 82 80 86 77 89C73 92 67 92 63 93L65 130" fill="none" stroke="url(#pf-rim)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 2.5px var(--c-glow))"/>
  </g>
</svg>`;
// « Aujourd'hui / avec ton plan » : construit avec SES réponses, sans promesse de résultat
const OUTCOME = {
  confiance: "Une assurance qui se travaille chaque jour", rencontres: "Une première impression soignée", invisible: "Une présence qu'on remarque",
  visage: "Un visage mis en valeur : peau, coupe, barbe", poids: "Une silhouette qui s'affine, semaine après semaine", peau: "Une routine de peau que tu tiens",
  cheveux: "Une coupe choisie pour ton visage", presence: "Un regard et une voix plus posés", progresser: "Des progrès suivis jour après jour",
};

// ---------- État (gardé dans l'onglet pour survivre à un rechargement) ----------
const KEY = "lm_quiz_v1";
let S = load() || fresh();
// Analyse faite après le paiement, depuis l'espace : on ouvre directement l'écran des selfies
{
  const p = new URLSearchParams(location.search);
  if (p.get("analyse") === "1") {
    S = { ...fresh(), rescan: true, answers: { genre: p.get("g") === "femme" ? "femme" : "homme" } };
    S.i = SCREENS.findIndex((x) => x.id === "selfies");
    history.replaceState(null, "", location.pathname);
  }
}
function fresh() {
  const p = new URLSearchParams(location.search);
  return {
    i: 0, history: [], answers: {}, consent: null, scan: "idle", scanError: "", lead: false,
    variant: p.get("v") === "b" ? "b" : "a",
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
  setAsideConsent(); // continuer sans répondre à la bannière cookies n'est pas un accord : rien n'est envoyé
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

// Noms des parties du plan (page de paiement)
const MODULES = { peau: "Peau nette", cheveux: "Coupe et cheveux", corps: "Corps et énergie", style: "Style", presence: "Assurance et présence" };

// Le maillage étiré sur la zone de l'ovale de la caméra (voir .mesh--onface)
const onFace = (svg) => svg.replace("<svg ", '<svg preserveAspectRatio="none" ');

// ---------- Accords au féminin ----------
// Les textes sont écrits au masculin ; pour une femme on accorde, et on retire ce qui ne la concerne pas (barbe).
const FEM = [[/Je suis prêt\b/g, "Je suis prête"], [/senti mis de côté/g, "sentie mise de côté"], [/inquiet ou débordé/g, "inquiète ou débordée"],
  [/pris au sérieux/g, "prise au sérieux"], [/maître de moi/g, "maîtresse de moi"], [/Nerveux,/g, "Nerveuse,"], [/coupe, barbe, sommeil/g, "coupe, sourcils, sommeil"], [/^Cheveux, barbe : qu'est-ce qui coince \?$/, "Et côté cheveux, qu'est-ce qui coince ?"],
  [/Chemise, chino/g, "Chemisier, blazer"], [/Jogging, survêt/g, "Legging, jogging"], [/moins séduisant\b/g, "moins séduisante"]];
const gx = (t) => (S.answers.genre === "femme" && typeof t === "string" ? FEM.reduce((x, [a, b]) => x.replace(a, b), t) : t);
function genderize(s) {
  if (S.answers.genre !== "femme") return s;
  const out = { ...s };
  for (const k of ["title", "lead", "cta", "eyebrow", "note", "confirm"]) if (out[k]) out[k] = gx(out[k]);
  if (out.options) out.options = out.options.filter((x) => x.id !== "barbe").map((x) => ({ ...x, label: gx(x.label), ...(x.hint ? { hint: gx(x.hint) } : {}) }));
  if (out.echo) { const e = out.echo; out.echo = (a) => gx(e(a)); }
  if (out.sources) out.sources = out.sources.map(([f, ...rest]) => [gx(f), ...rest]);
  return out;
}

// ---------- Écrans ----------
const VIEWS = {
  landing() {
    // Accueil le plus court possible : un titre, puis on choisit Homme ou Femme (c'est déjà la 1re réponse du quiz)
    return `<main class="screen landing">
      <div class="brand">MOGX</div>
      <p class="proof-bar"><span><svg class="proof-bar__flag" viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#F6F3EF"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>MOGX, top en France</span></p>
      <h1 class="title title--hero landing__title" tabindex="-1">Ce que les autres voient de toi <span class="hot">en 3 secondes.</span></h1>
      <p class="lead landing__lead">Ta note sur 15 critères, et exactement quoi changer pour la faire monter.</p>
      <fieldset class="gcards"><legend class="sr-only">Tu es…</legend>
        ${[["homme", "Homme"], ["femme", "Femme"]].map(([id, label]) => `<label class="gcard"><input class="gcard__input" type="radio" name="genre" value="${id}" ${S.answers.genre === id ? "checked" : ""}>
          <img class="gcard__img" src="/img/carte-${id}.webp" alt="" width="600" height="800" decoding="async">
          <span class="gcard__frame" aria-hidden="true"></span>
          <span class="gcard__foot"><span class="gcard__label">${label}</span><span class="gcard__go" aria-hidden="true">${ICON_GO}</span></span></label>`).join("")}
      </fieldset>
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
      ${s.unis ? `<div class="unis" aria-label="Universités des chercheurs cités">${s.unis.map((u) => `<span>${esc(u)}</span>`).join("")}</div>` : ""}
      ${s.sources ? `<ul class="sources">${s.sources.map(([f, u, c]) => c ? `<li><span class="sources__uni">${esc(u)}</span><b>${esc(f)}</b><span>${esc(c)}</span></li>` : `<li><b>${esc(f)}</b><span>${esc(u)}</span></li>`).join("")}</ul>` : ""}
      ${s.fine ? `<p class="fine">${esc(s.fine)}</p>` : ""}
      ${echoHtml(s)}
      ${footer(`<button class="btn btn--primary" data-next>${esc(s.cta || "Continuer")}</button>`)}
    </main>`;
  },

  selfies() {
    return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">2 selfies, et ton analyse démarre.</h1>
      <div class="examples">
        <figure class="example"><div class="example__art example__art--photo"><img src="/img/carte-${S.answers.genre === "femme" ? "femme" : "homme"}.webp" alt="" width="600" height="800" decoding="async"><span class="frame" aria-hidden="true"></span></div><span class="example__num">1</span><figcaption>De face</figcaption></figure>
        <figure class="example"><div class="example__art example__art--profile">${profileArt()}<span class="frame" aria-hidden="true"></span></div><span class="example__num">2</span><figcaption>De profil</figcaption></figure>
      </div>
      <p class="lead">Un selfie de toi, bien éclairé, sans lunettes ni casquette.</p>
      ${footer(`<p class="consent-line">En touchant « Prendre mes selfies », tu acceptes que notre IA analyse ton visage sur ces 2 photos pour calculer ta note. Jamais enregistrées, vues par personne. <a href="/biometrie/" target="_blank" rel="noopener">Détails</a></p><button class="btn btn--primary" data-selfies>${ICON_CAM} Prendre mes selfies</button><button class="btn btn--ghost" data-noscan>Continuer sans photo</button>`)}
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
        <svg class="cam__oval" viewBox="0 0 100 133" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><ellipse cx="50" cy="60" rx="${k === "face" ? 29 : 31}" ry="42"/></svg>
        <span class="cam__step">${k === "face" ? "1/2" : "2/2"} · ${k === "face" ? "De face" : "De profil"}</span>
        <div class="cam__example" aria-hidden="true">${k === "face" ? `<img src="/img/carte-${genreKey()}.webp" alt="">` : profileArt()}</div>
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
      <h1 class="title title--hero" tabindex="-1"><span class="big-gain">+${esc(t.gain)}</span> point${t.gain > 1 ? "s" : ""} à gagner.${Number(t.quick) > 0 ? " Les premiers dès 4 semaines." : ""}</h1>
      ${Number(t.quick) > 0 ? `<ol class="climb" aria-label="Ta progression estimée">
        <li class="climb__step"><span class="climb__when">Semaine 4</span><b class="climb__pts">+${esc(t.quick)}</b><span class="climb__what">${S.answers.genre === "femme" ? "Coupe, sourcils, posture, style" : "Coupe, barbe, posture, style"}</span><i class="climb__bar" style="--w:${Math.max(18, Math.round((100 * t.quick) / t.gain))}%"></i></li>
        <li class="climb__step"><span class="climb__when">Semaine 12</span><b class="climb__pts">+${esc(t.gain)}</b><span class="climb__what">Peau, silhouette, tout ton plan</span><i class="climb__bar" style="--w:100%"></i></li>
      </ol>` : ""}
      <p class="lead">5 à 10 minutes par jour. Ta note de départ reste cachée jusqu'au résultat.</p>
      <p class="legal">Une estimation calculée seulement sur ce qui se travaille (peau, coupe, posture, style…), jamais sur l'ossature. Pas une promesse : ça dépend de toi.</p>
      ${footer(`<button class="btn btn--primary" data-next>Je veux ces points</button>`)}
    </main>`;
    return `<main class="screen">${topbar()}
      <h1 class="title" tabindex="-1">Ton plan se construit d'après tes réponses.</h1>
      <p class="lead">Encore quelques questions, et ton plan est prêt.</p>
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
    const [title, lead] = (S11_TEXT[first] || S11_TEXT.progresser).map(gx);
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

  paywall() {
    const o = OFFERS[DEFAULT_OFFER];
    const pw = S.pw;
    if (!pw) return `<main class="screen"><div class="brand">MOGX</div><h1 class="title" tabindex="-1">On prépare ta page…</h1><div class="skel"></div><div class="skel"></div></main>`;
    const t = pw.teaser || {};
    const trial = pw.offer.trial;
    const lines = priceLines(o, trial);
    const lock = '<svg class="lock" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1Zm2 0h8V8a4 4 0 1 0-8 0v2Z"/></svg>';
    const row = (f, kind) => `<div class="hidden-row"><span class="hidden-row__name" style="width:${Math.min(70, 18 + f.len * 2.6)}%" aria-hidden="true">${lock}</span><span class="sr-only">Critère caché jusqu'au paiement :</span><b class="hidden-row__note hidden-row__note--${kind}">${f.note}</b></div>`;
    // faux texte flouté (le vrai contenu n'est jamais envoyé avant le paiement), de la longueur du vrai
    const blurText = (len) => Array.from({ length: Math.max(4, Math.round(Math.min(len, 170) / 6)) }, (_, k) => "xxxxxxxxxx".slice(0, 3 + ((k * 7) % 6))).join(" ");
    // Ordre (27/11/2026, inspiré du concurrent) : l'envie d'abord (ton analyse), l'offre, le paiement TOUT DE SUITE,
    // puis les preuves (forces, freins, programme) avec un bouton après chaque partie, et la réassurance à la fin.
    // Le prix de renouvellement reste juste au-dessus du bouton de paiement (loi, et règles Stripe pour les essais).
    const payBlock = `<section class="block paybox" id="pay">
        <h2 class="block__title">${trial ? `Ton essai à ${esc(euros(o.intro))}` : "Ton accès complet"}</h2>
        ${trial ? "" : `<p class="block__lead">La réservation de l'essai à ${esc(euros(o.intro))} est terminée pour toi.</p>`}
        <div class="offer offer--single">
          <span class="offer__main"><span class="offer__name">${esc(o.label)}</span><span class="offer__renew">${trial ? `${o.trialDays} jours pour tout débloquer` : "1re semaine"}</span></span>
          <span class="offer__price">${esc(euros(trial ? o.intro : o.renew))}<span class="offer__day">aujourd'hui</span></span>
        </div>
        ${pw.stripeKey ? `<p class="terms-line">${esc(lines.full)}</p><div id="checkout" class="checkout"></div>` : `
          ${pw.waiverOnSite ? `<label class="check"><input type="checkbox" id="waiver"><span>Je veux mon résultat tout de suite et je renonce à mon droit de rétractation de 14 jours une fois le résultat ouvert.</span></label>` : ""}
          <p class="terms-line">${esc(lines.full)}</p>
          <button class="btn btn--primary" data-pay>Débloquer mon résultat, ${esc(euros(trial ? o.intro : o.renew))}</button>`}
        <div id="pay-error"></div>
        <p class="paybox__trust">🔒 Paiement sécurisé par Stripe · Apple Pay, Google Pay ou carte · <a href="/cgv/" target="_blank" rel="noopener">CGV</a></p>
        <p class="paybox__trust">✅ Satisfait ou remboursé sur ta 1re semaine payée, sous conditions (<a href="#garantie">voir plus bas</a>)</p>
      </section>`;
    const cta = (label) => `<button class="btn btn--primary" data-gopay>${label}</button>`;
    return `<main class="screen screen--sales">
      <div class="brand">MOGX</div>
      ${t.scanned ? `
      <section class="scanhero">
        <h2 class="scanhero__title">Ton analyse est prête</h2>
        <div class="scanhero__photo">${scanPreview ? `<img src="${scanPreview}" alt="Ta photo analysée">${onFace(faceMesh({ className: "mesh mesh--onface" }))}` : faceMesh({ className: "mesh scanhero__mesh" })}</div>
        <div class="scanhero__rows">
          <div class="scanhero__row"><span>Ta note aujourd'hui</span><b class="scanhero__locked">${lock}<i aria-hidden="true">?,?</i><span class="sr-only">cachée jusqu'au paiement</span></b></div>
          <div class="scanhero__row"><span>Ton max</span><b class="scanhero__max">${esc(t.max)}<small>/100</small></b></div>
          <div class="scanhero__row"><span>À aller chercher</span><b class="scanhero__gain">+${esc(t.gain)}<small>points</small></b></div>
          ${Number(t.quick) > 0 ? `<div class="scanhero__row"><span>Dont dès 4 semaines</span><b class="scanhero__gain">+${esc(t.quick)}<small>points</small></b></div>` : ""}
        </div>
      </section>` : ""}
      <section class="pitch">
        <h1 class="title title--hero" tabindex="-1">${t.scanned ? `Tu peux monter jusqu'à ${esc(t.max)}/100.` : "Ton plan de 28 jours est prêt."}</h1>
        <ul class="pitch__list">
          ${t.scanned ? "<li>Ta note et tes 15 critères, expliqués un par un</li><li>Tes forces, et ce qui te freine vraiment</li>" : "<li>Ton analyse de visage sur 15 critères, à faire dans ton espace</li><li>Ton bilan d'après tes réponses</li>"}
          <li>Ton plan de 28 jours, fait pour ${t.scanned ? "ton visage" : "toi"}, 5 à 10 minutes par jour</li>
          <li>Résiliable en ligne en un clic</li>
        </ul>
        ${trial ? `<div class="reserved"><span class="reserved__icon" aria-hidden="true">🎁</span><span><b>Essai à ${esc(euros(o.intro))} réservé pour toi</b><span>Réservation : <b data-timer>--:--</b>, une seule fois</span></span></div>` : ""}
      </section>
      ${payBlock}
      ${t.scanned ? `
      <section class="block"><h2 class="block__title">Tes points forts</h2><p class="block__lead">Ce qui joue déjà pour toi.</p>${t.strengths.map((f) => row(f, "hot")).join("")}</section>
      <section class="block"><h2 class="block__title">Ce qui te freine</h2><p class="block__lead">${t.holding} critère${t.holding > 1 ? "s" : ""} qui se travaille${t.holding > 1 ? "nt" : ""}. C'est là que sont tes points.</p>${t.weaknesses.map((f) => row(f, "low")).join("")}
        <p class="more">${lock} Les noms et le détail dans ton rapport complet</p></section>
      ${cta("Obtenir mon rapport complet")}` : ""}
      <section class="block"><h2 class="block__title">Ton programme de 28 jours</h2><p class="block__lead">Fait pour toi, dans l'ordre de ce qui te fera gagner le plus. Le détail se débloque avec ton accès.</p>
        ${(t.modules || []).map((m, i) => `<div class="module${i === 0 ? " module--first" : ""}">
          <div class="module__head"><span class="module__name">${esc(m.title)}</span><span class="module__count">4 semaines</span></div>
          <p class="module__why">${esc(m.why)}</p>
          <ul class="module__keys">${m.steps.map((len, k) => `<li><b>Semaine ${k + 1}</b><span class="blurline" aria-hidden="true">${blurText(len)}</span><span class="sr-only">Détail caché jusqu'au paiement.</span></li>`).join("")}</ul>
          ${m.daily ? `<p class="module__daily">${lock}<span>+ ${m.daily} geste${m.daily > 1 ? "s" : ""} au quotidien</span></p>` : ""}
        </div>`).join("")}
        <p class="module__habits">${lock}<span>Chaque jour, tes actions à cocher dans ton espace, avec un rappel le matin si tu veux.</span></p>
      </section>
      ${cta("Obtenir mon plan")}
      <section class="block block--guarantee" id="garantie">
        <div class="guarantee-head"><h2 class="block__title">Satisfait ou remboursé</h2>${seal()}</div>
        <p class="block__lead">${esc(guaranteeText(o))}</p>
        <p class="block__lead">Pas de justificatif à envoyer : ton suivi dans ton espace suffit. <a href="/cgv/#garantie" target="_blank" rel="noopener">Les conditions en détail</a></p>
      </section>
      ${cta(trial ? `Commencer pour ${esc(euros(o.intro))}` : "Obtenir mon accès")}
      <section class="block block--card">
        <h2 class="block__title">Tes infos sont en sécurité</h2>
        <p class="block__lead">On ne vend ni ne partage tes données, à personne. Tes photos ne sont jamais enregistrées : elles servent à l'analyse, puis elles disparaissent. <a href="/confidentialite/" target="_blank" rel="noopener">En savoir plus</a></p>
      </section>
      ${pw.support ? `<section class="block block--card">
        <h2 class="block__title">Une question avant de payer ?</h2>
        <p class="block__lead">Écris-nous, une vraie personne te répond.</p>
        <a class="btn btn--secondary" href="mailto:${esc(pw.support)}">Écrire à ${esc(pw.support)}</a>
      </section>` : ""}
      <nav class="mini-legal" aria-label="Informations"><a href="/infos/">Prix et infos</a><a href="/connexion/">Mon espace</a><a href="/cgv/">CGV</a><a href="/confidentialite/">Confidentialité</a><a href="/mentions-legales/">Mentions légales</a>${consentEnabled() ? '<button type="button" class="linklike" data-cookies>Cookies</button>' : ""}</nav>
      <div class="sticky-pay" role="region" aria-label="Paiement">
        <div class="sticky-pay__info">${trial
          ? `<span class="sticky-pay__timer" id="timer" aria-live="off">--:--</span><span class="sticky-pay__sub">essai à ${esc(euros(o.intro))} réservé</span>`
          : `<span class="sticky-pay__timer">${esc(euros(o.renew))}</span><span class="sticky-pay__sub">la 1re semaine</span>`}</div>
        <button class="btn btn--primary" data-gopay>Débloquer</button>
      </div>
    </main>`;
  },

  scanning() {
    const p = scanPhotos;
    const art = p.face
      ? `<div class="tilted"><div class="tilted__card tilted__card--a"><img src="${p.face}" alt="Ton selfie de face">${onFace(faceMesh({ animated: true, className: "mesh mesh--live mesh--onface" }))}</div>${p.profil ? `<div class="tilted__card tilted__card--b"><img src="${p.profil}" alt="Ton selfie de profil"></div>` : ""}</div>`
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
        <div class="teaser__row teaser__row--hot"><span>Points que tu peux gagner</span><b>+${esc(t.gain || 0)}</b></div>
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
  // on garde exactement le cadre 3:4 où se trouve l'ovale (ce que la personne voyait) : le visage y est placé,
  // ce qui permet ensuite de poser le maillage pile sur le visage
  const box = v.getBoundingClientRect(), vw = v.videoWidth, vh = v.videoHeight;
  const sc = Math.max(box.width / vw, box.height / vh), ox = (box.width - vw * sc) / 2, oy = (box.height - vh * sc) / 2;
  const m = Math.min(box.width / 100, box.height / 133), rw = 100 * m, rh = 133 * m;
  let sx = ((box.width - rw) / 2 - ox) / sc, sy = ((box.height - rh) / 2 - oy) / sc, sw = rw / sc, sh = rh / sc;
  sx = vw - (sx + sw); // l'image affichée est en miroir
  sx = Math.max(0, Math.min(vw - sw, sx)); sy = Math.max(0, Math.min(vh - sh, sy));
  const k = Math.min(1, 1024 / Math.max(sw, sh));
  const c = document.createElement("canvas");
  c.width = Math.round(sw * k); c.height = Math.round(sh * k);
  c.getContext("2d").drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
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

// Après le paiement : on attend la fin de l'analyse puis on retourne dans l'espace (ou on propose de reprendre les photos)
async function finishRescan() {
  const btn = app.querySelector(".screen__footer .btn--primary");
  if (btn) { btn.setAttribute("aria-busy", "true"); btn.textContent = "Analyse en cours…"; }
  if (scanPromise) await scanPromise;
  if (S.scan === "done") { try { sessionStorage.removeItem(KEY); } catch {} location.href = "/app/?analyse=1"; return; }
  app.querySelector(".lead").outerHTML = `<div class="alert" role="alert">${esc(S.scanError || "On n'a pas pu lire tes photos.")} Reprends-les en pleine lumière, de face puis de profil.</div>`;
  if (btn) { btn.removeAttribute("aria-busy"); btn.textContent = "Reprendre les photos"; btn.removeAttribute("data-next"); btn.setAttribute("data-retake", ""); }
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
  const sv = s.variant ? { ...s, ...(s.variant(S.answers) || {}) } : s; // message qui reprend ses réponses
  const view = s.id === "age" && S.answers.age === "-18" ? VIEWS.stop() : (VIEWS[sv.type] || VIEWS.info)(genderize(sv));
  app.innerHTML = view;
  history.replaceState(null, "", location.pathname + location.search);
  if (S.history.length) history.pushState({ i: S.i }, "");
  app.querySelector("h1")?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  trackStep(s.id);
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
  if (S.rescan && t.hasAttribute("data-next") && SCREENS[S.i].type === "scanning") return finishRescan();
  if (S.rescan && t.hasAttribute("data-noscan")) { location.href = "/app/"; return; }
  if (t.hasAttribute("data-next")) return next();
  if (t.hasAttribute("data-cookies")) return reopenConsent();
  if (t.hasAttribute("data-confirm")) { syncQuiz(); return next(); }
  if (t.hasAttribute("data-multi")) { syncQuiz(); return next(); }
  // accord pour l'analyse du visage : donné en touchant « Prendre mes selfies » (phrase juste au-dessus du bouton)
  if (t.hasAttribute("data-selfies")) {
    S.consent = true;
    api("scan-consent", { agree: true }).catch(() => {});
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
  if (input.type === "radio" && (s.type === "single" || s.type === "landing")) {
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
  if (s.type === "landing") track("ViewContent", { content_name: "quiz" });
  // la question du genre est sur l'accueil : on saute l'écran genre
  setTimeout(() => (s.type === "landing" ? go(2) : next()), 250);
}
app.addEventListener("keydown", (e) => {
  const t = e.target;
  if (t.type !== "radio" || !t.name || t.name === "offer") return;
  if (e.key.startsWith("Arrow")) arrowNav = true;
  else if ((e.key === "Enter" || e.key === " ") && t.checked) { e.preventDefault(); arrowNav = false; chooseSingle(t, true); }
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
  // si l'analyse n'a pas marché : aucun message ici, la personne la refera dans son espace après le paiement
  btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = "Voir mon résultat";
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
  const o = OFFERS[DEFAULT_OFFER];
  track("InitiateCheckout", { value: (offer.trial ? o.intro : o.renew) / 100, currency: "EUR" });
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
    const txt = `${m}:${String(s).padStart(2, "0")}`;
    el.textContent = txt;
    document.querySelectorAll("[data-timer]").forEach((x) => { x.textContent = txt; });
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
// Pixel Meta (seulement après accord) : réglé par META_PIXEL_ID dans wrangler.toml
api("config", null, { method: "GET" }).then((c) => { initConsent(c.pixel); if (consentEnabled() && SCREENS[S.i].type === "paywall") render(); }).catch(() => {});
