// Fabrique le plan de 28 jours à partir des réponses et du scan (s'il y en a un). Sans IA, donc sans coût.
import { TASKS, TASK_BY_ID, LIBRARY_VERSION } from "./tasks.js";

export const PLAN_DAYS = 28;
const DOMAIN_OF_DIFFICULTE = { peau: "peau", cheveux: "cheveux", poids: "corps", visage: "peau", presence: "presence", confiance: "presence", invisible: "style", rencontres: "style", progresser: "" };

// Poids de chaque domaine : réponses du quiz + critères les plus faibles du scan
export function priorities(answers = {}, factors = null) {
  const w = { peau: 1, cheveux: 1, corps: 1, style: 1, presence: 1 };
  (answers.difficultes || []).forEach((d, i) => { const dom = DOMAIN_OF_DIFFICULTE[d]; if (dom) w[dom] += i === 0 ? 3 : 1.5; });
  if (answers.morpho === "enrobee") w.corps += 1.5;
  if (answers.style === "aucun" || answers.style === "sweat") w.style += 1;
  if (["bloque", "gene"].includes(answers.aborder)) w.presence += 1;
  if (factors) {
    const weakest = [...factors].sort((a, b) => a.note - b.note).slice(0, 4).map((f) => f.id);
    for (const t of TASKS) if (t.focus.some((f) => weakest.includes(f))) w[t.domain] += 0.4;
  }
  return w;
}

// Plan : chaque jour, 2 habitudes quotidiennes + 2 tâches ponctuelles, les domaines prioritaires d'abord.
// Les 2 premières semaines installent les habitudes ; le reste tourne sur les tâches ponctuelles.
export function buildPlan(answers = {}, factors = null) {
  const w = priorities(answers, factors);
  const short = answers.temps === false; // « pas 5 minutes par jour » : un plan allégé
  const weak = new Set(factors ? [...factors].sort((a, b) => a.note - b.note).slice(0, 5).map((f) => f.id) : []);
  const score = (t) => w[t.domain] + (t.focus.some((f) => weak.has(f)) ? 1 : 0);
  const daily = TASKS.filter((t) => t.daily).sort((a, b) => score(b) - score(a));
  const once = TASKS.filter((t) => !t.daily).sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
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
    const used = new Set(todayHabits.map((t) => t.domain));
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
