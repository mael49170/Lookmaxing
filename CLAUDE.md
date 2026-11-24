# Lookmaxing (nom provisoire)

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
