// Fabrique le plan de 28 jours à partir des réponses et du scan (s'il y en a un). Sans IA, donc sans coût.
import { TASKS, TASK_BY_ID, LIBRARY_VERSION } from "./tasks.js";

export const PLAN_DAYS = 28;
const DOMAIN_OF_DIFFICULTE = { peau: "peau", cheveux: "cheveux", poids: "corps", visage: "peau", presence: "presence", confiance: "presence", invisible: "style", rencontres: "style", progresser: "" };

// Poids de chaque domaine : réponses du quiz + critères les plus faibles du scan
export function priorities(answers = {}, factors = null) {
  const w = { peau: 1, cheveux: 1, corps: 1, style: 1, presence: 1 };
  (answers.difficultes || []).forEach((d, i) => { const dom = DOMAIN_OF_DIFFICULTE[d]; if (dom) w[dom] += i === 0 ? 3 : 1.5; });
  if (answers.morpho === "enrobee") w.corps += 1.5;
  if (["aucun", "sweat", "sport"].includes(answers.style)) w.style += 1;
  if (["bloque", "gene"].includes(answers.aborder)) w.presence += 1;
  // réponses du quiz détaillé (peau, cheveux, corps, présence)
  if (answers.peau_acne === "souvent") w.peau += 2; else if (answers.peau_acne === "parfois") w.peau += 0.8;
  if (["jamais", "abandon"].includes(answers.soins_routine)) w.peau += 0.8;
  const hair = answers.cheveux || [];
  if (hair.includes("coupe") || hair.includes("ligne")) w.cheveux += 1.5;
  if (hair.includes("barbe") || hair.includes("texture")) w.cheveux += 0.5;
  if (answers.sport === "jamais") w.corps += 1.5;
  if (answers.alimentation === "rarement") w.corps += 0.8;
  if (["faible", "moyen"].includes(answers.posture)) w.presence += 0.6;
  if (answers.regard === "evite" || answers.groupe === "nerveux" || answers.mal_a_l_aise === "oui") w.presence += 1;
  if (factors) {
    const weakest = [...factors].sort((a, b) => a.note - b.note).slice(0, 4).map((f) => f.id);
    for (const t of TASKS) if (t.focus.some((f) => weakest.includes(f))) w[t.domain] += 0.4;
  }
  return w;
}

// Coups de pouce par tâche, quand une réponse la désigne directement
export function taskBoosts(a = {}) {
  const b = {};
  const add = (id, v) => { b[id] = (b[id] || 0) + v; };
  if (["daccord", "plutot"].includes(a.relire)) add("message_direct", 2);
  if (["pas_daccord", "plutot_pas"].includes(a.dire_non)) add("dire_non", 2);
  if (a.groupe === "nerveux" || a.groupe === "neutre") add("groupe_question", 1.5);
  if (a.regard === "evite" || a.regard === "moyen") add("regard", 1.5);
  if (["faible", "moyen"].includes(a.posture)) { add("mur", 1.5); add("gainage", 0.5); }
  if ((a.cheveux || []).includes("coupe")) { add("coupe_photo", 2.5); add("coiffeur", 2); }
  if ((a.cheveux || []).includes("barbe")) add("barbe_trait", 1.5);
  if (a.sport === "jamais") { add("pompes", 1); add("squats", 1); }
  if (a.alimentation === "rarement") { add("proteines", 1); add("sucre", 1); }
  return b;
}

// Plan : chaque jour, 2 habitudes quotidiennes + 2 tâches ponctuelles, les domaines prioritaires d'abord.
// Les 2 premières semaines installent les habitudes ; le reste tourne sur les tâches ponctuelles.
export function buildPlan(answers = {}, factors = null) {
  const w = priorities(answers, factors);
  const short = answers.temps === false; // « pas 5 minutes par jour » : un plan allégé
  const weak = new Set(factors ? [...factors].sort((a, b) => a.note - b.note).slice(0, 5).map((f) => f.id) : []);
  const boost = taskBoosts(answers);
  // les « clés » (savoir-faire concret) passent devant : elles arrivent dans les 2 premières semaines
  const score = (t) => w[t.domain] + (t.focus.some((f) => weak.has(f)) ? 1 : 0) + (boost[t.id] || 0) + (t.key ? 1 : 0);
  // pour une femme, pas de tâche « barbe »
  const fits = (t) => !(answers.genre === "femme" && t.id === "barbe_trait");
  const daily = TASKS.filter((t) => t.daily && fits(t)).sort((a, b) => score(b) - score(a));
  const once = TASKS.filter((t) => !t.daily && fits(t)).sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
  const habits = daily.slice(0, short ? 2 : 3);
  const days = [];
  const done = new Set(); // tâches déjà données (les « oneShot » ne reviennent pas)
  let k = 0;
  for (let i = 0; i < PLAN_DAYS; i++) {
    // une nouvelle habitude par semaine, au plus 2 par jour
    const active = habits.slice(0, Math.min(habits.length, 1 + Math.floor(i / 7)));
    const todayHabits = active.slice(-2);
    // tâches ponctuelles : les prioritaires d'abord, mais jamais 2 fois le même domaine dans la journée
    const extra = [];
    const used = new Set(); // les habitudes ne bloquent pas un domaine : seules les 2 tâches du jour doivent varier
    for (let n = 0; n < (short ? 1 : 2); n++) {
      let pick = null;
      for (let j = 0; j < once.length && !pick; j++) {
        const t = once[(k + j) % once.length];
        if (!used.has(t.domain) && !extra.includes(t.id) && !(t.oneShot && done.has(t.id))) { pick = t; once.splice((k + j) % once.length, 1); once.push(t); }
      }
      pick ||= once.find((t) => !(t.oneShot && done.has(t.id)) && !extra.includes(t.id)) || once[k++ % once.length];
      used.add(pick.domain); extra.push(pick.id); done.add(pick.id);
    }
    days.push({ day: i + 1, tasks: [...todayHabits.map((t) => t.id), ...extra] });
  }
  return { library_version: LIBRARY_VERSION, days };
}

export const taskText = (id) => TASK_BY_ID[id]?.text || "";
export const taskDomain = (id) => TASK_BY_ID[id]?.domain || "";
