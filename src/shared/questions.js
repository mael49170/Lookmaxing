// Le parcours du quiz, écran par écran. Partagé par le site (affichage) et le serveur (contrôle des réponses).
// Tous les textes sont écrits pour ce projet. Aucun avis client ni chiffre inventé (voir CLAUDE.md).
// type : single (choix unique, passe tout seul), multi (plusieurs choix + Continuer), info, et des écrans spéciaux.

const o = (id, emoji, label, hint) => ({ id, emoji, label, ...(hint ? { hint } : {}) });

export const DIFFICULTES = [
  o("confiance", "😞", "Manque de confiance"),
  o("rencontres", "💔", "Les rencontres ne marchent pas"),
  o("invisible", "😶", "J'ai l'impression qu'on ne me voit pas"),
  o("visage", "🤔", "Je n'aime pas mon visage"),
  o("poids", "🏋️", "Mon poids ou ma silhouette"),
  o("peau", "😓", "Ma peau (boutons, cernes, rides)"),
  o("cheveux", "🥀", "Mes cheveux ou ma ligne de cheveux"),
  o("presence", "🗣️", "Je manque d'aisance avec les gens"),
  o("progresser", "🔥", "Rien de grave, je veux juste progresser"),
];

// Phrase de l'écran S11, selon la première difficulté choisie
export const S11_TEXT = {
  confiance: ["La confiance d'abord.", "Ton plan commence par ce qui te freine le plus : l'assurance."],
  rencontres: ["On s'occupe de la première impression.", "Ton plan commence par ce qui se voit en 3 secondes : peau, coupe, posture."],
  invisible: ["Tu vas te faire remarquer.", "Ton plan commence par la présence : posture, tenue, regard."],
  visage: ["On travaille ce qui se travaille.", "Ton plan commence par ce qui change vraiment un visage : peau, coupe, barbe, sommeil."],
  poids: ["Le corps d'abord.", "Ton plan commence par des habitudes simples d'alimentation et de mouvement."],
  peau: ["La peau d'abord.", "Ton plan commence par une routine de peau simple, matin et soir."],
  cheveux: ["Les cheveux d'abord.", "Ton plan commence par la coupe et le soin, adaptés à ton visage."],
  presence: ["L'aisance, ça s'entraîne.", "Ton plan commence par le regard, la voix et la posture."],
  progresser: ["Bonne mentalité.", "Ton plan commence par les gains les plus rapides pour ton profil."],
};

export const SCREENS = [
  { id: "accueil", sid: "S01", type: "landing" },
  { id: "genre", sid: "S02", type: "single", title: "On commence : tu es…", lead: "Ton scan et ton plan sont faits pour toi.",
    options: [o("homme", "", "Un homme"), o("femme", "", "Une femme")] },
  { id: "age", sid: "S03", type: "single", title: "Quel âge as-tu ?", lead: "Ça aide à lire ta peau et à régler ton plan.",
    options: [o("-18", "", "Moins de 18 ans"), o("18-24", "", "18 à 24 ans"), o("25-34", "", "25 à 34 ans"), o("35-44", "", "35 à 44 ans"), o("45-54", "", "45 à 54 ans"), o("55+", "", "55 ans et plus")] },
  { id: "etapes", sid: "S04", type: "info", eyebrow: "Comment ça se passe", title: "3 étapes, 3 minutes",
    steps: [["📋", "Tes réponses", "Tes objectifs, tes habitudes, ce qui te gêne."], ["📸", "Deux photos", "De face et de profil. Facultatif, jamais enregistrées."], ["📈", "Ta note et ton plan", "Où tu en es, jusqu'où tu peux aller, et comment."]],
    cta: "C'est parti" },
  { id: "scan_intro", sid: "S05", type: "info", eyebrow: "15 critères", title: "L'analyse de ton visage", lead: "Peau, cheveux, structure, posture, style : on regarde tout ce qu'une photo montre, et on te dit ce qui se travaille.", cta: "Continuer" },
  { id: "consentement", sid: "S06", type: "consent" },
  { id: "photos", sid: "S07", type: "photos", skipIf: (a) => !a.consent },
  { id: "plan_intro", sid: "S08", type: "plan_intro" },
  { id: "difficultes", sid: "S09", type: "multi", title: "Qu'est-ce qui te pèse le plus en ce moment ?", lead: "Plusieurs réponses possibles.", options: DIFFICULTES },
  { id: "objectifs", sid: "S10", type: "multi", title: "Qu'est-ce que tu veux obtenir ?", lead: "Plusieurs réponses possibles.",
    options: [o("assurance", "😎", "Plus d'assurance"), o("relation", "💘", "Des rencontres, une relation"), o("respect", "🏆", "Être pris au sérieux"), o("miroir", "🪞", "Me plaire dans le miroir"), o("photos", "📸", "Être bien sur les photos"), o("travail", "🎯", "Faire bonne impression au travail"), o("meilleur", "👑", "Être la meilleure version de moi")] },
  { id: "message", sid: "S11", type: "hero_message", cta: "Je suis prêt" },
  { id: "pari", sid: "S12", type: "single", eyebrow: "Ton pronostic", title: "D'après toi, quelle note vas-tu avoir ?", lead: "On te dira à la fin si tu as vu juste.", confirm: "Je valide mon pronostic", note: "Ton pronostic reste caché jusqu'au résultat.",
    options: [o("a_travailler", "😬", "Il y a du boulot", "Je ne suis pas fan de mon reflet"), o("moyen", "😐", "Dans la moyenne", "On ne me remarque pas trop"), o("correct", "🙂", "Correct", "Ça va, sans plus"), o("beau", "😏", "Plutôt beau", "On me remarque de temps en temps"), o("canon", "🔥", "Canon", "On se retourne sur moi")] },
  { id: "ignore", sid: "S13", type: "single", title: "Tu t'es déjà senti mis de côté à cause de ton physique ?",
    options: [o("oui", "📵", "Oui, souvent", "Messages sans réponse, on me coupe la parole"), o("parfois", "👻", "Parfois, je me sens transparent"), o("peu", "🤷", "Pas vraiment, mais je sens que je peux mieux faire"), o("jamais", "😎", "Jamais, je veux juste passer un cap")] },
  { id: "compliments", sid: "S14", type: "single", title: "On te fait des compliments sur ton physique ?",
    options: [o("jamais", "🦗", "Presque jamais"), o("famille", "🙃", "Rarement, surtout ma famille"), o("effort", "🙂", "Quand je fais un effort"), o("souvent", "😌", "Assez souvent, j'en veux plus")] },
  { id: "aborder", sid: "S15", type: "single", title: "Aborder quelqu'un qui te plaît, c'est comment pour toi ?",
    options: [o("bloque", "🧊", "Je bloque, en général je n'essaie pas"), o("gene", "😬", "J'y vais, mais ça devient gênant"), o("ok", "🙂", "Ça passe, sans être fluide"), o("facile", "😎", "Facile, c'est mon truc")] },
  { id: "fait", sid: "S16", type: "info", eyebrow: "Bon à savoir", title: "Une photo ne dit pas tout",
    lead: "Le même visage peut être jugé très différemment d'une photo à l'autre. La lumière, la peau, la coupe et la posture pèsent lourd, et elles se travaillent.",
    source: "Jenkins R. et al., Cognition, 2011", cta: "Compris" },
  { id: "essaye", sid: "S17", type: "multi", title: "Qu'est-ce que tu as déjà essayé ?", lead: "Plusieurs réponses possibles.",
    options: [o("soins", "💆", "Des soins de peau, abandonnés"), o("coupe", "💇", "Une coupe qui ne m'allait pas"), o("sport", "🏋️", "Le sport, par périodes"), o("regime", "🥗", "Des régimes"), o("astuces", "📱", "Des astuces vues sur les réseaux"), o("rien", "🙈", "Rien encore, je ne sais pas par où commencer")] },
  { id: "morpho", sid: "S18", type: "single", title: "Ta silhouette, c'est plutôt…", lead: "Ça sert seulement à régler ton plan.",
    options: [o("mince", "", "Mince"), o("moyenne", "", "Moyenne"), o("musclee", "", "Musclée"), o("enrobee", "", "Enrobée")] },
  { id: "style", sid: "S19", type: "single", title: "Ton style aujourd'hui ?",
    options: [o("sweat", "👕", "Sweat et ce qui est propre"), o("noir", "🖤", "Tout en noir"), o("streetwear", "🧢", "Streetwear et baskets"), o("chic", "👔", "Chic décontracté, sans prendre de risque"), o("aucun", "🤷", "Je n'en ai pas vraiment")] },
  { id: "recap", sid: "S20", type: "recap", cta: "On continue" },
  { id: "merite", sid: "S21", type: "single", title: "On te passe devant pour des choses que tu mérites ?",
    options: [o("rarement", "🏆", "Rarement, on voit ce que je vaux"), o("parfois", "😐", "Parfois, ça dépend"), o("souvent", "🙄", "Souvent, d'autres sont choisis avant moi"), o("toujours", "😤", "Tout le temps, ça m'use")] },
  { id: "piece", sid: "S22", type: "single", title: "Tu entres dans une pièce pleine d'inconnus. Ta première pensée ?",
    options: [o("chance", "👑", "Ils ont de la chance que je sois là"), o("compare", "🔍", "Qui est mieux que moi ici ?"), o("telephone", "📱", "Je fais semblant d'écrire un message"), o("trebucher", "🙈", "Surtout, ne pas trébucher")] },
  { id: "evite", sid: "S23", type: "multi", title: "Tu as déjà évité quelque chose à cause de ton physique ?", lead: "Plusieurs réponses possibles.",
    options: [o("soiree", "🎉", "Une soirée"), o("rdv", "💘", "Un rendez-vous"), o("photos", "📸", "Les photos de groupe"), o("plage", "🏖️", "La plage ou la piscine"), o("reseaux", "📵", "Poster sur les réseaux"), o("jamais", "🙅", "Jamais")] },
  { id: "construction", sid: "S24", type: "building",
    sheets: [{ id: "temps", title: "Tu peux donner 5 minutes par jour à ton plan ?" }, { id: "rappel", title: "Un petit rappel chaque matin pour ne pas lâcher ?" }] },
  { id: "email", sid: "S25", type: "email" },
  { id: "offre", sid: "S26", type: "paywall" },
];

export const SCREEN_IDS = SCREENS.map((s) => s.id);
export const QUESTION_SCREENS = SCREENS.filter((s) => s.type === "single" || s.type === "multi");

// Contrôle côté serveur : ne garde que des réponses connues
export function cleanAnswers(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const s of QUESTION_SCREENS) {
    const ids = new Set(s.options.map((x) => x.id));
    const v = raw[s.id];
    if (s.type === "single" && ids.has(v)) out[s.id] = v;
    if (s.type === "multi" && Array.isArray(v)) {
      const list = [...new Set(v.filter((x) => ids.has(x)))];
      if (list.length) out[s.id] = list;
    }
  }
  for (const k of ["temps", "rappel"]) if (typeof raw[k] === "boolean") out[k] = raw[k];
  return out;
}
