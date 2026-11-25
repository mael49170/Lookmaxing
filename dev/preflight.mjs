// Vérification avant la mise en ligne (vraies ventes). Bloque tant qu'il manque quelque chose d'obligatoire.
// node dev/preflight.mjs            -> contrôle le code (pages légales, tests)
// node dev/preflight.mjs --env      -> contrôle aussi les clés de .dev.vars (ou des variables d'environnement)
// Sortie 1 s'il reste un point bloquant.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = new URL("..", import.meta.url);
const ko = [], warn = [], ok = [];
const read = (p) => readFileSync(new URL(p, root), "utf8");

// 1. Pages légales : plus aucune case « [À REMPLIR] », pages à jour avec les prix
for (const page of ["cgv", "confidentialite", "biometrie", "mentions-legales"]) {
  const f = `src/${page}/index.html`;
  if (!existsSync(new URL(f, root))) { ko.push(`${f} manque (node dev/legal.mjs)`); continue; }
  const n = (read(f).match(/À REMPLIR/g) || []).length;
  if (n) ko.push(`${f} : ${n} case(s) « À REMPLIR » (dev/legal.mjs, tout en haut : société, SIREN, e-mail, médiateur…)`);
}
if (!ko.some((k) => k.includes("À REMPLIR"))) ok.push("pages légales remplies");

// 2. Tous les tests
for (const t of readdirSync(new URL("test/", root)).filter((f) => f.endsWith(".test.mjs"))) {
  try { execFileSync(process.execPath, [new URL(`test/${t}`, root).pathname], { stdio: "pipe" }); ok.push(`test ${t}`); }
  catch { ko.push(`test ${t} en échec`); }
}

// 3. Aucune clé secrète dans le code envoyé sur GitHub
const tracked = execFileSync("git", ["ls-files"], { cwd: root.pathname }).toString().split("\n").filter((f) => /\.(js|mjs|cjs|html|json|toml|md)$/.test(f));
const secret = /(sk_live_|sk_test_[A-Za-z0-9]{10,}|rk_live_|whsec_[A-Za-z0-9]{10,}|sk-ant-[A-Za-z0-9-]{10,}|re_[A-Za-z0-9]{20,})/;
const leaks = tracked.filter((f) => existsSync(new URL(f, root)) && secret.test(read(f)));
if (leaks.length) ko.push("clé secrète dans le code : " + leaks.join(", ")); else ok.push("aucune clé secrète dans le code");
if (tracked.includes(".dev.vars")) ko.push(".dev.vars est envoyé sur GitHub : le retirer tout de suite");

// 4. Les clés (avec --env)
if (process.argv.includes("--env")) {
  const env = { ...process.env };
  if (existsSync(new URL(".dev.vars", root))) for (const line of read(".dev.vars").split("\n")) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/); if (m) env[m[1]] = m[2]; }
  const need = { ANTHROPIC_API_KEY: "analyse du visage", STRIPE_SECRET_KEY: "paiement", STRIPE_WEBHOOK_SECRET: "confirmation des paiements", RESEND_API_KEY: "e-mails", MAIL_FROM: "adresse d'envoi", TURNSTILE_SITE_KEY: "anti-robot", TURNSTILE_SECRET: "anti-robot", CRON_SECRET: "tâches du jour", UNSUB_SECRET: "désinscription", IP_SALT: "anonymisation des IP", SUPPORT_EMAIL: "contact avant paiement" };
  for (const [k, why] of Object.entries(need)) (env[k] ? ok : ko).push(env[k] ? `${k} réglée` : `${k} manque (${why})`);
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) warn.push("Stripe est en mode TEST : passer en clé sk_live_ seulement pour ouvrir");
  if (env.DEV_FAKE_SCAN === "1" || env.DEV_FAKE_PAY === "1") ko.push("DEV_FAKE_SCAN / DEV_FAKE_PAY actifs : à retirer en ligne");
  if (!env.STRIPE_PUBLISHABLE_KEY) warn.push("STRIPE_PUBLISHABLE_KEY manque : le paiement se fera sur la page Stripe (pas dans la page)");
}

// 5. Ce que le code ne peut pas vérifier : à cocher à la main
const manual = [
  "Médiateur de la consommation choisi et écrit dans les CGV",
  "Accord de non-conservation (zero data retention) signé avec Anthropic, ou page « Données du visage » corrigée",
  "Analyse d'impact (AIPD) écrite pour les données du visage",
  "CGV relues par un avocat (semaine obligatoire, rétractation)",
  "Test réel de l'analyse sur 20 photos (note stable à 3 points près)",
  "Paiement test complet : carte acceptée, carte refusée 4000 0000 0000 0002, 3-D Secure, webhook, e-mail reçu",
  "Caméra testée sur un vrai iPhone (Safari) et un vrai Android (Chrome)",
  "Marque MOGX vérifiée (INPI, EUIPO) et domaine acheté",
];

console.log("\nCE QUI EST BON");
ok.forEach((x) => console.log("  ✓ " + x));
if (warn.length) { console.log("\nÀ SAVOIR"); warn.forEach((x) => console.log("  ! " + x)); }
console.log("\nÀ VÉRIFIER À LA MAIN");
manual.forEach((x) => console.log("  □ " + x));
if (ko.length) { console.log("\nBLOQUANT : PAS DE MISE EN LIGNE"); ko.forEach((x) => console.log("  ✗ " + x)); process.exit(1); }
console.log("\nRien de bloquant dans le code. Vérifie la liste « à la main » avant d'ouvrir.");
