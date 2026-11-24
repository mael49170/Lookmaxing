// Recopie replica/schema.sql (la version commentée) dans lib/schema.js (ce que lit le serveur).
// Lancer après chaque changement de tables : node dev/schema.mjs
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url);
const sql = readFileSync(new URL("replica/schema.sql", root), "utf8")
  .split("\n").map((l) => l.replace(/--.*$/, "").trimEnd()).filter((l) => l.trim()).join(" ");
const stmts = sql.split(";").map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
writeFileSync(new URL("lib/schema.js", root), "// Fichier fabriqué par dev/schema.mjs depuis replica/schema.sql : ne pas modifier à la main.\n// Les tables se créent toutes seules au premier appel.\nexport const SCHEMA = [\n" + stmts.map((s) => "  `" + s + "`,\n").join("") + "];\n");
console.log(stmts.length + " instructions");
