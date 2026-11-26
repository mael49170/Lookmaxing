# Parité MOGX ↔ l'original (26/11/2026)

## En bref

| mesure | score | ce que ça veut dire |
| --- | --- | --- |
| **Fonctions** | **83,3 / 100** | 15 « indispensables » sur 18 faites ; les 3 qui restent sont codées et testées en simulé, il manque seulement les vraies clés (Stripe test, Claude) |
| Mise en page | 22,1 / 100 | même structure écran par écran (retour, barre de progression, titre, options, bouton en bas), mais titres alignés à gauche chez nous, textes français plus longs, couleurs inversées : l'outil compare les contours au pixel près, donc ce chiffre est bas par construction. Voulu : on ne copie pas leur apparence (habillage protégé). |
| Global | 71,1 / 100 | moyenne des deux |

**Verdict : pas encore vendable**, uniquement à cause des 3 indispensables qui attendent les vraies clés, et des « À REMPLIR » des pages légales (société, SIREN, médiateur). Aucun bug S1 ou S2 ouvert.

## Écrans comparés (captures 390 × 844, même état)

| original | MOGX | score | différence principale |
| --- | --- | --- | --- |
| s01b accueil Homme/Femme | S01 accueil | 20,8 | même idée (titre + 2 cartes photo), notre badge et notre titre sont plus hauts |
| s03 âge | S03 | 11,1 | titre à gauche, 6 tranches au lieu de 5 |
| s05 intro scan | S05 | 16,9 | notre visage maillé au lieu de leur photo |
| s06 consentement | S06 | 13,5 | notre texte légal est plus long (RGPD art. 9 français) |
| s08 intro du plan | S10 | 12,2 | même « aujourd'hui / ton max » masqués, autre disposition |
| s09 difficultés | S11 | 36,3 | même liste avec cases, titre à gauche |
| s10 objectifs | S12 | 31,9 | idem |
| s11 message | S13 | 8,1 | notre phrase reprend ses réponses, la leur est fixe |
| s12 le pari | S15 | 30,7 | mêmes 5 cartes |
| s18 morphologie | S20 | 21,3 | nos silhouettes dessinées |
| s20 récap | S26 | 40,7 | même récap en 4 lignes |

Diff images: `replica/diffs/*.png`.

## Behaviour (what the scores cannot see)

| parcours | l'original | MOGX | on garde ? |
| --- | --- | --- | --- |
| Entrer dans le quiz | photo + « Start now », puis le choix du sexe | les 2 cartes Homme/Femme : **un geste de moins** | oui |
| E-mail | demandé avant le paiement | demandé **dans** le paiement, puis « Ton compte est créé » : **un écran de moins** | oui (choix de Maël, pas de relance) |
| Minuteur | repart à zéro à chaque visite | **vrai** : 15 min, une seule fois par téléphone, vérifié par le serveur | oui (DGCCRF) |
| Preuve sociale | 4,8 ★, 73 000 scans, témoignages | « MOGX, top en France » sans chiffre, visages notés « créés par IA » | oui (pas de faux chiffres) |
| Paiement | page à part | dans la page (Apple Pay / Google Pay) quand la clé Stripe est mise | oui |
| Garantie | 30 jours, plafond, demande par e-mail | 1re semaine, 5 jours sur 7 cochés, remboursement en 1 clic | oui |
| Résiliation | non vue | 1 clic dans l'espace membre | oui |
| Erreur d'analyse | non vue | message clair + reprendre les photos ou continuer sans | oui |

## Propreté (vérifié le 26/11/2026)

- Aucune trace de la marque, du domaine ou des couleurs de l'original (`sweep.py`).
- Aucune clé secrète dans le code ; tests serveur 39/39 ; parcours complet 15/15 deux fois de suite ; accessibilité (axe, WCAG AA) sans problème sur l'accueil, le quiz, le paiement, l'espace membre, les pages légales, /infos/ et la page 404.
- 21 liens internes testés : aucun cassé. Aucune erreur dans la console sur tout le parcours.
- Accueil : 14 fichiers, 285 Ko en tout (images des cartes 15 à 19 Ko).
- Corrigé pendant la vérification : une adresse inconnue renvoyait l'accueil avec le code 200 en ligne → vraie page 404 ; la page « Paiement de test » s'affichait aussi hors mode test → elle renvoie maintenant à l'accueil ; la vérification finale se signalait elle-même comme « clé secrète » → corrigé ; styles de l'ancien accueil plus utilisés → retirés.
- Laissés exprès : `functions/api/lead.js` et les relances du cron (inactifs, au cas où Maël les rallume) ; `/design/` (page interne des composants, non indexée).

## Les 5 prochaines choses à faire

1. Clé Stripe **test** → essayer le vrai paiement (carte acceptée, refusée, 3-D Secure, webhook, e-mail).
2. Clé Claude → test réel de l'analyse sur 20 photos (note stable à 3 points près).
3. Infos de la société + médiateur dans `dev/legal.mjs` (les « À REMPLIR »).
4. Brancher mogx.fr + Resend (e-mails) sur mogx.fr.
5. Ensuite seulement (« should ») : pixel Meta avec bandeau cookies, articles avec sources.

---

## Annexe : sortie de l'outil
## Parity: 71.1 / 100

features 83.3  (38 counted, must-haves 15 of 18 done)
layout   22.1  (11 screens compared)

Not shippable yet: 3 must-have features are not done.

## By area, weakest first
- content                        0.0  (1 features)
- addons                         0.0  (4 features)
- i18n                           0.0  (1 features)
- payments                      77.8  (8 features)
- scan                          84.4  (6 features)
- funnel                        88.9  (4 features)
- quiz                         100.0  (7 features)
- report                       100.0  (1 features)
- plan                         100.0  (2 features)
- account                      100.0  (3 features)
- notifications                100.0  (1 features)

## Missing, in build order
- [must] payments: Abonnement avec prix d'appel puis renouvellement automatique, partial  (0,99 € pour 3 jours (essai Stripe + paiement unique), puis 16,99 €/semaine, 1re semaine obligatoire ; testé (simulé), à essayer avec une clé test)
- [must] payments: Paiement Stripe carte Apple Pay Google Pay, partial  (S27 · Stripe Checkout codé et testé (simulé) ; à essayer avec une clé test)
- [must] scan: Analyse IA du visage sur 15 critères avec note actuelle et note max, partial  (how-it-works · code fait, testé en mode essai ; à tester avec une vraie clé Claude sur 20 photos)
- [should] content: Bibliothèque d'articles avec sources, no  (S35 à écrire nous-mêmes)
- [should] funnel: Suivi des sources de pub (utm et pixel Meta), partial  (URL d'entrée · utm et compteur par écran faits ; pixel Meta plus tard, après bandeau cookies)
- [could] addons: Coach IA en chat avec quota mensuel (option payante), no  (S32)
- [could] addons: Pack de leçons (option), no
- [could] addons: Rapport tenue sur photo (option), no  (S33)
- [could] addons: Rapport âge de peau sur photo (option), no  (S33)
- [could] i18n: Plusieurs langues, no  (/en/ dans l'URL)
- [could] payments: Achat d'option en 1 tap sur la carte enregistrée, no  (S31 Stripe hors session)
- [could] scan: Retake du scan pour mesurer les progrès, no  (how-it-works « baseline you can retake »)

## Left out on purpose (not scored)
- Variantes A/B de l'accueil du tunnel: accueil unique sans friction (titre + cartes Homme / Femme), choisi par Maël le 25/11/2026 ; ?v= garde la mesure
- E-mails de relance après l'e-mail sans achat: plus d'e-mail avant le paiement (choix de Maël le 25/11/2026) : le code reste, inactif
- Témoignages et photos avant/après de l'original: ne pas copier et rien ne prouve qu'ils sont réels
- Chiffres de preuve sociale (4.8 et 73000 scans): on n'affiche que nos vrais chiffres
- Sosies célèbres dans le rapport: droit à l'image des personnalités
- Chargement simulé qui fait croire à un calcul: trompeur
- Prix d'appel 0.99 puis 19.99 par semaine (prix de l'original): on a notre propre grille (décidée par Maël) : 0,99 € / 3 jours puis 16,99 €/semaine, engagement écrit en clair
- Articles science de l'original: leurs textes : on écrit les nôtres
- Marque GODMODE police et visuels: leur identité

## Yours, not in the original (not scored)
- Aperçu du vrai résultat avant paiement (point fort, gain, critères qui freinent)
- Analyse en direct sur sa photo (maillage thermique)
- Phrases qui reprennent ses réponses
- Révélation de la note après paiement
- Lien de connexion direct dans l'e-mail de bienvenue

## Screens
- replica/clone-screens/S13-message.png      8.1
- replica/clone-screens/S03-age.png         11.1
- replica/clone-screens/S10-plan_intro.png  12.2
- replica/clone-screens/S06-consentement.png  13.5
- replica/clone-screens/S05-scan_intro.png  16.9
- replica/clone-screens/S01-accueil.png     20.8
- replica/clone-screens/S20-morpho.png      21.3
- replica/clone-screens/S15-pari.png        30.7
- replica/clone-screens/S12-objectifs.png   31.9
- replica/clone-screens/S11-difficultes.png  36.3
- replica/clone-screens/S26-recap.png       40.7
