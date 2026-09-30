import { launch, newPage, go, BASE, sleep } from './lib.mjs';
let failed = 0; const ok = (n, c, d = '') => { if (!c) failed++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${!c && d ? ' -> ' + d : ''}`); };
const b = await launch();

// ---- mobile: drawer + modals
{ const p = await newPage(b, { width: 375, height: 800, mobile: true }); await p.goto(BASE + '/#/dashboard'); await sleep(900);
  const hidden = await p.evaluate(() => getComputedStyle(document.querySelector('aside')).visibility);
  ok('M1 Closed drawer is hidden from keyboard/screen readers', hidden === 'hidden', hidden);
  await p.click('button[aria-label="Open menu"]'); await sleep(400);
  ok('M2 Drawer opens and focus moves inside it', await p.evaluate(() => document.querySelector('aside').contains(document.activeElement)));
  await p.keyboard.press('Escape'); await sleep(400);
  ok('M3 Escape closes the drawer', await p.evaluate(() => getComputedStyle(document.querySelector('aside')).visibility) === 'hidden');
  await p.click('button[aria-label="Open menu"]'); await sleep(400);
  await p.evaluate(() => document.querySelector('aside a[href="#/waste"]').click()); await sleep(600);
  ok('M4 Choosing a page closes the drawer and opens it', await p.evaluate(() => location.hash === '#/waste' && getComputedStyle(document.querySelector('aside')).visibility === 'hidden'));
  for (const [route, btn] of [['inventory', 'Add medicine'], ['reminders', 'Add reminder'], ['appointments', 'Add appointment'], ['contacts', 'Add contact']]) {
    await go(p, route); await p.evaluate((t) => [...document.querySelectorAll('button')].find((x) => x.textContent.includes(t)).click(), btn); await sleep(400);
    const o = await p.evaluate(() => { const d = document.querySelector('[role=dialog]'); return { page: document.documentElement.scrollWidth - innerWidth, dlg: d.scrollWidth - d.clientWidth }; });
    ok(`M5 ${route} modal fits 375px (no sideways scroll)`, o.page <= 0 && o.dlg <= 0, JSON.stringify(o));
    await p.keyboard.press('Escape'); await sleep(200);
  }
  await p.close(); }

// ---- desktop keyboard/focus, motion
{ const p = await newPage(b); await p.goto(BASE + '/#/dashboard'); await sleep(900);
  ok('K1 Skip link is first tab stop', await (async () => { await p.keyboard.press('Tab'); return p.evaluate(() => document.activeElement.className.includes('skip-link')); })());
  await go(p, 'inventory'); await sleep(300);
  ok('K2 Focus moves to main content after navigating', await p.evaluate(() => document.activeElement.id === 'main-content'));
  await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Add medicine')).focus());
  await p.keyboard.press('Enter'); await sleep(300);
  ok('K3 Modal takes focus', await p.evaluate(() => !!document.querySelector('[role=dialog]')?.contains(document.activeElement)));
  await p.keyboard.press('Escape'); await sleep(300);
  ok('K4 Escape closes modal and returns focus to its button', await p.evaluate(() => !document.querySelector('[role=dialog]') && document.activeElement.textContent.includes('Add medicine')));
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await go(p, 'waste'); await sleep(300);
  ok('K5 Reduced motion switches page animation off', await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.page-in')).animationDuration) < 0.01));
  await p.close(); }

// ---- data safety: upgrade from Stage 7 data, corrupt storage
{ const p = await newPage(b); await p.goto(BASE + '/#/dashboard'); await sleep(800);
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('medguard:v1')); delete s.disposals; s.waste = [{ month: 'Apr', expired: 1, unused: 1 }]; s.medicines = s.medicines.map((m) => { const { cost, ...r } = m; return r; }); localStorage.setItem('medguard:v1', JSON.stringify(s)); });
  await p.reload(); await sleep(900);
  const s = await p.evaluate(() => JSON.parse(localStorage.getItem('medguard:v1')));
  ok('D1 Stage-7 data upgrades: disposals added, old waste series dropped', Array.isArray(s.disposals) && s.waste === undefined);
  await go(p, 'waste'); await sleep(500);
  ok('D2 Waste page works when medicines have no recorded value', await p.evaluate(() => !!document.querySelector('main h1') && /without a value/.test(document.body.innerText)));
  await p.evaluate(() => localStorage.setItem('medguard:v1', '{not json')); await p.reload(); await sleep(900);
  ok('D3 Corrupted storage falls back to sample data instead of a blank screen', await p.evaluate(() => !!document.querySelector('main h1') && JSON.parse(localStorage.getItem('medguard:v1')).medicines.length === 9));
  await p.evaluate(() => localStorage.setItem('medguard:v1', JSON.stringify({ medicines: null }))); await p.reload(); await sleep(900);
  ok('D4 Structurally broken data also recovers', await p.evaluate(() => !!document.querySelector('main h1')));
  await p.evaluate(() => { location.hash = '/nope'; }); await sleep(400);
  ok('D5 Unknown address shows Page not found with a way back', await p.evaluate(() => /Page not found/.test(document.body.innerText) && !!document.querySelector('main a[href="#/dashboard"]')));
  await p.close(); }

// ---- dead-button scan: click every safe button on every page; something must change
{ const p = await newPage(b); await p.goto(BASE + '/#/dashboard'); await sleep(800);
  const ids = await p.evaluate(() => [...document.querySelectorAll('aside nav a')].map((a) => a.getAttribute('href').slice(2)));
  const SKIP = /delete|remove|reset|clear|hold|send|sos|dispose|resolve|cancel alert|call|start fresh|enable notif|save|confirm|run ai audit|run again|try again|upload|use a sample|scan/i;
  const dead = []; let clicked = 0;
  for (const id of ids) {
    await go(p, id); await sleep(300);
    const n = await p.evaluate(() => document.querySelectorAll('main button').length);
    for (let i = 0; i < n; i++) {
      const r = await p.evaluate((i) => { const bt = document.querySelectorAll('main button')[i]; if (!bt) return null; const label = (bt.getAttribute('aria-label') || bt.textContent).trim(); return { label, dis: bt.disabled, sel: bt.getAttribute('aria-pressed') === 'true' || bt.getAttribute('aria-selected') === 'true' || bt.getAttribute('aria-current') === 'true' }; }, i);
      if (!r || r.dis || r.sel || !r.label || SKIP.test(r.label)) continue;
      const before = await p.evaluate(() => document.body.innerHTML.length + '|' + location.hash + '|' + document.querySelectorAll('[role=dialog],[role=alertdialog]').length + '|' + [...document.querySelectorAll('[aria-pressed],[aria-selected],[aria-expanded]')].map((e) => e.getAttribute('aria-pressed') + e.getAttribute('aria-selected') + e.getAttribute('aria-expanded')).join(''));
      await p.evaluate((i) => document.querySelectorAll('main button')[i].click(), i); await sleep(250);
      const after = await p.evaluate(() => document.body.innerHTML.length + '|' + location.hash + '|' + document.querySelectorAll('[role=dialog],[role=alertdialog]').length + '|' + [...document.querySelectorAll('[aria-pressed],[aria-selected],[aria-expanded]')].map((e) => e.getAttribute('aria-pressed') + e.getAttribute('aria-selected') + e.getAttribute('aria-expanded')).join(''));
      clicked++; if (before === after) dead.push(`${id}: "${r.label}"`);
      await p.keyboard.press('Escape'); await sleep(100);
      if ((await p.evaluate(() => location.hash)) !== '#/' + id) await go(p, id);
    }
  }
  ok(`X1 Dead-button scan: ${clicked} buttons clicked, none inert`, dead.length === 0, dead.join('; ')); }

console.log('errors:', failed); await b.close(); process.exit(failed ? 1 : 0);
