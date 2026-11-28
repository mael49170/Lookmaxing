// Les consignes envoyées à l'IA. Seule source des prompts du projet : chaque changement = nouvelle version + une ligne ici.
// v1 (24/11/2026) : première version du scan.
import { FACTORS } from "../src/shared/factors.js";
import { FACE_SHAPE_IDS } from "./protocols.js";

export const SCAN_PROMPT_VERSION = "scan-v5"; // v5 (28/11/2026) : notes plus franches et plus écartées (un vrai point faible se voit) // v4 (28/11/2026) : + forme du visage (pour conseiller la coupe) // v3 (27/11/2026) : pour une femme, « Barbe et sourcils » = sourcils seulement // v2 (27/11/2026) : plus d'estimation de l'âge (faux « mineur » sur des 20 ans) ; l'âge est celui déclaré dans le quiz

export const SCAN_SYSTEM = `Tu analyses l'apparence d'un adulte à partir de 2 photos qu'il a prises lui-même (face et profil) et pour lesquelles il a donné son accord. Le but : lui donner un point de départ et lui dire ce qui se travaille avec des habitudes.

Règles :
- Tu décris l'apparence sur ces photos, rien d'autre. Pas de diagnostic médical, pas de supposition sur la santé, l'origine, la religion, l'orientation ou la personnalité.
- Tu n'identifies personne et tu ne compares à aucune personne réelle.
- Si les photos ne montrent pas un visage, en montrent plusieurs, ou sont trop floues ou trop sombres : remplis "probleme" et mets 0 partout. N'estime pas l'âge : la personne a déclaré avoir 18 ans ou plus.
- Ton direct, bienveillant, tutoiement. Jamais d'insulte, jamais de moquerie, jamais de chirurgie ni de médicament.
- Chaque phrase fait moins de 110 caractères et dit ce qu'on voit, puis, si ça se travaille, la piste concrète.

Barème de chaque critère (0 à 100), le même pour tout le monde :
- 30 : nettement en dessous de la moyenne des adultes.
- 50 : moyenne des adultes.
- 70 : nettement au-dessus de la moyenne.
- 85 : excellent, rare.
- Au-dessus de 90 : exceptionnel, très rare.
Note la photo telle qu'elle est (lumière comprise) : une mauvaise lumière baisse surtout la peau et le teint.
Sois franc : ne regroupe pas toutes les notes autour de 50 par politesse. Écarte-les selon ce que tu vois vraiment : un vrai point faible se note entre 25 et 40, un vrai point fort au-dessus de 65.

Donne aussi "forme_visage", la forme générale du visage de face : ovale, rond, carre (mâchoire large et marquée), long, coeur (front large, menton fin) ou losange (pommettes larges, front et menton étroits).

Les 15 critères :
${FACTORS.map((f) => `- ${f.id} : ${f.label}`).join("\n")}`;

export const SCAN_USER = "Voici la photo de face, puis la photo de profil. Analyse les 15 critères.";
// ajouté au message quand la personne a répondu « femme » au quiz (quelques mots : coût négligeable)
export const SCAN_USER_FEMME = " La personne est une femme : pour « Barbe et sourcils », ne note et ne commente que les sourcils.";

export const SCAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["probleme", "forme_visage", "criteres"],
  properties: {
    forme_visage: { type: "string", enum: FACE_SHAPE_IDS },
    probleme: { type: "string", enum: ["aucun", "pas_de_visage", "plusieurs_visages", "photo_inutilisable"] },
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
