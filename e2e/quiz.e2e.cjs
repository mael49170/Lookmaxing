// Tests de bout en bout dans un vrai navigateur, contre le serveur local (mode essai).
// 1. node dev/server.mjs     2. node e2e/quiz.e2e.cjs [chemin/vers/axe.min.js]
// Sans dépendance : utilise le Playwright déjà installé sur la machine. axe-core (accessibilité) est facultatif.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "http://localhost:8788";
const AXE = process.argv[2] && fs.existsSync(process.argv[2]) ? fs.readFileSync(process.argv[2], "utf8") : null;
const PHOTO = path.join(__dirname, "photo-test.jpg"); // une image quelconque (le scan d'essai ne regarde pas le visage)
const results = [];
const a11y = new Map();

async function newPage(browser, { width = 390, height = 844 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" }); // sans animation : axe lit les vraies couleurs
  const page = await ctx.newPage();
  page.problems = [];
  // les réponses 4xx attendues (refus voulus) ne comptent pas ; les 5xx sont comptées à part
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource: the server responded with a status of 4\d\d/.test(m.text()) && page.problems.push("console: " + m.text()));
  page.on("pageerror", (e) => page.problems.push("js: " + e.message));
  page.on("response", (r) => r.status() >= 500 && page.problems.push("5xx: " + r.url()));
  return page;
}

async function axe(page, label) {
  if (!AXE) return;
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}`));
  for (const v of r) a11y.set(v.split(" ")[0], [...(a11y.get(v.split(" ")[0]) || []), label]);
}

const screenId = (page) => page.evaluate(() => { try { return JSON.parse(sessionStorage.getItem("lm_quiz_v1")).i; } catch { return -1; } });
const h1 = async (page) => (await page.getByRole("heading", { level: 1 }).first().textContent()).trim();

// Avance d'un écran comme le ferait quelqu'un (première réponse adulte, premier choix multiple)
async function step(page, { photos = true } = {}) {
  await page.waitForTimeout(350);
  if (await page.getByRole("button", { name: "Lancer l'analyse" }).count()) {
    if (!photos) return page.getByRole("button", { name: "Continuer sans photo" }).click();
    await page.getByLabel("Photo de face").setInputFiles(PHOTO);
    await page.waitForTimeout(300);
    await page.getByLabel("Photo de profil").setInputFiles(PHOTO);
    await page.getByRole("button", { name: "Lancer l'analyse" }).click({ trial: false });
    return;
  }
  if (await page.getByRole("button", { name: "J'accepte, on continue" }).count()) return page.getByRole("button", { name: photos ? "J'accepte, on continue" : "Pas maintenant" }).click();
  if (await page.getByRole("button", { name: /Ton plan se prépare|Voir mon résultat|Continuer sans scan/ }).count()) {
    for (let k = 0; k < 2; k++) { await page.getByRole("dialog").waitFor({ timeout: 15000 }); await page.getByRole("dialog").getByRole("button", { name: "Oui" }).click(); }
    await page.getByRole("button", { name: /Voir mon résultat|Continuer sans scan/ }).waitFor({ timeout: 30000 });
    return page.getByRole("button", { name: /Voir mon résultat|Continuer sans scan/ }).click();
  }
  const radios = page.getByRole("radio");
  if (await radios.count() && !(await page.getByRole("radio", { name: /aujourd'hui/ }).count())) {
    const n = await radios.count();
    for (let k = 0; k < n; k++) {
      const label = await radios.nth(k).evaluate((el) => el.closest("label").textContent);
      if (!/Moins de 18/.test(label)) { await radios.nth(k).check({ force: true }); break; }
    }
    const confirm = page.getByRole("button", { name: "Je valide mon pronostic" });
    if (await confirm.count()) await confirm.click();
    return;
  }
  const boxes = page.getByRole("checkbox");
  if (await page.getByRole("button", { name: "Continuer" }).count() && await boxes.count()) {
    await boxes.first().check({ force: true });
    return page.getByRole("button", { name: "Continuer" }).click();
  }
  return page.locator(".screen__footer").getByRole("button").first().click();
}

async function runTo(page, target, opts) {
  for (let n = 0; n < 45; n++) {
    if ((await page.getByLabel("Ton e-mail").count()) && target !== "email") {
      await page.getByLabel("Ton e-mail").fill(opts?.email || `test${Date.now()}@example.com`);
      await page.getByRole("button", { name: "Voir mon résultat" }).click();
      await page.getByRole("button", { name: /Débloquer mon résultat/ }).waitFor({ timeout: 10000 });
      continue;
    }
    const t = await h1(page).catch(() => "");
    if (target === "email" && await page.getByLabel("Ton e-mail").count()) return;
    if (target === "offre" && await page.getByRole("button", { name: /Débloquer mon résultat/ }).count()) return;
    if (typeof target === "number" && (await screenId(page)) === target) return;
    if (opts?.axe) await axe(page, "S" + String((await screenId(page)) + 1).padStart(2, "0"));
    await step(page, opts);
  }
  throw new Error("écran cible jamais atteint : " + target);
}

async function pay(page) {
  await page.getByRole("checkbox", { name: /rétractation/ }).check();
  await page.getByRole("button", { name: /Débloquer mon résultat/ }).click();
  await page.waitForURL(/\/app\//, { timeout: 15000 });
  if (await page.getByRole("button", { name: "Voir mon détail" }).count() || await page.waitForSelector(".tabs, .reveal", { timeout: 10000 }).then(() => page.locator(".reveal").count())) {
    await page.waitForTimeout(1800); await axe(page, "révélation"); await page.getByRole("button", { name: "Voir mon détail" }).click();
  }
  await page.getByRole("tablist").waitFor();
}

async function test(id, name, fn, browser, pageOpts) {
  const page = await newPage(browser, pageOpts);
  try {
    await page.goto(BASE + "/q/?v=a", { waitUntil: "networkidle" });
    await fn(page);
    if (page.problems.length) throw new Error(page.problems.join(" | "));
    results.push([id, "ok", name]);
  } catch (err) {
    results.push([id, "ÉCHEC", name + " : " + err.message.split("\n").slice(0, 3).join(" ").replace(/\x1b\[\d+m/g, "")]);
    await page.screenshot({ path: path.join(__dirname, `echec-${id}.png`) }).catch(() => {});
  }
  await page.context().close();
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

(async () => {
  if (!fs.existsSync(PHOTO)) throw new Error("Mets une image dans " + PHOTO);
  const browser = await chromium.launch();

  await test("F01-H1", "quiz complet avec photos, paiement, rapport", async (p) => {
    await runTo(p, "offre", { axe: true });
    await axe(p, "S25-S26");
    await pay(p);
    await axe(p, "S28");
    expect(await p.getByRole("heading", { name: /Ton détail/ }).count(), "pas de rapport");
    await p.getByRole("tab", { name: "Mon plan" }).click();
    const tasks = p.getByRole("checkbox");
    expect((await tasks.count()) >= 3, "moins de 3 tâches");
    await tasks.first().check();
    await p.waitForTimeout(400);
    expect(/1 sur 3 fait/.test(await p.textContent("main")), "case non comptée");
    await axe(p, "S29");
  }, browser);

  await test("F01-E1", "rechargement en plein quiz : on reprend au même écran", async (p) => {
    await runTo(p, 12);
    await p.reload({ waitUntil: "networkidle" });
    expect((await screenId(p)) === 12 && /pronostic|note/.test(await h1(p)), "pas revenu au S12");
  }, browser);

  await test("F01-E2", "retour arrière du navigateur : écran précédent, réponses gardées", async (p) => {
    await runTo(p, 10);
    await p.goBack(); await p.waitForTimeout(300);
    expect((await screenId(p)) === 9, "pas revenu au S09 (écran " + (await screenId(p)) + ")");
    expect(await p.getByRole("checkbox", { checked: true }).count() >= 1, "réponse perdue");
  }, browser);

  await test("F01-E3", "double clic sur Payer : une seule page de paiement demandée", async (p) => {
    await runTo(p, "offre");
    let n = 0; p.on("request", (r) => r.url().includes("/api/checkout") && !r.url().includes("done") && n++);
    await p.getByRole("checkbox", { name: /rétractation/ }).check();
    await p.getByRole("button", { name: /Débloquer mon résultat/ }).dblclick();
    await p.waitForURL(/\/app\//, { timeout: 15000 });
    expect(n === 1, n + " demandes de paiement");
  }, browser);

  await test("F01-E4", "au clavier seulement : les flèches choisissent sans valider, Espace valide (BUG-001)", async (p) => {
    await p.keyboard.press("Tab"); await p.keyboard.press("Enter"); // Lancer mon analyse
    await p.waitForTimeout(400);
    await p.keyboard.press("Tab"); // première réponse
    await p.keyboard.press("ArrowDown"); await p.waitForTimeout(600);
    expect(/tu es/.test(await h1(p)), "la flèche a validé toute seule");
    await p.keyboard.press("Space"); await p.waitForTimeout(600);
    expect(/âge/.test(await h1(p)), "Espace ne valide pas (" + await h1(p) + ")");
  }, browser);

  await test("F01-E5", "l'analyse échoue : message clair, reprendre les photos ou continuer sans", async (p) => {
    await p.route("**/api/scan", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: false, problem: "pas_de_visage", message: "On ne trouve pas de visage sur une des photos." }) }));
    await runTo(p, 24);
    for (let k = 0; k < 2; k++) { await p.getByRole("dialog").waitFor({ timeout: 15000 }); await p.getByRole("dialog").getByRole("button", { name: "Oui" }).click(); }
    await p.getByRole("button", { name: "Continuer sans scan" }).waitFor({ timeout: 30000 });
    expect(await p.getByRole("alert").filter({ hasText: "pas de visage" }).count(), "pas de message");
    await p.getByRole("button", { name: "Reprendre les photos" }).click();
    expect(/Deux photos/.test(await h1(p)), "pas revenu aux photos");
  }, browser);

  await test("F01-E6", "grand écran (1440 px) : pas de défilement horizontal, colonne centrée", async (p) => {
    await runTo(p, 8);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, main: document.querySelector("main").getBoundingClientRect().width }));
    expect(r.sw <= r.w && r.main <= 480, JSON.stringify(r));
  }, browser, { width: 1440, height: 900 });

  await test("F01-E7", "e-mail long avec accents et +", async (p) => {
    await runTo(p, "email");
    await p.getByLabel("Ton e-mail").fill("élodie.martin+" + "x".repeat(60) + "@exemple-tres-long-pour-voir.fr");
    await p.getByRole("button", { name: "Voir mon résultat" }).click();
    await p.getByRole("button", { name: /Débloquer mon résultat/ }).waitFor({ timeout: 5000 });
  }, browser);

  await test("F01-N1", "e-mail invalide : message sous le champ", async (p) => {
    await runTo(p, "email");
    await p.getByLabel("Ton e-mail").fill("prenom@");
    await p.getByRole("button", { name: "Voir mon résultat" }).click();
    expect(await p.getByText("Cette adresse ne semble pas complète.").isVisible(), "pas d'erreur");
  }, browser);

  await test("F01-N2", "payer sans cocher la renonciation : refusé avec un message", async (p) => {
    await runTo(p, "offre");
    await p.getByRole("button", { name: /Débloquer mon résultat/ }).click();
    expect(await p.getByRole("alert").filter({ hasText: "Coche la case" }).isVisible(), "pas de message");
    expect(!/\/app\//.test(p.url()), "paiement parti quand même");
  }, browser);

  await test("F02-H1", "sans photo (variante B) : plan d'après les réponses, pas de note", async (p) => {
    await p.goto(BASE + "/q/?v=b", { waitUntil: "networkidle" });
    await runTo(p, "offre", { photos: false });
    expect(!(await p.getByText("?,?").count()), "notes affichées sans scan");
    await pay(p);
    await p.getByRole("tab", { name: "Mon rapport" }).click();
    expect(await p.getByText(/Pas de scan pour ce compte/).count(), "rapport vide mal expliqué");
  }, browser);

  await test("F03-H1", "moins de 18 ans : arrêt, rien de gardé", async (p) => {
    await p.getByRole("button", { name: "Lancer mon analyse" }).click();
    await p.getByRole("radio", { name: /homme/ }).check({ force: true });
    await p.waitForTimeout(500);
    await p.getByRole("radio", { name: /Moins de 18/ }).check({ force: true });
    await p.getByRole("heading", { name: "Réservé aux adultes" }).waitFor();
    const cookies = await p.context().cookies();
    expect(!cookies.some((c) => c.name === "lm_q"), "cookie du quiz encore là");
    await axe(p, "S03b");
  }, browser);

  await test("F04-H1", "connexion par code, mauvais code refusé, session expirée renvoie à la connexion", async (p) => {
    const email = `f04${Date.now()}@example.com`;
    await runTo(p, "offre", { email, photos: false });
    await pay(p);
    await p.context().clearCookies();
    await p.goto(BASE + "/app/"); await p.waitForURL(/connexion/);
    await axe(p, "S30");
    await p.getByLabel("Ton e-mail").fill(email);
    await p.getByRole("button", { name: "Recevoir mon code" }).click();
    await p.getByLabel(/code à 6 chiffres/).waitFor();
    const code = (await p.textContent("#msg")).match(/\d{6}/)[0];
    await p.getByLabel(/code à 6 chiffres/).fill(code === "123456" ? "654321" : "123456");
    await p.getByRole("button", { name: "Me connecter" }).click();
    await p.getByRole("alert").filter({ hasText: "Code incorrect" }).waitFor();
    await p.getByLabel(/code à 6 chiffres/).fill(code);
    await p.getByRole("button", { name: "Me connecter" }).click();
    await p.waitForURL(/\/app\/$/);
    await p.getByRole("tablist").waitFor();
  }, browser);

  await test("F06-H1", "résilier pendant l'essai : semaine d'engagement annoncée, suppression refusée tant qu'elle n'est pas prélevée", async (p) => {
    await runTo(p, "offre", { photos: false });
    expect(/17,98/.test((await p.textContent("main")).replace(/\s+/g, " ")), "le minimum à payer n'est pas écrit sur la page de paiement");
    await pay(p);
    expect(/Essai en cours/.test(await p.textContent(".account")), "l'essai n'est pas indiqué");
    const messages = [];
    p.on("dialog", (d) => { messages.push(d.message()); d.accept(); });
    await p.getByRole("button", { name: "Supprimer mon compte et mes données" }).click();
    await p.waitForTimeout(400);
    expect(/\/app\//.test(p.url()), "suppression acceptée avec un abonnement en cours");
    await p.getByRole("button", { name: "Résilier mon abonnement" }).click();
    await p.getByText(/semaine d'engagement/).waitFor();
    expect(messages.some((m) => /semaine d'engagement/.test(m)), "la confirmation ne parle pas de la semaine d'engagement");
    await p.getByRole("button", { name: "Supprimer mon compte et mes données" }).click();
    await p.waitForTimeout(400);
    expect(messages.some((m) => /prélevée le/.test(m)), "pas de message clair sur la suppression");
  }, browser);

  await browser.close();
  for (const [id, res, name] of results) console.log(`${res === "ok" ? "ok    " : "ÉCHEC "} ${id}  ${name}`);
  console.log(`\n${results.filter((r) => r[1] === "ok").length} / ${results.length} réussis`);
  if (AXE) console.log("\nAccessibilité (axe, WCAG A et AA) :\n" + ([...a11y].map(([k, v]) => `  ${k} : ${[...new Set(v)].join(", ")}`).join("\n") || "  aucun problème"));
  else console.log("\n(accessibilité non testée : passer le chemin de axe.min.js)");
  process.exit(results.every((r) => r[1] === "ok") ? 0 : 1);
})();
