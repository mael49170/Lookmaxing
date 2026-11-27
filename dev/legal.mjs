// Fabrique les pages légales (src/cgv, src/confidentialite, src/biometrie, src/mentions-legales).
// Les prix, durées et conditions viennent de src/shared/plans.js : les pages ne peuvent pas contredire la page de paiement.
// Lancer après chaque changement de prix ou de texte : node dev/legal.mjs
// Les informations que seul le propriétaire connaît sont dans EDITEUR ci-dessous (« [À REMPLIR] » tant qu'elles manquent).
import { writeFileSync, mkdirSync } from "node:fs";
import { OFFERS, DEFAULT_OFFER, RESERVATION_MIN, GUARANTEE, euros, minimumCents } from "../src/shared/plans.js";

// ---------- À remplir par Maël (ou son comptable) ----------
const todo = (t) => `<mark class="todo">[À REMPLIR : ${t}]</mark>`;
export const EDITEUR = {
  // Même entreprise individuelle que Kadrio, adresse propre à MOGX (donné par Maël le 26/11/2026)
  nom: "Maël Poitiers",
  forme: "entrepreneur individuel (EI), nom commercial MOGX",
  adresse: "16 rue du Jubilé, 49170 Saint-Martin-du-Fouilloux, France",
  siren: "SIRET 131 842 700 00018",
  tva: "TVA non applicable, article 293 B du Code général des impôts",
  directeur: "Maël Poitiers",
  email: `<a href="mailto:contact@mogx.fr">contact@mogx.fr</a>`,
  telephone: `<a href="tel:+33752045665">07 52 04 56 65</a>`,
  mediateur: todo("nom, site et adresse du médiateur de la consommation choisi (obligatoire)"),
};
export const MAJ = "26 novembre 2026";
// ------------------------------------------------------------

const o = OFFERS[DEFAULT_OFFER];
const P = { intro: euros(o.intro), renew: euros(o.renew), min: euros(minimumCents(o)), jours: o.trialDays };
const root = new URL("..", import.meta.url);

function page(dir, title, body) {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#09090a">
<title>MOGX · ${title}</title>
<link rel="stylesheet" href="/styles/tokens.css">
<link rel="stylesheet" href="/styles/components.css">
<link rel="stylesheet" href="/legal/legal.css">
</head>
<body>
<!-- Page fabriquée par dev/legal.mjs : modifier ce fichier-là, pas celui-ci. -->
<main class="legal-page">
<a class="brand" href="/">MOGX</a>
<h1>${title}</h1>
<p class="updated">Dernière mise à jour : ${MAJ}</p>
${body}
<nav class="legal-links" aria-label="Informations légales">
  <a href="/cgv/">Conditions générales de vente</a>
  <a href="/confidentialite/">Confidentialité</a>
  <a href="/biometrie/">Données du visage</a>
  <a href="/mentions-legales/">Mentions légales</a>
</nav>
</main>
</body>
</html>
`;
  mkdirSync(new URL(`src/${dir}/`, root), { recursive: true });
  writeFileSync(new URL(`src/${dir}/index.html`, root), html);
}

const E = EDITEUR;

// ================= CGV =================
page("cgv", "Conditions générales de vente", `
<div class="summary">
  <p><b>En bref.</b> Aujourd'hui ${P.intro} pour ${P.jours} jours d'essai, puis une 1re semaine obligatoire à ${P.renew}, puis ${P.renew} par semaine jusqu'à ce que tu résilies.</p>
  <p>Minimum à payer : <b>${P.min}</b>. Résiliation en ligne en un clic, depuis ton espace.</p>
  <p>Satisfait ou remboursé sur ta 1re semaine payée, sous conditions (article 9).</p>
</div>

<h2 id="vendeur">1. Qui vend</h2>
<p>Le service MOGX est vendu par ${E.nom}, ${E.forme}, dont l'adresse professionnelle est ${E.adresse}, ${E.siren}, ${E.tva}. Contact : ${E.email} · ${E.telephone}.</p>

<h2 id="service">2. Ce que tu achètes</h2>
<p>MOGX est un service en ligne qui comprend :</p>
<ul>
  <li>un questionnaire et, si tu l'acceptes, l'analyse automatique de deux photos de ton visage ;</li>
  <li>un rapport : une note, une estimation de ton potentiel et le détail de 15 critères ;</li>
  <li>un plan de 28 jours, des tâches quotidiennes et un suivi dans ton espace membre ;</li>
  <li>si tu le demandes, un rappel quotidien par e-mail.</li>
</ul>
<p>Le service est réservé aux personnes majeures (18 ans et plus).</p>
<p>Les notes sont l'avis d'un logiciel sur deux photos, avec une lumière et un angle donnés. Ce n'est ni une mesure, ni un diagnostic, ni un avis médical, psychologique ou esthétique professionnel. Une autre photo peut donner une autre note. Le plan propose des habitudes non médicales (soins, coupe, style, sport, posture, assurance). MOGX ne garantit aucun résultat physique, ni aucun effet sur ta vie sentimentale ou sociale : le résultat dépend notamment de ta régularité.</p>

<h2 id="prix">3. Prix</h2>
<p>Les prix sont en euros. Ce sont les prix finaux, rien ne s'y ajoute : TVA non applicable, article 293 B du Code général des impôts. Ils sont affichés avant le paiement, juste au-dessus du bouton qui le déclenche, et repris sur la page de paiement et dans l'e-mail envoyé après l'achat.</p>
<div class="table-wrap"><table>
  <tr><th>Période</th><th>Prix</th></tr>
  <tr><td>Essai : les ${P.jours} premiers jours</td><td>${P.intro}, payés le jour de l'achat</td></tr>
  <tr><td>1re semaine après l'essai (obligatoire)</td><td>${P.renew}, prélevés à la fin de l'essai</td></tr>
  <tr><td>Chaque semaine suivante</td><td>${P.renew}, prélevés au début de chaque semaine, jusqu'à résiliation</td></tr>
</table></div>
<p><b>Engagement minimum :</b> les ${P.jours} jours d'essai puis la 1re semaine, soit ${P.min} au total.</p>
<h3 id="reservation">Réservation de l'essai</h3>
<p>Le prix d'essai de ${P.intro} est réservé pendant ${RESERVATION_MIN} minutes à partir de l'affichage de la page de paiement, comme l'indique le compteur de cette page. Il n'est proposé qu'une fois par appareil. Une fois ce délai passé, l'abonnement démarre directement au prix de ${P.renew} par semaine, sans essai et sans engagement au-delà de la semaine payée. Le compteur est réel : il ne repart pas à zéro.</p>

<h2 id="commande">4. Commande et paiement</h2>
<p>Tu réponds au questionnaire, tu indiques ton adresse e-mail, puis tu paies sur un formulaire sécurisé de notre prestataire de paiement Stripe (carte bancaire, Apple Pay, Google Pay). Avant de payer, tu acceptes les présentes conditions et tu demandes expressément l'accès immédiat à ton résultat (article 6).</p>
<p>Ton compte est créé automatiquement avec l'adresse e-mail utilisée au paiement. Un e-mail récapitule ton achat, le prix, l'engagement et la façon de résilier. Stripe t'envoie un reçu pour chaque prélèvement.</p>
<p>Si un prélèvement échoue, Stripe peut le retenter pendant quelques jours. Tu en es prévenu par e-mail. Sans paiement, l'abonnement peut être interrompu.</p>

<h2 id="livraison">5. Accès au service</h2>
<p>Ton rapport et ton plan s'ouvrent dès que le paiement est confirmé, sur la même page. Tu les retrouves ensuite dans ton espace membre, sans mot de passe : tu reçois un code ou un lien par e-mail à chaque connexion. Si ton rapport ne s'ouvre pas alors que tu as été prélevé, écris-nous : un prélèvement sans service rendu est remboursé en entier.</p>

<h2 id="retractation">6. Droit de rétractation</h2>
<p>En principe, tu disposes de 14 jours pour te rétracter d'un achat à distance (article L221-18 du Code de la consommation).</p>
<p><b>Ton rapport est un contenu numérique</b> fourni immédiatement. En cochant la case prévue avant le paiement, tu demandes qu'il te soit fourni tout de suite et tu reconnais perdre ton droit de rétractation sur ce rapport dès son ouverture (article L221-28, 13°).</p>
<p><b>Pour le reste du service</b> (plan, suivi, rappels), si tu te rétractes dans les 14 jours alors que tu as demandé à en profiter tout de suite, tu paies seulement la part du service déjà fournie jusqu'à ta rétractation (article L221-25). Le reste t'est remboursé dans les 14 jours.</p>
<p>Pour te rétracter, envoie ta décision sans ambiguïté à ${E.email}, par exemple avec le modèle ci-dessous.</p>
<div class="box">
  <p><b>Modèle de formulaire de rétractation</b></p>
  <p>À l'attention de ${E.nom}, ${E.adresse}, ${E.email} :</p>
  <p>Je vous notifie par la présente ma rétractation du contrat portant sur le service MOGX ci-dessous :<br>
  Commandé le : …… · Nom : …… · Adresse e-mail utilisée pour l'achat : …… · Date : …… · Signature (si envoi papier) : ……</p>
</div>

<h2 id="resiliation">7. Durée et résiliation</h2>
<p>L'abonnement est conclu à la semaine et se renouvelle automatiquement chaque semaine, au prix de ${P.renew}, jusqu'à résiliation.</p>
<p>Tu résilies <b>en ligne, en un clic</b>, depuis ton espace membre (« Résilier mon abonnement »), ou par e-mail à ${E.email}. Une confirmation s'affiche aussitôt.</p>
<ul>
  <li><b>Pendant les ${P.jours} jours d'essai :</b> la 1re semaine reste due, comme annoncé avant le paiement. Elle est prélevée à la fin de l'essai, puis plus rien. Tu gardes l'accès jusqu'à la fin de cette semaine.</li>
  <li><b>Après :</b> plus aucun prélèvement. Tu gardes l'accès jusqu'à la fin de la semaine déjà payée.</li>
</ul>
<p>Nous pouvons mettre fin à l'abonnement en cas d'utilisation contraire aux présentes conditions (par exemple l'envoi de photos d'une autre personne), ou si nous arrêtons le service. Dans ce dernier cas, la part non utilisée de la semaine payée est remboursée.</p>

<h2 id="utilisation">8. Ce qui est interdit</h2>
<p>Tu ne peux envoyer que des photos de toi. Il est interdit d'utiliser le service pour noter ou juger une autre personne, de le détourner, de le copier ou d'en revendre le contenu.</p>

<h2 id="garantie">9. Satisfait ou remboursé</h2>
<p>En plus de tes droits légaux, ta <b>1re semaine payée (${P.renew})</b> t'est remboursée si :</p>
<ul>
  <li>tu as suivi ton plan au moins ${GUARANTEE.minDays} jours sur les ${GUARANTEE.ofDays} jours de cette 1re semaine (au moins une tâche cochée dans ton espace ces jours-là) ;</li>
  <li>tu en fais la demande dans les ${GUARANTEE.requestWithinDays} jours qui suivent le prélèvement de cette semaine.</li>
</ul>
<p>La demande se fait en un clic, depuis ton espace (« Me faire rembourser ma 1re semaine »). Le site vérifie lui-même les conditions : aucun justificatif n'est demandé. Le remboursement arrête l'abonnement. La garantie ne vaut qu'une fois par personne et ne couvre pas les ${P.jours} jours d'essai.</p>

<h2 id="conformite">10. Garantie légale de conformité</h2>
<p>Comme tout contenu ou service numérique, MOGX est couvert par la garantie légale de conformité (articles L224-25-1 et suivants du Code de la consommation). Si le service ne fonctionne pas comme annoncé, écris-nous : nous le corrigeons dans un délai raisonnable. À défaut, tu peux obtenir une réduction du prix ou mettre fin au contrat avec remboursement.</p>

<h2 id="donnees">11. Données personnelles</h2>
<p>Le traitement de tes données est expliqué dans notre <a href="/confidentialite/">politique de confidentialité</a>, et celui des photos de ton visage dans notre <a href="/biometrie/">politique sur les données du visage</a>.</p>

<h2 id="litiges">12. Réclamations et litiges</h2>
<p>Pour toute réclamation, écris d'abord à ${E.email}. Nous répondons sous 3 jours ouvrés.</p>
<p>Si le désaccord persiste, tu peux saisir gratuitement le médiateur de la consommation : ${E.mediateur}. Tu dois d'abord nous avoir écrit, et le saisir dans l'année qui suit ta réclamation.</p>
<p>Ces conditions sont soumises au droit français. En cas de litige, tu peux saisir le tribunal de ton domicile.</p>
`);

// ================= Confidentialité =================
page("confidentialite", "Politique de confidentialité", `
<div class="summary">
  <p><b>En bref.</b> On collecte le minimum : tes réponses, ton e-mail, tes notes. <b>Tes photos ne sont jamais enregistrées.</b></p>
  <p>On ne vend ni ne partage tes données à des fins publicitaires. Tu peux tout faire effacer depuis ton espace.</p>
</div>

<h2>1. Qui est responsable</h2>
<p>${E.nom}, ${E.adresse}, est responsable du traitement de tes données. Contact pour tes données : ${E.email}.</p>

<h2>2. Ce qu'on collecte, pourquoi, et sur quelle base</h2>
<div class="table-wrap"><table>
  <tr><th>Données</th><th>Pourquoi</th><th>Base légale</th></tr>
  <tr><td>Tes réponses au questionnaire (âge par tranche, habitudes, ressenti)</td><td>Construire ton bilan et ton plan</td><td>Mesures précontractuelles et exécution du contrat</td></tr>
  <tr><td>Deux photos de ton visage, et les mesures qui en sont tirées</td><td>Calculer tes notes. Détail dans la <a href="/biometrie/">politique sur les données du visage</a>.</td><td>Ton consentement explicite (article 9 du RGPD)</td></tr>
  <tr><td>Tes notes (15 critères, note, potentiel)</td><td>Ton rapport, ton plan</td><td>Exécution du contrat</td></tr>
  <tr><td>Ton adresse e-mail</td><td>Ton compte, la connexion par code, les e-mails liés au service</td><td>Exécution du contrat</td></tr>
  <tr><td>Ton adresse e-mail (si tu as coché la case)</td><td>Conseils et offres par e-mail, 2 relances au plus</td><td>Ton consentement, retirable en un clic</td></tr>
  <tr><td>Tes tâches cochées</td><td>Le suivi, la garantie « satisfait ou remboursé »</td><td>Exécution du contrat</td></tr>
  <tr><td>Paiements (gérés par Stripe ; nous ne voyons jamais ton numéro de carte)</td><td>Encaisser, rembourser, facturer</td><td>Exécution du contrat et obligations comptables</td></tr>
  <tr><td>Adresse IP sous forme chiffrée, identifiant de l'appareil (cookie)</td><td>Limiter les abus, réserver l'essai une seule fois, sécurité</td><td>Intérêt légitime (lutte contre la fraude)</td></tr>
  <tr><td>Source de la visite (lien publicitaire), écrans vus (compteurs sans donnée personnelle)</td><td>Savoir quelles publicités et quels écrans marchent</td><td>Intérêt légitime</td></tr>
</table></div>
<p>Nous ne prenons aucune décision te concernant sur la seule base d'un traitement automatique, au-delà du calcul de tes notes, qui n'a aucune conséquence juridique pour toi.</p>

<h2>3. Combien de temps on garde tes données</h2>
<ul>
  <li><b>Photos :</b> jamais enregistrées (ni sur nos serveurs, ni dans nos journaux).</li>
  <li><b>Questionnaire sans e-mail :</b> 90 jours.</li>
  <li><b>Notes si tu n'achètes pas :</b> 30 jours, puis effacées automatiquement.</li>
  <li><b>E-mail laissé sans achat :</b> 3 ans après ton dernier contact avec nous, ou jusqu'à ta désinscription s'il ne sert qu'aux offres.</li>
  <li><b>Compte client :</b> tant que ton compte existe, puis 3 ans après la fin de ton dernier abonnement. Tu peux le supprimer toi-même, à tout moment, une fois l'abonnement terminé.</li>
  <li><b>Factures :</b> 10 ans, conservées par Stripe (obligation comptable).</li>
  <li><b>Codes de connexion :</b> 15 minutes. <b>Sessions :</b> 90 jours.</li>
</ul>

<h2>4. Qui reçoit tes données</h2>
<p>Seulement nos prestataires techniques, pour le service, sous contrat :</p>
<div class="table-wrap"><table>
  <tr><th>Prestataire</th><th>Rôle</th><th>Où</th></tr>
  <tr><td>Cloudflare, Inc.</td><td>Hébergement du site et de la base de données, anti-robot</td><td>Réseau mondial, société aux États-Unis</td></tr>
  <tr><td>Anthropic, PBC</td><td>Analyse des photos par intelligence artificielle, au moment du scan seulement</td><td>États-Unis</td></tr>
  <tr><td>Stripe</td><td>Paiement</td><td>Union européenne (Irlande) et États-Unis</td></tr>
  <tr><td>Resend</td><td>Envoi des e-mails</td><td>États-Unis</td></tr>
  <tr><td>Meta Platforms Ireland</td><td>Mesure de nos publicités (Facebook, Instagram), <b>seulement si tu acceptes les cookies de mesure</b></td><td>Irlande et États-Unis</td></tr>
</table></div>
<p>Pour les prestataires situés hors de l'Union européenne, le transfert est encadré par les garanties prévues par le RGPD : décision d'adéquation (cadre de protection des données UE–États-Unis) ou clauses contractuelles types de la Commission européenne. Chacun de ces prestataires a intégré à ses conditions un contrat de sous-traitance des données (« DPA ») conforme à l'article 28 du RGPD.</p>
<p>Nous ne vendons pas tes données. Aucune photo, aucune note et aucune réponse au quiz n'est envoyée à Meta.</p>

<h2 id="cookies">5. Cookies et stockage</h2>
<p>MOGX n'utilise que des cookies nécessaires au service, qui ne demandent pas ton accord :</p>
<ul>
  <li><code>lm_q</code> : ton questionnaire en cours (30 jours) ;</li>
  <li><code>lm_s</code> : ta connexion à ton espace (90 jours) ;</li>
  <li><code>lm_d</code> : identifiant de l'appareil, pour réserver l'essai une seule fois et limiter les abus (1 an) ;</li>
  <li>la protection anti-robot de Cloudflare (Turnstile), au moment du scan.</li>
</ul>
<p>Tes réponses en cours sont aussi gardées dans l'onglet de ton navigateur (stockage de session), effacé à la fermeture de l'onglet. </p>
<p><b>Avec ton accord seulement</b> : le pixel de Meta (cookies <code>_fbp</code> et <code>_fbc</code>, 3 mois) nous dit si tu es venu par une de nos pubs et si tu as commencé ou payé ton abonnement (avec le montant), pour mesurer et améliorer nos publicités. Rien n'est chargé ni envoyé à Meta avant que tu touches « Accepter » ; « Refuser » est tout aussi simple. Ton choix est gardé 6 mois, et tu peux le changer à tout moment avec le lien « Cookies » en bas de l'accueil. Meta et MOGX sont responsables ensemble de cette mesure ; Meta en explique l'usage dans sa propre politique (facebook.com/privacy/policy).</p>

<h2>6. Tes droits</h2>
<p>Tu peux à tout moment accéder à tes données, les corriger, les faire effacer, les récupérer (portabilité), t'opposer à un traitement, en limiter l'usage, retirer ton consentement et donner des directives pour après ton décès.</p>
<ul>
  <li>Effacer ton compte : depuis ton espace, « Supprimer mon compte et mes données » (après la fin de ton abonnement).</li>
  <li>Ne plus recevoir d'offres : le lien en bas de chaque e-mail.</li>
  <li>Tout le reste : écris à ${E.email}. Nous répondons sous un mois.</li>
</ul>
<p>Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la CNIL (<a href="https://www.cnil.fr" rel="noopener">cnil.fr</a>).</p>

<h2>7. Sécurité</h2>
<p>Connexions chiffrées (HTTPS), aucun mot de passe stocké (connexion par code à usage unique), accès à la base limité, photos jamais écrites sur disque. Nous réalisons une analyse d'impact sur la protection des données pour le traitement des photos du visage.</p>
`);

// ================= Biométrie =================
page("biometrie", "Données du visage", `
<div class="summary">
  <p><b>En bref.</b> L'analyse lit la forme et les proportions de ton visage : ce sont des données biométriques, protégées par l'article 9 du RGPD. Nous ne les traitons qu'avec ton accord écrit, demandé sur un écran à part, <b>avant</b> que la caméra s'ouvre.</p>
  <p>Tu peux dire non : tu as quand même un plan, fait d'après tes réponses.</p>
</div>

<h2>1. Ce que nous faisons</h2>
<p>À partir de deux photos que tu prends toi-même (de face et de profil), un modèle d'intelligence artificielle note 15 critères d'apparence. Nous en tirons une note, une estimation de ton potentiel et l'ordre de ton plan.</p>
<p>Nous ne faisons <b>rien d'autre</b> avec : pas d'identification, pas de recherche de ton visage ailleurs, pas de comparaison avec d'autres personnes ou avec des célébrités, pas d'entraînement d'IA, pas de publicité.</p>

<h2>2. Ton accord</h2>
<p>Sur l'écran des selfies, une phrase placée juste au-dessus du bouton explique ce traitement. En touchant « Prendre mes selfies », tu donnes ton consentement explicite. Nous enregistrons la date et la version du texte accepté. « Continuer sans photo », juste en dessous, est aussi simple et ne te prive d'aucune autre partie du service : ton plan est alors fait d'après tes réponses.</p>
<p>Tu peux retirer ton accord à tout moment : supprimer ton compte efface tes notes ; tu peux aussi nous écrire à ${E.email}.</p>

<h2>3. Qui voit tes photos</h2>
<p>Tes photos sont réduites dans ton téléphone, puis envoyées une seule fois, de façon chiffrée, à notre prestataire d'intelligence artificielle, Anthropic, pour l'analyse. Elles ne servent pas à entraîner ses modèles. Anthropic les efface ensuite automatiquement de ses serveurs, dans un délai de 30 jours au plus, comme le prévoit son contrat ; seul un contenu signalé comme contraire à ses règles d'usage peut être gardé plus longtemps (jusqu'à 2 ans) pour des raisons de sécurité. Chez MOGX, tes photos ne sont jamais enregistrées.</p>
<p>Aucune personne de MOGX ne regarde tes photos.</p>

<h2>4. Combien de temps</h2>
<ul>
  <li><b>Photos :</b> jamais enregistrées par MOGX. Elles restent dans l'onglet de ton navigateur pendant ta visite, puis disparaissent. Chez Anthropic, qui fait l'analyse : effacées sous 30 jours au plus (voir 3).</li>
  <li><b>Mesures du visage :</b> jamais enregistrées par MOGX. Seules les notes qui en résultent sont gardées.</li>
  <li><b>Notes, sans achat :</b> effacées automatiquement après 30 jours.</li>
  <li><b>Notes, si tu achètes :</b> gardées tant que ton compte existe, pour que tu retrouves ton rapport, puis effacées avec lui.</li>
</ul>

<h2>5. Les limites de l'analyse</h2>
<p>Une note est l'avis d'un logiciel sur deux photos, avec une lumière et un angle donnés. Elle ne mesure ni ta valeur, ni ta santé. Une autre photo peut donner une autre note. L'analyse s'arrête si la photo ne montre pas un seul visage net, ou si la personne semble mineure.</p>

<h2>6. Tes droits</h2>
<p>Tes droits (accès, effacement, retrait du consentement…) et le recours à la CNIL sont décrits dans notre <a href="/confidentialite/">politique de confidentialité</a>.</p>
`);

// ================= Mentions légales =================
page("mentions-legales", "Mentions légales", `
<h2>Éditeur</h2>
<p>${E.nom}<br>${E.forme}<br>${E.adresse}<br>${E.siren}<br>${E.tva}<br>Contact : ${E.email} · ${E.telephone}</p>
<p>Directeur de la publication : ${E.directeur}</p>

<h2>Hébergeur</h2>
<p>Cloudflare, Inc.<br>101 Townsend St, San Francisco, CA 94107, États-Unis<br><a href="https://www.cloudflare.com" rel="noopener">cloudflare.com</a></p>

<h2>Images</h2>
<p>Les visages montrés sur la page d'accueil et dans le parcours sont des illustrations créées par intelligence artificielle. Ce ne sont ni des clients, ni des personnes réelles.</p>

<h2>Propriété intellectuelle</h2>
<p>Les textes, dessins, éléments graphiques et le nom MOGX sont la propriété de l'éditeur. Toute reproduction sans autorisation est interdite. Les polices Inter et Archivo sont utilisées sous licence SIL Open Font License.</p>

<h2>Médiation</h2>
<p>Médiateur de la consommation : ${E.mediateur}</p>
`);

console.log("pages légales : cgv, confidentialite, biometrie, mentions-legales");
