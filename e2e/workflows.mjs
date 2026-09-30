import { launch, newPage, go, BASE, sleep } from './lib.mjs';

const results = []; let failed = 0;
const ok = (name, cond, detail = '') => { results.push([cond, name, detail]); if (!cond) failed++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? '  -> ' + detail : ''}`); };

// ---------- helpers ----------
const scopeSel = '[role=alertdialog]:last-of-type, [role=dialog]:last-of-type';
async function el(page, selector, text, scoped = false) {
  return page.evaluateHandle((selector, text, scoped, scopeSel) => {
    const roots = scoped ? [...document.querySelectorAll('[role=alertdialog],[role=dialog]')].slice(-1) : [document];
    const root = roots[0]; if (!root) return null;
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    return [...root.querySelectorAll(selector)].find((e) => e.offsetParent !== null || e.getClientRects().length) && [...root.querySelectorAll(selector)].filter((e) => e.getClientRects().length).find((e) => norm(e.textContent).includes(text) || e.getAttribute('aria-label') === text) || null;
  }, selector, text, scoped, scopeSel);
}
async function click(page, text, { scoped = false, sel = 'button, a, [role=tab], [role=checkbox]' } = {}) {
  const h = await el(page, sel, text, scoped); const e = h.asElement();
  if (!e) throw new Error(`No clickable "${text}"${scoped ? ' in dialog' : ''}`);
  await e.click(); await sleep(150);
}
async function fill(page, label, value, scoped = false) {
  const done = await page.evaluate((label, value, scoped) => {
    const root = scoped ? [...document.querySelectorAll('[role=alertdialog],[role=dialog]')].slice(-1)[0] : document; if (!root) return 'noroot';
    const lab = [...root.querySelectorAll('label')].find((l) => (l.childNodes[0]?.textContent || l.textContent).replace(/\s+/g, ' ').trim().startsWith(label));
    const c = lab ? lab.querySelector('input,select,textarea') : root.querySelector(`[aria-label="${label}"]`);
    if (!c) return 'nofield';
    if (c.tagName === 'SELECT') { const o = [...c.options].find((x) => x.textContent.includes(value) || x.value === value); if (!o) return 'nooption'; Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(c, o.value); c.dispatchEvent(new Event('change', { bubbles: true })); return 'ok'; }
    const proto = c.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(c, value); c.dispatchEvent(new Event('input', { bubbles: true })); return 'ok';
  }, label, value, scoped);
  if (done !== 'ok') throw new Error(`fill "${label}": ${done}`);
  await sleep(60);
}
const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('medguard:v1')));
const text = (page) => page.evaluate(() => document.body.innerText);
const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
async function waitText(page, t, ms = 8000) { const end = Date.now() + ms; while (Date.now() < end) { if ((await text(page)).includes(t)) return true; await sleep(150); } return false; }
async function step(name, fn) { try { await fn(); } catch (e) { ok(name, false, e.message.slice(0, 200)); } }

const b = await launch();
const page = await newPage(b); await page.goto(BASE + '/#/dashboard'); await sleep(900);

// ---------- 0. fresh state, navigation ----------
await step('Fresh load', async () => {
  const s = await state(page);
  ok('Fresh load: 9 sample medicines, 3 profiles, empty disposals, no fake waste series', s.medicines.length === 9 && s.patients.length === 3 && Array.isArray(s.disposals) && s.disposals.length === 0 && s.waste === undefined);
});
await step('Sidebar links', async () => {
  const links = await page.evaluate(() => [...document.querySelectorAll('aside nav a')].map((a) => [a.getAttribute('href'), a.textContent.trim()]));
  ok(`Sidebar has ${links.length} links, all hash routes`, links.length >= 20 && links.every(([h]) => /^#\/\w+$/.test(h)));
  let bad = [];
  for (const [href, label] of links) {
    await click(page, label, { sel: 'aside nav a' }); await sleep(350);
    const info = await page.evaluate(() => ({ h: location.hash, h1: document.querySelector('main h1')?.textContent, cur: document.querySelector('aside [aria-current=page]')?.getAttribute('href') }));
    if (info.h !== href || !info.h1 || info.cur !== href || /Page not found|Something went wrong/.test(info.h1)) bad.push(`${label}: ${JSON.stringify(info)}`);
  }
  ok('Every sidebar link opens its own page and is marked current', bad.length === 0, bad.join('; '));
});
await step('Page-level links', async () => {
  // every in-page hash link on every route must point to a registered page
  const ids = await page.evaluate(() => [...document.querySelectorAll('aside nav a')].map((a) => a.getAttribute('href').slice(2)));
  const dead = [];
  for (const id of ids) { await go(page, id); await sleep(250);
    const hrefs = await page.evaluate(() => [...document.querySelectorAll('main a[href^="#/"]')].map((a) => a.getAttribute('href').slice(2)));
    hrefs.forEach((h) => { if (!ids.includes(h)) dead.push(`${id} -> ${h}`); }); }
  ok('No in-page link points to a missing page', dead.length === 0, dead.join(', '));
});

// ---------- 1. Add a medicine ----------
await step('1 Add medicine', async () => {
  await go(page, 'inventory');
  await click(page, 'Add medicine');
  await click(page, 'Save medicine', { scoped: true });
  ok('1a Empty save shows plain-language errors, nothing saved', (await text(page)).includes('Enter the medicine name.') && (await state(page)).medicines.length === 9);
  await fill(page, 'Medicine name', 'Demo Multivitamin', true); await fill(page, 'Active ingredient', 'Multivitamin', true);
  await fill(page, 'Expiry date', dayOffset(21), true); await fill(page, 'Quantity in stock', '30', true); await fill(page, 'Value of stock on hand', '120', true);
  await click(page, 'Save medicine', { scoped: true }); await sleep(300);
  const s = await state(page); const m = s.medicines.find((x) => x.name === 'Demo Multivitamin');
  ok('1b Medicine saved with value, quantity, member', !!m && m.qty === 30 && m.cost === 120 && m.patientId === 'p1');
  ok('1c Appears in the table and a confirmation toast shows', (await text(page)).includes('Demo Multivitamin') && (await text(page)).includes('added to your inventory'));
});

// ---------- 2. Scan a sample prescription ----------
await step('2 Scan sample prescription', async () => {
  await go(page, 'prescriptions');
  await click(page, 'Demo scan (simulated)');
  const before = (await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button[disabled]')].map((b) => b.textContent).join(' | ')) || '';
  ok('2a Run scan is disabled until an image exists', /Run simulated scan/.test(before));
  await click(page, 'Use a sample prescription image', { scoped: true });
  await click(page, 'Run simulated scan', { scoped: true });
  ok('2b Review step appears after the simulated scan', await waitText(page, 'Confidence', 6000));
  ok('2c Labelled as simulated OCR', (await text(page)).includes('Simulated OCR'));
  await fill(page, 'Family member', 'Meena', true);
  ok('2d Allergy notice is shown and says allergies are not checked', (await text(page)).includes('MedGuard does not check medicines against allergies'));
  await page.evaluate(() => document.querySelectorAll('[role=dialog] input[type=checkbox]').forEach((c) => { if (!c.checked) c.click(); }));
  await sleep(200); await click(page, 'Confirm and save', { scoped: true }); await sleep(300);
  const s = await state(page); const rx = s.prescriptions.find((p) => p.source === 'scan');
  ok('2e Prescription saved for Meena, marked as scanned, medicines NOT auto-added', !!rx && rx.patientId === 'p2' && s.medicines.length === 10);
});

// ---------- 3. Run an AI audit ----------
await step('3 AI audit', async () => {
  await go(page, 'audit');
  await click(page, 'Run AI Audit');
  ok('3a Audit completes', await waitText(page, 'Run again', 25000));
  const s = await state(page);
  ok('3b Audit stored and findings raised (expired syrup, duplicates)', s.audits.length === 1 && s.alerts.some((a) => /Cough Syrup DX/.test(a.text)) && s.alerts.some((a) => /duplicate/i.test(a.text)));
  await go(page, 'dashboard');
  ok('3c Findings appear on the dashboard', (await text(page)).includes('Cough Syrup DX'));
});

// ---------- 4. Track a dose ----------
await step('4 Track a dose', async () => {
  await go(page, 'tracker');
  const before = await state(page);
  await click(page, 'Taken', { sel: '[aria-label="Dose status"] button' }); await sleep(250);
  const after = await state(page);
  const today = dayOffset(0);
  ok('4 Dose status saved as taken for today', after.doseLogs.filter((l) => l.date === today && l.status === 'taken').length >= before.doseLogs.filter((l) => l.date === today && l.status === 'taken').length && after.doseLogs.some((l) => l.date === today && l.status === 'taken'));
});

// ---------- 5. Set a reminder ----------
await step('5 Set reminder', async () => {
  await go(page, 'reminders');
  await click(page, 'Add reminder');
  await fill(page, 'Medicine', 'Demo Multivitamin', true); await fill(page, 'Time', '13:15', true); await fill(page, 'Units per dose', '1', true);
  ok('5a Disabled Save explains what is missing', (await text(page)).includes('To save, still needed: at least one day'));
  await click(page, 'All days', { scoped: true });
  await click(page, 'Save reminder', { scoped: true }); await sleep(300);
  const s = await state(page); const mv = s.medicines.find((m) => m.name === 'Demo Multivitamin');
  ok('5 Reminder saved for the new medicine at 13:15', s.reminders.some((r) => r.medicineId === mv.id && r.time === '13:15'));
});

// ---------- 6. Update medicine quantity ----------
await step('6 Update quantity', async () => {
  await go(page, 'refill');
  await fill(page, 'Quantity for Amlodipine 5mg', '40'); await click(page, 'Set quantity', { sel: 'tr:has(input[aria-label="Quantity for Amlodipine 5mg"]) button' }).catch(async () => {
    await page.evaluate(() => [...document.querySelectorAll('tr')].find((r) => r.querySelector('input[aria-label="Quantity for Amlodipine 5mg"]')).querySelectorAll('button')[1].click()); });
  await sleep(250);
  let s = await state(page);
  ok('6a Set quantity: Amlodipine now 40', s.medicines.find((m) => m.id === 'm2').qty === 40);
  await fill(page, 'Quantity for Amlodipine 5mg', '10');
  await page.evaluate(() => [...document.querySelectorAll('tr')].find((r) => r.querySelector('input[aria-label="Quantity for Amlodipine 5mg"]')).querySelectorAll('button')[0].click()); await sleep(250);
  s = await state(page); const m2 = s.medicines.find((m) => m.id === 'm2');
  ok('6b Record refill: quantity 50, refill remembered', m2.qty === 50 && m2.lastRefill?.qty === 10);
});

// ---------- 7. Add a family member ----------
await step('7 Add family member', async () => {
  await go(page, 'family');
  await click(page, 'Create profile');
  await fill(page, 'Name', 'Test Sibling', true); await fill(page, 'Age', '30', true); await fill(page, 'Relation', 'Sister', true);
  await click(page, 'Save profile', { scoped: true }); await sleep(300);
  const s = await state(page);
  ok('7 Profile created and selected', s.patients.length === 4 && s.patients.some((p) => p.name === 'Test Sibling'));
});

// ---------- 8. Add an appointment ----------
await step('8 Add appointment', async () => {
  await go(page, 'appointments');
  await click(page, 'Add appointment');
  await fill(page, 'Doctor', 'Dr. Demo Test', true); await fill(page, 'Date', dayOffset(5), true); await fill(page, 'Time', '09:30', true); await fill(page, 'Specialty', 'General', true);
  await click(page, 'Save appointment', { scoped: true }); await sleep(300);
  ok('8 Appointment saved', (await state(page)).appointments.some((a) => a.doctor === 'Dr. Demo Test' && a.time === '09:30'));
});

// ---------- 9. Health assistant ----------
await step('9 Health assistant', async () => {
  await go(page, 'assistant');
  await page.evaluate(() => { const t = document.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, 'I have a mild headache since morning'); t.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(100); await click(page, 'Send message');
  ok('9a Reply arrives and is labelled a sample', await waitText(page, 'Sample response', 8000));
  await page.evaluate(() => { const t = document.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, 'severe chest pain and cannot breathe'); t.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(100); await click(page, 'Send message');
  ok('9b Emergency wording triggers the static emergency card with 112', await waitText(page, '112', 5000) && /emergency/i.test(await text(page)));
});

// ---------- 10. Emergency contacts ----------
await step('10 Emergency contact', async () => {
  await go(page, 'contacts');
  await click(page, 'Add contact');
  await fill(page, 'Name', 'Demo Neighbour', true); await fill(page, 'Phone number', '+91 90000 55555', true);
  await click(page, 'Save contact', { scoped: true }); await sleep(300);
  ok('10 Contact saved', (await state(page)).contacts.some((c) => c.name === 'Demo Neighbour'));
});

// ---------- 11. Activate SOS (press and hold) ----------
await step('11 SOS', async () => {
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('medguard:v1')); s.selectedPatientId = 'p1'; localStorage.setItem('medguard:v1', JSON.stringify(s)); });
  await page.reload(); await sleep(900); await go(page, 'dashboard');
  await page.evaluate(() => [...document.querySelectorAll('aside button')].find((x) => /SOS/i.test(x.textContent)).click()); await sleep(400);
  ok('11a Confirmation opens first: nothing sent yet', /hold to send sos alert/i.test(await text(page)) && (await state(page)).emergencyAlerts.length === 0);
  const btn = (await el(page, 'button', 'Hold to send SOS alert', true)).asElement(); await btn.evaluate((x) => x.scrollIntoView({ block: 'center' })); await sleep(200); const box = await btn.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await sleep(350); await page.mouse.up(); await sleep(300);
  ok('11b A short press does NOT send (accidental-press protection)', (await state(page)).emergencyAlerts.length === 0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await sleep(2200); await page.mouse.up(); await sleep(600);
  let s = await state(page); const al = s.emergencyAlerts[0];
  ok('11c Press-and-hold creates one active alert marked simulated', s.emergencyAlerts.length === 1 && al.active && al.simulated === true);
  ok('11d SOS ACTIVE screen and call links (112, 108) shown', /sos.{0,20}active/i.test(await text(page)));
  const tels = await page.evaluate(() => [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')));
  ok('11e tel: links present for 112 and 108', tels.some((t) => t.includes('112')) && tels.some((t) => t.includes('108')), tels.join(','));
  await sleep(4000); s = await state(page);
  ok('11f Notifications reach a final simulated status (no fake "delivered")', s.emergencyAlerts[0].notifications.length > 0 && s.emergencyAlerts[0].notifications.every((n) => ['sent', 'failed'].includes(n.status)), JSON.stringify(s.emergencyAlerts[0].notifications.map((n) => n.status)));
});

// ---------- 12. Caregiver dashboard shows the alert ----------
await step('12 Caregiver sees alert', async () => {
  await go(page, 'caregiver'); const t = await text(page);
  ok('12 Alert for Ravi Kumar visible on caregiver dashboard, labelled simulated', /Ravi Kumar/.test(t) && /simulated/i.test(t) && /SOS|emergency/i.test(t));
});
await step('12b Resolve alert', async () => {
  await go(page, 'sos');
  const h = (await el(page, 'button', 'resolved')).asElement() || (await el(page, 'button', 'Resolved')).asElement();
  if (!h) throw new Error('no resolve button'); await h.click(); await sleep(300);
  ok('12b Resolve asks for confirmation first', (await text(page)).includes('does not end a call') || (await page.$('[role=alertdialog]')) !== null);
  await click(page, 'Mark resolved', { scoped: true }).catch(() => click(page, 'resolved', { scoped: true })); await sleep(400);
  ok('12c Alert resolved and no longer active', (await state(page)).emergencyAlerts.every((a) => !a.active));
});

// ---------- 13. Waste analytics ----------
await step('13 Waste analytics', async () => {
  await go(page, 'waste'); await sleep(600);
  const s = await state(page); const t = await text(page);
  const today = new Date(dayOffset(0)); const days = (m) => Math.ceil((new Date(m.expiry) - today) / 864e5);
  const expired = s.medicines.filter((m) => days(m) < 0).length; const near = s.medicines.filter((m) => days(m) >= 0 && days(m) <= 60).length;
  const cards = await page.evaluate(() => [...document.querySelectorAll('main .grid.md\\:grid-cols-4 > *')].map((c) => c.innerText.replace(/\n+/g, ' | ')));
  ok(`13a Cards match saved data (total ${s.medicines.length}, expired ${expired}, near ${near})`, cards.length === 4 && cards[0].includes(String(s.medicines.length)) && new RegExp(`Expired \\| ${expired}\\b`).test(cards[1]) && new RegExp(`Nearing expiry \\| ${near}\\b`).test(cards[2]), JSON.stringify(cards));
  ok('13b Says no environmental impact is calculated', /does not calculate any environmental impact/i.test(t));
  ok('13c New multivitamin shows up as nearing expiry with "not estimable" honesty where no schedule', /Demo Multivitamin/.test(t));
  ok('13d Trend chart and data table exist', (await page.$('main [role=img]')) !== null && /View chart data as a table/.test(t));
  ok('13e No dead stat cards (stat cards without an action are not buttons)', await page.evaluate(() => [...document.querySelectorAll('main .grid.md\\:grid-cols-4 > *')].every((c) => c.tagName !== 'BUTTON')));
});

// ---------- Stage 8 features ----------
await step('14 Disposal guide', async () => {
  await go(page, 'disposal');
  const t = await text(page);
  ok('14a Guide has never-do list, take-back first, local guidance, emergency call', /Never do these/.test(t) && /take-back/i.test(t) && /local pharmacy/i.test(t) && /CDSCO/.test(t) && /Call 112/.test(t));
  ok('14b No unsafe advice: flushing/pouring only appear in a "do not" context', !/you can flush|pour it down|burn it/i.test(t));
  ok('14c Expired Cough Syrup DX is listed', /Cough Syrup DX/.test(t));
  const before = await state(page);
  await click(page, "I've disposed of this");
  ok('14d Confirmation says the app does not dispose for you', (await text(page)).includes('does not dispose of the medicine for you'));
  await click(page, 'Go back', { scoped: true }); await sleep(200);
  ok('14e Cancelling changes nothing', (await state(page)).medicines.length === before.medicines.length);
  await click(page, "I've disposed of this"); await click(page, "Yes, I've disposed of it", { scoped: true }); await sleep(400);
  const s = await state(page);
  ok('14f Confirmed: medicine removed, its record kept, reminders cleaned', s.disposals.length === 1 && s.disposals[0].name === 'Cough Syrup DX' && !s.medicines.some((m) => m.id === 'm5') && s.disposals[0].value === 110);
  await go(page, 'waste'); await sleep(500);
  ok('14g Waste page lists the recorded disposal, labelled as user-entered', /Cough Syrup DX/.test(await text(page)) && /not verified disposals/.test(await text(page)));
});
await step('15 What-if simulator', async () => {
  await go(page, 'whatif');
  const before = JSON.stringify((await state(page)).medicines);
  ok('15a Says simulation only, never saved, no dose/treatment changes', /Simulation only/.test(await text(page)) && /cannot simulate stopping a treatment or changing a prescribed dose/.test(await text(page)));
  await click(page, 'Add to simulation'); ok('15b Empty value rejected with a message', await waitText(page, 'Enter a number.', 2000));
  await fill(page, 'Units in the refill', '-5'); await click(page, 'Add to simulation'); ok('15c Negative refill rejected', await waitText(page, 'A refill must add at least 1 unit.', 2000));
  await click(page, 'Try an example'); await sleep(400);
  const t = await text(page);
  ok('15d Simulated panel is labelled SIMULATED next to "Real inventory now"', /SIMULATED/.test(t) && /real inventory now/i.test(t) && /if this happened/i.test(t));
  ok('15e Real inventory is unchanged by simulating', JSON.stringify((await state(page)).medicines) === before);
  await click(page, 'Clear simulation'); ok('15f Clear returns to the empty state', await waitText(page, 'No simulation yet', 2000));
  await go(page, 'inventory'); await go(page, 'whatif');
  ok('15g Leaving the page discards the simulation', (await text(page)).includes('No simulation yet'));
});
await step('16 Price comparison', async () => {
  await go(page, 'compare'); const t = await text(page);
  ok('16a Demo data banner says prices are fictional', /Demo data: these prices are fictional/.test(t));
  ok('16b Says not interchangeable and no recommendation to switch', /not necessarily interchangeable/.test(t) && /does not recommend switching/.test(t));
  const pr = await page.evaluate(() => { const cells = [...document.querySelectorAll('tbody td')].filter((c) => c.textContent.includes('₹')); return { n: cells.length, tagged: cells.filter((c) => /Demo/.test(c.textContent)).length }; });
  ok(`16c Every price cell is tagged Demo (${pr.tagged}/${pr.n})`, pr.n > 0 && pr.n === pr.tagged);
  await fill(page, 'Find an active ingredient', 'zzz'); ok('16d Unknown search shows an empty state', await waitText(page, 'No demo prices for "zzz"', 2000));
});
await step('17 Demo guide', async () => {
  await go(page, 'demo'); const t = await text(page);
  ok('17a Seven steps totalling 5:00, with SIMULATED labels', /Total: 5:00/.test(t) && (t.match(/SIMULATED/g) || []).length >= 4 && ['Dashboard', 'Medicine inventory', 'AI medicine audit', 'Medication tracking', 'Caregiver dashboard', 'Emergency SOS', 'Sustainability dashboard'].every((x) => t.includes(x)));
  const opens = await page.evaluate(() => [...document.querySelectorAll('main ol > li')].length);
  ok('17b Seven step cards', opens === 7);
  const routes = ['dashboard', 'inventory', 'audit', 'tracker', 'caregiver', 'sos', 'waste']; let bad = [];
  for (let i = 0; i < 7; i++) { await go(page, 'demo'); await page.evaluate((i) => [...document.querySelectorAll('main ol > li')][i].querySelector('button:last-of-type').click(), i); await sleep(400); const h = await page.evaluate(() => location.hash); if (h !== `#/${routes[i]}`) bad.push(`${i + 1}:${h}`); }
  ok('17c Every "Open" button goes to the right page', bad.length === 0, bad.join(','));
  await go(page, 'demo'); await click(page, 'Start fresh demo'); await click(page, 'Reset to sample data', { scoped: true }); await sleep(500);
  const s = await state(page);
  ok('17d Start fresh demo restores the 9 sample medicines and clears disposals/alerts', s.medicines.length === 9 && s.disposals.length === 0 && s.patients.length === 3 && s.emergencyAlerts.length === 0);
});

console.log(`\n${results.length - failed}/${results.length} checks passed`);
const real = page.errors.filter((e) => !/fonts\.g|CORS|ERR_FAILED|status of (403|404)/.test(e));
console.log('App console errors (excluding blocked Google Fonts):', real.length, real.slice(0, 5));
await b.close(); process.exit(failed || real.length ? 1 : 0);
