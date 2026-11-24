# Marque

Direction donnée par Maël (24/11/2026) : sombre, noir, émotionnelle, « ultra chaude » du début à la fin, marketing avant tout.

## L'idée
**La chaleur, au sens propre.** Comme une caméra thermique : le noir, et ce qui parle de toi (ton visage, ta note, ta progression) chauffe du rouge sombre à l'or. Une seule audace visuelle (le dégradé thermique), tout le reste calme.

## Nom : 5 candidats (Maël choisit)

Écartés : tout ce qui ressemble à l'original (« god », « mode », « looks » + suffixe). « Lookmaxing » reste un nom de travail : c'est le nom générique de la pratique, impossible à protéger comme marque.

| nom | style | pourquoi |
| --- | --- | --- |
| **Braise** | métaphore | la marque thermique en un mot, français, court, se prononce partout |
| **Kalos** | inventé (grec « beau ») | court, premium, sonne bien en français et en anglais |
| **Belle Gueule** | expression française | direct, fier, très parlé ; peut sembler familier |
| **Ignis** | inventé (latin « feu ») | chaud, international |
| **Statur** | composé | « stature » : la présence, pas seulement le visage |

Vérifications (à faire, aucune n'a été lancée : le réseau de cette session ne les permet pas, et ce sont des premiers tris, pas un avis d'avocat) :

| vérification | où | Braise | Kalos | Belle Gueule | Ignis | Statur |
| --- | --- | --- | --- | --- | --- | --- |
| marque France / UE | data.inpi.fr, euipo.europa.eu (classes 9, 42, 44) | à faire | à faire | à faire | à faire | à faire |
| monde | WIPO Global Brand Database | à faire | à faire | à faire | à faire | à faire |
| domaine .fr / .com | registrar (OVH, Gandi) | à faire | à faire | à faire | à faire | à faire |
| App Store, Play | recherche du nom exact | à faire | à faire | à faire | à faire | à faire |
| Instagram, TikTok | @nom | à faire | à faire | à faire | à faire | à faire |
| le web | « nom + visage », « nom + appli » | à faire | à faire | à faire | à faire | à faire |

## Couleurs (dans `design/tokens.json`, contraste vérifié : 26 paires, 0 échec)
- fond noir #09090a, surfaces #131315 / #1b1b1e, traits #29292d
- texte blanc cassé #f6f3ef, secondaire #a5a3ab
- braise #ff5a1f (boutons, choix), or #ffc46b (ce qui est bon pour toi : ton max, tes gains)
- dégradé thermique (rouge sombre → braise → ambre → or) : visage, jauge, progression, gain. Nulle part ailleurs.
- Le rouge de l'original n'est utilisé nulle part (vérifié par `sweep.py`).

## Typo
- Archivo (OFL), très grasse et serrée, pour les titres et les notes : effet affiche, alignée à gauche.
- Inter (OFL) pour le texte. Les deux servies depuis notre site (pas de Google Fonts).

## Logo : brief
- Idée : un point de braise (le point de chaleur sur le visage) + le nom en Archivo large.
- Type : symbole + nom. Le symbole seul doit tenir en 16 px (favicon) et en icône d'appli 1024 px.
- Livrables : SVG, icône 1024×1024 sans transparence, favicons, image de partage 1200×630.
- Ne doit pas ressembler à l'original : pas de soulignement rouge sous le nom, pas de rouge vif sur blanc.
- Provisoire dans le site : un point braise lumineux devant le nom.

## Voix : chaude, franche, de ton côté
- **Chaude**, pas mielleuse : on parle de ce qu'il ressent (les regards, le miroir, les photos), sans pathos.
- **Franche**, pas blessante : « sans filtre », mais jamais une moquerie ni une insulte.
- **De ton côté**, pas coach Instagram : « on va les chercher ensemble », jamais « deviens un alpha ».

| on dit | on ne dit pas |
| --- | --- |
| « Ce que les autres voient de toi en 3 secondes. » | « Découvre ton potentiel caché !!! » |
| « Tu as plus de marge que tu ne crois. » | « Tu es moche, voici comment réparer ça. » |
| « Ces points, on va les chercher ensemble. » | « Dernière chance, offre expire dans 04:59 » (faux) |
| « Tes photos ne sont jamais enregistrées. » | « 100 % garanti par l'IA » |
| « Résiliable en ligne en un clic. » | (rien en petits caractères qui contredit le gros) |

Les textes les plus vus, réécrits dans cette voix : accueil, « Lancer mon analyse », « On lit ton visage. », « Tu as plus de marge que tu ne crois. », « Voir ma note », « Ton résultat t'attend. », « Ces points, on va les chercher ensemble. », « Débloquer mon résultat », la révélation (« Ta note… Ton max : … à aller chercher »), l'e-mail de bienvenue (« C'est parti »).

## Le balayage
`python3 ~/.claude/skills/replica-brand/sweep.py . --config replica/brand.json` : propre (aucun nom, domaine ni couleur de l'original dans le site).
