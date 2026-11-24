const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errs=[]; p.on('console', m => m.type()==='error' && errs.push(m.text())); p.on('requestfailed', r=>errs.push('FAIL '+r.url()));
  await p.goto(process.argv[2], { waitUntil: 'networkidle' });
  await p.screenshot({ path: process.argv[3], fullPage: true });
  console.log('errors:', errs.length ? errs : 'none', 'fonts:', await p.evaluate(()=>[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family).join(',')));
  await b.close();
})();
