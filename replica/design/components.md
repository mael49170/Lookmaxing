# Composants

Code : `src/styles/tokens.css` (fabriqué par `node dev/tokens.mjs` depuis `tokens.json`) et `src/styles/components.css`.
Page de contrôle : `/design/` (tous les états). Pas de Tailwind : le projet n'a aucune dépendance (comme Kadrio). Les composants utilisent seulement les variables `--c-*`, `--fs-*`, `--sp-*`, `--r-*`, jamais une couleur en dur.

Polices : Inter (texte) et Plus Jakarta Sans (titres), licence OFL, servies depuis notre site (`src/fonts/`) : pas de Google Fonts, donc rien n'est envoyé à Google (RGPD).
Icônes : des traits SVG simples dans le style Lucide (MIT), et les émojis du téléphone dans les réponses.

```
Écran (.screen)
  mise en page  une colonne, 16 px de marge, 480 px max, bouton collé en bas (.screen__footer)
  a11y          un seul <h1> par écran, la question
  used on       tous

Bouton (.btn)
  variants  primary (accent plein), secondary (contour), ghost (texte gris)
  sizes     56 px (bas d'écran), 48 px (ghost)
  states    default, hover, active (réduit à 98 %), focus-visible (anneau 2 px accent), disabled (45 %), loading (aria-busy + rond qui tourne, le texte reste)
  tokens    bg accent, text on-accent, radius lg (14), font lg/600
  a11y      vrai <button>, le texte du bouton dit l'action
  used on   S01–S28, S29–S34

Barre du haut (.topbar + .progress)
  variants  normale, sur fond accent (.hero)
  states    0 à 100 %, animée
  a11y      retour = <button aria-label="Retour">, 48 px ; progression = role=progressbar avec aria-valuenow
  used on   S09–S23

Carte de réponse (.option)
  variants  choix unique (radio : passe tout seul à l'écran suivant après 250 ms), choix multiple (case + bouton Continuer)
  parts     émoji 24 px, libellé 16/600, aide 14 grise, case à droite (multiple)
  states    default (bord 1 px accent-line), choisie (bord 2 px accent + fond accent-soft), focus-visible, désactivée
  tokens    hauteur 56, rayon md (12), 12 px entre deux cartes
  a11y      vrai <input> radio ou checkbox dans un <label> ; le groupe est un <fieldset> avec <legend> = la question ; flèches du clavier pour les radios
  used on   S02, S03, S09–S23

Pastille (.eyebrow)
  used on   S05, S11, S12, S20, S24, S25

Note (.score) et jauge (.gauge)
  variants  masquée (floue, aria-label « Note masquée ») avant paiement, visible
  tokens    score 40/800 chiffres à largeur fixe ; jauge score-low → score-mid → score-high
  a11y      la jauge a role=img et un aria-label « 64 sur 100 »
  used on   S08, S25, S28

Critère (.factor)
  used on   S28, page « Comment ça marche » (avec l'étiquette « Exemple »)

Étiquette exemple (.sample)
  règle     tout ce qui n'est pas un vrai résultat ou un vrai avis porte cette étiquette
  used on   accueil, S04, S16, page « Comment ça marche »

Écran message (.hero)
  variants  fond accent arrondi en bas, titre blanc
  used on   S11, S20

Récap (.step)
  variants  fait (rond coché), suivant (bord 2 px accent + « ENSUITE »)
  used on   S20

Barres de construction (.bars)
  règle     montrent un vrai avancement (le calcul du plan), pas un faux chargement
  used on   S24

Fenêtre du bas (.scrim + .sheet)
  states    ouverte, fermée ; entre en glissant (260 ms)
  a11y      role=dialog aria-modal, focus sur la question à l'ouverture, Échap = Non
  used on   S24

Champ (.field + .input)
  states    vide, rempli, focus (anneau accent), erreur (bord danger + message sous le champ relié par aria-describedby)
  a11y      vrai <label>, type=email, autocomplete=email, 17 px (pas de zoom sur iPhone)
  used on   S25, S30

Case (.check)
  règle     la case marketing est toujours décochée au départ
  used on   S25, S26 (renonciation au délai de 14 jours)

Consentement (.consent)
  règle     même texte partout (écran, page biométrie, politique) ; refus aussi visible que l'accord
  used on   S06, S33

Tâche du plan (.task)
  states    à faire, faite (barrée)
  used on   S29

Erreur (.alert)
  used on   S07 (pas de visage, plusieurs visages, photo floue), S25, S27
```
