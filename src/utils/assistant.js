// Prototype reply engine. Replies are pre-written SAMPLES, not clinical advice and not clinically validated.
// Emergency screening (utils/safety.js) always runs first in the page and short-circuits this file.
import { ASSISTANT_URL, HAS_AI_SERVICE, SYSTEM_RULES } from '../config/assistant';
import { guardText } from './safety';

const uid = () => `cm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const mk = (role, text, extra = {}) => ({ id: uid(), role, text, ts: Date.now(), kind: 'text', ...extra });

const TOPICS = {
  headache: { label: 'headache', re: /\bheadache|head (is )?(pounding|hurts|aching)|migraine\b/,
    ask: ['Where is the pain (one side, forehead, back of the head)?', 'Did it start suddenly or build up slowly?', 'Any nausea, sensitivity to light, vision changes or fever with it?'],
    info: 'Headaches have many possible causes, from tiredness and dehydration to eye strain, stress or illness. Noting when it happens, how long it lasts and what else you notice helps a doctor much more than the headache alone.',
    care: ['it started suddenly and is the worst you have ever had', 'it follows a head injury', 'it comes with confusion, weakness, trouble speaking, a stiff neck or fever', 'it keeps coming back or is getting worse over days'] },
  fever: { label: 'fever', re: /\bfever|temperature|feverish|chills|shivering\b/,
    ask: ['What temperature did you measure, and how (mouth, ear, forehead)?', 'How many days has it lasted?', 'Any cough, sore throat, rash, pain when passing urine, or vomiting?'],
    info: 'A fever is a sign that the body is reacting to something, and there are many possible reasons. How high it is, how long it lasts and what comes with it are the details a clinician will ask about. Resting and drinking fluids are common general comfort measures.',
    care: ['the fever lasts more than about three days', 'there is a rash, a stiff neck, confusion or severe drowsiness', 'the person is very young, elderly, or has a long-term condition', 'there are signs of dehydration such as very little urine'] },
  cough: { label: 'cough', re: /\bcough\w*|phlegm|wheez\w*\b/,
    ask: ['Is it dry, or are you bringing up phlegm (and what colour)?', 'How long have you had it?', 'Any fever, wheezing, or breathlessness on climbing stairs?'],
    info: 'Coughs can follow common infections, be linked to allergies or airway conditions, or come from other causes. The length of time and whether there is wheezing, fever or phlegm are the key details to share with a doctor.',
    care: ['it lasts more than two to three weeks', 'you cough up blood', 'you have wheezing or breathlessness', 'there is fever with chest pain or a feeling of being very unwell'] },
  throat: { label: 'sore throat', re: /\bsore throat|throat (pain|hurts|is sore)|swallowing (hurts|pain)|painful swallowing\b/,
    ask: ['How long has it been sore?', 'Any fever, swollen glands, or white patches you can see?', 'Is swallowing painful enough to affect drinking?'],
    info: 'Sore throats are common and have many causes. Being able to drink fluids and how long it lasts matter when deciding whether to be seen.',
    care: ['you cannot swallow fluids or are drooling', 'you have trouble breathing or a muffled voice', 'it lasts more than about a week', 'you have a high fever or a rash'] },
  stomach: { label: 'stomach upset', re: /\b(stomach|abdominal|belly|tummy)\b|\bnausea|nauseous|vomit\w*|diarrh\w+|loose motions?|constipat\w+\b/,
    ask: ['How long has this been going on?', 'Roughly how often are you vomiting or passing loose stools, and are you able to keep fluids down?', 'Any fever, severe pain in one spot, or blood in vomit or stool?'],
    info: 'Stomach upsets are common and have many causes. The main general concern is losing too much fluid, so noticing how much is being drunk and passed matters.',
    care: ['you cannot keep any fluids down', 'there is blood in vomit or stool', 'the pain is severe or stays in one spot', 'there are signs of dehydration such as dizziness, dry mouth or very little urine', 'the person is a young child or elderly'] },
  dizzy: { label: 'dizziness', re: /\bdizz\w+|light-?headed|spinning|vertigo\b/,
    ask: ['Does the room spin, or do you feel about to faint?', 'Does it happen when you stand up, turn your head, or at any time?', 'Any hearing changes, headache, chest discomfort or palpitations with it?'],
    info: 'Dizziness can come from many sources, including the inner ear, blood pressure changes, dehydration or medicines. A doctor will want to know what triggers it and how long each episode lasts.',
    care: ['it comes with weakness, numbness, trouble speaking or vision changes', 'you faint or nearly faint', 'it comes with chest discomfort or a racing heartbeat', 'it keeps happening'] },
  fatigue: { label: 'tiredness', re: /\b(tired|fatigue\w*|exhaust\w*|no energy|weak(ness)?|lethargic)\b/,
    ask: ['How long have you felt this way?', 'Has your sleep, appetite or weight changed?', 'Anything else you have noticed, such as low mood, breathlessness or feeling cold?'],
    info: 'Ongoing tiredness has many possible causes, including sleep, stress, diet, medicines and medical conditions, so a doctor usually asks a broad set of questions.',
    care: ['it lasts more than a couple of weeks', 'it comes with unexplained weight loss, breathlessness or fainting', 'it affects daily activities'] },
  skin: { label: 'skin problem', re: /\brash|itch\w*|hives|skin (is )?(red|peeling|burning)|blister\w*|swelling\b/,
    ask: ['Where on the body is it, and is it spreading?', 'When did it start, and did anything new happen (new food, product, medicine, insect bite)?', 'Any fever, pain, or swelling of the face or lips?'],
    info: 'Skin changes can be triggered by many things. Photos taken over time, and a list of anything new in the last few days, are useful to show a doctor.',
    care: ['it spreads quickly', 'it is painful, blistering or comes with fever', 'there is swelling of the face, lips or tongue', 'it started after a new medicine'] },
  pain: { label: 'pain', re: /\b(joint|knee|back|neck|shoulder|muscle|leg|arm|hip) (pain|ache|aching|stiff\w*)|\bbody ache|\bpain\b|\bache\b/,
    ask: ['Where exactly is the pain, and does it spread anywhere?', 'Did it start after an injury or activity, or gradually?', 'Is there swelling, redness, numbness, or does it wake you at night?'],
    info: 'Pain can have many causes. What makes it better or worse, and how it affects movement and sleep, are useful to record for a doctor visit.',
    care: ['it followed a fall or injury and you cannot use the limb', 'there is numbness, weakness or loss of bladder or bowel control', 'the area is hot, red and swollen', 'it is getting steadily worse'] },
  urinary: { label: 'urinary symptoms', re: /\burin\w+|pee\b|burning (when|while)|passing urine|bladder\b/,
    ask: ['How long has this been happening?', 'Any burning, needing to go very often, or blood in the urine?', 'Any fever, back pain or vomiting?'],
    info: 'Urinary symptoms have several possible causes and are usually assessed with a conversation and sometimes a simple test. Drinking enough fluids is a common general measure.',
    care: ['there is fever or back or side pain', 'there is blood in the urine', 'you cannot pass urine', 'symptoms continue or keep returning'] },
  sleep: { label: 'sleep trouble', re: /\b(can'?t|cannot|trouble|difficulty) (sleep|falling asleep)|insomnia|sleepless|not sleeping\b/,
    ask: ['How long has your sleep been disturbed?', 'Is it hard to fall asleep, or do you wake during the night?', 'Anything changed recently, such as stress, routine, or new medicines?'],
    info: 'Sleep problems are common and often linked to routine, stress, health conditions or medicines. A simple sleep diary is helpful to bring to a doctor.',
    care: ['it lasts several weeks', 'it affects your mood or daily functioning', 'you snore loudly or stop breathing during sleep'] },
};
const detectTopic = (t) => Object.entries(TOPICS).find(([, v]) => v.re.test(t.toLowerCase()))?.[0];

const BOUNDARY = [
  { re: /\b(what|which)\b.{0,30}\b(medicine|medication|tablet|drug|antibiotic|painkiller)\b.{0,30}\b(should|can|to)\b.{0,12}\b(i|he|she|we|take|give|use)\b|\bprescribe\b|\bwhat should i take\b/i,
    text: "I can't recommend or prescribe medicines. A doctor or pharmacist who knows the full picture, including allergies and current medicines, is the right person to ask. I can help you write down your symptoms and questions so the visit goes further." },
  { re: /\b(how (much|many)|dose|dosage|double|increase|reduce|skip|stop taking|missed (a )?dose)\b.{0,40}\b(tablets?|pills?|capsules?|medicines?|medications?|doses?|puffs?|syrup|insulin|metformin|amlodipine|paracetamol)\b|\b(dose|dosage)\b/i,
    text: "I can't advise on doses or on changing, skipping or stopping a medicine. Please ask the prescribing doctor or a pharmacist. If a dose was missed or something feels wrong after a medicine, contact them or seek medical care. You can note the question in Visit preparation." },
  { re: /\b(do i|does he|does she|do we|is it|could it be|am i|what do i|what does he|what does she) (have|be|got)\b.{0,40}|\bdiagnos\w*|\bwhat (disease|illness|condition)\b|\bwhat is (wrong|causing)\b/i,
    text: "I can't diagnose what is causing symptoms. Many different conditions can look alike, and only a clinician who can examine the person and order tests can assess that. I can share general information and help you note down details to take to a doctor." },
  { re: /\b(is it|are they|is this) (serious|dangerous|harmless|nothing|okay|ok|safe|normal)\b|\bshould i (worry|be worried)|\bnothing to worry\b/i,
    text: "I can't judge how significant symptoms are or offer reassurance, because I can't examine anyone and many symptoms have more than one possible cause. If you are worried, or something is getting worse, please speak to a doctor. Seek emergency care straight away for trouble breathing, chest pain, sudden weakness on one side, confusion, or unresponsiveness." },
];

const ctxLines = (p) => {
  const out = [];
  if (p.conditions?.length) out.push(`${p.name.split(' ')[0]} has ${p.conditions.join(' and ')} on record, so mention this to any clinician.`);
  if (p.allergies?.length) out.push(`Recorded allergies: ${p.allergies.join(', ')}. Tell any doctor or pharmacist before anything new is suggested.`);
  if (p.age && p.age < 12) out.push('For children, a paediatrician or a doctor experienced with children is the right person to assess symptoms.');
  if (p.age && p.age >= 65) out.push('Older adults can become unwell more quickly, so it is reasonable to seek advice sooner.');
  return out;
};

export function parseDuration(t) {
  const s = t.toLowerCase();
  const m = s.match(/(\d+|a|an|one|two|three|four|five|six|seven|few|couple of)\s*(hours?|days?|weeks?|months?)/);
  if (m) return `${m[1] === 'a' || m[1] === 'an' ? '1' : m[1]} ${m[2]}`;
  if (/since (yesterday|last night|this morning)/.test(s)) return s.match(/since (yesterday|last night|this morning)/)[0];
  if (/\bfor (a )?(day|week|month)\b/.test(s)) return s.match(/for (a )?(day|week|month)/)[0];
  return '';
}
export function parseSeverity(t) {
  const s = t.toLowerCase(); const n = s.match(/\b(10|[1-9])\s*(\/|out of)\s*10\b/); if (n) return Number(n[1]);
  if (/unbearable|worst|excruciating|very severe/.test(s)) return 9; if (/\bsevere|really bad|terrible\b/.test(s)) return 8;
  if (/moderate|medium|quite bad/.test(s)) return 5; if (/\bmild|slight|little|not too bad\b/.test(s)) return 2; return null;
}

const footer = 'This is general information from a prototype and not medical advice.';
function infoReply(topicKey, symptomText, allText, patient) {
  const t = TOPICS[topicKey]; const ctx = ctxLines(patient);
  const text = [
    `Thanks for the details. Here is some general information about ${t.label}.`, t.info,
    `Seek medical care promptly if:\n${t.care.map((c) => `- ${c}`).join('\n')}`,
    ctx.length ? `About ${patient.name.split(' ')[0]}:\n${ctx.map((c) => `- ${c}`).join('\n')}` : '',
    `I can't tell you what is causing this or what to take. You can save this to symptom history and prepare notes for a doctor visit. ${footer}`,
  ].filter(Boolean).join('\n\n');
  return { text, kind: 'info', topic: topicKey, draft: { text: symptomText.trim(), duration: parseDuration(allText), severity: parseSeverity(allText) } };
}
function followUp(topicKey, symptomText) {
  const t = TOPICS[topicKey];
  return { text: `I'm sorry you're dealing with this. I can't say what is causing it, but a few details will help you describe it clearly to a doctor:\n\n${t.ask.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nAnswer in your own words, or tap a quick answer below. If anything feels sudden or severe, tell me now.`,
    kind: 'followup', topic: topicKey, symptomText, chips: ['For a day or two, mild', 'About a week, moderate', 'More than two weeks, it is getting worse', 'It came on suddenly and is severe'] };
}

export function sampleReply(text, history, patient) {
  const b = BOUNDARY.find((x) => x.re.test(text)); if (b) return { text: `${b.text}\n\n${footer}`, kind: 'boundary' };
  const last = [...history].reverse().find((m) => m.role === 'assistant');
  const topic = detectTopic(text);
  if (last?.kind === 'followup' && !topic) return infoReply(last.topic, last.symptomText, `${last.symptomText} ${text}`, patient);
  if (topic) return parseDuration(text) && parseSeverity(text) !== null ? infoReply(topic, text, text, patient) : followUp(topic, text);
  if (/\b(visit|appointment|doctor|prepare|notes)\b/i.test(text)) return { kind: 'text', text: 'You can review saved symptoms and build a notes sheet in the Visit preparation tab. It lists your own entries, current medicines on record, and your questions. It does not book appointments or suggest treatment.', chips: ['Describe a symptom'] };
  return { kind: 'text', text: `I can share general health information and help you describe symptoms clearly for a doctor. Tell me what ${patient.name.split(' ')[0]} is experiencing in your own words, including when it started and how strong it feels.\n\n${footer}`, chips: ['Headache for two days', 'Fever since yesterday', 'Cough for a week'] };
}

// Real service (optional). Falls back to the labelled sample on any failure.
// shareProfile: the user's consent to send age, conditions and allergies to the connected service. Off = the profile is not sent.
export async function generateReply(text, history, patient, { shareProfile = false } = {}) {
  if (HAS_AI_SERVICE) {
    try {
      const res = await fetch(ASSISTANT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: SYSTEM_RULES, messages: [...history, { role: 'user', text }].slice(-12).map((m) => ({ role: m.role, content: m.text })),
          profile: shareProfile ? { age: patient.age, conditions: patient.conditions, allergies: patient.allergies } : null }) });
      const data = await res.json(); const g = guardText(String(data.reply || ''));
      if (data.reply) return { text: g.text, kind: 'text', source: 'service', guarded: g.guarded };
    } catch { /* fall through to the sample */ }
  }
  const r = sampleReply(text, history, patient); const g = guardText(r.text);
  return { ...r, text: g.text, source: 'sample', guarded: g.guarded, ...(g.guarded && { kind: 'boundary', chips: undefined, draft: undefined }) };
}

export const SUGGESTED = (p) => {
  const base = ['I have a headache that started two days ago', 'My throat is sore and I have a mild fever', 'I feel dizzy when I stand up', 'How should I prepare for a doctor visit?'];
  if (p.age && p.age < 12) return ['My child has had a cough for a week', 'My child has a fever since yesterday', 'My child has a stomach ache and nausea', 'How should I prepare for a doctor visit?'];
  if (p.conditions?.some((c) => /arthritis/i.test(c))) return ['My knee joints are stiff and painful in the morning', ...base.slice(0, 2), base[3]];
  return base;
};
