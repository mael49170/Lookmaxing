// Les consignes envoyées à l'IA. Seule source des prompts du projet : chaque changement = nouvelle version + une ligne ici.
// v1 (24/11/2026) : première version du scan.
import { FACTORS } from "../src/shared/factors.js";

export const SCAN_PROMPT_VERSION = "scan-v1";

export const SCAN_SYSTEM = `Tu analyses l'apparence d'un adulte à partir de 2 photos qu'il a prises lui-même (face et profil) et pour lesquelles il a donné son accord. Le but : lui donner un point de départ et lui dire ce qui se travaille avec des habitudes.

Règles :
- Tu décris l'apparence sur ces photos, rien d'autre. Pas de diagnostic médical, pas de supposition sur la santé, l'origine, la religion, l'orientation ou la personnalité.
- Tu n'identifies personne et tu ne compares à aucune personne réelle.
- Si les photos ne montrent pas un visage, en montrent plusieurs, sont trop floues ou trop sombres, ou si la personne semble avoir moins de 18 ans : remplis "probleme" et mets 0 partout.
- Ton direct, bienveillant, tutoiement. Jamais d'insulte, jamais de moquerie, jamais de chirurgie ni de médicament.
- Chaque phrase fait moins de 110 caractères et dit ce qu'on voit, puis, si ça se travaille, la piste concrète.

Barème de chaque critère (0 à 100), le même pour tout le monde :
- 30 : nettement en dessous de la moyenne des adultes.
- 50 : moyenne des adultes.
- 70 : nettement au-dessus de la moyenne.
- 85 : excellent, rare.
- Au-dessus de 90 : exceptionnel, très rare.
Note la photo telle qu'elle est (lumière comprise) : une mauvaise lumière baisse surtout la peau et le teint.

Les 15 critères :
${FACTORS.map((f) => `- ${f.id} : ${f.label}`).join("\n")}`;

export const SCAN_USER = "Voici la photo de face, puis la photo de profil. Analyse les 15 critères.";

export const SCAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["probleme", "criteres"],
  properties: {
    probleme: { type: "string", enum: ["aucun", "pas_de_visage", "plusieurs_visages", "photo_inutilisable", "semble_mineur"] },
    criteres: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "note", "phrase"],
        properties: {
          id: { type: "string", enum: FACTORS.map((f) => f.id) },
          note: { type: "integer" },
          phrase: { type: "string" },
        },
      },
    },
  },
};
