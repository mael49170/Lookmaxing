// La bibliothèque de tâches du plan. Écrite et relue par nous : l'IA n'écrit pas le plan.
// Règle : rien de médical, pas de produit de marque, pas de chirurgie. Une tâche = une action faisable en moins de 10 minutes.
// domain : peau, cheveux, corps, style, presence. focus : critères du scan concernés. daily : tous les jours.
export const LIBRARY_VERSION = "taches-v1";

export const TASKS = [
  // Peau
  { id: "nettoyant", domain: "peau", daily: true, focus: ["peau_qualite", "peau_teint"], text: "Matin et soir : visage lavé avec un nettoyant doux, pas de savon de douche." },
  { id: "spf", domain: "peau", daily: true, focus: ["peau_qualite", "peau_teint", "yeux"], text: "Le matin : crème solaire indice 30 ou plus sur le visage, même s'il fait gris." },
  { id: "hydratant", domain: "peau", daily: true, focus: ["peau_qualite"], text: "Le soir : une crème hydratante simple sur peau propre." },
  { id: "taie", domain: "peau", focus: ["peau_qualite"], text: "Change ta taie d'oreiller aujourd'hui (une fois par semaine)." },
  { id: "mains_visage", domain: "peau", focus: ["peau_qualite"], text: "Aujourd'hui, surveille tes mains : on ne touche pas son visage." },
  { id: "eau", domain: "peau", daily: true, focus: ["peau_teint"], text: "Bois une grande bouteille d'eau sur la journée." },
  { id: "sommeil", domain: "peau", daily: true, focus: ["yeux", "peau_teint"], text: "Couché à heure fixe ce soir : vise 7 à 9 heures de sommeil." },
  // Cheveux et pilosité
  { id: "coupe_photo", domain: "cheveux", focus: ["coiffure"], text: "Enregistre 3 photos de coupes sur des visages proches du tien, pour ton prochain coiffeur." },
  { id: "coiffeur", domain: "cheveux", focus: ["coiffure", "ligne_cheveux"], text: "Prends rendez-vous chez un coiffeur et montre-lui tes 3 photos." },
  { id: "produit_coiffant", domain: "cheveux", focus: ["coiffure"], text: "Essaie de te coiffer avec un produit mat, cheveux juste séchés à la serviette." },
  { id: "barbe_trait", domain: "cheveux", focus: ["pilosite", "machoire"], text: "Barbe : dessine une ligne nette sous la mâchoire et sur les joues." },
  { id: "sourcils", domain: "cheveux", focus: ["pilosite", "yeux"], text: "Sourcils : retire seulement les poils entre les deux, rien d'autre." },
  // Corps
  { id: "marche", domain: "corps", daily: true, focus: ["corps"], text: "Marche 30 minutes aujourd'hui, d'un coup ou en plusieurs fois." },
  { id: "pompes", domain: "corps", focus: ["corps", "posture"], text: "3 séries de pompes (sur les genoux si besoin), 1 minute de repos entre chaque." },
  { id: "squats", domain: "corps", focus: ["corps"], text: "3 séries de 15 squats, dos droit." },
  { id: "proteines", domain: "corps", focus: ["corps", "machoire"], text: "Une source de protéines à chaque repas aujourd'hui (œufs, poisson, viande, légumineuses)." },
  { id: "sucre", domain: "corps", focus: ["corps", "peau_qualite"], text: "Aujourd'hui, pas de boisson sucrée." },
  { id: "gainage", domain: "corps", focus: ["posture", "corps"], text: "Gainage : 3 fois 30 secondes." },
  // Posture et présence
  { id: "mur", domain: "presence", focus: ["posture"], text: "2 minutes dos au mur : talons, fesses, épaules et tête contre le mur." },
  { id: "ecran", domain: "presence", daily: true, focus: ["posture"], text: "Écran à hauteur des yeux quand tu travailles, pas le cou penché." },
  { id: "regard", domain: "presence", focus: ["yeux"], text: "Aujourd'hui, garde le regard 2 secondes de plus quand tu parles à quelqu'un." },
  { id: "voix", domain: "presence", focus: [], text: "Parle un peu plus lentement que d'habitude, et finis tes phrases." },
  { id: "bonjour", domain: "presence", focus: [], text: "Dis bonjour en premier à 3 personnes aujourd'hui (commerçant, voisin, collègue)." },
  { id: "photo_lumiere", domain: "presence", focus: ["peau_teint"], text: "Selfie face à une fenêtre, à hauteur des yeux : compare avec la lumière du plafond." },
  // Style
  { id: "tri", domain: "style", focus: ["tenue"], text: "Sors de ton placard ce qui est trop grand, délavé ou abîmé." },
  { id: "epaules", domain: "style", focus: ["tenue"], text: "Vérifie tes hauts : la couture d'épaule doit tomber sur l'épaule, pas en dessous." },
  { id: "basiques", domain: "style", focus: ["tenue"], text: "Note les 3 basiques qui te manquent (t-shirt uni, pantalon droit, veste) avant d'acheter quoi que ce soit." },
  { id: "chaussures", domain: "style", focus: ["tenue"], text: "Nettoie tes chaussures. Ça se voit plus qu'on ne croit." },
  { id: "couleurs", domain: "style", focus: ["tenue", "peau_teint"], text: "Essaie un haut de couleur unie près du visage (bleu marine, vert, blanc cassé) : regarde ce qui te va." },
];
export const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t]));
