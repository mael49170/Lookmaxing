// La bibliothèque de tâches du plan. Écrite et relue par nous : l'IA n'écrit pas le plan.
// Règle : rien de médical, pas de produit de marque, pas de chirurgie. Une tâche = une action faisable en moins de 10 minutes.
// domain : peau, cheveux, corps, style, presence. focus : critères du scan concernés. daily : tous les jours.
// oneShot : à faire une seule fois sur les 28 jours (prendre rendez-vous, trier le placard…).
// key : une « clé » du plan, un vrai savoir-faire concret (montrée en titre, détail flouté, sur la page de paiement).
export const LIBRARY_VERSION = "taches-v2"; // v2 (27/11/2026) : clés concrètes ajoutées

export const TASKS = [
  // Peau
  { id: "nettoyant", short: "Nettoyant doux", domain: "peau", daily: true, focus: ["peau_qualite", "peau_teint"], text: "Matin et soir : visage lavé avec un nettoyant doux, pas de savon de douche." },
  { id: "spf", short: "Écran solaire", domain: "peau", daily: true, focus: ["peau_qualite", "peau_teint", "yeux"], text: "Le matin : crème solaire indice 30 ou plus sur le visage, même s'il fait gris." },
  { id: "hydratant", short: "Crème du soir", domain: "peau", daily: true, focus: ["peau_qualite"], text: "Le soir : une crème hydratante simple sur peau propre." },
  { id: "taie", short: "Taie propre", domain: "peau", focus: ["peau_qualite"], text: "Change ta taie d'oreiller aujourd'hui (une fois par semaine)." },
  { id: "mains_visage", short: "Mains loin du visage", domain: "peau", focus: ["peau_qualite"], text: "Aujourd'hui, surveille tes mains : on ne touche pas son visage." },
  { id: "eau", short: "Bien t'hydrater", domain: "peau", daily: true, focus: ["peau_teint"], text: "Bois une grande bouteille d'eau sur la journée." },
  { id: "actifs", key: true, oneShot: true, short: "Les 3 actifs qui marchent sur ta peau", domain: "peau", focus: ["peau_qualite", "peau_teint"], text: "Cherche des ingrédients sur l'étiquette, pas des marques : niacinamide (pores, imperfections, teint), acide salicylique 2 % le soir, 2 à 3 fois par semaine (boutons, points noirs), et un écran solaire SPF 30 ou plus chaque matin. Un seul nouveau produit par semaine, pour voir ce que ta peau supporte. Si ça pique ou rougit, arrête et demande conseil à un pharmacien." },
  { id: "cernes", key: true, oneShot: true, short: "Cernes : le protocole 5 minutes", domain: "peau", focus: ["yeux"], text: "Le matin : 1 minute de froid sur les cernes (une cuillère passée au frigo, ou de l'eau très froide). Le soir : écrans coupés 30 minutes avant de dormir. Si tes yeux sont gonflés au réveil, dors la tête un peu surélevée." },
  { id: "degonfler", key: true, oneShot: true, short: "Un visage moins gonflé dès demain", domain: "peau", focus: ["machoire", "peau_teint"], text: "Ce soir : repas peu salé, pas d'alcool, un grand verre d'eau. Demain matin, compare ton visage au miroir, à la même lumière qu'aujourd'hui." },
  { id: "sommeil", short: "Sommeil réglé", domain: "peau", daily: true, focus: ["yeux", "peau_teint"], text: "Couché à heure fixe ce soir : vise 7 à 9 heures de sommeil." },
  // Cheveux et pilosité
  { id: "forme_visage", key: true, oneShot: true, short: "La coupe qui va à la forme de ton visage", domain: "cheveux", focus: ["coiffure"], text: "Devant un miroir, cheveux en arrière : compare la largeur du front, des pommettes et de la mâchoire, puis la longueur du visage. Ovale : presque tout te va. Rond : du volume sur le dessus, les côtés plus courts. Carré : de la longueur et du mouvement pour adoucir. Long : peu de volume sur le dessus, de la largeur sur les côtés. Note ta forme pour ton coiffeur." },
  { id: "densite", key: true, oneShot: true, short: "Des cheveux qui paraissent plus épais", domain: "cheveux", focus: ["coiffure", "ligne_cheveux"], text: "Côtés plus courts, de la texture sur le dessus, et un produit mat sur cheveux secs : les cheveux paraissent plus denses. Évite les produits brillants qui collent les mèches. Si ta ligne recule vite, un médecin peut t'en parler." },
  { id: "coupe_photo", oneShot: true, short: "Ta coupe idéale", domain: "cheveux", focus: ["coiffure"], text: "Enregistre 3 photos de coupes sur des visages proches du tien, pour ton prochain coiffeur." },
  { id: "coiffeur", oneShot: true, short: "Rendez-vous coiffeur", domain: "cheveux", focus: ["coiffure", "ligne_cheveux"], text: "Prends rendez-vous chez un coiffeur et montre-lui tes 3 photos." },
  { id: "produit_coiffant", short: "Coiffage mat", domain: "cheveux", focus: ["coiffure"], text: "Essaie de te coiffer avec un produit mat, cheveux juste séchés à la serviette." },
  { id: "barbe_trait", short: "Barbe nette", domain: "cheveux", focus: ["pilosite", "machoire"], text: "Barbe : dessine une ligne nette sous la mâchoire et sur les joues." },
  { id: "sourcils", short: "Sourcils propres", domain: "cheveux", focus: ["pilosite", "yeux"], text: "Sourcils : retire seulement les poils entre les deux, rien d'autre." },
  // Corps
  { id: "marche", short: "30 min de marche", domain: "corps", daily: true, focus: ["corps"], text: "Marche 30 minutes aujourd'hui, d'un coup ou en plusieurs fois." },
  { id: "pompes", short: "Pompes", domain: "corps", focus: ["corps", "posture"], text: "3 séries de pompes (sur les genoux si besoin), 1 minute de repos entre chaque." },
  { id: "squats", short: "Squats", domain: "corps", focus: ["corps"], text: "3 séries de 15 squats, dos droit." },
  { id: "programme_corps", key: true, oneShot: true, short: "Ton programme corps sans matériel", domain: "corps", focus: ["corps", "posture"], text: "3 séances de 20 minutes par semaine, chez toi : 3 tours de 10 pompes (sur les genoux si besoin), 15 squats, 10 fentes par jambe, 30 secondes de gainage. Chaque semaine, ajoute 2 répétitions par exercice. Tu commences aujourd'hui." },
  { id: "assiette", key: true, oneShot: true, short: "L'assiette qui se voit sur ta peau", domain: "corps", focus: ["peau_teint", "corps"], text: "À chaque repas : la moitié de l'assiette en légumes, un quart en protéines, un quart en féculents. Des fruits et légumes colorés chaque jour : une étude de l'université de St Andrews (2012) a montré qu'en manger plus rend le teint plus sain aux yeux des autres en quelques semaines." },
  { id: "proteines", short: "Protéines", domain: "corps", focus: ["corps", "machoire"], text: "Une source de protéines à chaque repas aujourd'hui (œufs, poisson, viande, légumineuses)." },
  { id: "sucre", short: "Zéro soda", domain: "corps", focus: ["corps", "peau_qualite"], text: "Aujourd'hui, pas de boisson sucrée." },
  { id: "gainage", short: "Gainage", domain: "corps", focus: ["posture", "corps"], text: "Gainage : 3 fois 30 secondes." },
  // Posture et présence
  { id: "mur", short: "Posture au mur", domain: "presence", focus: ["posture"], text: "2 minutes dos au mur : talons, fesses, épaules et tête contre le mur." },
  { id: "ecran", short: "Écran à hauteur", domain: "presence", daily: true, focus: ["posture"], text: "Écran à hauteur des yeux quand tu travailles, pas le cou penché." },
  { id: "regard", short: "Regard qui tient", domain: "presence", focus: ["yeux"], text: "Aujourd'hui, garde le regard 2 secondes de plus quand tu parles à quelqu'un." },
  { id: "voix", short: "Voix posée", domain: "presence", focus: [], text: "Parle un peu plus lentement que d'habitude, et finis tes phrases." },
  { id: "message_direct", short: "Message sans relire", domain: "presence", focus: [], text: "Envoie un message important en ne le relisant qu'une seule fois." },
  { id: "dire_non", short: "Un non tranquille", domain: "presence", focus: [], text: "Dis non une fois aujourd'hui à quelque chose qui ne t'arrange pas, sans te justifier." },
  { id: "groupe_question", short: "Parler en groupe", domain: "presence", focus: [], text: "En groupe, pose une vraie question à quelqu'un et écoute la réponse jusqu'au bout." },
  { id: "bonjour", short: "Dire bonjour en premier", domain: "presence", focus: [], text: "Dis bonjour en premier à 3 personnes aujourd'hui (commerçant, voisin, collègue)." },
  { id: "angle_photo", key: true, oneShot: true, short: "Ton meilleur angle en photo", domain: "presence", focus: ["peau_teint", "machoire"], text: "Face à une fenêtre, téléphone un peu au-dessus de tes yeux, menton légèrement en avant puis vers le bas, regard juste au-dessus de l'objectif. Prends 10 photos, garde la meilleure pour tes profils." },
  { id: "premier_message", key: true, oneShot: true, short: "Le premier message qui obtient une réponse", domain: "presence", focus: [], text: "Au lieu de « salut, ça va ? », rebondis sur un détail précis de la personne (un lieu, un objet, une photo) avec une vraie question. Court, sans compliment sur le physique, et tu attends la réponse avant de relancer." },
  { id: "photo_lumiere", oneShot: true, short: "La bonne lumière", domain: "presence", focus: ["peau_teint"], text: "Selfie face à une fenêtre, à hauteur des yeux : compare avec la lumière du plafond." },
  // Style
  { id: "tri", oneShot: true, short: "Tri du placard", domain: "style", focus: ["tenue"], text: "Sors de ton placard ce qui est trop grand, délavé ou abîmé." },
  { id: "epaules", oneShot: true, short: "Bonne coupe d'épaules", domain: "style", focus: ["tenue"], text: "Vérifie tes hauts : la couture d'épaule doit tomber sur l'épaule, pas en dessous." },
  { id: "basiques", oneShot: true, short: "Tes 3 basiques", domain: "style", focus: ["tenue"], text: "Note les 3 basiques qui te manquent (t-shirt uni, pantalon droit, veste) avant d'acheter quoi que ce soit." },
  { id: "chaussures", short: "Baskets nettes", domain: "style", focus: ["tenue"], text: "Nettoie tes chaussures. Ça se voit plus qu'on ne croit." },
  { id: "couleurs", key: true, oneShot: true, short: "Les couleurs qui illuminent ton visage", domain: "style", focus: ["tenue", "peau_teint"], text: "À la lumière du jour, regarde les veines de ton poignet. Plutôt bleues : les couleurs froides te vont (bleu marine, gris, blanc pur, bordeaux). Plutôt vertes : les couleurs chaudes (beige, kaki, crème, terracotta). Porte-les près du visage, garde le reste pour le bas." },
  { id: "garde_robe", key: true, oneShot: true, short: "Les 5 pièces qui vont à tout le monde", domain: "style", focus: ["tenue"], text: "T-shirt blanc uni bien coupé, pull col rond de couleur sombre, jean brut coupe droite, chemise oxford, baskets blanches en cuir lisse. Ajusté aux épaules, longueur au niveau de la ceinture : avec ces 5 pièces, tout va avec tout." },
];
export const taskShort = (id) => TASK_BY_ID[id]?.short || id;
export const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t]));
