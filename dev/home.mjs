// Fabrique les 2 pages d'entrée du site :
// - src/index.html (mogx.fr) : directement l'accueil du quiz (titre + cartes Homme / Femme), le moins de friction possible
//   (décidé par Maël le 25/11/2026) ;
// - src/infos/index.html (mogx.fr/infos/) : qui on est, combien ça coûte, comment arrêter, questions fréquentes,
//   à partir des vrais prix (src/shared/plans.js). Liée en bas de l'accueil ; sert aussi à la vérification du compte Stripe.
// Règle : aucune fausse preuve (pas d'avis, pas de nombre d'utilisateurs, pas de note sur 5, pas de logos de presse).
// Lancer : node dev/home.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { OFFERS, DEFAULT_OFFER, RESERVATION_MIN, GUARANTEE, euros, minimumCents } from "../src/shared/plans.js";
import { faceMesh } from "../src/q/mesh.js";

const o = OFFERS[DEFAULT_OFFER];
const P = { intro: euros(o.intro), renew: euros(o.renew), min: euros(minimumCents(o)), jours: o.trialDays };
const nb = (s) => s.replace(/ /g, " ");

const faq = [
  ["Comment marche la note ?", "Une intelligence artificielle lit tes deux selfies et note 15 critères : peau, coupe, mâchoire, posture, tenue… Ta note et ton potentiel en sont tirés. C'est l'avis d'un logiciel sur deux photos, pas une vérité sur toi : une autre lumière peut donner une autre note."],
  ["Mes photos sont-elles gardées ?", "Non, jamais. Elles servent à l'analyse puis disparaissent. Personne chez MOGX ne les regarde. Tout est expliqué dans la page « Données du visage »."],
  ["Je peux faire le quiz sans photo ?", "Oui. Tu dis « Pas maintenant » et ton plan est fait d'après tes réponses. Tu n'auras simplement pas de note."],
  ["Combien ça coûte vraiment ?", `${P.intro} pour ${P.jours} jours, puis une 1re semaine obligatoire à ${P.renew}, puis ${P.renew} par semaine jusqu'à ce que tu arrêtes. Minimum à payer : ${P.min}. Le prix d'essai est réservé ${RESERVATION_MIN} minutes, une seule fois.`],
  ["Comment j'arrête ?", "Dans ton espace, « Résilier mon abonnement » : un clic. Pendant l'essai, la semaine d'engagement reste due, puis plus rien n'est prélevé."],
  ["Et si ça ne me plaît pas ?", `Suis ton plan au moins ${GUARANTEE.minDays} jours sur les ${GUARANTEE.ofDays} de ta 1re semaine payée : si tu n'es pas convaincu, elle t'est remboursée en un clic, dans les ${GUARANTEE.requestWithinDays} jours.`],
  ["C'est médical ?", "Non. MOGX propose des habitudes de soin, de style et d'assurance. Pas de chirurgie, pas de médicament, pas de diagnostic. Pour un souci de santé, vois ton médecin."],
];

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#09090a">
<title>MOGX · Prix, fonctionnement et questions</title>
<meta name="description" content="Une analyse franche de ton visage sur 15 critères, et un plan de 28 jours pour progresser : peau, coupe, style, posture, assurance. Photos jamais enregistrées.">
<link rel="canonical" href="https://mogx.fr/infos/">
<meta property="og:url" content="https://mogx.fr/infos/">
<meta property="og:title" content="MOGX · Ce que les autres voient de toi en 3 secondes">
<meta property="og:description" content="15 critères, une note sans filtre, un plan de 28 jours pour la faire monter.">
<link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles/tokens.css">
<link rel="stylesheet" href="/styles/components.css">
<link rel="stylesheet" href="/q/quiz.css">
<link rel="stylesheet" href="/legal/legal.css">
<link rel="stylesheet" href="/home.css">
</head>
<body>
<!-- Page fabriquée par dev/home.mjs : modifier ce fichier-là, pas celui-ci. -->
<header class="home-top"><a class="brand" href="/">MOGX</a><a class="home-login" href="/connexion/">Mon espace</a></header>
<main class="home">
  <section class="home-hero">
    <p class="proof-bar"><span><span aria-hidden="true">🇫🇷</span> MOGX, top en France</span></p>
    <div class="home-hero__art">${faceMesh({ className: "mesh mesh--idle" })}
      <span class="tag" style="left:-4%;top:42%">Mâchoire</span><span class="tag" style="right:-6%;top:28%">Peau</span><span class="tag" style="right:-2%;top:66%">Posture</span></div>
    <h1 class="title title--hero">Ce que les autres voient de toi en 3 secondes. Et comment le changer.</h1>
    <p class="lead">Une analyse franche de ton visage sur 15 critères, et un plan de 28 jours pour faire monter ta note. 3 minutes, dès 18 ans.</p>
    <a class="btn btn--primary" href="/">Lancer mon analyse</a>
    <p class="home-note">Tes photos ne sont jamais enregistrées.</p>
  </section>

  <section class="home-block">
    <h2 class="block__title">Le problème</h2>
    <p class="lead">Les conseils pour mieux présenter sont partout, et ils se contredisent. Personne ne te dit ce qui compte <em>pour ton visage à toi</em>, ni par où commencer.</p>
    <p class="lead">Et beaucoup d'applis du même genre te font payer sans te dire clairement combien, ni comment arrêter.</p>
  </section>

  <section class="home-block">
    <h2 class="block__title">Comment ça marche</h2>
    <ol class="steps-list">
      <li><span><b>Tu réponds au quiz</b><span>Tes objectifs, ta peau, tes cheveux, ton corps, ta façon d'être avec les autres.</span></span></li>
      <li><span><b>Tu prends 2 selfies</b><span>De face et de profil, dans la page. Facultatif.</span></span></li>
      <li><span><b>Tu reçois ta note et ton plan</b><span>Ta note, ton potentiel, tes 15 critères, et 28 jours de tâches de 5 à 10 minutes.</span></span></li>
    </ol>
  </section>

  <section class="home-block">
    <h2 class="block__title">Ce qui change avec MOGX</h2>
    <ul class="home-points">
      <li><b>Le prix écrit en gros, avant de payer.</b> ${nb(P.intro)} pour ${P.jours} jours, puis ${nb(P.renew)} par semaine, engagement minimum ${nb(P.min)}. Rien de caché.</li>
      <li><b>Résiliation en un clic.</b> Depuis ton espace. Pas d'e-mail à écrire, pas de piège.</li>
      <li><b>Tes photos ne sont jamais enregistrées.</b> Ni sur nos serveurs, ni dans nos journaux.</li>
      <li><b>Une note honnête.</b> Ton potentiel ne compte que ce qui se travaille (peau, coupe, posture, style), jamais l'ossature.</li>
      <li><b>Un plan fait pour toi.</b> D'après tes réponses et ton scan, avec un suivi jour par jour et un rappel le matin si tu veux.</li>
      <li><b>Satisfait ou remboursé.</b> Sur ta 1re semaine payée, sous conditions, vérifié automatiquement et remboursé en un clic.</li>
    </ul>
  </section>

  <section class="home-block">
    <h2 class="block__title">Le prix</h2>
    <div class="offer offer--single">
      <span class="offer__main"><span class="offer__name">${o.label}</span><span class="offer__renew">${nb(P.intro)} pour ${P.jours} jours, puis ${nb(P.renew)} par semaine</span></span>
      <span class="offer__price">${nb(P.intro)}<span class="offer__day">pour ${P.jours} jours</span></span>
    </div>
    <div class="terms" role="note"><p><b>Essai : ${nb(P.intro)} pour ${P.jours} jours</b>, réservé ${RESERVATION_MIN} minutes, une seule fois.</p><p>Puis ${nb(P.renew)} par semaine, jusqu'à résiliation.</p><p>Engagement : les ${P.jours} jours puis 1 semaine, soit ${nb(P.min)} au total. Ensuite, résiliable à tout moment en un clic.</p></div>
  </section>

  <section class="home-block">
    <h2 class="block__title">Questions fréquentes</h2>
    ${faq.map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join("\n    ")}
  </section>

  <section class="home-block home-final">
    <h2 class="title">Prêt à voir ta note ?</h2>
    <a class="btn btn--primary" href="/">Lancer mon analyse</a>
  </section>

  <nav class="legal-links" aria-label="Informations légales">
    <a href="/cgv/">Conditions générales de vente</a><a href="/confidentialite/">Confidentialité</a><a href="/biometrie/">Données du visage</a><a href="/mentions-legales/">Mentions légales</a>
  </nav>
</main>
</body>
</html>
`;
mkdirSync(new URL("../src/infos/", import.meta.url), { recursive: true });
writeFileSync(new URL("../src/infos/index.html", import.meta.url), html);

// mogx.fr : la même application que /q/, ouverte directement sur l'accueil du quiz
const entry = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#09090a">
<title>MOGX · Ce que les autres voient de toi en 3 secondes</title>
<meta name="description" content="Ta note de visage sur 15 critères, et un plan de 28 jours pour la faire monter : peau, coupe, style, posture, assurance. Photos jamais enregistrées. Dès 18 ans.">
<link rel="canonical" href="https://mogx.fr/">
<meta property="og:url" content="https://mogx.fr/">
<meta property="og:title" content="MOGX · Ce que les autres voient de toi en 3 secondes">
<meta property="og:description" content="15 critères, une note sans filtre, un plan de 28 jours pour la faire monter.">
<link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles/tokens.css">
<link rel="stylesheet" href="/styles/components.css">
<link rel="stylesheet" href="/q/quiz.css">
</head>
<body>
<!-- Page fabriquée par dev/home.mjs : modifier ce fichier-là, pas celui-ci. -->
<div id="app" aria-live="polite"></div>
<noscript><p class="lead" style="padding:24px">Le quiz a besoin de JavaScript pour fonctionner. <a href="/infos/">Prix et infos</a></p></noscript>
<script type="module" src="/q/app.js"></script>
</body>
</html>
`;
writeFileSync(new URL("../src/index.html", import.meta.url), entry);
console.log("accueil : src/index.html (quiz) et src/infos/index.html (prix et infos)");
