// Cookies de mesure (pixel Meta) : rien n'est chargé ni envoyé à Meta avant l'accord de la personne (CNIL).
// « Refuser » aussi simple et visible qu'« Accepter », choix gardé 6 mois, modifiable à tout moment (lien « Cookies »).
// Sans identifiant de pixel (META_PIXEL_ID dans wrangler.toml), aucune bannière et rien n'est envoyé.
// Continuer sans répondre n'est pas un accord : la bannière se ferme pour cette visite, rien n'est envoyé, elle revient à la suivante.
const KEY = "mogx-consent";
const KEEP = 182 * 864e5; // 6 mois
let choice = null;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  if (saved && Date.now() - saved.at < KEEP) choice = saved.v;
} catch {}
let pixel = "", loaded = false, queue = [], box = null;

function load() {
  if (loaded || !pixel) return;
  loaded = true;
  /* code officiel du pixel Meta */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, "script", "https://connect.facebook.net/fr_FR/fbevents.js");
  window.fbq("init", pixel);
  window.fbq("track", "PageView");
  queue.forEach(([event, params]) => window.fbq("track", event, params || {}));
  queue = [];
}

// event : nom d'événement standard de Meta (ViewContent, InitiateCheckout, StartTrial, Purchase…)
export function track(event, params) {
  if (choice === "no" || !event || !pixel) return;
  if (loaded) window.fbq("track", event, params || {});
  else if (queue.length < 20) queue.push([event, params]);
}

function choose(v) {
  choice = v;
  try { localStorage.setItem(KEY, JSON.stringify({ v, at: Date.now() })); } catch {}
  hide();
  if (v === "yes") load(); else queue = [];
}
function hide() { box?.remove(); box = null; }

function show() {
  if (box || !pixel) return;
  box = document.createElement("div");
  box.className = "cookie-bar";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "Cookies");
  box.innerHTML = `<p><b>Cookies de mesure</b><br>Avec ton accord, Meta (Facebook, Instagram) nous dit si tu viens de nos pubs, pour les améliorer. Rien n'est envoyé si tu refuses. Tu peux changer d'avis à tout moment (lien « Cookies » en bas de la page de paiement et dans ton espace). <a href="/confidentialite/#cookies">En savoir plus</a></p>
    <div class="cookie-bar__btns"><button type="button" class="btn btn--secondary" data-c="no">Refuser</button><button type="button" class="btn btn--secondary" data-c="yes">Accepter</button></div>`;
  box.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (b) choose(b.dataset.c); });
  document.body.append(box);
}

export function initConsent(id) {
  pixel = String(id || "").replace(/\D/g, "");
  if (!pixel) return;
  if (choice === "yes") load();
  else if (choice !== "no") show();
}
// La personne continue sans répondre : on range la bannière pour cette visite (rien n'est envoyé)
export function setAsideConsent() { if (choice === null) hide(); }
// Lien « Cookies » : la question revient ; refuser après avoir accepté arrête l'envoi (rechargement)
export function reopenConsent() {
  if (!pixel) return;
  const was = choice;
  choice = null; hide(); show();
  if (was === "yes") box.querySelector('[data-c="no"]').addEventListener("click", () => location.reload());
}
export const consentEnabled = () => Boolean(pixel);
