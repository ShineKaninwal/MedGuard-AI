import { launch, newPage, go, axe, BASE, sleep } from './lib.mjs';
import fs from 'fs';
const navSrc = fs.readFileSync(new URL('../src/config/nav.js', import.meta.url), 'utf8');
const ROUTES = [...navSrc.matchAll(/id: '(\w+)'/g)].map((m) => m[1]).concat(['nonexistent']);
const b = await launch(); let bad = 0;
for (const [label, vp] of [['desktop', {}], ['mobile', { width: 375, height: 800, mobile: true }]]) {
  const p = await newPage(b, vp); await p.goto(BASE + '/#/dashboard'); await sleep(800);
  console.log('=====', label);
  for (const r of ROUTES) {
    await go(p, r); await sleep(250);
    const info = await p.evaluate(() => ({ h1: document.querySelector('h1')?.textContent?.slice(0, 40) || null, overflow: document.documentElement.scrollWidth - window.innerWidth, title: document.title }));
    const v = label === 'desktop' ? await axe(p) : [];
    const flag = !info.h1 || info.overflow > 0 || v.length;
    if (flag) bad++;
    console.log((flag ? 'XX ' : 'ok ') + r.padEnd(14), JSON.stringify(info), v.map((x) => `${x.id}(${x.n}) ${x.sample}`).join(' | '));
  }
  console.log('console errors:', p.errors.length, p.errors.slice(0, 5));
}
await b.close(); console.log('flagged:', bad);
