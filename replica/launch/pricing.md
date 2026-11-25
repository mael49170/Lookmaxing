# Prix

## Décidé par Maël (25/11/2026)
| période | prix TTC |
| --- | --- |
| 3 jours d'essai | 0,99 € |
| 1re semaine après l'essai (obligatoire) | 16,99 € |
| chaque semaine suivante | 16,99 € jusqu'à résiliation |
| engagement minimum | 17,98 € |

- Essai réservé 15 minutes (vrai minuteur), une fois par e-mail et par téléphone ; après : 16,99 € la 1re semaine, sans essai.
- Garantie : 1re semaine payée remboursée si plan coché 5 jours sur 7, demande sous 14 jours.
- Seule source des prix : `src/shared/plans.js` (page de paiement, Stripe, e-mails, CGV, accueil).

## À côté (relevé, avec la date)
| service | prix | source | lu le |
| --- | --- | --- | --- |
| GodModeLooks | 10 offres qui changent selon la visite, ex. 0,99 $ la 1re semaine puis 19,99 $ par semaine ; 19,99 $ le 1er mois puis 49,99 $/mois | leurs conditions (section 4.1) | 24/11/2026 |
| maxxing.me | offre à la semaine avec minuteur et prix barré | captures de Maël (prix exacts non relevés) | 25/11/2026 |

## Ce que les clients reprochent à ce genre d'appli (recherche du 24/11/2026, peu de sources : à compléter)
Prélèvements après résiliation, abonnement difficile à arrêter, payer avant de voir quoi que ce soit, notes peu fiables (justuseapp.com, fiches App Store d'applis de notation du visage). Ce que MOGX fait contre :
- résiliation en un clic dans l'espace ;
- prix et engagement écrits au-dessus du bouton, sur Stripe et dans l'e-mail ;
- un vrai aperçu du résultat avant de payer (point fort, gain, vraies notes sans les noms) ;
- note bornée et stable (barème fixe dans les consignes, test sur 20 photos avant d'ouvrir).

## Dans Stripe
Rien à créer à la main : le produit, le prix à la semaine (16,99 €) et le prix d'essai (0,99 €) se créent tout seuls au premier paiement (`lib/stripe.js`). À faire par Maël dans Stripe : renseigner l'adresse des CGV (Paramètres, Public details), activer le portail client, créer le webhook (`replica/backend.md`).
