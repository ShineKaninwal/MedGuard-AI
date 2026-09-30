import puppeteer from 'puppeteer-core';
import fs from 'fs';
// Set CHROME to the path of a Chrome or Chromium binary, e.g. CHROME=/usr/bin/chromium
export const CHROME = process.env.CHROME || '/usr/bin/chromium';
export const BASE = process.env.BASE || 'http://localhost:4173';
export const axeSrc = fs.readFileSync(new URL('./node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
export async function launch() {
  return puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}
export async function newPage(browser, { width = 1280, height = 900, mobile = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (['error'].includes(m.type())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  page.errors = errors;
  return page;
}
export const go = async (page, id) => { await page.evaluate((i) => { window.location.hash = '/' + i; }, id); await new Promise((r) => setTimeout(r, 450)); };
export async function axe(page) {
  await page.evaluate(axeSrc);
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].target.join(' ') + ' :: ' + (v.nodes[0].failureSummary || '').split('\n')[1] }));
  });
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
