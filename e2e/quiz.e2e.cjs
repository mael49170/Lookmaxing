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
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce", permissions: ["camera"] }); // sans animation : axe lit les vraies couleurs
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
// l'identifiant de l'écran affiché (genre, pari, construction…)
const screenName = (page) => page.evaluate(async () => { try { const i = JSON.parse(sessionStorage.getItem("lm_quiz_v1")).i || 0; return (await import("/shared/questions.js")).SCREENS[i].id; } catch { return ""; } });
const h1 = async (page) => (await page.getByRole("heading", { level: 1 }).first().textContent()).trim();

// Avance d'un écran comme le ferait quelqu'un (première réponse adulte, premier choix multiple)
async function step(page, { photos = true } = {}) {
  await page.waitForTimeout(350);
  // page de paiement (ou en train de charger) : rien à cliquer ici, runTo s'arrête dessus
  if (/On prépare ta page/.test(await h1(page).catch(() => "")) || await page.locator("[data-pay]").count()) return page.getByRole("button", { name: /Débloquer mon résultat, / }).waitFor({ timeout: 10000 });
  // caméra dans la page (fausse caméra de Chromium) : face puis profil
  if (await page.getByRole("button", { name: /^Prendre la photo/ }).count()) {
    if (!photos) return page.getByRole("button", { name: "Continuer sans photo" }).click();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: /^Prendre la photo/ }).click();
    return page.getByRole("button", { name: "C'est bon" }).click();
  }
  if (await page.getByRole("button", { name: "C'est bon" }).count()) return page.getByRole("button", { name: "C'est bon" }).click();
  if (await page.getByRole("button", { name: "Lancer l'analyse" }).count()) { // écran de secours, sans caméra
    if (!photos) return page.getByRole("button", { name: "Continuer sans photo" }).click();
    await page.getByLabel("Photo de face").setInputFiles(PHOTO);
    await page.waitForTimeout(300);
    await page.getByLabel("Photo de profil").setInputFiles(PHOTO);
    return page.getByRole("button", { name: "Lancer l'analyse" }).click();
  }
  if (!photos && await page.getByRole("button", { name: "Prendre mes selfies" }).count()) return page.getByRole("button", { name: "Continuer sans photo" }).click();
  if (await page.getByRole("button", { name: "On calcule ton potentiel" }).count()) return page.locator(".screen__footer .btn--primary:not([disabled])").waitFor({ timeout: 40000 });
  if (await page.getByRole("button", { name: /Ton plan se prépare|Voir mon résultat|Continuer sans scan/ }).count()) {
    for (let k = 0; k < 3; k++) { await page.getByRole("dialog").waitFor({ timeout: 20000 }); await page.getByRole("dialog").getByRole("button", { name: "Oui" }).click(); }
    await page.getByRole("button", { name: /Voir mon résultat|Continuer sans scan/ }).waitFor({ timeout: 40000 });
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
  for (let n = 0; n < 90; n++) {
    if (target === "offre" && await page.getByRole("button", { name: /Débloquer mon résultat, / }).count()) return;
    if (/On prépare ta page/.test(await h1(page).catch(() => ""))) { await page.getByRole("button", { name: /Débloquer mon résultat, / }).waitFor({ timeout: 10000 }); continue; }
    if (typeof target === "string" && target.startsWith("id:") && (await screenName(page)) === target.slice(3)) return;
    if (opts?.axe) await axe(page, await screenName(page));
    await step(page, opts);
  }
  throw new Error("écran cible jamais atteint : " + target);
}

// Paiement : la page de paiement, puis le formulaire de paiement (ici le faux, en mode test) qui demande l'e-mail
async function toPayForm(page) {
  await page.getByRole("checkbox", { name: /rétractation/ }).check();
  await page.getByRole("button", { name: /Débloquer mon résultat, / }).click();
  await page.waitForURL(/\/essai-paiement\//, { timeout: 15000 });
}
async function pay(page, email) {
  await toPayForm(page);
  await axe(page, "paiement-test");
  await page.getByLabel("Ton e-mail").fill(email || `test${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Payer (test)" }).click();
  await page.waitForURL(/\/app\//, { timeout: 15000 });
  await page.getByRole("heading", { name: "Ton compte est créé." }).waitFor();
  await axe(page, "compte-cree");
  const toNote = await page.getByRole("button", { name: "Voir ma note" }).count();
  await page.getByRole("button", { name: /Voir ma note|Voir mon plan/ }).click();
  if (toNote) { await page.waitForTimeout(1800); await axe(page, "révélation"); await page.getByRole("button", { name: "Voir mon détail" }).click(); }
  await page.getByRole("tablist").waitFor();
}

async function test(id, name, fn, browser, pageOpts) {
  const page = await newPage(browser, pageOpts);
  try {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
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
  const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });

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
    await runTo(p, "id:peau_acne");
    const before = await screenId(p);
    await p.reload({ waitUntil: "networkidle" });
    expect((await screenId(p)) === before && /Boutons|imperfections/.test(await h1(p)), "pas revenu au même écran");
  }, browser);

  await test("F01-E2", "retour arrière du navigateur : écran précédent, réponses gardées", async (p) => {
    await runTo(p, "id:objectifs");
    await p.goBack(); await p.waitForTimeout(300);
    expect((await screenName(p)) === "difficultes", "pas revenu aux difficultés (écran " + (await screenName(p)) + ")");
    expect(await p.getByRole("checkbox", { checked: true }).count() >= 1, "réponse perdue");
  }, browser);

  await test("F01-E3", "double clic sur Payer : une seule page de paiement demandée", async (p) => {
    await runTo(p, "offre");
    let n = 0; p.on("request", (r) => r.url().includes("/api/checkout") && !r.url().includes("done") && n++);
    await p.getByRole("checkbox", { name: /rétractation/ }).check();
    await p.getByRole("button", { name: /Débloquer mon résultat, / }).dblclick();
    await p.waitForURL(/\/essai-paiement\//, { timeout: 15000 });
    expect(n === 1, n + " demandes de paiement");
  }, browser);

  await test("F01-E4", "au clavier seulement : les flèches choisissent sans valider, Espace valide (BUG-001)", async (p) => {
    await p.keyboard.press("Tab"); // carte « Homme » de l'accueil
    await p.keyboard.press("ArrowDown"); await p.waitForTimeout(600);
    expect(/autres voient/.test(await h1(p)), "la flèche a validé toute seule");
    await p.keyboard.press("Space"); await p.waitForTimeout(600);
    expect(/âge/.test(await h1(p)), "Espace ne valide pas (" + await h1(p) + ")");
  }, browser);

  await test("F01-E5", "l'analyse échoue avant le paiement : aucun message, on continue, l'analyse est proposée dans l'espace", async (p) => {
    await p.route("**/api/scan", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: false, problem: "pas_de_visage", message: "On ne trouve pas de visage sur une des photos." }) }));
    await runTo(p, "id:construction");
    // les 3 petites questions de l'écran (si elles ne sont pas déjà répondues)
    for (let k = 0; k < 3; k++) { if (await p.getByRole("dialog").waitFor({ timeout: 8000 }).then(() => true, () => false)) await p.getByRole("dialog").getByRole("button", { name: "Oui" }).click(); }
    await p.locator("[data-tomail]:not([disabled])").waitFor({ timeout: 40000 });
    expect(/Voir mon résultat/.test(await p.locator("[data-tomail]").textContent()), "le bouton n'invite pas à voir son résultat");
    expect(!(await p.getByRole("alert").count()), "un message d'échec s'affiche encore");
    expect(!(await p.getByText(/pas abouti|pas de visage/).count()), "le texte d'échec est encore là");
    await p.locator("[data-tomail]").click();
    await runTo(p, "offre");
    expect(await p.getByText(/analyse de visage sur 15 critères, à faire dans ton espace/).count(), "l'analyse n'est pas proposée pour après le paiement");
    await pay(p);
    await p.getByRole("tab", { name: "Mon rapport" }).click();
    expect(await p.getByRole("link", { name: "Faire mon analyse" }).count(), "pas de bouton pour faire l'analyse dans l'espace");
  }, browser);

  await test("F01-E6", "grand écran (1440 px) : pas de défilement horizontal, colonne centrée", async (p) => {
    await runTo(p, "id:difficultes");
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, main: document.querySelector("main").getBoundingClientRect().width }));
    expect(r.sw <= r.w && r.main <= 480, JSON.stringify(r));
  }, browser, { width: 1440, height: 900 });

  await test("F01-E7", "e-mail long avec accents et + (demandé au paiement)", async (p) => {
    await runTo(p, "offre", { photos: false });
    await toPayForm(p);
    await p.getByLabel("Ton e-mail").fill("élodie.martin+" + "x".repeat(60) + "@exemple-tres-long-pour-voir.fr");
    await p.getByRole("button", { name: "Payer (test)" }).click();
    await p.getByRole("heading", { name: "Ton compte est créé." }).waitFor({ timeout: 10000 });
    expect(await p.getByText(/élodie\.martin\+x+@exemple/).count(), "l'adresse n'est pas affichée");
  }, browser);

  await test("F01-N1", "e-mail invalide au paiement : message sous le champ", async (p) => {
    await runTo(p, "offre", { photos: false });
    await toPayForm(p);
    await p.getByLabel("Ton e-mail").fill("prenom@");
    await p.getByRole("button", { name: "Payer (test)" }).click();
    expect(await p.getByText("Cette adresse ne semble pas complète.").isVisible(), "pas d'erreur");
  }, browser);

  await test("F01-N2", "payer sans cocher la renonciation : refusé avec un message", async (p) => {
    await runTo(p, "offre");
    await p.getByRole("button", { name: /Débloquer mon résultat, / }).click();
    expect(await p.getByRole("alert").filter({ hasText: "Coche la case" }).isVisible(), "pas de message");
    expect(!/\/app\//.test(p.url()), "paiement parti quand même");
  }, browser);

  await test("F01-P1", "page de paiement : vrai minuteur, vraies notes sans les noms, plan, garantie, prix écrit", async (p) => {
    await runTo(p, "offre");
    const timer = await p.textContent("#timer");
    expect(/^1[45]:\d\d$/.test(timer), "minuteur absent ou faux : " + timer);
    const text = (await p.textContent("main")).replace(/\s+/g, " ");
    expect(/Tu peux monter jusqu'à \d+\/100/.test(text), "le max n'est pas affiché (sur 100)");
    expect(/Satisfait ou remboursé/.test(text) && /5 jours sur les 7/.test(text), "garantie absente");
    expect(/17,98 €/.test(text) && /16,99 € par semaine/.test(text), "prix pas écrit en clair");
    expect(!/(Mâchoire|Symétrie|Peau|Posture)\b.*\/100/.test(text), "un nom de critère est visible à côté de sa note");
    expect((await p.locator(".module").count()) >= 3, "il manque des parties du programme");
    expect((await p.locator(".module__keys b").count()) >= 5, "il manque les titres concrets du plan");
    expect(!(await p.content()).includes("Cherche des ingrédients sur l'étiquette"), "le détail du plan est envoyé avant le paiement");
    await p.getByRole("button", { name: "Débloquer", exact: true }).click();
    await p.waitForTimeout(600);
    expect(await p.locator("#pay").evaluate((el) => el.getBoundingClientRect().top < innerHeight), "le bouton du bas ne mène pas au paiement");
  }, browser);

  await test("F02-H1", "sans photo (entrée par /q/) : plan d'après les réponses, pas de note", async (p) => {
    await p.goto(BASE + "/q/", { waitUntil: "networkidle" });
    await runTo(p, "offre", { photos: false });
    expect(!(await p.getByText("?,?").count()), "notes affichées sans scan");
    await pay(p);
    await p.getByRole("tab", { name: "Mon rapport" }).click();
    expect(await p.getByRole("link", { name: "Faire mon analyse" }).count(), "l'analyse n'est pas proposée dans l'espace");
  }, browser);

  await test("F03-H1", "moins de 18 ans : arrêt, rien de gardé", async (p) => {
    await p.getByRole("radio", { name: /Homme/ }).check({ force: true });
    await p.waitForTimeout(500);
    await p.getByText("Moins de 18 ans").click(); // un simple toucher (l'écran change aussitôt)
    await p.getByRole("heading", { name: "Réservé aux adultes" }).waitFor();
    const cookies = await p.context().cookies();
    expect(!cookies.some((c) => c.name === "lm_q"), "cookie du quiz encore là");
    await axe(p, "S03b");
  }, browser);

  await test("F04-H1", "connexion par code, mauvais code refusé, session expirée renvoie à la connexion", async (p) => {
    const email = `f04${Date.now()}@example.com`;
    await runTo(p, "offre", { photos: false });
    await pay(p, email);
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

  await test("F07-H1", "parcours femme : textes au féminin, pas de barbe, programmes et rapport adaptés", async (p) => {
    await p.locator("label.gcard").nth(1).click();
    await runTo(p, "offre");
    const offre = await p.textContent("main");
    expect(!/barbe/i.test(offre), "la page de paiement parle de barbe");
    await pay(p);
    fs.mkdirSync("replica/clone-screens/femme", { recursive: true });
    await p.screenshot({ path: "replica/clone-screens/femme/espace-rapport.png", fullPage: true });
    const rapport = await p.textContent("main");
    await p.getByRole("tab", { name: "Mon plan" }).click();
    await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    await p.screenshot({ path: "replica/clone-screens/femme/espace-plan.png", fullPage: true });
    const plan = await p.textContent("main");
    expect(/skincare/i.test(plan), "pas de routine skincare dans le plan d'une femme");
    for (const [where, txt] of [["rapport", rapport], ["plan", plan]]) {
      expect(!/barbe|tondeuse|pomme d'Adam|moustache/i.test(txt), `l'espace (${where}) parle de barbe`);
      expect(!/\b(convaincu|prêt à|seul face|gêné|transparent|réservé|Posé|Affirmé)\b/.test(txt), `masculin dans l'espace (${where})`);
    }
  }, browser);

  await browser.close();
  for (const [id, res, name] of results) console.log(`${res === "ok" ? "ok    " : "ÉCHEC "} ${id}  ${name}`);
  console.log(`\n${results.filter((r) => r[1] === "ok").length} / ${results.length} réussis`);
  if (AXE) console.log("\nAccessibilité (axe, WCAG A et AA) :\n" + ([...a11y].map(([k, v]) => `  ${k} : ${[...new Set(v)].join(", ")}`).join("\n") || "  aucun problème"));
  else console.log("\n(accessibilité non testée : passer le chemin de axe.min.js)");
  process.exit(results.every((r) => r[1] === "ok") ? 0 : 1);
})();
