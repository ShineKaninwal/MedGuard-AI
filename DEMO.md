# MedGuard AI: five-minute demo

Everything below uses the built-in **fictional** sample family (Ravi, Meena and Arjun Kumar). The same script is inside the app at `#/demo`, with a **Start fresh demo** button that resets to the sample data.

Before you start: open the app, go to **Demo Guide**, select **Start fresh demo**.

| # | Time | Page | Show | Simulated? |
|---|------|------|------|------------|
| 1 | 0:30 | Dashboard | Ravi selected; today's reminders, low stock, expiry counters; red SOS panel; the waste card (computed from the real inventory) | Oldest 3 activity entries are labelled "Sample entry" |
| 2 | 0:40 | Medicine Inventory | Expired Cough Syrup DX (red); Paracetamol and Dolo share an ingredient. **Add medicine**: "Demo Multivitamin", ingredient "Multivitamin", qty 30, expiry about 3 weeks out, value 120 | No |
| 3 | 0:50 | AI Medicine Audit | Run the audit for Ravi; read the findings (expired syrup, expiring paracetamol, duplicate). Then tick the actions you have checked and press **Confirm review** (it only records your review). Optional: Prescriptions > **Demo scan (simulated)** > "Use a sample prescription image" > choose **Meena** > tick low-confidence fields > save | **Yes**: "agents" are fixed rule-based checks; the scan shows sample text and does not read the image |
| 4 | 0:40 | Tracker, then Refill Planner | Mark a dose Taken (unconfirmed doses are never counted as missed). Amlodipine is low: record a refill of 30 | No |
| 5 | 0:40 | Caregiver Dashboard | Whole-family view. Leave this tab for step 6 | Caregiver/Patient is a demo switch, no login |
| 6 | 0:50 | Emergency SOS | SOS button > pick type > **press and hold** (or tick "I can't hold" and tap twice) > SOS ACTIVE with 112/108 call links > back to Caregiver Dashboard to see the alert > mark resolved | **Yes**: contact notifications are simulated (Simulated sent / Pending / Failed + Retry); nothing leaves the browser; numbers are fictional |
| 7 | 0:50 | Waste Analytics, Disposal Guide, What-If | Expired / nearing expiry / total / potential waste / 12-month forecast; open "How this is calculated"; mark the expired syrup as disposed; What-If > "Try an example" and compare the dashed SIMULATED panel with saved data | What-If is never saved. Price Comparison (optional) uses made-up demo prices |

Total 5:00.

## Talking points
- No environmental-impact figures are shown, because that needs verified data the prototype does not have.
- Waste figures come only from quantities, expiry dates and values entered in the app. Where a schedule is missing, the app says "not estimable" instead of guessing.
- Call buttons are `tel:` links; the app never claims a call connected.
- Camera capture is off on purpose: the hackathon rules allow cameras to produce counts only. Prescriptions are typed in, taken from the fictional sample image, or uploaded as a fictional demo file.
- The Agent Safety Policy is in Settings.
- The app does **not** check medicines against allergies (Ravi has a recorded penicillin allergy, which is why the scan step uses Meena).
