// Parcours complet du quiz en local (mode essai), avec une capture par écran dans replica/clone-screens/.
// node dev/e2e-walk.cjs [variante a|b] [photo.jpg]
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const variant = process.argv[2] || "a";
  const photo = process.argv[3];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`http://localhost:8788/q/?v=${variant}&utm_source=test`, { waitUntil: "networkidle" });
  const shot = async (name) => p.screenshot({ path: path.join("replica/clone-screens", `${name}.png`) });
  const sid = async () => p.evaluate(() => JSON.parse(sessionStorage.getItem("lm_quiz_v1") || "{}").i);
  const ids = ["S01","S02","S03","S04","S05","S06","S07","S08","S09","S10","S11","S12","S13","S14","S15","S16","S17","S18","S19","S20","S21","S22","S23","S24","S25","S26"];
  for (let n = 0; n < 40; n++) {
    await p.waitForTimeout(400);
    const i = (await sid()) ?? 0;
    const h1 = (await p.locator("h1").first().textContent().catch(() => "")).trim();
    const name = ids[i] + (variant === "b" && i === 0 ? "b" : "");
    await shot(name);
    console.log(name, "|", h1);
    if (ids[i] === "S26") break;
    if (await p.locator("input[data-shot]").count()) {
      if (photo) {
        await p.locator('input[data-shot="face"]').setInputFiles(photo);
        await p.waitForTimeout(500);
        await p.locator('input[data-shot="profil"]').setInputFiles(photo);
        await p.waitForTimeout(500);
        await shot("S07-filled");
        await p.click("[data-scan]");
      } else await p.click("[data-noscan]");
      continue;
    }
    if (await p.locator("[data-consent=yes]").count()) { await p.click(photo ? "[data-consent=yes]" : "[data-consent=no]"); continue; }
    if (await p.locator("#mail-form").count()) {
      await p.click("button[type=submit]"); await p.waitForTimeout(200); await shot("S25-error");
      await p.fill("#email", "test@example.com"); await p.click("button[type=submit]"); continue;
    }
    if (await p.locator("[data-tomail]").count()) {
      for (let k = 0; k < 2; k++) { await p.locator("[data-sheet]").first().waitFor({ timeout: 15000 }); if (k === 0) await shot("S24-sheet"); await p.locator("[data-sheet][data-v='1']").click(); }
      await p.locator("[data-tomail]:not([disabled])").waitFor({ timeout: 30000 });
      await shot("S24-done"); await p.click("[data-tomail]"); continue;
    }
    const radios = p.locator("label.option--radio");
    if (await radios.count()) {
      const opts = await radios.allTextContents();
      const k = opts.findIndex((t) => !/Moins de 18/.test(t)) ;
      await radios.nth(k >= 0 ? k : 0).click();
      if (await p.locator("[data-confirm]").count()) { await p.waitForTimeout(100); await p.click("[data-confirm]"); }
      continue;
    }
    const checks = p.locator("label.option:not(.option--radio)");
    if (await checks.count()) { await checks.nth(0).click(); await checks.nth(1).click().catch(() => {}); await p.click("[data-multi]"); continue; }
    await p.locator(".screen__footer .btn--primary").first().click();
  }
  // paiement d'essai
  await p.click("[data-pay]"); await p.waitForTimeout(300); await shot("S26-error");
  await p.check("#waiver"); await p.click("[data-pay]");
  await p.waitForURL(/\/app\//, { timeout: 10000 });
  await p.waitForSelector(".tabs"); await p.waitForTimeout(300);
  await p.screenshot({ path: "replica/clone-screens/S28.png", fullPage: true });
  await p.click("[data-tab=plan]"); await p.waitForTimeout(200);
  await p.locator("input[data-task]").first().check(); await p.waitForTimeout(400);
  await p.screenshot({ path: "replica/clone-screens/S29.png", fullPage: true });
  console.log("app:", (await p.locator("h1").first().textContent()).trim());
  console.log("erreurs console :", errs.length ? errs : "aucune");
  await b.close();
})();
