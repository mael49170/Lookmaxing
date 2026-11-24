// Les 15 critères du scan. Partagé par le site et le serveur.
// changeable : ce qu'on peut améliorer avec des habitudes (sert au calcul honnête du « max »).
// weight : poids dans la note globale.
export const FACTORS = [
  { id: "machoire", label: "Mâchoire", group: "visage", weight: 1.2, changeable: 0.25 },
  { id: "pommettes", label: "Pommettes", group: "visage", weight: 0.8, changeable: 0.2 },
  { id: "symetrie", label: "Symétrie", group: "visage", weight: 1, changeable: 0 },
  { id: "proportions", label: "Proportions", group: "visage", weight: 1, changeable: 0 },
  { id: "yeux", label: "Regard et contour des yeux", group: "visage", weight: 1, changeable: 0.3 },
  { id: "nez", label: "Harmonie du nez", group: "visage", weight: 0.6, changeable: 0 },
  { id: "levres", label: "Lèvres", group: "visage", weight: 0.6, changeable: 0.2 },
  { id: "peau_qualite", label: "Qualité de peau", group: "peau_cheveux", weight: 1.3, changeable: 0.8 },
  { id: "peau_teint", label: "Teint", group: "peau_cheveux", weight: 0.8, changeable: 0.6 },
  { id: "ligne_cheveux", label: "Ligne des cheveux", group: "peau_cheveux", weight: 0.7, changeable: 0.1 },
  { id: "coiffure", label: "Coiffure", group: "peau_cheveux", weight: 1.1, changeable: 0.9 },
  { id: "pilosite", label: "Barbe et sourcils", group: "peau_cheveux", weight: 0.7, changeable: 0.9 },
  { id: "corps", label: "Silhouette", group: "corps_style", weight: 1, changeable: 0.7 },
  { id: "posture", label: "Posture", group: "corps_style", weight: 0.8, changeable: 0.9 },
  { id: "tenue", label: "Coupe des vêtements", group: "corps_style", weight: 0.8, changeable: 1 },
];
export const FACTOR_IDS = FACTORS.map((f) => f.id);
export const GROUPS = { visage: "Structure du visage", peau_cheveux: "Peau et cheveux", corps_style: "Corps et style" };

// Note globale (0-100) : moyenne pondérée des critères. Calculée par le code, pas par l'IA, pour rester stable.
export function overall(scores) {
  let s = 0, w = 0;
  for (const f of FACTORS) if (Number.isFinite(scores[f.id])) { s += scores[f.id] * f.weight; w += f.weight; }
  return w ? Math.round(s / w) : 0;
}

// Potentiel : ce que donnerait chaque critère après 12 semaines d'efforts réguliers.
// On ne promet un gain que sur ce qui se travaille (changeable), jamais sur l'ossature.
export function potential(scores) {
  const target = {};
  for (const f of FACTORS) {
    const v = scores[f.id];
    if (!Number.isFinite(v)) continue;
    target[f.id] = Math.round(v + (Math.max(v, 85) - v) * f.changeable * 0.7);
  }
  return Math.max(overall(scores), Math.min(95, overall(target)));
}

// Note sur 10 avec une décimale, pour l'affichage
export const outOf10 = (n) => (Math.round(n) / 10).toFixed(1);
