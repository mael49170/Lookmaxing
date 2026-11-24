// Le visage maillé « thermique » : la signature visuelle. Dessin abstrait (aucune vraie personne).
// faceMesh() rend un SVG ; sur l'écran d'analyse, il est posé sur la photo de la personne, dans son téléphone seulement.

// Points dans un repère 0..100 (largeur) x 0..130 (hauteur). Chaque point a une « chaleur » de 0 à 1.
const P = [];
const add = (x, y, h, group) => P.push({ x, y, h, group });
// contour du visage (ovale un peu carré en bas)
for (let i = 0; i < 26; i++) {
  const a = (i / 26) * Math.PI * 2 - Math.PI / 2;
  const rx = 38, ry = a > 0 && a < Math.PI ? 56 : 50;
  const squarish = a > 0.3 && a < Math.PI - 0.3 ? 1.06 : 1;
  add(50 + Math.cos(a) * rx * squarish, 64 + Math.sin(a) * ry, 0.25 + 0.5 * Math.abs(Math.sin(a * 2)), "contour");
}
// sourcils, yeux, nez, bouche, pommettes, mâchoire
[[30, 50], [36, 47], [43, 49]].forEach(([x, y]) => { add(x, y, 0.6, "sourcils"); add(100 - x, y, 0.6, "sourcils"); });
[[30, 58], [35, 55.5], [40, 58], [35, 60.5]].forEach(([x, y]) => { add(x, y, 0.9, "yeux"); add(100 - x, y, 0.9, "yeux"); });
[[50, 58], [50, 68], [50, 78], [45, 81], [55, 81]].forEach(([x, y]) => add(x, y, 0.75, "nez"));
[[40, 94], [45, 91.5], [50, 92.5], [55, 91.5], [60, 94], [50, 97.5]].forEach(([x, y]) => add(x, y, 0.85, "bouche"));
[[24, 74], [30, 82], [76, 74], [70, 82]].forEach(([x, y]) => add(x, y, 1, "pommettes"));
[[34, 108], [42, 113], [50, 115], [58, 113], [66, 108]].forEach(([x, y]) => add(x, y, 0.95, "machoire"));
[[50, 34], [38, 38], [62, 38], [50, 44]].forEach(([x, y]) => add(x, y, 0.4, "front"));

// liens : chaque point vers ses 2 voisins les plus proches (maillage léger)
const LINKS = [];
P.forEach((p, i) => {
  P.map((q, j) => [j, Math.hypot(p.x - q.x, p.y - q.y)]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 2)
    .forEach(([j, d]) => { if (d < 18 && !LINKS.some(([a, b]) => (a === j && b === i))) LINKS.push([i, j]); });
});

const heat = (h) => (h > 0.85 ? "var(--c-gold)" : h > 0.6 ? "var(--c-warning)" : h > 0.4 ? "var(--c-accent)" : "var(--c-score-low)");

// animated : les points apparaissent un par un (écran d'analyse)
export function faceMesh({ animated = false, className = "mesh" } = {}) {
  const order = P.map((p, i) => i).sort((a, b) => P[a].y - P[b].y);
  const delay = (i) => (animated ? `style="animation-delay:${(order.indexOf(i) * 35)}ms"` : "");
  return `<svg class="${className}" viewBox="-4 6 108 128" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="mesh-glow" cx="50%" cy="58%" r="55%"><stop offset="0%" stop-color="var(--c-glow)" stop-opacity=".45"/><stop offset="100%" stop-color="var(--c-glow)" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="50" cy="66" rx="52" ry="62" fill="url(#mesh-glow)"/>
    <g class="mesh__links">${LINKS.map(([a, b], k) => `<line x1="${P[a].x.toFixed(1)}" y1="${P[a].y.toFixed(1)}" x2="${P[b].x.toFixed(1)}" y2="${P[b].y.toFixed(1)}" ${animated ? `style="animation-delay:${k * 15}ms"` : ""}/>`).join("")}</g>
    <g class="mesh__dots">${P.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(1 + p.h * 1.4).toFixed(2)}" fill="${heat(p.h)}" ${delay(i)}/>`).join("")}</g>
    ${animated ? '<rect class="mesh__sweep" x="-4" y="6" width="108" height="3" fill="var(--c-gold)"/>' : ""}
  </svg>`;
}
export const MESH_POINTS = P.length;
