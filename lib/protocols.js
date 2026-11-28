// Les protocoles : un vrai programme par problème, écrit et relu par nous (pas d'IA, donc pas de coût).
// Règles : rien de médical, pas de marque, pas de chirurgie, pas de promesse de résultat ; quand il le faut, « vois un médecin ».
// focus : les critères du scan concernés (le protocole est proposé quand l'un d'eux est faible).
// why : pourquoi ça marche, en 2 phrases. weeks : ce qu'on fait chaque semaine (4 semaines, ça monte).
// daily : les gestes de tous les jours (ce qui se coche dans « Mon plan »).
export const PROTOCOLS_VERSION = "protocoles-v1";

export const PROTOCOLS = [
  {
    id: "machoire", title: "Mâchoire plus nette et double menton", focus: ["machoire", "corps"],
    why: "Le bas du visage se « noie » surtout à cause de l'eau retenue (sel, sucre, alcool), de la graisse et de la posture de la tête. On agit sur les trois en même temps : c'est ce qui se voit le plus vite.",
    daily: [
      "Moins de 5 g de sel : pas de charcuterie, de plats préparés ni de sauces toutes faites ; goûte avant de saler.",
      "Pas de soda ni de jus : de l'eau, ou de l'eau gazeuse avec du citron.",
      "1,5 à 2 litres d'eau sur la journée, un grand verre au réveil.",
      "Rentre le menton : 3 séries de 10, tête droite, menton tiré vers l'arrière (comme un double menton volontaire), 3 secondes chacun.",
    ],
    weeks: [
      "Semaine 1 : sel, sucre et eau. Prends une photo de profil le jour 1, même lumière, même angle.",
      "Semaine 2 : ajoute l'alcool : 2 soirs sans au minimum, et jamais plus de 2 verres. Le soir, dîner léger et peu salé.",
      "Semaine 3 : la posture. Écran à hauteur des yeux, et le menton rentré dès que tu y penses. Sommeil 7 à 9 h.",
      "Semaine 4 : si ta silhouette est enrobée, enlève 300 calories par jour (une portion de féculents en moins le soir, pas de grignotage). Compare ta photo de profil avec celle du jour 1.",
    ],
    tip: { homme: "Dessine ta ligne de barbe à 2 doigts au-dessus de la pomme d'Adam : elle crée une mâchoire nette tout de suite.", femme: "En photo, menton légèrement en avant puis vers le bas : la ligne de la mâchoire ressort aussitôt." },
  },
  {
    id: "peau", title: "Peau nette", focus: ["peau_qualite"],
    why: "La plupart des imperfections viennent d'une peau mal nettoyée, agressée ou trop exposée au soleil. Une routine simple et régulière bat dix produits utilisés au hasard.",
    daily: [
      "Matin : nettoyant doux (pas le savon de la douche), crème légère, écran solaire SPF 30 ou plus, même s'il fait gris.",
      "Soir : nettoyant doux, puis une crème hydratante simple sur peau propre.",
      "Ne touche pas tes boutons, et garde les mains loin du visage.",
    ],
    weeks: [
      "Semaine 1 : la routine de base, matin et soir, sans rien ajouter. Change ta taie d'oreiller (puis 2 fois par semaine).",
      "Semaine 2 : ajoute un sérum à la niacinamide le matin, avant la crème (pores, imperfections, teint).",
      "Semaine 3 : ajoute l'acide salicylique 2 % le soir, 2 à 3 fois par semaine seulement (boutons, points noirs).",
      "Semaine 4 : garde tout, et note ce qui a changé. Si ça pique ou rougit, arrête le dernier produit ajouté. Si l'acné est forte ou douloureuse, vois un médecin ou un dermatologue.",
    ],
    tip: { homme: "Rase-toi dans le sens du poil, avec une lame propre : moins de boutons et de rougeurs sur le cou.", femme: "Démaquille-toi toujours avant de dormir, même tard : c'est la 1re cause de pores bouchés." },
  },
  {
    id: "teint", title: "Teint frais et cernes", focus: ["peau_teint", "yeux"],
    why: "Un teint terne et des cernes, c'est surtout le sommeil, l'hydratation et l'alimentation. Une étude de l'université de St Andrews montre qu'en 6 semaines, plus de fruits et légumes colorés rendent le teint plus sain aux yeux des autres.",
    daily: [
      "Couché à heure fixe, 7 à 9 heures de sommeil ; écrans coupés 30 minutes avant.",
      "Le matin : 1 minute de froid sur les cernes (eau très froide, ou une cuillère passée au frigo).",
      "5 portions de fruits et légumes colorés : carottes, poivrons, tomates, épinards, fruits rouges.",
    ],
    weeks: [
      "Semaine 1 : le sommeil d'abord, à heure fixe, même le week-end.",
      "Semaine 2 : les fruits et légumes colorés à chaque repas.",
      "Semaine 3 : écran solaire tous les matins (le soleil ternit et marque le contour des yeux).",
      "Semaine 4 : si tes yeux sont gonflés au réveil, dors la tête un peu surélevée, et moins de sel le soir.",
    ],
    tip: { homme: "Les lunettes de soleil dehors : tu plisses moins les yeux, le contour se marque moins.", femme: "Un correcteur pêche ou orangé sous un fond de teint neutralise les cernes bleus mieux qu'un correcteur clair." },
  },
  {
    id: "coupe", title: "La coupe qui te va", focus: ["coiffure", "ligne_cheveux"],
    why: "Une coupe choisie pour la forme de ton visage change toute ta tête, du jour au lendemain. C'est souvent le plus gros gain, et le plus rapide.",
    daily: [
      "Coiffe-toi chaque matin : cheveux juste séchés à la serviette, un produit mat de la taille d'un petit pois, réparti à la racine.",
    ],
    weeks: [
      "Semaine 1 : regarde la forme de ton visage (dans ton rapport) et enregistre 3 photos de coupes qui lui vont, sur des visages proches du tien.",
      "Semaine 2 : rendez-vous chez le coiffeur. Montre tes photos, et dis la longueur voulue en centimètres (dessus et côtés).",
      "Semaine 3 : apprends le coiffage : sèche au sèche-cheveux en donnant la direction avec la main, puis le produit.",
      "Semaine 4 : prends ton prochain rendez-vous (toutes les 4 à 6 semaines pour une coupe courte : c'est ce qui la garde nette).",
    ],
    tip: { homme: "Si tes cheveux s'affinent : côtés plus courts, texture sur le dessus, produit mat. Ils paraissent plus épais. Si la ligne recule vite, un médecin peut t'en parler.", femme: "Un dégradé autour du visage (au niveau des pommettes) affine et donne du mouvement, quelle que soit ta longueur." },
  },
  {
    id: "pilosite", title: { homme: "Barbe et sourcils nets", femme: "Des sourcils qui structurent ton regard" }, focus: ["pilosite"],
    why: "Des poils bien dessinés encadrent le visage : une barbe nette dessine la mâchoire, des sourcils propres ouvrent le regard.",
    daily: { homme: ["Barbe : passe la tondeuse sur la ligne du cou 2 fois par semaine, et une goutte d'huile pour barbe le soir."], femme: ["Sourcils : brosse-les vers le haut chaque matin, et fixe-les avec un gel transparent."] },
    weeks: {
      homme: ["Semaine 1 : dessine ta ligne de joue (de la pointe de l'oreille au coin de la moustache) et ta ligne de cou (2 doigts au-dessus de la pomme d'Adam).",
        "Semaine 2 : choisis ta longueur et garde-la toutes les semaines à la tondeuse. Si ta barbe a des trous, une barbe de 3 jours bien nette vaut mieux qu'une barbe longue clairsemée.",
        "Semaine 3 : sourcils : retire seulement les poils entre les deux, rien d'autre.",
        "Semaine 4 : garde le rythme, c'est la régularité qui fait l'effet « net »."],
      femme: ["Semaine 1 : laisse pousser 2 semaines sans épiler, pour voir ta vraie forme.",
        "Semaine 2 : repère tes 3 points (début au-dessus de l'aile du nez, sommet dans l'axe de la pupille, fin dans l'axe du coin de l'œil).",
        "Semaine 3 : retire seulement ce qui dépasse sous la ligne, jamais au-dessus ; ou fais-le faire une 1re fois par une professionnelle.",
        "Semaine 4 : comble les trous avec un crayon d'une teinte plus clair que tes cheveux, par petits traits."],
    },
  },
  {
    id: "posture", title: "Une posture qui en impose", focus: ["posture"],
    why: "La tête projetée en avant et les épaules enroulées font paraître plus petit, plus fatigué et moins sûr de soi. Quelques minutes par jour suffisent à remettre le corps droit.",
    daily: [
      "2 minutes dos au mur : talons, fesses, épaules et arrière de la tête contre le mur.",
      "Rentre le menton et serre les omoplates 10 fois, chaque fois que tu attends (bus, café, file).",
      "Écran à hauteur des yeux quand tu travailles, pas le cou penché.",
    ],
    weeks: [
      "Semaine 1 : le mur matin et soir, pour sentir ta vraie position droite.",
      "Semaine 2 : ajoute 3 séries de 10 « rowing » avec un élastique ou deux bouteilles d'eau (tirer les coudes vers l'arrière).",
      "Semaine 3 : marche 20 minutes par jour en gardant cette position : regard droit, épaules basses.",
      "Semaine 4 : fais-toi prendre en photo de profil et compare avec ton selfie de profil du début.",
    ],
    tip: { homme: "Debout, pieds écartés à la largeur des épaules, mains hors des poches : tu prends ta place.", femme: "Assise, les deux pieds au sol et le dos décollé du dossier : tu parais plus grande et plus posée." },
  },
  {
    id: "silhouette", title: "Silhouette et énergie", focus: ["corps"],
    why: "Un corps qui bouge change le visage (moins gonflé), la posture et l'assurance. Pas besoin de salle : 3 séances de 20 minutes par semaine, qui montent un peu chaque semaine.",
    daily: [
      "8 000 pas, d'un coup ou en plusieurs fois.",
      "Des protéines à chaque repas : œufs, poisson, viande, yaourt grec, lentilles, pois chiches.",
    ],
    weeks: [
      "Semaine 1 : 3 séances chez toi : 3 tours de 8 pompes (sur les genoux si besoin), 12 squats, 8 fentes par jambe, 20 secondes de gainage.",
      "Semaine 2 : même séance, +2 répétitions par exercice, et 30 secondes de gainage.",
      "Semaine 3 : 4 tours au lieu de 3.",
      "Semaine 4 : +2 répétitions encore, et note tes chiffres : tu verras le chemin fait depuis la semaine 1.",
    ],
    tip: { homme: "La moitié de l'assiette en légumes à chaque repas : tu manges autant, avec moins de calories.", femme: "La moitié de l'assiette en légumes à chaque repas : tu manges autant, avec moins de calories." },
  },
  {
    id: "style", title: "Un style qui te met en valeur", focus: ["tenue"],
    why: "Ce n'est pas le prix des vêtements qui compte, c'est la coupe et les couleurs. Des pièces ajustées dans les bonnes teintes changent l'impression en une seconde.",
    daily: [
      "Choisis ta tenue la veille, et vérifie : épaules ajustées, longueur au niveau de la ceinture, rien de délavé.",
    ],
    weeks: [
      "Semaine 1 : trouve tes couleurs : à la lumière du jour, veines du poignet plutôt bleues → couleurs froides (bleu marine, gris, blanc pur, bordeaux) ; plutôt vertes → couleurs chaudes (beige, kaki, crème, terracotta).",
      "Semaine 2 : trie ton placard : sors ce qui est trop grand, délavé ou abîmé.",
      "Semaine 3 : complète tes basiques qui manquent, dans tes couleurs.",
      "Semaine 4 : fais retoucher 1 ou 2 pièces trop longues ou trop larges (quelques euros chez une retoucheuse, l'effet est immédiat).",
    ],
    tip: { homme: "Tes 5 basiques : t-shirt blanc uni bien coupé, pull col rond sombre, jean brut coupe droite, chemise oxford, baskets blanches en cuir lisse.", femme: "Tes 5 basiques : t-shirt blanc ajusté, jean droit taille haute, blazer bien coupé, pull fin uni, baskets blanches en cuir lisse." },
  },
  {
    id: "assurance", title: "Assurance et présence", focus: [],
    why: "Ce que tu dégages se juge en quelques secondes, souvent sans un mot. Regard, voix et manière de dire non s'entraînent comme un muscle, par petites doses.",
    daily: [
      "Garde le regard 2 secondes de plus quand tu parles à quelqu'un.",
      "Parle un peu plus lentement que d'habitude, et finis tes phrases sans « enfin… voilà ».",
    ],
    weeks: [
      "Semaine 1 : dis bonjour en premier à 3 personnes par jour (commerçant, voisin, collègue).",
      "Semaine 2 : dis non une fois par jour à quelque chose qui ne t'arrange pas, sans te justifier.",
      "Semaine 3 : en groupe, pose une vraie question à quelqu'un et écoute la réponse jusqu'au bout.",
      "Semaine 4 : envoie tes messages importants en ne les relisant qu'une seule fois.",
    ],
    tip: { homme: "Avant un moment important : 2 minutes debout, épaules ouvertes, respiration lente par le ventre.", femme: "Avant un moment important : 2 minutes debout, épaules ouvertes, respiration lente par le ventre." },
  },
  {
    id: "photos", title: "Tes meilleures photos", focus: ["peau_teint", "machoire"],
    why: "Une même personne peut paraître très différente d'une photo à l'autre : lumière, angle, expression. On t'apprend les réglages qui te montrent sous ton meilleur jour.",
    daily: [],
    weeks: [
      "Semaine 1 : la lumière : face à une fenêtre, jamais la lumière du plafond.",
      "Semaine 2 : l'angle : téléphone un peu au-dessus de tes yeux, menton légèrement en avant puis vers le bas.",
      "Semaine 3 : l'expression : regard juste au-dessus de l'objectif, un vrai demi-sourire (pense à quelque chose de drôle).",
      "Semaine 4 : prends 10 photos avec ces réglages et garde la meilleure pour tes profils.",
    ],
    tip: { homme: "Recule et zoome un peu (x2) au lieu de tenir le téléphone près du visage : le nez paraît moins gros.", femme: "Recule et zoome un peu (x2) au lieu de tenir le téléphone près du visage : le nez paraît moins gros." },
  },
];

const pick = (v, genre) => (v && typeof v === "object" && !Array.isArray(v) ? v[genre === "femme" ? "femme" : "homme"] : v);
// Le protocole vu par une personne (homme / femme)
export function protocolFor(p, genre) {
  return { id: p.id, title: pick(p.title, genre), why: p.why, daily: pick(p.daily, genre) || [], weeks: pick(p.weeks, genre) || [], tip: pick(p.tip, genre) || "" };
}
export const PROTOCOL_BY_ID = Object.fromEntries(PROTOCOLS.map((p) => [p.id, p]));

// Formes de visage (détectées par l'analyse) : les coupes qui vont, et celles à éviter
export const FACE_SHAPES = {
  ovale: { label: "Ovale", why: "Front et mâchoire de largeur proche, visage un peu plus long que large : presque tout te va.",
    homme: { yes: ["Coupe courte texturée", "Quiff ou pompadour", "Undercut avec du volume dessus"], no: ["Frange lourde qui cache le front"] },
    femme: { yes: ["Carré long", "Longueurs dégradées", "Frange rideau"], no: ["Rien d'interdit : évite juste de cacher tout le visage"] } },
  rond: { label: "Rond", why: "Largeur et longueur proches, joues pleines : on allonge avec de la hauteur et des côtés plus courts.",
    homme: { yes: ["Côtés courts, volume sur le dessus", "Quiff haut", "Barbe un peu plus longue au menton"], no: ["Coupe bol", "Volume sur les côtés"] },
    femme: { yes: ["Longueurs sous le menton", "Raie sur le côté", "Volume au sommet"], no: ["Carré au niveau des joues", "Frange droite épaisse"] } },
  carre: { label: "Carré", why: "Front large et mâchoire marquée : un atout. On garde la force et on adoucit un peu les angles.",
    homme: { yes: ["Dégradé avec dessus texturé", "Coupe courte classique", "Barbe courte bien dessinée"], no: ["Coupe très géométrique en brosse plate"] },
    femme: { yes: ["Longueurs ondulées", "Dégradé autour du visage", "Frange rideau"], no: ["Carré droit au niveau de la mâchoire"] } },
  long: { label: "Long", why: "Visage nettement plus long que large : on évite d'allonger encore, on ajoute de la largeur.",
    homme: { yes: ["Longueur moyenne sur les côtés", "Frange texturée", "Barbe courte et pleine sur les joues"], no: ["Pompadour très haut", "Côtés rasés à zéro"] },
    femme: { yes: ["Frange", "Carré avec du volume", "Ondulations sur les côtés"], no: ["Très longues lisses sans volume"] } },
  coeur: { label: "Cœur", why: "Front plus large, menton fin : on équilibre en donnant du volume vers le bas.",
    homme: { yes: ["Longueur moyenne coiffée sur le côté", "Frange légère", "Barbe pour élargir le menton"], no: ["Volume très haut sur le dessus", "Côtés rasés"] },
    femme: { yes: ["Carré long", "Frange rideau", "Volume au niveau du menton"], no: ["Volume au sommet, longueurs plates"] } },
  losange: { label: "Losange", why: "Pommettes larges, front et menton plus étroits : on adoucit les pommettes et on élargit front et menton.",
    homme: { yes: ["Frange texturée", "Longueur moyenne sur les côtés", "Barbe fournie au menton"], no: ["Côtés très courts avec beaucoup de hauteur"] },
    femme: { yes: ["Frange", "Longueurs dégradées au niveau du menton", "Raie au milieu souple"], no: ["Cheveux plaqués en arrière"] } },
};
export const FACE_SHAPE_IDS = Object.keys(FACE_SHAPES);

// Les protocoles d'une personne, dans l'ordre : ses critères les plus faibles d'abord, puis ce que disent ses réponses
const DIFF_TO_PROTOCOL = { peau: "peau", cheveux: "coupe", poids: "silhouette", visage: "machoire", presence: "assurance", confiance: "assurance", invisible: "style", rencontres: "photos" };
export function choosePlanProtocols(answers = {}, factors = null, max = 5) {
  const score = Object.fromEntries(PROTOCOLS.map((p) => [p.id, 0]));
  if (factors) for (const f of factors) for (const p of PROTOCOLS) if (p.focus.includes(f.id)) score[p.id] = Math.max(score[p.id], (100 - f.note) / 6);
  (answers.difficultes || []).forEach((d, i) => { const id = DIFF_TO_PROTOCOL[d]; if (id) score[id] += i === 0 ? 6 : 3; });
  if (answers.peau_acne === "souvent") score.peau += 3;
  if ((answers.cheveux || []).some((x) => ["coupe", "ligne"].includes(x))) score.coupe += 3;
  if ((answers.cheveux || []).includes("barbe")) score.pilosite += 2;
  if (answers.morpho === "enrobee") { score.machoire += 2; score.silhouette += 2; }
  if (answers.sport === "jamais") score.silhouette += 2;
  if (["faible", "moyen"].includes(answers.posture)) score.posture += 2;
  if (["aucun", "sweat", "sport"].includes(answers.style)) score.style += 2;
  if (answers.regard === "evite" || ["bloque", "gene"].includes(answers.aborder) || answers.mal_a_l_aise === "oui") score.assurance += 3;
  if (["daccord", "plutot"].includes(answers.relire) || ["pas_daccord", "plutot_pas"].includes(answers.dire_non)) score.assurance += 2;
  return Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, max).map(([id]) => id);
}
