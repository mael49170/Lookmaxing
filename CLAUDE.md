# Lookmaxing (nom provisoire)

Quiz mobile + scan du visage + plan pour s'améliorer, pour le marché français, en français. Reconstruit les fonctions de GodModeLooks (pas ses textes, ses images ni sa marque) avec le pack Replica.

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
