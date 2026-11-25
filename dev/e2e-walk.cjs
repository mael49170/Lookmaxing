// Parcours complet du quiz en local (mode essai), avec une capture par écran dans replica/clone-screens/.
// node dev/e2e-walk.cjs [variante a|b] [photos|sans]
// La caméra est simulée par Chromium (fausse vidéo), comme un vrai téléphone.
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const variant = process.argv[2] || "a";
  const photos = process.argv[3] !== "sans";
  const b = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"], reducedMotion: "reduce" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("console", (m) => m.type() === "error" && !/status of 4\d\d/.test(m.text()) && errs.push(m.text()));
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`http://localhost:8788/q/?v=${variant}&utm_source=test`, { waitUntil: "networkidle" });
  const shot = (name) => p.screenshot({ path: path.join("replica/clone-screens", `${name}.png`) });
  const cur = () => p.evaluate(async () => { const i = JSON.parse(sessionStorage.getItem("lm_quiz_v1") || "{}").i || 0; const s = (await import("/shared/questions.js")).SCREENS[i]; return { i, id: s.id, sid: s.sid, type: s.type }; });
  let last = "", same = 0;
  for (let n = 0; n < 90; n++) {
    await p.waitForTimeout(450);
    const s = await cur();
    const key = s.id + (await p.locator("[data-keep]").count()) + (await p.locator("[data-shoot]").count());
    if (key === last) { if (++same > 30) throw new Error("bloqué sur " + s.id); } else same = 0;
    last = key;
    if (same === 0) { await shot(`${s.sid}-${s.id}${variant === "b" && s.i === 0 ? "-b" : ""}`); console.log(s.sid, s.id, "|", (await p.locator("h1").first().textContent().catch(() => "")).trim().slice(0, 70)); }
    if (s.id === "offre") break;
    if (s.id === "photos") {
      if (!photos) { await p.click("[data-noscan]"); continue; }
      if (await p.locator("[data-shoot]").count()) { await p.waitForTimeout(800); await p.click("[data-shoot]"); await p.waitForTimeout(300); await shot(`${s.sid}-photos-review`); continue; }
      if (await p.locator("[data-keep]").count()) { await p.click("[data-keep]"); continue; }
      throw new Error("caméra indisponible (écran de secours)");
    }
    if (s.id === "consentement") { await p.click(photos ? "[data-consent=yes]" : "[data-consent=no]"); continue; }
    if (s.id === "selfies" && !photos) { await p.click("[data-noscan]"); continue; }
    if (s.id === "email") { await p.fill("#email", `walk${Date.now()}@example.com`); await p.click("button[type=submit]"); continue; }
    if (s.id === "construction") {
      for (let k = 0; k < 3; k++) { await p.locator("[data-sheet]").first().waitFor({ timeout: 20000 }); if (k === 0) await shot(`${s.sid}-construction-question`); await p.locator("[data-sheet][data-v='1']").click(); }
      await p.locator("[data-tomail]:not([disabled])").waitFor({ timeout: 40000 });
      await shot(`${s.sid}-construction-fin`); await p.click("[data-tomail]"); continue;
    }
    if (s.type === "projection") { await p.locator(".screen__footer .btn--primary:not([disabled])").waitFor({ timeout: 40000 }); await shot(`${s.sid}-projection`); await p.click(".screen__footer .btn--primary"); continue; }
    const radios = p.locator("label.option--radio");
    if (await radios.count()) {
      const opts = await radios.allTextContents();
      const k = opts.findIndex((t) => !/Moins de 18/.test(t));
      await radios.nth(Math.min(opts.length - 1, k + (s.id === "morpho" ? 1 : 0))).click();
      if (await p.locator("[data-confirm]").count()) { await p.waitForTimeout(100); await p.click("[data-confirm]"); }
      continue;
    }
    const checks = p.locator("label.option:not(.option--radio)");
    if (await checks.count()) { await checks.nth(0).click(); await checks.nth(1).click().catch(() => {}); await p.click("[data-multi]"); continue; }
    await p.locator(".screen__footer .btn--primary").first().click();
  }
  await p.waitForTimeout(1500);
  await p.screenshot({ path: "replica/clone-screens/S51-offre-full.png", fullPage: true });
  console.log("erreurs console :", errs.length ? errs : "aucune");
  await b.close();
})();
