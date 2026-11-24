# Architecture : (nom à trouver) — reconstruction des fonctions de base de GodModeLooks, pour la France

Lu : `recon.md`, `features.csv`. Public : France, en français.

## Stack

Même base que Kadrio : Maël la connaît déjà, et on peut reprendre du code qui marche (connexion par e-mail, Stripe, e-mails, relances, compteur du tunnel).

| couche | choix | pourquoi |
| --- | --- | --- |
| web | HTML + JS sans framework, servi par Cloudflare Pages | comme Kadrio : aucune dépendance, pages très légères (le quiz doit s'ouvrir vite depuis une pub Instagram) |
| serveur | Cloudflare Pages Functions (`functions/api/`) | comme Kadrio, gratuit au départ |
| base | Cloudflare D1 (SQLite) | une seule base, comme Kadrio ; voir `schema.sql` |
| connexion | lien ou code par e-mail, sans mot de passe | on reprend `auth-start` / `auth-verify` de Kadrio |
| paiement | Stripe Checkout (abonnement) + portail client Stripe | Kadrio l'a déjà ; Apple Pay et Google Pay compris |
| e-mail | Resend | Kadrio l'a déjà |
| IA (scan) | Claude, API Messages, sortie JSON imposée | voir « Le scan » plus bas |
| anti-robots | Cloudflare Turnstile sur l'écran photo | gratuit ; empêche qu'un robot vide notre budget IA |
| tâches planifiées | un petit Worker Cloudflare qui appelle `POST /api/cron` chaque jour | comme les relances de Kadrio |
| hébergement | Cloudflare Pages + un nom de domaine à Maël | comme Kadrio |

### Le scan (le seul appel IA du tunnel)

- Modèle : `claude-opus-5-5` (le modèle conseillé par défaut). Effort réglé à `low`, à mesurer ensuite. Le `claude-sonnet-5-5` coûte moitié moins : c'est à Maël de choisir, après un test sur 20 photos.
- Entrée : 2 photos réduites dans le téléphone (1 024 px de côté, en JPEG), envoyées une seule fois, jamais écrites sur disque ni dans les logs.
- Sortie : un JSON avec un schéma imposé, qui contient :
  - les 15 critères notés sur 100, chacun avec une phrase ;
  - les points forts et les points à travailler ;
  - un drapeau `pas_un_visage` / `plusieurs_visages` / `semble_mineur` qui arrête le scan.
- Le refus du modèle (`stop_reason: "refusal"`) est géré. Le secours côté serveur est activé (`fallbacks: "default"`). Si ça échoue quand même, on passe au plan tiré des réponses seules, comme quand le client refuse le scan.
- **Coût estimé par scan avec Opus 5.5** : 0,06 € environ.
  - Entrée : environ 2 × 1 300 jetons pour les photos + 2 000 jetons de consignes (mis en cache). Soit environ 4 600 jetons à 4 $ le million, 0,018 $.
  - Sortie : environ 2 300 jetons (réflexion + JSON) à 20 $ le million, 0,046 $.
  - Total : environ 0,065 $. Avec Sonnet 5.5, environ 0,03 $.
  - Le scan est gratuit, avant l'e-mail : 1 000 scans coûtent environ 60 €, même si personne n'achète. D'où les limites : 1 scan par quiz, 3 par adresse IP et par jour, Turnstile.
- Les consignes (prompt) sont dans un seul fichier versionné, comme le `guide-de-voix.md` de Kadrio.

### Le plan (sans IA)

Le plan jour par jour vient d'une **bibliothèque de tâches écrite et relue par nous** (peau, cheveux, corps, style, confiance), choisie et ordonnée par le code d'après les réponses et les critères les plus faibles du scan. Ça ne coûte rien par client, l'IA ne peut rien inventer de dangereux (aucun conseil médical), et tout le monde reçoit la même qualité.

## Schema

13 tables, dans `schema.sql`, testé sur SQLite. Contrôle d'accès : une vérification par requête dans le code (D1 n'a pas de règles par ligne). Chaque route d'un membre lit `customer_id` depuis la session, jamais depuis la requête.

Règles fortes dans la base :
- `scans.quiz_id` unique : un seul scan par quiz (coût) ;
- `task_checks` a une clé (client, jour, tâche) : cocher deux fois ne crée qu'une ligne ;
- `stripe_events.id` est la clé : un webhook reçu deux fois n'est traité qu'une fois ;
- aucune colonne pour les photos ou les mesures du visage ;
- `scans.delete_after` : les notes sont effacées seules si personne n'achète (30 jours) ;
- l'âge « moins de 18 » n'est jamais enregistré.

Relations : quizzes 1-1 scans, quizzes 1-1 leads, customers 1-n subscriptions, customers 1-1 plans, customers 1-n task_checks / addon_purchases / sessions.

## API

| méthode chemin | fait | qui | entrée | sortie | parcours |
| --- | --- | --- | --- | --- | --- |
| GET /q/ | le quiz (page statique, une question par écran, tout en mémoire dans le navigateur) | tous | utm_* | page | F01 F02 F03 |
| POST /api/quiz | crée ou met à jour le quiz (sexe, âge, réponses, pari) | tous (cookie du quiz) | quiz_id?, champs | quiz_id | F01 |
| POST /api/track | +1 au compteur d'un écran | tous | step, variant, source | ok | F01 |
| POST /api/scan/consent | enregistre le consentement biométrique et sa version | quiz | quiz_id, version | ok | F01 |
| POST /api/scan | 2 photos → Claude → notes ; photos jetées tout de suite | quiz avec consentement, Turnstile, limite IP | quiz_id, 2 images, jeton Turnstile | notes (masquées jusqu'au paiement côté écran) | F01 |
| POST /api/lead | enregistre l'e-mail et la case marketing | quiz | quiz_id, email, optin | offres à afficher | F01 F02 |
| POST /api/checkout | crée la session Stripe Checkout (prix d'appel par coupon « 1re période » + prix normal) | lead | quiz_id, offre, renonciation 14 j | url Stripe | F01 |
| GET /api/checkout/done | vérifie le paiement chez Stripe, crée client + plan, ouvre la session | retour Stripe | session_id | redirection vers le rapport | F01 |
| POST /api/stripe-webhook | checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated/deleted | Stripe (signature vérifiée) | événement | 200 | F01 F06 |
| POST /api/auth/start | envoie le code et le lien | tous (limite) | email | ok | F04 |
| GET /api/auth/verify | ouvre la session | lien e-mail | jeton | cookie | F04 |
| POST /api/logout | ferme la session | membre | | ok | F04 |
| GET /api/me | profil, abonnement, rapport, plan du jour | membre | | JSON | F04 |
| POST /api/plan/check | coche ou décoche une tâche | membre | day, task_id, done | ok | F04 |
| POST /api/subscription/cancel | résilie (fin de période), en 1 clic depuis l'app | membre | kind | ok | F06 |
| POST /api/portal | ouvre le portail Stripe (carte, factures) | membre | | url | F06 |
| POST /api/account/delete | supprime tout (sauf factures, gardées par Stripe pour la loi) | membre sans abonnement actif | confirmation | ok | F06 |
| GET /api/unsubscribe | désinscription des e-mails en 1 clic | lien e-mail | jeton | page | — |
| POST /api/addon | achat d'option sur la carte enregistrée (could) | membre | addon | ok / 3-D Secure | F05 |
| POST /api/cron | relances et nettoyage (voir Jobs) | Worker planifié (secret) | | bilan | — |
| GET /api/health | vérifie les clés (Claude, Stripe, Resend, Turnstile) | admin | | JSON | — |

21 routes. Uniquement des API publiques avec les clés de Maël (Claude, Stripe, Resend, Cloudflare). Jamais celles de GodModeLooks.

Webhooks entrants : Stripe. Sortants : aucun (pixel Meta plus tard, seulement après accord des cookies).

Jobs (1 appel par jour, 8 h heure de Paris) :
- **nettoyage** : efface les notes des scans sans achat après 30 jours, et les quiz sans e-mail après 90 jours ;
- **rappel du jour** : un e-mail aux membres qui l'ont demandé (S24), avec les tâches du jour ;
- **relance** : à J+1 et J+3 après l'e-mail sans achat, seulement si la case marketing est cochée. Au plus 2, jamais aux désinscrits.

## The parts that bite

- **Données du visage (RGPD article 9)** : il faut un consentement explicite et versionné, avant la caméra, avec un refus aussi simple que l'accord. Il faut aussi :
  - une analyse d'impact (AIPD) avant d'ouvrir ;
  - un contrat de sous-traitance avec Anthropic et le transfert hors UE à vérifier ;
  - aucune photo dans les logs (attention aux messages d'erreur) ;
  - vérifier combien de temps l'API garde les requêtes, et demander le « zero data retention » si possible.
- **Mineurs** : le quiz bloque les moins de 18 ans, et le scan s'arrête si la photo semble être celle d'un mineur.
- **Note stable** : la même photo doit donner presque la même note. On fixe la grille de notation dans les consignes, on arrondit, et on garde le premier résultat du quiz. On le teste sur 20 photos passées 3 fois chacune avant d'ouvrir.
- **Coût des scans gratuits** : 1 scan par quiz (base), 3 par IP et par jour (`hits`), Turnstile. On enregistre le coût réel de chaque appel (`scans.cost_microusd`).
- **Droit de la consommation français** :
  - prix TTC en euros ;
  - le prix de renouvellement écrit au-dessus du bouton ;
  - une case de renonciation au délai de 14 jours, avant d'ouvrir le rapport ;
  - la résiliation en 3 clics depuis l'app ;
  - aucun faux avis ni chiffre inventé.
- **Webhooks en double** : la table `stripe_events` les bloque.
- **Courses** : un double clic sur « Payer » réutilise la même session Checkout (clé d'idempotence = quiz_id + offre) ; le scan déjà fait est renvoyé, pas refait.
- **Fuseau horaire** : le « jour » du plan est le jour à Paris, et les rappels partent à 8 h heure de Paris.
- **Délivrabilité des e-mails** : un domaine à nous dans Resend (SPF, DKIM, DMARC), et une désinscription en 1 clic dans chaque e-mail.
- **Suppression RGPD** : tout est effacé en cascade depuis `customers`. Les factures restent chez Stripe (obligation légale de 10 ans).
- **Pixel Meta** : seulement après accord dans le bandeau cookies (CNIL).

## Build order

1. **Tranche verticale** (moche mais complète) :
   - écrans : S02, S03, 3 questions (S09, S10, S18), S06, S07, S25, S26 (1 offre), S27, S28 (brut) ;
   - tables : quizzes, scans, leads, customers, subscriptions, stripe_events ;
   - routes : /api/quiz, /api/scan/consent, /api/scan, /api/lead, /api/checkout, /api/checkout/done, /api/stripe-webhook ;
   - Stripe en mode test.
   - Ça prouve que le cœur marche : quiz, photos, note, e-mail, paiement, rapport.
2. **Must** :
   - tout le quiz (S01 à S24, sans les « skip ») et le blocage des mineurs ;
   - le plan F02 sans scan, la bibliothèque de tâches et le plan ;
   - la connexion (S30), l'espace membre (S29), la résiliation (S34) ;
   - les pages légales, dont la politique biométrique et l'AIPD.
3. **Should** :
   - la variante A/B, le compteur du tunnel, le pari et le récap ;
   - le suivi des tâches, le rappel quotidien et les relances ;
   - la suppression du compte, la mention de rétractation ;
   - les articles (écrits par nous, avec sources).
4. **Could** : les options (rapports photo, coach, pack), l'achat en 1 tap, le nouveau scan pour mesurer les progrès.
5. **Corrections** venues de `/replica-entrepreneur`, une fois qu'il aura tourné.
