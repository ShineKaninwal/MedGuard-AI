<<<<<<< HEAD
# MedGuard AI

A prototype for managing a family's medicines. **All sample people, medicines, phone numbers and prices are fictional.** Data is stored in this browser only. Not clinically or legally reviewed; not a medical device.

## Install and run
Requires Node.js 18 or newer.
```
npm install
npm run dev        # development server, http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build, http://localhost:4173
```
Page fonts load from Google Fonts; without internet the app falls back to system fonts.

## Tests
`npm test` runs the unit tests for the agent tools and the audit pipeline (plain Node).

## Browser tests (optional)
A browser test suite lives in `e2e/`. It needs a Chrome or Chromium binary and the app running on port 4173 (`npm run build && npm run preview`).
```
cd e2e && npm install
CHROME=/path/to/chromium npm run all     # or: routes | workflows | extra
```
- `routes`: every page on desktop and a 375px phone: heading present, no sideways scroll, axe accessibility scan.
- `workflows`: add medicine, run the simulated demo scan on a sample prescription, audit, dose, reminder, quantity, family member, appointment, assistant, contact, SOS (press and hold), caregiver alert, waste analytics, disposal, what-if, price comparison, demo reset.
- `extra`: mobile drawer and modals, keyboard and focus, reduced motion, upgrading old saved data, corrupted storage, and a scan that clicks every safe button to find dead ones.

Add pages in `src/pages`, register them in `src/App.jsx` (`PAGES`) and `src/config/nav.js`.

## Demo
See `DEMO.md`, or open **Demo Guide** in the app (`#/demo`).


## Stage 10: forest, emerald and ivory redesign
Visual redesign only. No logic, data handling, safety rule or route was changed.
- **Palette** lives in `tailwind.config.js`. The old token names (`navy`, `teal`, `mint`, `ivory`, `slate`, `amber`, `coral`, `red`) were kept and given new values, so every page recolours without code changes: `navy` = deep forest #123B32 (important sections, selected navigation), `teal` = emerald (primary buttons, positive indicators; the button shade is a touch deeper than #16876B, #127A61, so white text passes 4.5:1), `mint` = soft sage #DCE9DF, `ivory` = warm ivory #F8F5EC (page background), `slate` = warm charcoal ramp (text), `amber` = muted terracotta #D97855 (warnings), new `gold` = soft gold #E8BD68 (highlights, selected details), `coral`/`red` = emergency crimson (SOS, calling, cancelling, errors only).
- **Layout**: light sidebar with forest selected item; Dashboard rebuilt to the reference arrangement (welcome banner with illustration, four differently treated stat boxes, adherence ring and chart, quick actions, medicine inventory, prescriptions, activity, expiry runway, waste outlook, and a right rail with a crimson Emergency SOS panel, reminders, appointments and refills). Inventory, Audit, Assistant, Appointments and Family use a shared `PageBanner`; `Card` has `tone` variants (plain, sage, ivory, gold, forest).
- **Only real data is shown.** The adherence ring and chart come from the recorded dose logs (unconfirmed doses are never counted as missed). Nothing was invented to fill the layout: this project has no lab-report, heart-rate or blood-pressure features, so no such boxes or numbers were added.
- **Motion** (`components/illustrations.jsx`, `index.css`): heartbeat on the hero heart, ECG line drawn once, chart and progress-bar entrance animations, page transitions, card hover lift. The Audit timeline line and ring grow only as steps really finish. `MotionConfig reducedMotion="user"`, `useReducedMotion` for charts and a CSS `prefers-reduced-motion` block switch it all off. The SOS button still does not pulse.
- **Charts** (Dashboard, Tracker, Waste) use the new palette; legends and text stay alongside colour.

## Stage 9: hackathon rules, agent safety and polish
- **Camera rule.** The hackathon rules say cameras may produce counts only, and nobody has approved prescription scanning. The app has **no live camera capture** (no `getUserMedia`, no `capture` attribute). `CAMERA_CAPTURE_APPROVED` in `src/config/policy.js` is `false`; the flag is only a marker, and camera code would have to be written after written approval. Manual entry is unchanged. Prescription images can come from the built-in **fictional** sample or a saved file, and a file upload needs a tick-box saying it is a fictional demo image (set `DEMO_UPLOADS_ALLOWED = false` to remove uploads). The notice is shown in the picker and in Settings. On some phones the file chooser itself may offer a camera; the tick-box tells people not to use it for real documents.
- **Agent Safety Policy** (Settings, `components/AgentPolicy.jsx`, text in `config/policy.js`): what the AI can and cannot do, which actions need confirmation, how prescription data is handled, what is simulated and what is fictional. Short notices with a link to it sit on the Audit and Assistant pages.
- **Deterministic agent tools** (`utils/agentTools.js`, unit tested): `daysRemaining`, `checkExpiry`, `findDuplicates`, `findLowStock` (with days of supply where a schedule exists), `reconcilePrescription`, `createEmergencyAlert`, `summarizeFindings`. The audit, the Dashboard and the SOS flow all call them; the old separate rule set in `AppContext.analyze` now delegates to them. Missing data comes back as missing (`null`), never as a guess.
- **AI Medicine Audit** (`pages/Audit.jsx`, `utils/auditEngine.js`): nine real steps (a new Stock Agent checks low stock). The progress ring fills only when a step finishes; each step shows its measured time; a step that throws shows **Failed** and the report is marked incomplete. Findings: expiry by recorded date, low stock, duplicates, prescription comparison, and a "what this report is unsure about" list. **Review and confirm** lists check-or-ask actions with tick-boxes; confirming records only that a person reviewed the report (it changes no medicine, dose or schedule and notifies no one). The engine label says "Rule-based checks, no AI model".
- **Privacy**: a setting (off by default) controls whether the Assistant may send age, conditions and allergies to a connected AI service (`VITE_ASSISTANT_URL`). With no service configured nothing leaves the browser.
- **Emergency**: SOS uses coral, the pulsing animation was removed, `createEmergencyAlert` builds the alert record, and the existing flows (112/108 `tel:` links, per-alert contact choice, caregiver contacts, confirm before cancel, "Simulated" statuses) are unchanged.
- **Look and feel**: ivory background, mint accents, coral reserved for emergencies, a serif face for page titles, a single status strip and an expiry-runway chart on the Dashboard.
- **Unit tests**: `npm test` runs `tests/agent-tools.test.mjs` in plain Node (no packages needed).

## Stage 8: sustainability and polish
- **Waste Analytics** (`#/waste`, `utils/waste.js`): expired, nearing expiry (60 days), total inventory, potential waste and a 12-month expiry forecast, all computed from the saved inventory, reminders and the "value of stock on hand" you enter per medicine. Units are never added across medicines. A projected leftover exists only when a fixed schedule is set in Reminders; otherwise it is shown as "not estimable" and left out of totals. **No environmental impact is calculated.** The trend is a forecast from today's inventory, not a history of past waste.
- **Disposal Guide** (`#/disposal`, `config/disposal.js`): general guidance (take-back first, no flushing or pouring away, secure storage, sharps and inhaler handling) that defers to local pharmacy and authorities. "I've disposed of this" removes the medicine and keeps a user-entered record; it does not dispose of anything or verify it. The content has not been reviewed by a pharmacist or regulator; two of the three linked sources describe US practice.
- **Price Comparison** (`#/compare`, `data/demoPrices.js`): fictional prices, labelled Demo everywhere. It states that products are not necessarily interchangeable and never recommends switching.
- **What-If Simulator** (`#/whatif`, `utils/whatif.js`): pure functions on copies of the data. Only stock changes are allowed (add a refill, change a quantity, set aside expired stock). Doses and treatment cannot be changed or stopped. Results appear in a dashed, hatched panel labelled SIMULATED beside the saved data and are discarded when you leave.
- **Polish**: pages load on demand (with a loading skeleton) and each has its own error boundary; styled confirmations replace browser dialogs; toasts; forms say what is missing; skip link, focus moves to the page after navigation, page titles, reduced-motion support, WCAG AA colour contrast (axe clean); the mobile menu is a proper drawer.
- **Data**: migration `migrate8` adds `disposals` and drops the old made-up monthly `waste` series. Older saved data upgrades automatically.

## Known limitations
- No allergy checking anywhere. The scanner and the medicine form do not compare medicines with recorded allergies.
- Emergency numbers are for India (112, 108, Tele-MANAS 14416). Confirm before real use.
- Disposal guidance and the assistant's safety rules have not been reviewed by clinicians or regulators.
- Value figures depend on what users type; unpriced medicines are excluded from rupee totals and the page says so.

## Stage 6: AI Health Assistant (`#/assistant`)
- `src/utils/safety.js`: deterministic emergency and urgent rules. They run before any reply is generated and show a static emergency card (no follow-up questions, no loading delay). Also holds the output guard that blocks diagnoses, medicine names/doses and reassurance in any generated text.
- `src/utils/assistant.js`: labelled sample replies (default) and an optional real-service call. Set `VITE_ASSISTANT_URL` to POST `{ system, messages, profile }` and read `{ reply }`. Safety rules and the output guard still apply. Profile data would leave the browser, so enable only with a service you trust.
- `src/utils/visitPrep.js`: plain-text notes builder for doctor visits.
- Data added to the saved state (migration `migrate6`): `symptoms`, `chats`, `visitNotes`. Older saved data upgrades automatically.
- Emergency numbers are for India (112, 108, Tele-MANAS 14416). Confirm before any real-world use.
- The rules are a prototype, have not been clinically validated, and can miss warning signs. Have a clinician review them before any real use.

## Stage 7: Emergency contacts and SOS (`#/contacts`, `#/sos`)
- **Contacts** (`pages/Contacts.jsx`): add, edit, delete family, caregivers, doctors, hospitals and ambulance services, each with notes, a primary flag (one per person) and a "Receive SOS alerts" switch. Older sample contacts upgrade automatically (migration `migrate7`) and are labelled Sample: their numbers are made up.
- **SOS button** (`components/sos/SosUi.jsx`): on the dashboard, the mobile header, the sidebar and the SOS page. It only opens a confirmation screen. Emergency type (General emergency is preselected), per-alert contact choice, and optional location and medical details (all OFF unless ticked). Sending needs a press-and-hold (or two taps for people who cannot hold).
- **Calling**: `tel:` links for 112 (emergency), 108 (ambulance), the primary family contact and doctor. They are at the top of the confirmation screen, the active screen and the banner, so they never depend on an alert being created. The app cannot place calls or know if one connected, and never says so.
- **Active alert** (`components/sos/ActiveEmergency.jsx`): SOS ACTIVE screen and a banner on every page until the alert is cancelled or marked resolved. Both need confirmation, and the dialog says it does not end a call or stop help. Optional simulated "status update" to contacts.
- **Notifications are simulated.** `services/notifications.js` is the only module that creates or delivers notifications. Statuses: Simulated sent, Pending, Failed (with Retry). Failures come from: no network, an invalid phone number, or the demo switch on the SOS page. All are labelled Simulated in the UI. Alerts that were pending when the page closed are shown as Failed.
- **Backend later**: add a provider `{ send({ notification, message }) => Promise<{ status: 'sent'|'failed', error? }> }` to `PROVIDERS` in `services/notifications.js` and set `NOTIFY_PROVIDER` in `config/sos.js`. A real service also needs consent for messaging, phone verification, delivery receipts, retries and a server-side audit log.
- **Privacy**: location and medical details go into a message only when ticked for that alert. "Remember these choices" is off by default. Everything, including coordinates, is stored in this browser's LocalStorage. Real medical data should not be stored or sent like this.
- **Limits**: the caregiver dashboard shows alerts only because patient and caregiver share one browser. Emergency numbers are for India; confirm before real use. Not clinically or legally reviewed.
=======
# MedGuard-AI
>>>>>>> 5378185919762de27699e4ca87e8e944f454ea43
