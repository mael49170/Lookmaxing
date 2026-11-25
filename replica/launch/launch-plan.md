# Plan de lancement

## Avant d'ouvrir (bloquant)
`node dev/preflight.mjs --env` doit passer, puis cocher la liste « à la main » qu'il affiche :
1. Société créée, cases « À REMPLIR » remplies (`dev/legal.mjs`), médiateur choisi.
2. Clés : Stripe (test d'abord), Claude, Resend avec ton domaine, Turnstile.
3. Test réel de l'analyse sur 20 photos de proches d'accord (note stable, coût réel par scan noté).
4. Paiement test complet, caméra testée sur un vrai iPhone et un vrai Android.
5. Accord de non-conservation Anthropic, analyse d'impact (AIPD), CGV relues par un avocat.

## Semaine 1 : petit budget, on regarde
- 10 à 20 € par jour de pub Meta, les 3 angles de `ads.md` en même temps.
- Chaque jour : le compteur du tunnel (table `funnel`) montre combien passent chaque écran, par variante et par source. Repérer où les gens partent (quiz de 51 écrans : on retire ceux qui coûtent cher).
- Garder un œil sur Stripe : contestations de paiement (au-dessus de 0,5 %, réagir vite), remboursements, résiliations.

## Les 10 premiers clients
- Leur écrire à la main (e-mail de bienvenue + un message à J+3) : qu'est-ce qui les a fait payer, qu'est-ce qui les a gênés.
- Avec leur accord écrit, leurs vrais avis pourront aller sur l'accueil (jamais d'avis inventé).

## Ensuite
- Bandeau cookies puis pixel Meta (pour mesurer les ventes par pub).
- Les options payantes vues chez les concurrents (rapport peau, rapport tenue, coach) seulement si les premiers clients les demandent, et après calcul du coût réel de l'IA.
