# Plan de test : Lookmaxing

Build : 80ae5b3 + corrections  Date : 2026-11-24  Env : local, mode essai (analyse et paiement simulés)

Lancer : `node test/flow.test.mjs`, `node test/backend.test.mjs`, `node test/units.test.mjs` (serveur, sans navigateur),
puis `node dev/server.mjs` et `node e2e/quiz.e2e.cjs [axe.min.js]` (navigateur).

| case | parcours | type | étapes | attendu | auto | résultat |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | visiteur → rapport payé, avec scan | normal | quiz, accord, 2 photos, 2 questions rapides, e-mail, offre, case, payer | rapport (15 critères), plan du jour, case cochée comptée | e2e | ok |
| F01-E1 | | rechargement en plein quiz | aller au S12, recharger | même écran, réponses gardées | e2e | ok |
| F01-E2 | | retour arrière | aller au S10, bouton retour du navigateur | S09, réponses gardées | e2e | ok |
| F01-E3 | | double clic sur Payer | | une seule page de paiement demandée | e2e | ok |
| F01-E4 | | clavier seulement | Tab, flèches, Espace | les flèches choisissent sans valider, Espace valide | e2e | ok (BUG-001 corrigé) |
| F01-E5 | | l'analyse échoue | réponse « pas de visage » | message clair, reprendre les photos ou continuer sans | e2e | ok |
| F01-E6 | | grand écran 1440 px | | pas de défilement horizontal, colonne de 480 px centrée | e2e | ok |
| F01-E7 | | e-mail long, accents, + | | accepté | e2e | ok |
| F01-E8 | | rechargement pendant l'analyse | | photos perdues : proposition de les reprendre | code | à vérifier à la main |
| F01-E9 | | 4G partagée (même IP) | 10 scans depuis une même IP | les 10 passent, le 11e est refusé avec un message | api | ok (BUG-002 corrigé) |
| F01-E10 | | deux scans pour un même quiz | | un seul appel payant | api | ok |
| F01-N1 | | e-mail invalide | | message sous le champ | e2e | ok |
| F01-N2 | | payer sans cocher la renonciation | | refusé avec message, pas de paiement | e2e + api | ok |
| F01-N3 | | carte refusée (Stripe 4000 0000 0000 0002) | | Stripe affiche l'erreur, aucun compte créé | manuel | à faire avec une clé test |
| F01-N4 | | scan sans consentement | appel direct à l'API | refusé (403) | api | ok |
| F01-N5 | | photo pas une image / trop lourde | | refusé | api | ok |
| F01-S1 | | photos jamais gardées | après un scan, lire toute la base | aucune trace de la photo | api | ok |
| F01-S2 | | photos jamais dans les journaux | erreur de l'IA | journal sans photo | api | ok |
| F02-H1 | sans photo (variante B) | normal | « Pas maintenant », quiz, e-mail, payer | plan d'après les réponses, rapport expliqué, pas de « ?.? » | e2e | ok |
| F02-E1 | | retrait du consentement après un scan | | notes effacées | api | ok |
| F03-H1 | mineur | normal | « Moins de 18 ans » | arrêt, quiz effacé, cookie effacé | e2e + api | ok |
| F04-H1 | membre qui revient | normal | session expirée → connexion → code | espace membre | e2e | ok (BUG-003 corrigé) |
| F04-E1 | | lien de connexion | lien de l'e-mail, 2 fois | 1re fois connecté, 2e fois « expiré » ; pas d'e-mail dans le lien | api | ok |
| F04-E2 | | déconnexion de tous les appareils | | l'autre appareil est déconnecté | api | ok |
| F04-N1 | | mauvais code | | « Code incorrect », 5 essais au plus | e2e + api | ok |
| F04-N2 | | adresse inconnue | | même réponse qu'une adresse connue, aucun code envoyé | api | ok |
| F04-N3 | | données d'un autre client | client B connecté | ne voit et ne change que ses données | api | ok |
| F05 | achat d'option | — | — | — | — | pas construit (could) |
| F06-H1 | résilier puis supprimer | normal | résilier, supprimer | résilié (fin de période), tout effacé | e2e + api | ok |
| F06-N1 | | supprimer avec un abonnement en cours | | refusé : résilier d'abord | e2e + api | ok |
| W-1 | webhooks Stripe | signature fausse / événement en double | | refusé / traité une fois, un seul e-mail de bienvenue | api | ok |
| W-2 | | paiement refusé au renouvellement | | statut « en retard » + e-mail | api | ok |
| J-1 | tâches du jour | secret, nettoyage, rappel 1 fois par jour, 2 relances au plus, désinscription | | | api | ok |
| A-1 | accessibilité | axe WCAG A et AA sur chaque écran | | 0 problème | e2e | ok |

## À faire à la main (avec les vraies clés, avant d'ouvrir)
- [ ] F01-N3 : carte refusée 4000 0000 0000 0002, et carte 3-D Secure 4000 0027 6000 3184.
- [ ] Paiement test complet : le webhook arrive, l'e-mail de bienvenue arrive (et pas dans les indésirables).
- [ ] Analyse réelle : 20 photos de personnes d'accord, 3 passages chacune. La note doit varier de 3 points au plus.
- [ ] Appareil photo sur un vrai iPhone (Safari) et un vrai Android (Chrome).
- [ ] F01-E8 : recharger la page pendant l'analyse.
- [ ] E-mail de rappel le matin, lien de désinscription depuis Gmail.
