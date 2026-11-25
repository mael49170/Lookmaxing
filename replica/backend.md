# Backend

Tout est codé et testé sans clé (tests : `node test/backend.test.mjs`, `flow`, `units` : 23 tests). Ce qui reste à faire demande des comptes que **Maël crée lui-même** (Claude n'ouvre aucun compte et ne tape aucune clé).

## Ce que Maël doit créer (dans cet ordre)

| service | pour quoi | où mettre la clé | état |
| --- | --- | --- | --- |
| Anthropic (console.anthropic.com) | l'analyse des photos | `ANTHROPIC_API_KEY` | à créer. Demander aussi le « zero data retention » et signer le DPA (RGPD) |
| Stripe, **mode test** | le paiement | `STRIPE_SECRET_KEY` (sk_test_…), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` (pk_test_…, paiement dans la page) | à créer. Webhook vers `https://<site>/api/stripe-webhook` avec : checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed. Activer le portail client (changer de carte, factures) |
| Resend | les e-mails | `RESEND_API_KEY`, `MAIL_FROM` | à créer, avec le domaine du site vérifié (SPF, DKIM, DMARC) |
| Cloudflare Turnstile | l'anti-robot du scan | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` | à créer (gratuit) |
| Secrets maison | tâches du jour, désinscription, IP | `CRON_SECRET`, `UNSUB_SECRET`, `IP_SALT` | à générer au hasard |
| Cloudflare D1 | la base | `wrangler.toml` (`database_id`) | à créer à l'étape deploy |

Liste complète : `.dev.vars.example`. Vérifier ce qui est branché : `/api/health`.

## Connexion
- Sans mot de passe : code à 6 chiffres + lien, 15 minutes, 5 essais, une seule utilisation. Pas d'e-mail dans le lien.
- Limites : 20 demandes par heure par connexion, 5 par heure par adresse. Une adresse inconnue reçoit la même réponse (on ne révèle pas qui est client).
- Cookie de session `HttpOnly`, `Secure` en ligne, `SameSite=Lax`, 90 jours. Déconnexion de cet appareil ou de tous.
- Suppression du compte : efface vraiment client, abonnement, plan, suivi, sessions, quiz, notes et e-mail laissé. Refusée tant qu'un abonnement court (il faut résilier d'abord). Les factures restent chez Stripe (10 ans, obligation légale).

## Base
- Tables : `replica/schema.sql` (commentée) → `node dev/schema.mjs` → `lib/schema.js`. Créées toutes seules au premier appel.
- Droits : chaque route membre lit le client depuis la session (jamais depuis la requête). Testé avec un deuxième client.
- Sauvegardes : D1 garde 30 jours d'historique (Time Travel), rien à activer. Vérifier dans Cloudflare à l'étape deploy.

## Paiement
- Stripe Checkout (carte, Apple Pay, Google Pay, Link), en abonnement. Prix d'appel = réduction « 1re période » créée toute seule, puis prix normal. Texte de renouvellement écrit au-dessus du bouton de paiement Stripe.
- Statut de l'abonnement dans notre base, mis à jour par les webhooks (signature vérifiée, chaque événement traité une fois, renvoyé par Stripe en cas d'erreur).
- Résiliation en un clic dans l'espace membre (fin de période, plus aucun prélèvement). Portail Stripe pour la carte et les factures.
- Case obligatoire de renonciation au délai de 14 jours avant le paiement (contenu numérique livré tout de suite).

## E-mails et tâches du jour
- E-mails : code de connexion, bienvenue, paiement refusé, rappel du jour, 2 relances au plus (seulement si la case marketing est cochée). Désinscription en un clic (lien signé + en-tête List-Unsubscribe).
- Tâches du jour (`/api/cron`, lancé par `dev/cron-worker.js` à 7 h UTC) : nettoyage (notes sans achat après 30 jours, quiz sans e-mail après 90 jours, codes et sessions périmés), rappels, relances. 40 e-mails au plus par passage, le reste part le lendemain. Erreurs comptées et écrites dans le journal.

## Intégrations
| service | API | données envoyées | délai |
| --- | --- | --- | --- |
| Anthropic | Messages API, sortie JSON imposée | 2 photos, une fois, rien d'autre | aucun |
| Stripe | API v1 (version figée 2024-06-20) | e-mail, id du quiz | aucun ; passage en live à l'étape deploy |
| Resend | API e-mails | e-mail, contenu des messages | vérification du domaine (DNS), quelques heures |
| Turnstile | siteverify | jeton, IP | aucun |

## Sécurité
- [x] secrets seulement dans les variables (Cloudflare ou `.dev.vars`), `.dev.vars` ignoré par git, rien dans le site
- [x] entrées vérifiées côté serveur sur chaque route (réponses connues seulement, e-mail, offre, images)
- [x] droits vérifiés sur chaque lecture et écriture, testé avec un deuxième client
- [x] limites sur la connexion, le scan (3 par jour par connexion, 1 par quiz) ; le formulaire e-mail n'envoie rien
- [x] webhooks : signature vérifiée
- [x] photos : type et taille limités, jamais enregistrées, jamais dans les journaux (testé)
- [x] pas d'e-mail dans les adresses (connexion, désinscription) ni dans les journaux en ligne
- [x] aucune dépendance à auditer
- [ ] politique de confidentialité avec chaque prestataire (Anthropic, Stripe, Resend, Cloudflare) : étape launch
- [ ] analyse d'impact (AIPD) pour les données du visage : avant d'ouvrir
