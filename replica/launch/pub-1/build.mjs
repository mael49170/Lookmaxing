// Fabrique les visuels de la 1re pub Meta de MOGX : 3 variantes × 2 formats (fil 1080×1350, story 1080×1920).
// Lancer : node replica/launch/pub-1/build.mjs  → écrit les HTML (sources) et les PNG dans ce dossier.
// Règles (replica/launch/ads.md) : pas d'avant/après de visage, seuls visages = images créées par IA du projet,
// aucun chiffre inventé (les notes restent cachées « ?? » comme dans l'appli), pas de promesse de résultat.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { faceMesh } from "../../../src/q/mesh.js";
import { OFFERS, euros } from "../../../src/shared/plans.js";

const DIR = dirname(fileURLToPath(import.meta.url));
const SRC = "../../../src";
const o = OFFERS.semaine;
const PRICE = `${euros(o.intro)} les ${o.trialDays} premiers jours, puis ${euros(o.renew)} / semaine`;

// Le maillage posé sur le visage IA (réglé à l'œil sur carte-homme / carte-femme, cadrage 3:4)
const meshOn = (cls = "") => faceMesh({ className: `mesh ${cls}` }).replace("<svg ", '<svg preserveAspectRatio="none" ');

const CSS = `
@font-face { font-family: "Inter"; src: url("${SRC}/fonts/inter.woff2") format("woff2"); font-weight: 100 900; }
@font-face { font-family: "Archivo"; src: url("${SRC}/fonts/archivo.woff2") format("woff2"); font-weight: 100 900; font-stretch: 62% 125%; }
* { box-sizing: border-box; }
html, body { margin: 0; width: 1080px; height: var(--h); overflow: hidden; background: var(--c-bg); color: var(--c-text); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
.ad { position: relative; width: 1080px; height: var(--h); overflow: hidden; display: flex; flex-direction: column; padding: var(--pad-top) 72px var(--pad-bot); gap: 36px;
  background: radial-gradient(70% 45% at 70% 70%, color-mix(in srgb, var(--c-glow) 26%, transparent), transparent 70%), radial-gradient(50% 30% at 10% 0%, color-mix(in srgb, var(--c-warning) 10%, transparent), transparent 70%), var(--c-bg); }
.brand { font-family: var(--font-display); font-stretch: 112%; font-weight: 800; font-size: 40px; letter-spacing: .02em; display: inline-flex; align-items: center; gap: 14px; }
.brand::before { content: ""; width: 18px; height: 18px; border-radius: 50%; background: var(--c-accent); box-shadow: 0 0 22px var(--c-glow); }
.top { display: flex; justify-content: space-between; align-items: center; }
.flag { font-size: 22px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--c-accent-strong); border: 2px solid var(--c-accent-line); background: var(--c-accent-soft); padding: 10px 18px; border-radius: 999px; }
h1 { margin: 0; font-family: var(--font-display); font-stretch: 78%; font-weight: 800; font-size: 104px; line-height: .95; letter-spacing: -.01em; text-transform: uppercase; }
h1 em { font-style: normal; background: var(--heat); -webkit-background-clip: text; background-clip: text; color: transparent; }
.sub { margin: 0; font-size: 34px; line-height: 1.3; color: var(--c-text-muted); font-weight: 500; }
.sub b { color: var(--c-text); }
.chip { display: inline-block; align-self: flex-start; font-size: 22px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; padding: 10px 18px; border-radius: 999px; }
.chip--grey { background: var(--c-surface-alt); color: var(--c-text-muted); border: 2px solid var(--c-border); }
.chip--hot { background: var(--c-accent); color: var(--c-on-accent); box-shadow: 0 10px 40px -8px rgba(255,90,31,.7); }
.cta { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: auto; }
.btn { flex: none; font-family: var(--font-display); font-stretch: 100%; font-weight: 800; font-size: 40px; padding: 30px 48px; border-radius: 999px; background: var(--c-accent); color: var(--c-on-accent); box-shadow: 0 18px 60px -12px rgba(255,90,31,.8); }
.url { font-size: 30px; font-weight: 700; color: var(--c-text); }
.url small { display: block; font-size: 22px; font-weight: 500; color: var(--c-text-muted); margin-top: 6px; }
.storyurl { margin-top: auto; font-size: 26px; font-weight: 700; color: var(--c-text); text-align: center; }
.storyurl small { color: var(--c-text-muted); font-weight: 500; }
.fine { font-size: 20px; color: var(--c-text-muted); opacity: .85; }

/* Téléphone */
.phone { position: relative; aspect-ratio: 9 / 18.5; border-radius: 64px; padding: 14px; background: linear-gradient(160deg, #2c2c31, #0d0d0f 60%); box-shadow: 0 50px 120px -30px rgba(0,0,0,.9), 0 0 0 2px #3a3a40, 0 0 90px -20px color-mix(in srgb, var(--c-glow) 60%, transparent); flex: none; }
.phone__screen { position: relative; width: 100%; height: 100%; border-radius: 52px; overflow: hidden; background: var(--c-bg); display: flex; flex-direction: column; padding: 64px 26px 26px; gap: 18px; font-size: 22px; }
.phone__screen::before { content: ""; position: absolute; top: 16px; left: 50%; width: 120px; height: 32px; transform: translateX(-50%); border-radius: 20px; background: #000; z-index: 3; }
.p-eyebrow { font-size: 16px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--c-accent-strong); }
.p-title { font-family: var(--font-display); font-stretch: 85%; font-weight: 800; font-size: 34px; line-height: 1.05; }
.p-bar { height: 8px; border-radius: 99px; background: var(--c-track); overflow: hidden; }
.p-bar i { display: block; height: 100%; width: var(--w); background: var(--heat); background-size: 380px 100%; border-radius: inherit; box-shadow: 0 0 10px color-mix(in srgb, var(--c-glow) 60%, transparent); }
.photo { position: relative; aspect-ratio: 3 / 4; border-radius: 26px; overflow: hidden; background: #000; flex: none; }
.photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.photo::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, color-mix(in srgb, var(--c-bg) 70%, transparent), transparent 40%); }
.photo .mesh { position: absolute; z-index: 1; left: 26%; top: 20%; width: 48%; height: 45%; }
.photo--f .mesh { left: 26.5%; top: 20%; width: 47%; height: 44%; }
.phone { width: 470px; }
.mesh { display: block; overflow: visible; }
.mesh__links line { stroke: color-mix(in srgb, var(--c-accent) 70%, transparent); stroke-width: .35; vector-effect: non-scaling-stroke; }
.mesh__dots circle { filter: drop-shadow(0 0 1.6px var(--c-glow)); }
.scanline { position: absolute; z-index: 2; left: 0; right: 0; top: 44%; height: 3px; background: var(--c-gold); box-shadow: 0 0 18px 4px var(--c-glow); opacity: .85; }
.photo__tag { position: absolute; z-index: 2; left: 16px; bottom: 14px; font-size: 15px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--c-gold); }
.rows { display: grid; gap: 12px; }
.row { display: grid; grid-template-columns: 1fr 150px; align-items: center; gap: 14px; font-size: 20px; font-weight: 600; }
.score { display: flex; justify-content: space-between; align-items: baseline; padding: 16px 20px; border-radius: 20px; background: var(--c-surface); border: 1px solid var(--c-accent-line); }
.score span { font-size: 18px; color: var(--c-text-muted); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.score b { font-family: var(--font-display); font-weight: 800; font-size: 44px; }
.score b i { font-style: normal; filter: blur(9px); background: var(--heat); -webkit-background-clip: text; background-clip: text; color: transparent; }
.score b small { font-size: 20px; color: var(--c-text-muted); margin-left: 4px; }
.opt { padding: 20px 22px; border-radius: 18px; border: 2px solid var(--c-border); background: var(--c-surface); font-weight: 600; font-size: 22px; }
.opt--on { border-color: var(--c-accent); background: linear-gradient(90deg, var(--c-accent-soft), var(--c-surface)); }
.week { display: grid; gap: 8px; padding: 16px 18px; border-radius: 18px; background: var(--c-surface); border: 1px solid var(--c-border); }
.week--first { border-color: var(--c-accent-line); background: radial-gradient(90% 120% at 0% 0%, color-mix(in srgb, var(--c-glow) 18%, transparent), transparent 70%), var(--c-surface); }
.week b { font-size: 16px; letter-spacing: .14em; text-transform: uppercase; color: var(--c-accent-strong); }
.week span { font-size: 21px; font-weight: 600; }
.check { display: flex; gap: 12px; align-items: center; font-size: 19px; color: var(--c-text-muted); }
.check::before { content: "✓"; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; background: var(--c-accent); color: var(--c-on-accent); font-weight: 900; font-size: 18px; flex: none; }
.p-btn { margin-top: auto; text-align: center; padding: 20px; border-radius: 999px; background: var(--c-accent); color: var(--c-on-accent); font-weight: 800; font-size: 22px; }
`;

const page = (h, body, extra = "") => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>MOGX · pub 1</title>
<link rel="stylesheet" href="${SRC}/styles/tokens.css">
<style>${CSS}
:root { --h: ${h}px; --pad-top: ${h > 1500 ? 250 : 72}px; --pad-bot: ${h > 1500 ? 330 : 64}px; }
${extra}</style></head><body>${body}</body></html>`;

// ——— Écrans d'appli (maquettes des vrais écrans, notes cachées comme avant le paiement) ———
const scanScreen = (g = "homme") => `<div class="phone__screen">
  <div class="p-eyebrow">Analyse en cours</div>
  <div class="photo${g === "femme" ? " photo--f" : ""}"><img src="${SRC}/img/carte-${g}.webp" alt="">${meshOn()}<div class="scanline"></div><div class="photo__tag">15 critères · visage créé par IA</div></div>
  <div class="score"><span>Ta note</span><b><i>??</i><small>/100</small></b></div>
  <div class="rows">
    ${[["Mâchoire", 62], ["Qualité de peau", 48], ["Coiffure", 80], ["Posture", 55]].map(([l, w]) => `<div class="row"><span>${l}</span><div class="p-bar"><i style="--w:${w}%"></i></div></div>`).join("")}
  </div>
</div>`;

const quizScreen = () => `<div class="phone__screen">
  <div class="p-bar"><i style="--w:38%"></i></div>
  <div class="p-eyebrow">Question 7</div>
  <div class="p-title">Ta routine pour la peau, c'est…</div>
  <div class="opt">Rien du tout</div>
  <div class="opt opt--on">Un gel douche et c'est tout</div>
  <div class="opt">Nettoyant + crème</div>
  <div class="opt">Une vraie routine</div>
  <div class="p-btn">Continuer</div>
</div>`;

const planScreen = () => `<div class="phone__screen">
  <div class="p-eyebrow">Ton plan · 28 jours</div>
  <div class="p-title">Aujourd'hui, 8 minutes.</div>
  <div class="check">Routine peau du matin</div>
  <div class="check">Posture : 3 × 1 minute</div>
  <div class="week week--first"><b>Semaine 1</b><span>Style, coupe, barbe</span><div class="p-bar"><i style="--w:30%"></i></div></div>
  <div class="week"><b>Semaine 2</b><span>Posture, peau, teint</span></div>
  <div class="week"><b>Semaine 3</b><span>Mâchoire, silhouette</span></div>
  <div class="week"><b>Semaine 4</b><span>Assurance, photos</span></div>
</div>`;

const top = `<div class="top"><span class="brand">MOGX</span><span class="flag">🇫🇷 Top en France</span></div>`;
const cta = (label, sub) => `<div class="cta"><div class="url">mogx.fr<small>${sub}</small></div><div class="btn">${label} →</div></div>`;

// ——— Variante A : « Avant / Après », mais du PRODUIT (avant : tu devines ; après : tu sais) ———
function varA(h) {
  const story = h > 1500;
  const questions = ["Ma coupe me va vraiment ?", "Je commence par la peau ou la posture ?", "Qu'est-ce qu'on voit de moi en 3 secondes ?"];
  return page(h, `<div class="ad">
  ${top}
  <h1>Avant, tu <span style="color:var(--c-text-muted)">devines.</span><br>Après, tu <em>sais.</em></h1>
  <div class="split">
    <div class="before">
      <span class="chip chip--grey">Avant</span>
      ${questions.map((q) => `<div class="bubble">${q}</div>`).join("")}
    </div>
    <div class="after">
      <div class="phone"><span class="chip chip--hot">Avec MOGX</span>${scanScreen("homme")}</div>
    </div>
  </div>
  ${story ? `<div class="storyurl">mogx.fr <small>· exemple d'écran, photo jamais enregistrée</small></div>` : cta("Fais ton scan", "Exemple d'écran · photo jamais enregistrée")}
</div>`, `
h1 { font-size: ${story ? 104 : 86}px; }
.split { flex: 1; min-height: 0; display: ${story ? "flex; flex-direction: column" : "grid; grid-template-columns: 380px 1fr"}; gap: 30px; }
.before { position: relative; display: flex; flex-direction: column; gap: 18px; padding: 28px 26px; border-radius: 40px; background: repeating-linear-gradient(135deg, #121214 0 14px, #0f0f11 14px 28px); border: 2px dashed var(--c-border); overflow: hidden; }
.before::after { content: "?"; position: absolute; right: 10px; bottom: -70px; font-family: var(--font-display); font-weight: 800; font-size: 360px; line-height: 1; color: #18181b; }
.bubble { position: relative; z-index: 1; padding: 20px 24px; border-radius: 26px 26px 26px 8px; background: var(--c-surface-alt); color: var(--c-text-muted); font-size: 27px; font-weight: 600; line-height: 1.25; }
.after { display: flex; justify-content: center; align-items: ${story ? "flex-start" : "center"}; }
.after .phone { zoom: ${story ? 0.68 : 0.76}; }
.after .phone > .chip { position: absolute; z-index: 5; top: -26px; left: 50%; transform: translateX(-50%); font-size: 26px; white-space: nowrap; }
${story ? `.before { flex-direction: row; flex-wrap: wrap; padding: 24px; gap: 14px; flex: none; } .before .chip { flex-basis: 100%; flex-grow: 0; } .before::after { font-size: 260px; bottom: -60px; } .bubble { font-size: 25px; padding: 16px 20px; } .bubble:nth-of-type(2) { order: 3; } .split { gap: 50px; } .storyurl { position: absolute; left: 0; right: 0; bottom: 250px; }` : ""}
`);
}

// ——— Variante B : les 3 étapes (quiz → scan → plan), prix clair ———
function varB(h) {
  const story = h > 1500;
  return page(h, `<div class="ad">
  ${top}
  <h1>Un quiz, 2 selfies.<br><em>Ton plan.</em></h1>
  <p class="sub">Ta note sur 100, tes <b>15 critères</b>, ton plan de <b>28 jours</b>.${story ? " 5 à 10 minutes par jour." : ""}</p>
  <div class="fan">
    <div class="phone ph1">${quizScreen()}</div>
    <div class="phone ph3">${planScreen()}</div>
    <div class="phone ph2">${scanScreen("femme")}</div>
  </div>
  <div class="price">${PRICE}</div>
  ${story ? `<div class="storyurl">mogx.fr <small>· visage créé par IA</small></div>` : cta("Commencer", "Visage créé par IA · photo jamais enregistrée")}
</div>`, `
.ad { gap: ${story ? 30 : 22}px; }
h1 { font-size: ${story ? 112 : 84}px; }
.sub { font-size: ${story ? 32 : 30}px; }
.fan { position: relative; flex: 1; min-height: 0; }
.fan .phone { position: absolute; top: ${story ? 20 : 4}px; left: 50%; zoom: ${story ? 0.8 : 0.68}; }
.ph1 { transform: translateX(-50%) translateX(-330px) translateY(70px) rotate(-9deg) scale(.86); filter: brightness(.65); }
.ph3 { transform: translateX(-50%) translateX(330px) translateY(70px) rotate(9deg) scale(.86); filter: brightness(.65); }
.ph2 { transform: translateX(-50%); z-index: 2; }
.price { align-self: center; font-size: ${story ? 30 : 26}px; font-weight: 700; padding: 16px 30px; border-radius: 999px; border: 2px solid var(--c-accent-line); background: color-mix(in srgb, var(--c-accent-soft) 92%, transparent); position: relative; z-index: 3; white-space: nowrap; }
.cta { margin-top: 0; }
${story ? ".storyurl { margin-top: 0; }" : ""}
`);
}

// ——— Variante C : le visage maillé en grand, avec les critères épinglés ———
function varC(h) {
  const story = h > 1500;
  const pins = [["Regard", 40, 39, "l"], ["Qualité de peau", 61, 49, "r"], ["Mâchoire", 41, 57, "l"], ["Coiffure", 65, 26, "r"]];
  return page(h, `<div class="ad ad--c">
  <div class="hero"><img src="${SRC}/img/carte-femme.webp" alt="">${meshOn()}<div class="scanline"></div>
    ${pins.map(([l, x, y, s]) => `<div class="pin pin--${s}" style="left:${x}%;top:${y}%"><i></i><span>${l}</span></div>`).join("")}
  </div>
  <div class="layer">
    ${top}
    <div class="bottom">
      <span class="chip chip--hot">15 critères passés au crible</span>
      <h1>Ce que les autres voient de toi <em>en 3 secondes.</em></h1>
      <p class="sub">Une note sur 100 sans filtre, et un plan de <b>28 jours</b>, jour par jour.</p>
      ${story ? `<div class="storyurl" style="text-align:left">mogx.fr <small>· visage créé par IA · photo jamais enregistrée</small></div>` : cta("Commencer", "Visage créé par IA · photo jamais enregistrée")}
    </div>
  </div>
</div>`, `
.ad--c { padding: 0; background: var(--c-bg); }
.hero { position: absolute; left: 50%; top: ${story ? -40 : -190}px; width: 1080px; aspect-ratio: 3 / 4; transform: translateX(-50%); }
.hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, var(--c-bg) ${story ? 18 : 26}%, transparent ${story ? 45 : 50}%), linear-gradient(to bottom, var(--c-bg), transparent 22%); }
.hero .mesh { position: absolute; z-index: 1; left: 26.5%; top: 20%; width: 47%; height: 44%; opacity: .95; }
.hero .mesh__dots circle { transform: scale(.55); transform-box: fill-box; transform-origin: center; }
.hero .scanline { top: 45%; }
.pin { position: absolute; z-index: 2; display: flex; align-items: center; gap: 12px; transform: translateY(-50%); }
.pin i { width: 22px; height: 22px; border-radius: 50%; background: var(--c-gold); box-shadow: 0 0 0 6px color-mix(in srgb, var(--c-gold) 30%, transparent), 0 0 24px var(--c-glow); flex: none; }
.pin span { font-size: 28px; font-weight: 800; padding: 10px 20px; border-radius: 999px; background: color-mix(in srgb, var(--c-bg) 78%, transparent); border: 2px solid var(--c-accent-line); white-space: nowrap; }
.pin--l { flex-direction: row-reverse; transform: translate(-100%, -50%); }
.layer { position: relative; z-index: 3; height: 100%; display: flex; flex-direction: column; padding: var(--pad-top) 72px var(--pad-bot); }
.bottom { margin-top: auto; display: flex; flex-direction: column; gap: 24px; }
h1 { font-size: ${story ? 104 : 88}px; }
.sub { font-size: ${story ? 34 : 30}px; }
.cta { margin-top: 6px; }
.storyurl { margin-top: 6px; }
`);
}

// ——— Variante D : 2 cases côte à côte, le MÊME visage IA (aucune transformation) : sans analyse / avec MOGX ———
function varD(g) { return (h) => {
  const story = h > 1500;
  const crit = g === "femme" ? ["Regard", "Qualité de peau", "Coiffure", "Teint"] : ["Mâchoire", "Qualité de peau", "Coiffure", "Barbe et sourcils"];
  return page(h, `<div class="ad ad--d">
  ${top}
  <h1>Ce que les autres <em>voient de toi.</em></h1>
  <div class="duo">
    <div class="case case--before">
      <div class="pic"><img src="${SRC}/img/carte-${g}.webp" alt=""><b class="qm">?</b></div>
      <div class="lab"><span class="chip chip--grey">Avant</span><p>Tu devines.</p></div>
    </div>
    <div class="case case--after">
      <div class="pic"><img src="${SRC}/img/carte-${g}.webp" alt="">${meshOn()}<div class="scanline"></div>
        <div class="note"><span>Ta note</span><b><i>??</i><small>/100</small></b></div>
      </div>
      <div class="lab"><span class="chip chip--hot">Avec MOGX</span><p>Tu sais. <span>Et tu as ton plan.</span></p></div>
      <div class="crits">${crit.map((c) => `<span>${c}</span>`).join("")}<span>+ 11 critères</span></div>
    </div>
  </div>
  ${story ? `<div class="storyurl">mogx.fr <small>· même visage, créé par IA · aucune retouche</small></div>` : cta("Fais ton scan", "Même visage créé par IA · aucune retouche")}
</div>`, `
h1 { font-size: ${story ? 100 : 80}px; }
.duo { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; align-content: start; gap: 24px; }
.case { position: relative; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
.pic { position: relative; flex: none; height: ${story ? 640 : 540}px; border-radius: 34px; overflow: hidden; background: #000; }
.pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; }
.case--before .pic { border: 2px dashed var(--c-border); }
.case--before .pic img { filter: grayscale(1) brightness(.55) contrast(.9) blur(1.5px); }
.qm { position: absolute; inset: 0; display: grid; place-items: center; font-family: var(--font-display); font-weight: 800; font-size: ${story ? 300 : 260}px; color: rgba(246,243,239,.16); }
.case--after .pic { border: 2px solid var(--c-accent); box-shadow: 0 0 60px -10px color-mix(in srgb, var(--c-glow) 80%, transparent); }
.case--after .pic::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, color-mix(in srgb, var(--c-bg) 75%, transparent), transparent 35%); }
.pic .mesh { position: absolute; z-index: 1; left: 24%; top: 21%; width: 53%; height: 45%; } .case--after .scanline { top: 42%; }
.note { position: absolute; z-index: 3; left: 18px; right: 18px; bottom: 18px; display: flex; justify-content: space-between; align-items: baseline; padding: 12px 18px; border-radius: 18px; background: color-mix(in srgb, var(--c-bg) 80%, transparent); border: 1px solid var(--c-accent-line); }
.note span { font-size: 18px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--c-text-muted); }
.note b { font-family: var(--font-display); font-size: 40px; font-weight: 800; }
.note b i { font-style: normal; filter: blur(8px); background: var(--heat); -webkit-background-clip: text; background-clip: text; color: transparent; }
.note b small { font-size: 18px; color: var(--c-text-muted); margin-left: 4px; }
.lab { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.lab p { margin: 0; font-family: var(--font-display); font-stretch: 85%; font-weight: 800; font-size: ${story ? 44 : 36}px; }
.case--before .lab p { color: var(--c-text-muted); }
.lab p span { color: var(--c-accent-strong); }
.crits { display: flex; flex-wrap: wrap; gap: 8px; }
.crits span { font-size: 19px; font-weight: 700; padding: 8px 14px; border-radius: 999px; background: var(--c-surface); border: 1px solid var(--c-accent-line); }
.lab .chip { font-size: 18px; } .lab p { flex-basis: 100%; } ${story ? ".storyurl { margin-top: 0; } .crits span { font-size: 21px; }" : ""}
${story ? "" : ".case--before .lab { margin-bottom: 0; } .case--before::after { content: ''; }"}
`);
}; }

const VARIANTS = {
  "D-deux-cases-homme": varD("homme"), "D-deux-cases-femme": varD("femme"), "A-avant-apres": varA, "B-3-etapes": varB, "C-visage-maille": varC };
const FORMATS = { fil: 1350, story: 1920 };

const files = [];
for (const [name, fn] of Object.entries(VARIANTS)) for (const [f, h] of Object.entries(FORMATS)) {
  const file = `${name}-${f}.html`;
  writeFileSync(join(DIR, file), fn(h));
  files.push([file, h]);
}

// Export PNG (Playwright, déjà installé sur la machine)
const { createRequire } = await import("node:module");
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
for (const [file, h] of files) {
  const p = await browser.newPage({ viewport: { width: 1080, height: h }, deviceScaleFactor: 1 });
  await p.goto("file://" + join(DIR, file));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(DIR, file.replace(".html", ".png")) });
  await p.close();
  console.log("✓", file.replace(".html", ".png"));
}
await browser.close();
