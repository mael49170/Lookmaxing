# Journal de construction

Mode essai en local : `node dev/server.mjs` puis http://localhost:8788/q/ (analyse et paiement simulés, aucune clé, rien de payant).
Parcours complet automatique avec captures : `node dev/e2e-walk.cjs a chemin/photo.jpg` (ou `b` sans photo). Tests : `node test/flow.test.mjs` et `node test/units.test.mjs`.

| écran | date | état | ce qui manque | plus dur que prévu |
| --- | --- | --- | --- | --- |
| S01 / S01b accueil | 24/11 | fait | — | la variante B pose la 1re question sur l'accueil |
| S02 genre | 24/11 | fait | — | |
| S03 âge + S03b blocage | 24/11 | fait | — | rien n'est gardé, cookie effacé |
| S04 étapes | 24/11 | fait | — | remplace leurs témoignages (pas de faux avis) |
| S05 intro du scan | 24/11 | fait | — | |
| S06 consentement | 24/11 | partiel | la page /biometrie/ (lien « Tout le détail ») | |
| S07 photos | 24/11 | fait | test sur un vrai iPhone et Android | réduction des photos dans le téléphone, analyse en arrière-plan pendant le quiz |
| S08 intro du plan | 24/11 | fait | — | |
| S09–S23 questions | 24/11 | fait | — | S16 : un fait sourcé au lieu d'un témoignage |
| S24 construction | 24/11 | fait | — | attend la vraie fin de l'analyse (pas de faux chargement) ; propose de reprendre les photos si elle échoue |
| S25 e-mail | 24/11 | fait | page /confidentialite/ | |
| S26 offres | 24/11 | fait | vrais prix (/replica-launch), page /cgv/ | case de renonciation aux 14 jours obligatoire |
| S27 paiement | 24/11 | essai | Stripe Checkout (/replica-backend) | |
| S28 rapport | 24/11 | fait | test avec de vraies notes de Claude | |
| S29 plan du jour | 24/11 | fait | — | le plan mélangeait trop un seul domaine : corrigé |
| S30 connexion | — | à faire | /replica-backend | |
| S34 résilier / supprimer | 24/11 | partiel | routes /api/subscription-cancel, /api/account-delete, /api/logout | |
| S31–S33 options payantes | — | pas commencé | « could » | |
| S35 articles | — | pas commencé | « should » | |
| S36 pages légales | — | à faire | /replica-launch | |

Points à surveiller :
- L'analyse n'a été testée qu'en mode essai (fausses notes). Le vrai test avec Claude demande une clé et 20 photos de personnes d'accord : c'est le test le plus important avant d'ouvrir.
- Les prix sont provisoires (`src/shared/plans.js`).

## 25/11/2026 : parcours complet (51 écrans), sur le modèle du concurrent maxxing.me (captures de Maël)
- Caméra dans la page : ovale, exemple dessiné, déclencheur, galerie, « C'est bon / Je la reprends », face puis profil ; écran de secours si la caméra est refusée. Consentement toujours AVANT la caméra (RGPD).
- Nouvelles questions : peau, routine, cheveux, sport, alimentation, groupe, langage du corps, regard, 8 questions de personnalité, attentes, durée, « tu vas au bout ? ».
- Nouveaux écrans : selfies (exemples dessinés), analyse avec les 2 photos penchées, 4 écrans « braise », aujourd'hui / avec ton plan (d'après SES réponses), estimation de gain (vraie, depuis son scan), « ce que dit la recherche » (3 vraies études), profil (résumé de ses réponses), rapport en 4 barres.
- Dessins maison : avatars homme / femme, silhouettes de corps (aucune photo de vraie personne).
- Le plan lit les nouvelles réponses (3 tâches « présence » ajoutées).
- Refusé : 360 000 utilisateurs, ★4,9, Harvard/Oxford/Cambridge, « +64 % », avant/après de mannequins, graphique avec logos NIH/APA.
- Retirés car en double avec les questions du concurrent : « on te passe devant », « pièce pleine d'inconnus », « déjà évité », « déjà essayé », « une photo ne dit pas tout ».
- Tests : 35 serveur + 15 navigateur (avec fausse caméra), 0 problème d'accessibilité.
