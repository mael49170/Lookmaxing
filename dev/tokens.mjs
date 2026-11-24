// Fabrique src/styles/tokens.css à partir de replica/design/tokens.json.
// Lancer : node dev/tokens.mjs   (à refaire après chaque changement de couleurs, par exemple à l'étape « marque »)
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const t = JSON.parse(readFileSync(new URL("replica/design/tokens.json", root), "utf8"));
const px = (n) => `${n}px`;
const lines = [];

for (const [k, v] of Object.entries(t.color)) lines.push(`  --c-${k}: ${v};`);
for (const [k, v] of Object.entries(t.font)) lines.push(`  --font-${k}: ${v};`);
for (const [k, v] of Object.entries(t.type)) {
  lines.push(`  --fs-${k}: ${px(v.size)};`, `  --lh-${k}: ${px(v.line)};`, `  --fw-${k}: ${v.weight};`);
}
t.space.forEach((v, i) => lines.push(`  --sp-${i}: ${px(v)};`));
for (const [k, v] of Object.entries(t.radius)) lines.push(`  --r-${k}: ${px(v)};`);
for (const [k, v] of Object.entries(t.size)) lines.push(`  --size-${k}: ${px(v)};`);
for (const [k, v] of Object.entries(t.shadow)) lines.push(`  --shadow-${k}: ${v};`);
for (const [k, v] of Object.entries(t.motion)) lines.push(`  --motion-${k}: ${v};`);

// le dégradé thermique : la signature de la marque (visage scanné, jauge, progression)
lines.push(`  --heat: linear-gradient(90deg, ${t.color["heat-deep"]} 0%, ${t.color["score-low"]} 25%, ${t.color.accent} 55%, ${t.color.warning} 80%, ${t.color.gold} 100%);`);
const css = `/* Fichier fabriqué par dev/tokens.mjs depuis replica/design/tokens.json : ne pas modifier à la main. */
@font-face { font-family: "Inter"; src: url("/fonts/inter.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }
@font-face { font-family: "Archivo"; src: url("/fonts/archivo.woff2") format("woff2"); font-weight: 100 900; font-stretch: 62% 125%; font-display: swap; }

:root {
${lines.join("\n")}
}
`;
writeFileSync(new URL("src/styles/tokens.css", root), css);
console.log(`tokens.css : ${lines.length} variables`);
