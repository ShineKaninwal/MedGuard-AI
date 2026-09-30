// Hackathon rules and the Agent Safety Policy. One place, so the Settings page, the Audit page, the Assistant page
// and the Prescription entry all say the same thing, and the code paths that enforce a rule read the same flag.

// Camera: the hackathon rules say cameras may produce counts only. Nobody has approved prescription scanning,
// so live camera capture stays OFF. Set to true only after the organizers approve it in writing, AND add the
// capture code yourself: this flag alone does not turn a camera on anywhere.
export const CAMERA_CAPTURE_APPROVED = false;

// Uploading a saved image file (fictional demo prescriptions only). Set to false to remove uploads entirely,
// which leaves manual entry and the built-in fictional sample image.
export const DEMO_UPLOADS_ALLOWED = true;

export const CAMERA_NOTICE = 'Live camera capture is turned off. The hackathon rules allow cameras to produce counts only, and prescription scanning has not been approved by the organizers.';

export const POLICY = {
  can: [
    'Flag medicines whose recorded expiry date has passed or is within 60 days.',
    'Flag possible duplicates (same active ingredient or very similar names) for a pharmacist or doctor to review.',
    'Flag low stock, using the minimum you set and, where a fixed schedule exists, days of supply left.',
    'Compare a prescription list you entered with the inventory you entered, and say which matches are uncertain.',
    'Explain the information you entered, and say plainly when something is missing or unverified.',
    'Give general, non-diagnostic health information in the Assistant, with a reminder to ask a clinician.',
  ],
  cannot: [
    'Diagnose any condition or say whether symptoms are serious or harmless.',
    'Prescribe, recommend or choose medicines.',
    'Change a dose or a schedule, or tell anyone to start, stop, skip or swap a medicine.',
    'Make medical decisions or act on its own.',
    'Invent prescription details, doses, prices or expiry dates. Missing data is shown as missing.',
    'Buy medicines, book appointments, or contact anyone without you confirming.',
    'Check medicines against allergies. MedGuard does not do this.',
  ],
  confirm: [
    ['Adding, editing or deleting a medicine, prescription or reminder', 'You press Save or a confirmation button.'],
    ['Recording a refill, a quantity change or a disposal', 'You enter it and confirm. The app records what you say; it cannot verify it.'],
    ['Saving text read from a prescription image', 'You must check every low-confidence field first.'],
    ['Closing an audit report', 'You tick what you have checked and press Confirm review. This only records your review.'],
    ['Sending an SOS alert', 'A confirmation screen and a press-and-hold (or two taps). Cancelling an active alert also asks first.'],
    ['Sharing location or medical details in an alert', 'Every item is off unless you tick it for that alert.'],
  ],
  prescriptions: [
    'Prescription details exist only in this browser (LocalStorage). Nothing is uploaded, and no camera is used.',
    'You can type a prescription in, use the built-in fictional sample, or upload a saved fictional demo image.',
    'The "scanner" is simulated: it shows fixed sample text and does not read your image.',
    'Do not upload a real prescription, patient record or identity document. Demo uploads need a tick-box to confirm the file is fictional.',
  ],
  simulated: [
    'Prescription scanning (OCR): fixed sample text, does not read the image.',
    'SOS notifications (SMS and push): nothing is sent. Statuses read "Simulated sent".',
    'Assistant replies: pre-written samples unless you connect a service; not clinically validated.',
    'Caregiver and Patient roles: a demo switch with no login.',
    'Price comparison: made-up demo prices. What-If results: never saved.',
  ],
  real: [
    'Expiry, duplicate, low-stock, days-of-supply and prescription-versus-inventory checks are ordinary deterministic code run on your saved data. They are not an AI model and not clinically validated.',
    'The 112 and 108 buttons are tel: links. They open your dialer; the app cannot place a call or know if one connected.',
  ],
  fictional: [
    'All patients (Ravi, Meena and Arjun Kumar), medicines, prescriptions, doctors, contacts and phone numbers are made up.',
    'Do not enter real patient files, identity documents, faces or number plates. The app stores none of these.',
  ],
};
