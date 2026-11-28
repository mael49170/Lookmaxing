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

const OBJECTIFS = [o("assurance", "😎", "Plus d'assurance"), o("relation", "💘", "Des rencontres, une relation"), o("respect", "🏆", "Être pris au sérieux"), o("miroir", "🪞", "Me plaire dans le miroir"), o("photos", "📸", "Être bien sur les photos"), o("travail", "🎯", "Faire bonne impression au travail"), o("meilleur", "👑", "Être la meilleure version de moi")];

// Phrase de l'écran S11, selon la première difficulté choisie
export const S11_TEXT = {
  confiance: ["Ta confiance va changer de camp.", "On attaque ce qui te freine le plus. Chaque jour, une action simple, que tu vois et que tu sens."],
  rencontres: ["Tout se joue dans les 3 premières secondes.", "Et ça, ça se travaille. Ton plan commence par ce qu'on voit en premier : peau, coupe, posture."],
  invisible: ["On ne va plus passer à côté de toi.", "Posture, tenue, regard : les 3 choses qui font qu'on te remarque en entrant quelque part. On commence par elles."],
  visage: ["Ton visage a plus de marge que tu ne crois.", "Peau, coupe, barbe, sommeil : c'est ça qui transforme un visage, pas la chirurgie. On commence par là."],
  poids: ["Ton corps change, ton visage suit.", "Quelques habitudes simples d'alimentation et de mouvement, et ça se voit d'abord sur ton visage."],
  peau: ["Une peau nette, et tout le visage change.", "C'est souvent le changement qui se voit le plus vite. Ta routine : 2 minutes le matin, 2 minutes le soir."],
  cheveux: ["La bonne coupe, c'est une autre tête.", "Ton plan te dit quelle coupe va à la forme de ton visage, et comment en prendre soin."],
  presence: ["L'aisance, ça s'entraîne. Vraiment.", "Regard, voix, posture : des exercices courts, chaque jour, jusqu'à ce que ce soit naturel."],
  progresser: ["Tu veux passer un cap. On y va.", "Ton plan commence par ce qui te fera gagner le plus, le plus vite, avec ton profil."],
};

export const AGREE = [o("pas_daccord", "", "Pas d'accord"), o("plutot_pas", "", "Plutôt pas d'accord"), o("sais_pas", "", "Je ne sais pas"), o("plutot", "", "Plutôt d'accord"), o("daccord", "", "D'accord")];
export const FREQ = [o("jamais", "", "Jamais"), o("rarement", "", "Rarement"), o("parfois", "", "Parfois"), o("souvent", "", "Souvent"), o("toujours", "", "Toujours")];
const agreeQ = (id, title, extra = {}) => ({ id, type: "single", scale: true, eyebrow: "Tu es d'accord avec cette phrase ?", title, options: AGREE, ...extra });

const _SCREENS = [
  { id: "accueil", type: "landing" },
  { id: "genre", type: "single", title: "On commence : tu es…", lead: "Ton scan et ton plan sont faits pour toi.",
    options: [o("homme", "", "Un homme"), o("femme", "", "Une femme")], avatars: true },
  { id: "etapes", type: "info", eyebrow: "Comment ça se passe", title: "3 étapes, 3 minutes",
    steps: [["📋", "Tes réponses", "Tes objectifs, tes habitudes, ce qui te gêne."], ["📸", "Deux selfies", "De face et de profil. Facultatif, jamais enregistrés."], ["📈", "Ta note et ton plan", "Où tu en es, jusqu'où tu peux aller, et comment."]],
    cta: "C'est parti" },
  { id: "age", type: "single", title: "Quel âge as-tu ?", lead: "Ça aide à lire ta peau et à régler ton plan.",
    options: [o("-18", "", "Moins de 18 ans"), o("18-24", "", "18 à 24 ans"), o("25-34", "", "25 à 34 ans"), o("35-44", "", "35 à 44 ans"), o("45-54", "", "45 à 54 ans"), o("55+", "", "55 ans et plus")] },
  { id: "scan_intro", type: "info", eyebrow: "15 critères passés au crible", title: "On va lire ton visage comme les autres le lisent.", lead: "Les gens se font un avis en quelques secondes. On te montre lequel, critère par critère, et surtout ce qui se travaille.", cta: "Continuer" },
  // l'accord pour l'analyse du visage est donné sur l'écran des selfies (une phrase au-dessus du bouton), décidé par Maël le 27/11/2026
  { id: "selfies", type: "selfies" },
  { id: "photos", type: "photos", skipIf: (a) => !a.consent },
  { id: "analyse", type: "scanning", skipIf: (a) => !a.consent || a.scan === "idle" },
  { id: "plan_intro", type: "plan_intro", skipIf: (a) => a.consent && a.scan !== "idle" }, // après l'analyse, il ferait 2 messages d'affilée
  { id: "difficultes", type: "multi", title: "Qu'est-ce qui te pèse le plus en ce moment ?", lead: "Plusieurs réponses possibles.", options: DIFFICULTES },
  { id: "message", type: "hero_message", cta: "Je suis prêt" },
  { id: "objectifs", type: "multi", title: "Qu'est-ce que tu veux obtenir ?", lead: "Plusieurs réponses possibles.",
    options: OBJECTIFS },
  { id: "mission", type: "ember", eyebrow: "Notre mission", title: "Devenir la version de toi qu'on remarque.",
    lead: "Pas de chirurgie, pas de régime miracle. Des gestes simples, chaque jour, sur ce qui change vraiment ton image. Dehors comme dedans.", cta: "Continuer",
    // reprend la question juste avant (objectifs), pour que le message change si la réponse change
    echo: (a) => { const o = OBJECTIFS.find((x) => x.id === (a.objectifs || [])[0]); return o ? `Tu veux : « ${o.label} ». C'est exactement ce que ton plan va aller chercher.` : ""; } },
  // ----- Visage et corps -----
  { id: "peau_acne", type: "single", title: "Boutons, imperfections, teint irrégulier : ça te concerne ?",
    options: [o("souvent", "", "Oui, tout le temps"), o("parfois", "", "Parfois, sans que ce soit grave"), o("non", "", "Non, ma peau est plutôt nette")] },
  { id: "soins_routine", type: "single", title: "Tu as déjà suivi une routine de soins pour la peau ?",
    options: [o("jamais", "", "Jamais, je ne sais pas par où commencer"), o("abandon", "", "J'ai essayé, mais je ne tiens pas"), o("mieux", "", "J'en ai une, je veux de meilleurs résultats"), o("solide", "", "Ma routine est solide")] },
  { id: "maquillage", type: "single", title: "Et le maquillage, pour toi, c'est…", skipIf: (a) => a.genre !== "femme",
    options: [o("jamais", "", "Jamais ou presque"), o("minimum", "", "Le minimum : mascara, baume"), o("doute", "", "Tous les jours, sans savoir si ça me met vraiment en valeur"), o("adore", "", "J'adore, je veux aller plus loin")] },
  { id: "cheveux", type: "multi", title: "Cheveux, barbe : qu'est-ce qui coince ?", lead: "Plusieurs réponses possibles.",
    echo: (a) => ({ doute: "Bien choisi, le maquillage unifie ton teint et ouvre ton regard en 5 minutes. Ton plan te montre quoi mettre, et où, pour ton visage.", adore: "Ton plan va plus loin : la teinte exacte, le regard, la bonne mine, et une version soirée.", minimum: "Avec 2 ou 3 gestes de plus, bien placés, ton visage s'éclaire. Ton plan te les montre." }[a.maquillage] || ""),
    options: [o("ligne", "", "Ma ligne recule, ou mes cheveux s'affinent"), o("coupe", "", "Je ne sais pas quelle coupe me va"), o("texture", "", "Cheveux secs ou gras"), o("barbe", "", "Ma barbe pousse mal"), o("rien", "", "Rien de spécial, je veux progresser")] },
  { id: "fait_coupe", type: "ember",
    variant: (a) => {
      const c = a.cheveux || [];
      if (c.includes("barbe") && c.includes("coupe")) return { title: "Ta coupe et ta barbe, on s'en occupe.", lead: "Une coupe pensée pour ton visage et une barbe bien dessinée changent toute ta tête, dès le lendemain. Ton plan te dit lesquelles, et comment les entretenir." };
      if (c.includes("barbe")) return { title: "Une barbe qui pousse mal, ça se rattrape.", lead: "Une barbe courte et bien dessinée fait plus d'effet qu'une barbe longue pleine de trous. Ton plan te montre où tracer les lignes pour structurer ta mâchoire, dès cette semaine." };
      if (c.includes("ligne")) return { title: "Des cheveux qui paraissent plus épais, c'est possible.", lead: "La bonne coupe et le bon produit donnent de la densité à l'œil, dès le lendemain. Ton plan te dit lesquels, pour la forme de ton visage." };
      if (c.includes("texture")) return { title: "Des cheveux qui tiennent toute la journée.", lead: "Secs ou gras, ça se règle avec 2 ou 3 bons gestes et le bon produit. Ton plan te dit lesquels, et ta coupe idéale en prime." };
      return null;
    },
    title: "La bonne coupe change ta tête dès le lendemain.",
    lead: "Une coupe pensée pour la forme de ton visage change toute ton allure. Le problème : presque personne ne sait laquelle lui va. Ton plan, lui, te le dit.", cta: "Continuer" },
  { id: "morpho", type: "single", grid: true, title: "Ta silhouette, c'est plutôt…", lead: "Ça sert seulement à régler ton plan.",
    options: [o("musclee", "", "Musclée"), o("mince", "", "Mince"), o("moyenne", "", "Moyenne"), o("enrobee", "", "Enrobée")] },
  { id: "sport", type: "single", title: "Tu as un programme de sport en ce moment ?",
    options: [o("jamais", "", "Non, je ne fais pas de sport"), o("libre", "", "J'en fais, mais sans programme"), o("programme", "", "Oui, je suis un vrai programme")] },
  { id: "alimentation", type: "single", title: "Tu manges équilibré, en général ?",
    options: [o("rarement", "", "Presque jamais"), o("parfois", "", "Parfois"), o("souvent", "", "Presque toujours")] },
  { id: "style", type: "single", title: "Tu t'habilles comment, la plupart du temps ?",
    options: [o("sweat", "👕", "Basique", "Jean, t-shirt, sweat"), o("streetwear", "🧢", "Streetwear", "Baskets, oversize, casquette"), o("sport", "🏃", "Sportswear", "Jogging, survêt, baskets"), o("noir", "🖤", "Tout en noir", "Simple et sombre"), o("chic", "👔", "Chic décontracté", "Chemise, chino, chaussures en cuir"), o("aucun", "🤷", "Je ne fais pas attention", "Je mets ce qui traîne")] },
  { id: "avant_apres", type: "contrast" },
  // ----- Présence -----
  { id: "ignore", type: "single", title: "Tu t'es déjà senti mis de côté à cause de ton physique ?",
    options: [o("oui", "📵", "Oui, souvent", "Messages sans réponse, on me coupe la parole"), o("parfois", "👻", "Parfois, je me sens transparent"), o("peu", "🤷", "Pas vraiment, mais je sens que je peux mieux faire"), o("jamais", "😎", "Jamais, je veux juste passer un cap")] },
  { id: "projection", type: "projection", skipIf: (a) => !a.consent },
  { id: "compliments", type: "single", title: "On te fait des compliments sur ton physique ?",
    options: [o("jamais", "🦗", "Presque jamais"), o("famille", "🙃", "Rarement, surtout ma famille"), o("effort", "🙂", "Quand je fais un effort"), o("souvent", "😌", "Assez souvent, j'en veux plus")] },
  { id: "recap", type: "recap", cta: "On continue" },
  { id: "groupe", type: "single", title: "Quand tu parles en groupe, tu es plutôt…",
    options: [o("assure", "", "À l'aise, on m'écoute"), o("neutre", "", "Je parle, sans vraiment marquer"), o("nerveux", "", "Nerveux, j'ai du mal à garder l'attention")],
    echo: (a) => (["jamais", "famille"].includes(a.compliments) ? "Peu de compliments, ça ne veut pas dire rien à mettre en valeur. Ça veut dire que personne ne l'a encore fait. On va s'en occuper." : "") },
  { id: "posture", type: "single", title: "Ton langage du corps, tu le notes comment ?",
    options: [o("fort", "", "Bon : je sais me tenir et utiliser mes gestes"), o("moyen", "", "Moyen : je pourrais avoir plus de présence"), o("faible", "", "Faible : j'ai souvent l'air mal à l'aise")] },
  { id: "regard", type: "single", title: "Regarder les gens dans les yeux, c'est…",
    options: [o("facile", "", "Facile, ça m'aide à créer le lien"), o("moyen", "", "Ça va, mais je me sens un peu gêné"), o("evite", "", "Difficile, je détourne vite le regard")] },
  { id: "personnalite", type: "ember", title: "Ce que tu dégages compte autant que ton visage.",
    lead: "Assurance, regard, façon de parler : on lit tes réponses et tu reçois des exercices courts pour que ça se sente. En photo comme en vrai.", cta: "Continuer" },
  { id: "rencontrer", type: "single", scale: true, title: "Rencontrer de nouvelles personnes, ça te plaît ?", options: FREQ },
  agreeQ("soirees", "J'adore organiser des soirées avec plein d'amis."),
  { id: "message_appel", type: "single", scale: true, title: "Tu préfères envoyer un message plutôt qu'appeler ?", options: FREQ },
  { id: "confiance_info", type: "ember", title: "On va trouver ce qui vide ta confiance.",
    lead: "Puis chaque jour, une petite action pour la remplir. Pas d'exploit : de la régularité. C'est elle qui change tout.", cta: "Continuer" },
  { id: "aborder", type: "single", title: "Aborder quelqu'un qui te plaît, c'est comment pour toi ?",
    options: [o("bloque", "🧊", "Je bloque, en général je n'essaie pas"), o("gene", "😬", "J'y vais, mais ça devient gênant"), o("ok", "🙂", "Ça passe, sans être fluide"), o("facile", "😎", "Facile, c'est mon truc")] },
  agreeQ("dire_non", "Je sais dire non sans culpabiliser.", {
    echo: (a) => (["bloque", "gene"].includes(a.aborder) ? "Tu bloques face à quelqu'un qui te plaît. Souvent, ce n'est pas le visage : c'est la posture et le regard. Ça s'entraîne." : "") }),
  // Vraies études publiées (vérifiables), citées comme résultats de recherche. Jamais « validé par » : les universités ne valident pas MOGX.
  // Vraies études publiées (vérifiables), citées comme résultats de recherche. Jamais « validé par » : les universités ne valident pas MOGX.
  { id: "science", type: "info", eyebrow: "Ce que dit la recherche", title: "Ce que les plus grandes universités ont montré.",
    unis: ["Harvard", "Princeton", "St Andrews"],
    sources: [
      ["En 30 secondes, sans un mot, ton attitude a déjà été jugée.", "Harvard", "Ambady et Rosenthal, 1993"],
      ["Un visage est jugé en un dixième de seconde.", "Princeton", "Willis et Todorov, 2006"],
      ["Quelques détails de ton visage peuvent faire toute la différence dans la façon dont les autres te perçoivent.", "St Andrews", "Whitehead et al., 2012"]],
    cta: "Continuer" },
  { id: "mal_a_l_aise", type: "single", title: "Tu te sens souvent mal à l'aise quand tu parles aux autres ?",
    options: [o("oui", "", "Oui"), o("non", "", "Non"), o("sais_pas", "", "Je ne sais pas")] },
  agreeQ("relire", "Je relis mes messages plusieurs fois avant de les envoyer."),
  { id: "inquiet", type: "single", title: "Tu te sens inquiet ou débordé ?",
    options: [o("jamais", "", "Jamais"), o("parfois", "", "Parfois"), o("souvent", "", "Souvent")] },
  { id: "glowup", type: "ember", title: "Ton glow-up commence maintenant.",
    lead: "Apparence et présence dans un seul plan : peau, coupe, style, posture, assurance. 5 à 10 minutes par jour, pas plus.", cta: "Continuer" },
  { id: "attentes", type: "multi", title: "Qu'est-ce que tu attends de tout ça ?", lead: "Plusieurs réponses possibles.",
    options: [o("assurance", "", "Plus d'assurance"), o("charme", "", "Plus de charme"), o("rencontres", "", "Plus de rencontres, de meilleurs rendez-vous"), o("maitrise", "", "Me sentir maître de moi"), o("mental", "", "Arrêter de trop réfléchir")] },
  { id: "duree", type: "single", title: "Combien de temps veux-tu y consacrer ?",
    options: [o("2s", "", "2 semaines"), o("1m", "", "1 mois"), o("3m", "", "2 à 3 mois"), o("6m", "", "6 mois"), o("nsp", "", "Je ne sais pas encore")] },
  { id: "profil", type: "profile" },
  { id: "construction", type: "building",
    sheets: [{ id: "temps", title: "Tu peux donner 5 minutes par jour à ton plan ?" }, { id: "finir", title: "Tu vas au bout de ce que tu commences ?" }, { id: "rappel", title: "Un petit rappel chaque matin pour ne pas lâcher ?" }] },
  { id: "apercu", type: "teaser", skipIf: (a) => a.scan !== "done" },
  { id: "offre", type: "paywall" },
];
// Identifiants d'écran stables pour le compteur et les captures : S01, S02…
export const SCREENS = _SCREENS.map((s, i) => ({ ...s, sid: "S" + String(i + 1).padStart(2, "0") }));

export const SCREEN_IDS = SCREENS.map((s) => s.id);
export const QUESTION_SCREENS = SCREENS.filter((s) => s.type === "single" || s.type === "multi");
export const SHEET_IDS = ["temps", "rappel", "finir"];

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
  for (const k of SHEET_IDS) if (typeof raw[k] === "boolean") out[k] = raw[k];
  return out;
}

// ---------- Profil de personnalité : un RÉSUMÉ de ses réponses, pas un test psychologique ----------
const AGREE_SCORE = { pas_daccord: 0, plutot_pas: 1, sais_pas: 2, plutot: 3, daccord: 4 };
const FREQ_SCORE = { jamais: 0, rarement: 1, parfois: 2, souvent: 3, toujours: 4 };
const pick = (map, v) => (v in map ? map[v] : null);
const avg = (list) => { const l = list.filter((x) => x !== null); return l.length ? l.reduce((a, b) => a + b, 0) / l.length : null; };
export const PROFILE_DIMS = {
  ouverture: { label: "Ouverture aux autres", high: "Sociable", low: "plutôt réservé", lowF: "plutôt réservée" },
  aisance: { label: "Aisance en face à face", high: "À l'aise", low: "qui doute en face à face" },
  calme: { label: "Calme sous pression", high: "Posé", highF: "Posée", low: "qui encaisse beaucoup de stress" },
  affirmation: { label: "Affirmation de soi", high: "Affirmé", highF: "Affirmée", low: "qui dit oui trop facilement" },
};
export function profile(a = {}) {
  const raw = {
    ouverture: avg([pick(FREQ_SCORE, a.rencontrer), pick(AGREE_SCORE, a.soirees), a.message_appel in FREQ_SCORE ? 4 - FREQ_SCORE[a.message_appel] : null]),
    aisance: avg([pick({ bloque: 0, gene: 1, ok: 3, facile: 4 }, a.aborder), a.relire in AGREE_SCORE ? 4 - AGREE_SCORE[a.relire] : null,
      pick({ oui: 0, sais_pas: 2, non: 4 }, a.mal_a_l_aise), pick({ evite: 0, moyen: 2, facile: 4 }, a.regard), pick({ nerveux: 0, neutre: 2, assure: 4 }, a.groupe)]),
    calme: avg([pick({ souvent: 0, parfois: 2, jamais: 4 }, a.inquiet), pick(AGREE_SCORE, a.calme_conflit)]),
    affirmation: avg([pick(AGREE_SCORE, a.dire_non), pick({ faible: 0, moyen: 2, fort: 4 }, a.posture)]),
  };
  const dims = Object.entries(raw).filter(([, v]) => v !== null).map(([k, v]) => ({ id: k, ...PROFILE_DIMS[k], score: Math.round((v / 4) * 100) }));
  if (dims.length < 2) return null;
  const sorted = [...dims].sort((x, y) => y.score - x.score);
  const hi = sorted[0], lo = sorted[sorted.length - 1];
  const f = a.genre === "femme"; // accordé au féminin
  const title = hi.score - lo.score < 15 ? (f ? "Équilibrée" : "Équilibré") : `${f ? hi.highF || hi.high : hi.high}, ${f ? lo.lowF || lo.low : lo.low}`;
  return { title, dims, strongest: hi.id, weakest: lo.id };
}
