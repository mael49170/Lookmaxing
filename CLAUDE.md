# MOGX

Quiz mobile + scan du visage + plan pour s'améliorer, pour le marché français, en français. Reconstruit les fonctions d'un site existant (voir `replica/recon.md`), jamais ses textes, ses images ni sa marque, avec le pack Replica.

- `replica/` : le travail du pack Replica. `recon.md` (écrans S01…, parcours F01…), `features.csv` (la liste des fonctions, colonne `clone` à remplir), `architecture.md`, `schema.sql`. `replica/screens/` : captures de l'original, référence seulement, jamais dans le site.
- Même base que Kadrio : Cloudflare Pages + Functions + D1, Stripe, Resend, Claude. Aucune dépendance.

## Le propriétaire

Maël est cuisinier, pas développeur. **Toujours répondre en français**, dans tous les messages, sans exception (demandé par Maël le 25/11/2026). Toujours expliquer simplement, et dire ce qui va être fait avant chaque grosse modification. Ne rien supprimer sans son accord.

## Règles (ne pas changer sans accord)

- Aucune photo de visage enregistrée, nulle part (ni base, ni disque, ni logs).
- Consentement biométrique avant la caméra, refus aussi simple que l'accord : depuis le 27/11/2026 (choix de Maël, moins de friction), plus d'écran séparé, une phrase juste au-dessus du bouton « Prendre mes selfies » (« Continuer sans photo » juste en dessous). Ne jamais retirer cette phrase.
- Pas de moins de 18 ans : bloqué par l'âge déclaré dans le quiz. L'IA n'estime plus l'âge sur les photos (scan-v2, 27/11/2026 : elle prenait des 20 ans pour des mineurs).
- Aucun faux avis, aucun chiffre inventé (notes, nombre de scans, « tendance »).
- Prix TTC en euros, prix de renouvellement écrit au-dessus du bouton, résiliation en 3 clics.
- Aucune clé secrète dans le code : Cloudflare (Variables and secrets) ou `.dev.vars` en local (jamais commité).
- Vérifier le coût réel de chaque appel IA avant d'ajouter ou de changer une fonction.

## Marque et design (décidé par Maël le 24/11/2026)

- Sombre, noir, émotionnel, « ultra chaud » tout au long du parcours. Marketing avant tout, le moins de friction possible.
- Le compte se crée tout seul au paiement (pas d'inscription, pas de mot de passe) ; l'e-mail de bienvenue contient un lien de connexion direct.
- L'e-mail n'est demandé qu'AU paiement (décidé par Maël le 25/11/2026) : c'est le formulaire Stripe qui le demande (en mode test : `/essai-paiement/`), puis l'écran « Ton compte est créé ». Conséquences acceptées par Maël : plus de relance des personnes qui n'ont pas payé (`functions/api/lead.js` et les relances du cron restent en place, inactives), et l'essai n'est bloqué que par téléphone.
- Couleurs, typo, voix : `replica/brand.md` et `replica/design/tokens.json` (puis `node dev/tokens.mjs`). Le dégradé thermique est réservé à ce qui parle de la personne (visage, note, progression).
- Limites qui restent : pas de faux avis, pas de faux chiffres, pas de faux compte à rebours, prix de renouvellement toujours visible.

## Prix (décidé par Maël le 25/11/2026)

- 0,99 € les 3 premiers jours, puis une 1re semaine obligatoire à 16,99 €, puis 16,99 € par semaine jusqu'à résiliation. Une seule offre : `src/shared/plans.js` (seule source, lue par la page de paiement, Stripe, les e-mails).
- Le minimum (17,98 €), le prix à la semaine et l'engagement sont écrits juste au-dessus du bouton de paiement, sur la page Stripe et dans l'e-mail de bienvenue. Résilier pendant l'essai : la semaine d'engagement reste prélevée, puis plus rien.
- Minuteur VRAI (décidé le 25/11/2026) : l'essai à 0,99 € est réservé 15 minutes, une seule fois par téléphone (`lib/offer.js`, vérifié par le serveur au paiement ; l'e-mail n'est connu qu'après). Ensuite : 16,99 € la semaine directement. Jamais de minuteur qui repart à zéro.
- Garantie avec conditions (25/11/2026) : 1re semaine payée remboursée si le plan est coché au moins 5 jours sur 7, demande dans les 14 jours, une fois ; automatique depuis l'espace membre (`lib/guarantee.js`), et ça arrête l'abonnement.
- Paiement dans notre page (Stripe intégré, Apple Pay / Google Pay) si `STRIPE_PUBLISHABLE_KEY` est réglée, sinon page Stripe.
- Page de paiement : la photo (en mémoire seulement), le vrai max, les vraies notes avec les noms cachés, le vrai plan (2 semaines visibles). Refusé (DGCCRF, Meta) : faux compteurs de personnes, faux avis, avant/après d'inconnus, prix barrés fictifs, célébrités, produits de marque avec faux pourcentages.

## Nom et pages légales (25/11/2026)

- Nom : **MOGX** (choisi par Maël). Domaine : **mogx.fr** (acheté le 25/11/2026). Marque vérifiée le 27/11/2026 (`replica/brand.md`) : seule « mogX » existe (camping-cars, Konrad Knoblauch GmbH), pas de conflit pour l'appli, mais **jamais de vêtements MOGX** (classe 25 prise). mogx.app (appli looksmaxxing anglaise) n'a pas de marque. Dépôt INPI (classes 9, 41, 42, 44, libellés prêts dans `replica/brand.md`) : Maël démarre sans (décidé le 27/11/2026), à refaire dès les premières ventes.
- Pages légales fabriquées par `node dev/legal.mjs` (CGV, confidentialité, données du visage, mentions légales) : les prix et conditions viennent de `src/shared/plans.js`. Après un changement de prix, relancer le script (un test le vérifie). Les informations de la société sont dans `EDITEUR` en haut du script : même entreprise individuelle que Kadrio (Maël Poitiers, EI, SIRET 131 842 700 00018, TVA non applicable art. 293 B, 07 52 04 56 65), contact : contact@mogx.fr (boîte OVH créée le 26/11/2026), adresse propre à MOGX : 16 rue du Jubilé, 49170 Saint-Martin-du-Fouilloux (donné par Maël le 26/11/2026). Pas d'accord « zero data retention » avec Anthropic (jugé inutile par Maël le 26/11/2026) : la page « Données du visage » dit la vraie durée (effacées par Anthropic sous 30 jours au plus). DPA des prestataires écrits le 27/11/2026. Reste « [À REMPLIR] » : le médiateur seulement (ne pas ouvrir le site avant).
- Le texte du consentement biométrique a une version (`CONSENT_VERSION` dans `functions/api/scan-consent.js`) : la changer à chaque modification du texte.

## Lancement (25/11/2026)

- Accueil (`/`, décidé par Maël le 25/11/2026) : le moins de friction possible, il ouvre directement le quiz : logo, ligne de confiance, titre, 2 cartes Homme / Femme (un seul geste pour entrer). Les prix, le fonctionnement et les questions sont sur `/infos/`, lié en bas. Les deux sont fabriqués par `node dev/home.mjs` (un test vérifie les prix). Les pubs peuvent mener à `/` ou `/q/` (même écran). Les 2 cartes montrent des visages créés par IA (faits par Maël avec ChatGPT le 26/11/2026, `src/img/carte-homme.webp` et `carte-femme.webp`) ; la mention « illustrations créées par IA » est dans les mentions légales (retirée de l'accueil par Maël le 27/11/2026). On ne les fait jamais passer pour des clients.
- Pixel Meta (27/11/2026) : `src/shared/consent.js`, identifiant dans `META_PIXEL_ID` (wrangler.toml). Rien n'est chargé avant « Accepter » ; « Refuser » aussi simple ; continuer sans répondre = pas d'accord. Événements : ViewContent (choix Homme/Femme), InitiateCheckout (page de paiement), Purchase + StartTrial (après paiement, vrai montant). Jamais de photo, de note ou de réponse envoyée à Meta.
- Parcours (27/11/2026) : pas de pronostic ; textes accordés au féminin (`genderize` dans `src/q/app.js`) ; écran des études (`science`) : seulement de vraies études avec revue et année, noms d'universités en texte (jamais de logos) et la phrase « ne sont pas liées à MOGX et ne le valident pas » (un test le vérifie) ; page de paiement : le programme par partie, titres des « clés » en clair, détail flouté (jamais envoyé avant le paiement).
- Pubs Meta : `replica/launch/ads.md` (ne jamais dire ce que la personne EST, pas d'avant/après, pas de promesse de résultat).
- Avant toute vraie vente : `node dev/preflight.mjs --env` doit passer (bloque tant qu'il reste des « À REMPLIR », un test en échec ou une clé manquante), puis cocher sa liste « à la main ».
- Ligne en haut de l'accueil : « 🇫🇷 MOGX, top en France » (slogan choisi par Maël le 25/11/2026), en badge orange foncé, majuscules espacées, drapeau dessiné (version C choisie le 26/11/2026). Ne jamais y ajouter de note, d'étoiles, de chiffre ou de « n° 1 » sans preuve (vrais avis vérifiés, vrai classement avec sa source).
