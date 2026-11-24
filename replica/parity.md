## Parity: 74.1 / 100

features 80.2  (35 counted, must-haves 14 of 18 done)
layout   49.8  (6 screens compared)

Not shippable yet: 4 must-have features are not done.

## By area, weakest first
- content                        0.0  (1 features)
- addons                         0.0  (4 features)
- i18n                           0.0  (1 features)
- payments                      66.7  (5 features)
- scan                          75.0  (6 features)
- funnel                        85.7  (3 features)
- quiz                         100.0  (7 features)
- report                       100.0  (1 features)
- plan                         100.0  (2 features)
- account                      100.0  (3 features)
- notifications                100.0  (2 features)

## Missing, in build order
- [must] payments: Abonnement avec prix d'appel puis renouvellement automatique, partial  (conditions 4.3 · réduction 1re période + webhooks, testés (simulé) ; à essayer avec une clé test)
- [must] payments: Paiement Stripe carte Apple Pay Google Pay, partial  (S27 · Stripe Checkout codé et testé (simulé) ; à essayer avec une clé test)
- [must] scan: Analyse IA du visage sur 15 critères avec note actuelle et note max, partial  (how-it-works · code fait, testé en mode essai ; à tester avec une vraie clé Claude sur 20 photos)
- [must] scan: Écran de consentement biométrique avant la caméra avec refus possible, partial  (S06 RGPD art. 9 · écran fait ; page /biometrie/ à écrire (launch))
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
- Témoignages et photos avant/après de l'original: ne pas copier et rien ne prouve qu'ils sont réels
- Chiffres de preuve sociale (4.8 et 73000 scans): on n'affiche que nos vrais chiffres
- Sosies célèbres dans le rapport: droit à l'image des personnalités
- Chargement simulé qui fait croire à un calcul: trompeur
- Prix d'appel 0.99 puis 19.99 par semaine: très risqué en droit français de la consommation
- Articles science de l'original: leurs textes : on écrit les nôtres
- Marque GODMODE police et visuels: leur identité

## Screens
- replica/clone-screens/S18.png             32.2
- replica/clone-screens/S20.png             46.1
- replica/clone-screens/S13.png             48.2
- replica/clone-screens/S12.png             54.6
- replica/clone-screens/S10.png             58.2
- replica/clone-screens/S09.png             59.4

## Note sur le score de mise en page (49,8)

Il est bas, et c'est voulu en partie : le score compare la place des éléments, et le clone a sa propre mise en page (titres plus gros, cartes de réponse plus hautes, pas de photo d'homme en haut de l'accueil). Recopier exactement la disposition de l'original serait copier son « habillage ». Seuls les 6 écrans de questions dont on est sûr qu'ils se correspondent sont comptés : les autres captures de l'original ont été prises à des moments différents du parcours (tests A/B), la comparaison n'aurait pas de sens.

## Différences de comportement

| parcours | l'original fait | le clone fait | garder ou corriger |
| --- | --- | --- | --- |
| F01 nombre d'écrans | ~27 écrans jusqu'à l'e-mail | 25 écrans jusqu'à l'e-mail | garder |
| F01 preuve sociale | « 4.8 », « 73 000 scans », témoignages avec photos avant/après | un exemple étiqueté « Exemple », 3 étapes, un fait sourcé | garder (aucun faux avis) |
| F01 chargement | barres qui avancent toutes seules | barres qui attendent la vraie fin de l'analyse | garder |
| F01 note max | ? (inconnu) | calculée par le code, seulement sur ce qui se travaille (jamais l'ossature) | garder |
| F01 notes avant paiement | inconnues | jamais envoyées au navigateur avant le paiement | garder |
| F01 offres | 10 offres possibles, dont 0,99 $ puis 19,99 $ par semaine | 2 offres mensuelles, prix provisoires | à décider à l'étape launch |
| F01 renonciation 14 jours | case à la page de paiement (UE) | case obligatoire avant le paiement | garder |
| F06 résiliation | par e-mail ou « Manage subscription » | un bouton dans l'espace, un clic | garder |
| F06 suppression | après résiliation | pareil, et tout est vraiment effacé | garder |
| Relances | e-mails « conseils et offres » | 2 au plus, seulement si la case est cochée | garder |
| Options payantes | coach IA, rapports photo, pack | pas construites | plus tard |

## Verdict

**Pas encore vendable**, honnêtement : 4 fonctions indispensables ne sont qu'à moitié faites, et les 4 attendent la même chose :
1. une clé Stripe **test** pour essayer le vrai paiement (2 fonctions) ;
2. une clé Claude pour tester la vraie analyse sur 20 photos ;
3. la page /biometrie/ (étape launch, avec les autres pages légales).

Le code est prêt pour les trois. Aucun bug S1 ou S2 ouvert.

## Les 5 prochaines choses à faire
1. Clé Stripe test : paiement complet, carte refusée, 3-D Secure, webhook, e-mail de bienvenue.
2. Clé Claude : 20 photos × 3 passages, stabilité de la note, coût réel par scan, choix Opus ou Sonnet.
3. Pages légales : biométrie, confidentialité (avec chaque prestataire), CGV, mentions légales, plus l'analyse d'impact (AIPD).
4. Vrais prix (étape launch), puis le bandeau cookies et le pixel Meta.
5. Articles avec sources (« should »), puis les options payantes (« could »).
