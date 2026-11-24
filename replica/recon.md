# Recon map : GodModeLooks (web mobile)

Périmètre : le tunnel d'entrée (quiz → scan du visage → e-mail → paiement → rapport et plan) et l'espace membre de base. Les options payantes (coach IA, rapports photo, pack de leçons) sont notées mais en « could ».
Pour : le marché français, en français (décidé par Maël le 24/11/2026). Donc RGPD (données du visage) et droit de la consommation français (prix affichés, résiliation en 3 clics, rétractation 14 jours).
Date : 2026-11-24

## Avertissement : les conditions du site

Les conditions d'utilisation de GodModeLooks (section 2.5, https://godmodelooks.com/en/terms) interdisent :
- « use the Service to build or benchmark a competing product » ;
- « scrape, crawl or spider the Service » ;
- « reverse engineer […] any part of the Service ».

Ce qui a été fait : une seule visite du quiz public, à vitesse humaine, avec un navigateur automatique, arrêtée avant l'e-mail. Pas de compte, pas de photo envoyée, pas d'e-mail saisi, aucun code ni appel réseau du site lu. À partir d'ici, la suite se fait **uniquement à partir des pages publiques déjà lues** (accueil, « how it works », conditions, politiques). On ne repasse plus dans leur quiz.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | tunnel (quiz) | https://godmodelooks.com/en/q/main | 1 visite, jusqu'à l'écran e-mail. 2 variantes d'accueil vues (test A/B). |
| 2 | accueil | https://godmodelooks.com/en | positionnement « looksmaxxing sans le folklore » |
| 3 | comment ça marche | https://godmodelooks.com/en/how-it-works | les 3 étapes, les 15 critères du scan, exemple de rapport |
| 4 | conditions | https://godmodelooks.com/en/terms | grille de prix complète, options payantes, espace membre, interdictions |
| 5 | remboursement | https://godmodelooks.com/en/refund | garantie 30 jours sous conditions, plafond 60 $ |
| 6 | livraison | https://godmodelooks.com/en/fulfillment | ce qui est livré, connexion par lien e-mail |
| 7 | données biométriques | https://godmodelooks.com/en/biometric | consentement écrit, durée de conservation |
| 8 | à propos | https://godmodelooks.com/en/about | principes, ligne éditoriale « science » |
| 9 | plan du site | https://godmodelooks.com/sitemap.xml | 9 articles « science » |

Non vus : l'écran de paiement, le rapport, l'espace membre. Tout ce qui les concerne vient des conditions et de « how it works ». Confiance moyenne.

## Core loop

Un homme peu sûr de lui répond à un quiz de 2 minutes, envoie 2 selfies, reçoit une note de visage « maintenant / ton maximum » et achète un abonnement pour débloquer le rapport et un plan jour par jour (peau, cheveux, corps, style, confiance).

## Screens

| ID | écran | accès | rôle | composants clés | états vus |
| --- | --- | --- | --- | --- | --- |
| S01 | Accueil du tunnel, variante A | /en/q/main | accroche avant/après, note 8.6 | photo, badges +0.9 peau…, jauge rouge→vert, bouton « Start now », preuve sociale (4.8, 73 000 scans) | rempli |
| S01b | Accueil, variante B | /en/q/main | choix du sexe tout de suite | 2 gros boutons Male / Female | rempli |
| S02 | Sexe | après S01 | personnaliser | 2 boutons | rempli |
| S03 | Âge | après S02 | âge et blocage mineurs | 6 tranches | rempli |
| S03b | Blocage moins de 18 ans | S03 « Under 18 » | fin du tunnel | texte, « Go back » | rempli |
| S04 | Témoignages | après S03 | preuve sociale | 3 cartes (prénom, âge, semaines, note avant → après, citation) | rempli |
| S05 | Intro du scan | après S04 | promesse « 30+ points » | visuel, « Continue » | rempli |
| S06 | Consentement biométrique | après S05 | consentement écrit avant la caméra | texte légal, « Details », « I agree, continue », « Not now » | rempli |
| S07 | Prise des 2 photos (face, profil) | S06 « I agree » | capture | caméra, guide de cadrage | non vu |
| S08 | Intro du plan | après S06/S07 | « Today ?.? / Your max ?.? » | 2 notes masquées | rempli |
| S09 | Difficultés | | choix multiples | 9 cartes emoji + case, « Continue » | vide, rempli |
| S10 | Objectifs | | choix multiples | 7 cartes | vide, rempli |
| S11 | Message personnalisé | | reprend la réponse S09 | titre dynamique « Low confidence ends here. », « I'm ready » | rempli |
| S12 | Le pari | | deviner sa note (révélée à la fin) | 5 cartes, « Lock in my guess » | vide, rempli |
| S13–S15 | Questions confiance | | choix unique, passe tout seul | 4 cartes emoji | rempli |
| S16 | Témoignage | | preuve sociale | photo, citation, « Sounds good » | rempli |
| S17 | Déjà essayé | | choix multiples | 6 cartes | rempli |
| S18 | Morphologie | | choix unique | 4 options | rempli |
| S19 | Style | | choix unique | 5 cartes | rempli |
| S20 | Récap « Your plan so far » | | montre le plan qui se construit | 4 lignes (visage, corps, habitudes, présence), reprend S18 | rempli |
| S21–S22 | Questions confiance (2) | | choix unique | 4 cartes | rempli |
| S23 | Ce que tu as évité | | choix multiples | 6 cartes | rempli |
| S24 | « Building your plan… » | | attente simulée + 2 micro-questions oui/non | 3 barres de progression, questions « 5 min par jour ? », « rappel quotidien ? » | chargement |
| S25 | E-mail obligatoire | | capter l'adresse avant le résultat | notes masquées « ?.? », champ e-mail, mention marketing | vide, erreur « Enter a valid email address » |
| S26 | Paywall | | choisir une offre | grille d'offres (prix d'appel → renouvellement), récap | non vu (prix lus dans les conditions) |
| S27 | Paiement | | Stripe (carte, Apple Pay, Google Pay, Link) | formulaire Stripe, mention droit de rétractation UE | non vu |
| S28 | Rapport | après paiement | notes maintenant / potentiel, points forts, points faibles classés, sosies célèbres, révélation du pari | jauges, listes notées sur 100 | exemple public seulement |
| S29 | Plan + espace membre | lien e-mail | plan jour par jour, suivis (trackers) | liste de tâches, cases | non vu |
| S30 | Connexion | lien ou code e-mail | sans mot de passe | champ e-mail, code | non vu |
| S31 | Offre d'option (upsell) | dans l'espace membre | achat en 1 tap | prix, bouton, mention renouvellement | non vu |
| S32 | Coach IA | option | chat, photo jointe, quota mensuel | fil de messages, compteur | non vu |
| S33 | Rapport âge de peau / rapport tenue | option | photo → rapport | consentement, caméra, rapport | non vu |
| S34 | Gérer l'abonnement / supprimer le compte | You → Manage subscription | annuler | boutons | non vu |
| S35 | Bibliothèque « science » | /en/science | articles notés par niveau de preuve | liste, article avec références | rempli |
| S36 | Pages légales | /en/terms… | conditions, confidentialité, remboursement, livraison, avertissement, biométrie | texte long | rempli |

## Flows

```
F01 Visiteur → rapport payé (avec scan)
    S01 -> S02 -> S03 -> S04 -> S05 -> S06 -> S07 -> S08 -> S09…S24 -> S25 -> S26 -> S27 -> S28
    happy path clicks : ~32 (27 écrans vus + photos + paiement)
    edge : moins de 18 ans (S03b), refus du scan (F02), e-mail invalide, paiement refusé, 3-D Secure,
           photo floue ou sans visage, plusieurs visages, client UE (rétractation 14 jours)

F02 Visiteur sans scan
    S06 « Not now » -> S08 -> … -> S28 (plan tiré des réponses seulement, pas de note)

F03 Mineur
    S03 « Under 18 » -> S03b (fin, aucune donnée demandée)

F04 Membre qui revient
    e-mail -> S30 (lien ou code) -> S29

F05 Achat d'une option en 1 tap
    S29 -> S31 -> paiement sur la carte enregistrée -> S32 ou S33

F06 Annuler / supprimer
    S29 -> S34 -> annuler l'abonnement (et le coach séparément) -> supprimer le compte
```

## Components

| composant | variantes | états | utilisé sur |
| --- | --- | --- | --- |
| Bouton principal plein rouge | normal, avec flèche | normal, désactivé, chargement | tous |
| Carte de réponse | choix unique (passe tout seul), choix multiple (case à cocher) | normal, choisi (fond rosé, bord rouge) | S09–S23 |
| Barre de progression du quiz | avec flèche retour | | S09–S23 |
| Carte note | avant/après, masquée « ?.? » | | S01, S08, S25, S28 |
| Jauge rouge → vert | | | S01, S28 |
| Carte témoignage | courte (3 en ligne), longue (photo) | | S04, S16 |
| Écran interstitiel | message perso, récap du plan | | S11, S20 |
| Chargement simulé | 3 barres + micro-question | | S24 |
| Écran de consentement | court + « Details » dépliable | | S06, S33 |
| Champ e-mail | | vide, erreur | S25, S30 |
| Badge preuve sociale | | | S01 |

## Inferred data model

```
QuizSession  id, variant (A/B), sexe, tranche_age, reponses (json), pari, a_consenti_scan (bool + date),
             utm (source, campagne, contenu), cree_le
             evidence: S01–S24, URL avec utm_*         confidence: high

ScanResult   id, quiz_session_id, note_actuelle, note_max, facteurs (15 notes sur 100),
             points_forts, points_faibles, sosies (noms), supprime_le
             evidence: how-it-works, conditions 2.2, politique biométrique   confidence: medium
             (photos jamais enregistrées, mesures gardées dans l'onglet seulement)

Lead         email, consentement_marketing, quiz_session_id
             evidence: S25                              confidence: high

Customer     id, email, stripe_customer_id, moyen_de_paiement_enregistre
             evidence: conditions 2.6, 4.1, 4.8         confidence: high

Subscription id, customer_id, offre (prix d'appel, durée d'appel, prix de renouvellement, rythme),
             statut, renouvelle_le, annule_fin_de_periode
             evidence: conditions 4.1–4.3 (grille de 10 offres)   confidence: high

Plan         id, customer_id, jours[] -> taches[] (domaine : peau, cheveux, corps, style, confiance)
             evidence: how-it-works étape 3, livraison    confidence: medium

TrackerLog   customer_id, date, type, valeur
             evidence: livraison (« beside the trackers »)   confidence: guess

AddonPurchase  customer_id, type (coach, pack, rapport_age, rapport_tenue), prix, recurrent
CoachMessage   customer_id, role, texte, photo?, cree_le ; CoachAllowance (mois, restant)
PhotoReport    customer_id, type, resultat (json), cree_le
             evidence: conditions 2.9, 2.10, 4.8          confidence: medium
```

Relations : QuizSession 1-1 ScanResult (optionnel), QuizSession 1-1 Lead, Customer 1-n Subscription, Customer 1-1 Plan, Customer 1-n AddonPurchase / CoachMessage / PhotoReport / TrackerLog.

## Prix de l'original (conditions, section 4)

Abonnement : 10 offres possibles, changent d'une visite à l'autre. Exemples :
- 0,99 $ la 1re semaine, puis 19,99 $ par semaine (52 prélèvements par an, soit 1 039 $ par an) ;
- 19,99 $ le 1er mois, puis 49,99 $ par mois ;
- 39,99 $ les 3 premiers mois, puis 79,99 $ tous les 3 mois.

Options : coach IA 19,99 $ puis 39,99 $ par mois ; pack 6 en 1 14,99 $ ; rapport âge de peau 8,94 $ ; rapport tenue 7,94 $.
Garantie : 30 jours, seulement après 21 jours de programme suivis, plafonnée à 60 $.

## Feature matrix

Voir `features.csv`. Must : 18, should : 10, could : 7, skip : 7.

## Out of scope (ne peut pas ou ne doit pas être repris)

- Leurs témoignages, photos avant/après et prénoms (Mara, Alex, Dan, Jake) : à ne pas copier. Rien ne prouve qu'ils sont réels. Des faux avis sont interdits en France (pratique commerciale trompeuse).
- Leurs chiffres de preuve sociale (« 4.8 », « 73 000+ scans », « Trending in the US ») : à ne jamais reprendre. Le clone n'affiche que ses propres chiffres, vrais.
- Leurs textes, leur marque « GODMODE », leur police, leurs articles « science ».
- Les sosies célèbres : risque sur le droit à l'image des personnalités. À éviter.
- Le prix d'appel à 0,99 $ qui passe à 19,99 $ par semaine : légal aux États-Unis avec mentions, très risqué en France (DGCCRF, résiliation en 3 clics obligatoire depuis 2023).
- Le « chargement simulé » (S24) qui fait croire à un calcul : à refaire honnêtement ou à enlever.

## Size

Écrans 36 (dont 12 non vus), parcours 6, entités 10. Parties difficiles :
1. **L'analyse du visage par IA** : un modèle de vision qui note 15 critères de façon stable (la même photo doit donner la même note), et le coût de chaque scan.
2. **Les données biométriques** : en Europe, la géométrie du visage est une donnée sensible (RGPD article 9). Il faut un consentement explicite, une analyse d'impact (AIPD), une durée de conservation écrite. C'est le point le plus lourd.
3. **La facturation** : prix d'appel puis renouvellement, achat d'option en 1 tap sur la carte enregistrée (Stripe hors session), droit de rétractation de 14 jours dans l'UE, résiliation en 3 clics.

Taille : **L** (environ un trimestre pour tout ; le tunnel seul avec scan, e-mail, paiement et rapport : M, quelques semaines).

## Décisions (24/11/2026)

1. Conditions : Maël décide de ne pas en tenir compte, à ses risques. On ne retourne pas dans leur quiz (ni faux e-mail, ni photos) : tout le reste vient des pages publiques déjà lues. Rien de ce qui leur appartient n'est repris (textes, images, marque).
2. Public : France, en français.
3. Dépôt : `mael49170/Lookmaxing`, créé par Maël.
4. Avis clients : Maël a demandé de faire « comme lui ». Refusé : on n'écrit pas de faux témoignages ni de faux chiffres. À la place : un exemple de rapport marqué « exemple » (comme leur « illustrative sample »), puis de vrais avis de testeurs, avec leur accord, dès qu'il y en a.
