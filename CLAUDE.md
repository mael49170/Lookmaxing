# MOGX

Quiz mobile + scan du visage + plan pour s'améliorer, pour le marché français, en français. Reconstruit les fonctions d'un site existant (voir `replica/recon.md`), jamais ses textes, ses images ni sa marque, avec le pack Replica.

- `replica/` : le travail du pack Replica. `recon.md` (écrans S01…, parcours F01…), `features.csv` (la liste des fonctions, colonne `clone` à remplir), `architecture.md`, `schema.sql`. `replica/screens/` : captures de l'original, référence seulement, jamais dans le site.
- Même base que Kadrio : Cloudflare Pages + Functions + D1, Stripe, Resend, Claude. Aucune dépendance.

## Le propriétaire

Maël est cuisinier, pas développeur. Toujours expliquer simplement, en français, et dire ce qui va être fait avant chaque grosse modification. Ne rien supprimer sans son accord.

## Règles (ne pas changer sans accord)

- Aucune photo de visage enregistrée, nulle part (ni base, ni disque, ni logs).
- Consentement biométrique sur son propre écran, avant la caméra, refus aussi simple que l'accord.
- Pas de moins de 18 ans.
- Aucun faux avis, aucun chiffre inventé (notes, nombre de scans, « tendance »).
- Prix TTC en euros, prix de renouvellement écrit au-dessus du bouton, résiliation en 3 clics.
- Aucune clé secrète dans le code : Cloudflare (Variables and secrets) ou `.dev.vars` en local (jamais commité).
- Vérifier le coût réel de chaque appel IA avant d'ajouter ou de changer une fonction.

## Marque et design (décidé par Maël le 24/11/2026)

- Sombre, noir, émotionnel, « ultra chaud » tout au long du parcours. Marketing avant tout, le moins de friction possible.
- Le compte se crée tout seul au paiement (pas d'inscription, pas de mot de passe) ; l'e-mail de bienvenue contient un lien de connexion direct.
- Couleurs, typo, voix : `replica/brand.md` et `replica/design/tokens.json` (puis `node dev/tokens.mjs`). Le dégradé thermique est réservé à ce qui parle de la personne (visage, note, progression).
- Limites qui restent : pas de faux avis, pas de faux chiffres, pas de faux compte à rebours, prix de renouvellement toujours visible.

## Prix (décidé par Maël le 25/11/2026)

- 0,99 € les 3 premiers jours, puis une 1re semaine obligatoire à 16,99 €, puis 16,99 € par semaine jusqu'à résiliation. Une seule offre : `src/shared/plans.js` (seule source, lue par la page de paiement, Stripe, les e-mails).
- Le minimum (17,98 €), le prix à la semaine et l'engagement sont écrits juste au-dessus du bouton de paiement, sur la page Stripe et dans l'e-mail de bienvenue. Résilier pendant l'essai : la semaine d'engagement reste prélevée, puis plus rien.
- Minuteur VRAI (décidé le 25/11/2026) : l'essai à 0,99 € est réservé 15 minutes, une seule fois par e-mail et par téléphone (`lib/offer.js`, vérifié par le serveur au paiement). Ensuite : 16,99 € la semaine directement. Jamais de minuteur qui repart à zéro.
- Garantie avec conditions (25/11/2026) : 1re semaine payée remboursée si le plan est coché au moins 5 jours sur 7, demande dans les 14 jours, une fois ; automatique depuis l'espace membre (`lib/guarantee.js`), et ça arrête l'abonnement.
- Paiement dans notre page (Stripe intégré, Apple Pay / Google Pay) si `STRIPE_PUBLISHABLE_KEY` est réglée, sinon page Stripe.
- Page de paiement : la photo (en mémoire seulement), le vrai max, les vraies notes avec les noms cachés, le vrai plan (2 semaines visibles). Refusé (DGCCRF, Meta) : faux compteurs de personnes, faux avis, avant/après d'inconnus, prix barrés fictifs, célébrités, produits de marque avec faux pourcentages.

## Nom et pages légales (25/11/2026)

- Nom : **MOGX** (choisi par Maël). Vérifications de marque et de domaine à faire : `replica/brand.md`.
- Pages légales fabriquées par `node dev/legal.mjs` (CGV, confidentialité, données du visage, mentions légales) : les prix et conditions viennent de `src/shared/plans.js`. Après un changement de prix, relancer le script (un test le vérifie). Les informations de la société sont dans `EDITEUR` en haut du script (« [À REMPLIR] » tant qu'elles manquent : ne pas ouvrir le site avant).
- Le texte du consentement biométrique a une version (`CONSENT_VERSION` dans `functions/api/scan-consent.js`) : la changer à chaque modification du texte.
