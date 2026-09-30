// Stage 6 safety layer. Deterministic rules that run BEFORE any reply is generated
// (sample or real AI). If a rule matches, the emergency card is shown immediately and
// no generated text, follow-up question or model call is used for that message.
// These rules are a prototype and have NOT been clinically validated. They can miss things.

export const EMERGENCY_NUMBERS = { general: '112', ambulance: '108', crisis: '14416' };

const norm = (t) => ` ${t.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ')} `;
const NEG = /\b(no|not|without|never|denies|denied|nor|isn't|wasn't|doesn't|don't)\b/;

// True if at least one match of `re` is not negated within its own clause ("no chest pain").
function hit(text, re) {
  const g = new RegExp(re.source, 'gi'); let m;
  while ((m = g.exec(text))) {
    const clause = text.slice(0, m.index).split(/[.,;!?]|\bbut\b|\band\b/).pop();
    if (!NEG.test(clause.slice(-28))) return true;
    if (g.lastIndex === m.index) g.lastIndex++;
  }
  return false;
}
const any = (...res) => (t) => res.some((r) => hit(t, r));
const both = (a, b) => (t) => hit(t, a) && hit(t, b);

const BREATH = /\b(breath\w*|short(ness)? of breath|can'?t get (any )?air|gasping)\b/;
const CHEST = /\bchest (pain|pressure|tightness|discomfort|heaviness)|pain (in|across) (my |the )?chest|(tight|heavy|crushing) chest\b/;

export const EMERGENCY_RULES = [
  { id: 'breathing', title: 'Severe difficulty breathing',
    test: any(/\b(severe|extreme|serious|sudden|worsening|gasping|struggling)\b\W+(?:\w+\W+){0,3}(breath|short(ness)? of breath)/,
      /\b(can'?t|cannot|couldn'?t|unable to|not able to|hard to|trouble|difficult\w*|difficulty|struggl\w+)\W+(?:\w+\W+){0,3}breath/,
      /\b(blue|bluish|grey) (lips|face|fingers)\b/, /\b(gasping|choking|can'?t get (any )?air)\b/, /\bnot breathing\b/) },
  { id: 'chest', title: 'Chest pain with other warning signs',
    test: (t) => (hit(t, CHEST) && (hit(t, BREATH) || hit(t, /\b(sweat\w*|cold sweat|arm|jaw|shoulder|faint\w*|nausea|vomit\w*)\b/))) },
  { id: 'stroke', title: 'Possible stroke warning signs',
    test: any(/\b(sudden\w*)\W+(?:\w+\W+){0,4}(weak\w*|numb\w*|paraly\w*)/, /\b(weak\w*|numb\w*|paraly\w*)\W+(?:\w+\W+){0,4}(one side|left side|right side|half of)/,
      /\b(one[- ]sided|one side of)\W+(?:\w+\W+){0,3}(weak\w*|numb\w*)/, /\b(face|mouth) (is )?(droop\w*|drooping|sagging)|droopy face/,
      /\bslurred speech|can'?t speak|cannot speak|suddenly (can'?t|cannot|unable to) (speak|talk|see)|sudden (confusion|loss of vision|trouble speaking)/,
      /\b(worst headache|thunderclap)\b/) },
  { id: 'unconscious', title: 'Unconscious or not responding',
    test: any(/\bunconscious|unresponsive|not responding|won'?t wake|wouldn'?t wake|can'?t wake|cannot wake|not waking|passed out|collapsed|blacked out|no pulse|seizure|convulsion|fit(s)? (that|and) (won'?t|wont) stop/) },
  { id: 'bleeding', title: 'Heavy bleeding',
    test: any(/\b(heavy|severe|uncontrolled|non[- ]?stop|profuse) bleeding|bleeding (that )?(won'?t|will not|doesn'?t|does not) stop|soaking through|vomiting blood|coughing (up )?(a lot of )?blood/) },
  { id: 'allergy', title: 'Severe allergic reaction',
    test: (t) => hit(t, /\b(swelling|swollen) (of |in )?(the |my |his |her )?(face|lips|tongue|throat)|throat (is )?(closing|tight)|anaphyla\w+/) || (hit(t, /\ballergic reaction\b/) && hit(t, BREATH)) },
  { id: 'poison', title: 'Possible poisoning or overdose',
    test: any(/\boverdos\w*|swallowed (poison|bleach|kerosene|a lot of|too many)|took too many (pills|tablets|medicines?)|poison(ed|ing)\b/) },
  { id: 'sugar', title: 'Very low blood sugar with confusion',
    test: both(/\b(low (blood )?sugar|hypoglyc\w+|sugar (is )?(very )?low)\b/, /\b(confus\w+|drowsy|can'?t stay awake|shaking badly|unresponsive|seizure)\b/) },
  { id: 'meningitis', title: 'Fever with stiff neck',
    test: both(/\bfever|high temperature\b/, /\bstiff neck|neck (is )?stiff|light hurts (my|his|her) eyes\b/) },
  { id: 'selfharm', title: 'Thoughts of self-harm', crisis: true,
    test: any(/\bsuicid\w*|kill (myself|himself|herself)|end (my|his|her) (own )?life|want to die|hurt (myself|himself|herself)|self[- ]?harm/) },
];

// "Urgent" is not an emergency call, but the person should be told to get care promptly.
export const URGENT_RULES = [
  { id: 'breath_mild', title: 'Shortness of breath', test: any(BREATH) },
  { id: 'chest_alone', title: 'Chest pain or tightness', test: any(CHEST) },
  { id: 'blood', title: 'Blood in stool, urine or vomit', test: any(/\bblood (in|when).{0,12}(stool|urine|vomit|pee|poo)|black (tarry )?stools?|bloody (stool|urine)/) },
  { id: 'faint', title: 'Fainting', test: any(/\bfaint(ed|ing)?\b|fainting spell/) },
  { id: 'baby_fever', title: 'Fever in a very young baby', test: both(/\b(baby|infant|newborn)\b/, /\bfever|high temperature\b/) },
];

export function checkSafety(text) {
  const t = norm(text);
  const e = EMERGENCY_RULES.find((r) => r.test(t)); if (e) return { level: 'emergency', rule: e };
  const u = URGENT_RULES.find((r) => r.test(t)); if (u) return { level: 'urgent', rule: u };
  return { level: 'none' };
}

// Checks the new message alone, then together with the previous user message so a
// warning sign split across two messages ("chest pain" then "and I can't breathe") is caught.
export function checkConversation(text, history) {
  const now = checkSafety(text); if (now.level === 'emergency') return now;
  const prevUser = [...history].reverse().find((m) => m.role === 'user');
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
  if (prevUser && lastAssistant?.kind !== 'emergency') {
    const both2 = checkSafety(`${prevUser.text}. ${text}`); if (both2.level === 'emergency') return both2;
  }
  return now;
}

// Output guard: generated text (sample or AI service) must never diagnose, prescribe, give
// doses, or reassure. Anything that trips these patterns is replaced by a safe fallback.
const BAD = [
  /\b(you|he|she|they) (definitely |probably |likely |may |might |could )?(have|has) (a |an )?(\w+ )?(infection|flu|cold|virus|migraine|diabetes|asthma|pneumonia|\w+itis|\w+osis|\w+emia)\b/i,
  /\b(this|it) is (probably |likely |just |only )?(a |an )?(\w+ )?(infection|flu|cold|virus|migraine|allergy|\w+itis)\b/i,
  /\b\d+(\.\d+)?\s?(mg|mcg|ml|g|iu|units?|tablets?|pills?|capsules?|puffs?|drops?)\b/i,
  /\b(take|use|try|start|stop|increase|double|reduce|skip|give|apply)\s+(a |an |the |some |your |his |her |more |less )?(paracetamol|ibuprofen|aspirin|antibiotics?|tablets?|pills?|medicines?|medications?|dose|doses|syrup|inhaler|steroids?|painkillers?)\b/i,
  /\b(nothing to worry|not serious|harmless|perfectly normal|no cause for concern|nothing serious|nothing to be concerned|will (go|clear) away (on its own|by itself)|safe to ignore|is fine\b)/i,
];
export const GUARD_FALLBACK = 'I can only share general health information, and I can\'t assess what is causing symptoms or advise on medicines or doses. Please talk to a doctor or pharmacist about this. If symptoms are getting worse or you feel unsafe, seek medical care promptly.';
export const guardText = (text) => (BAD.some((r) => r.test(text)) ? { text: GUARD_FALLBACK, guarded: true } : { text, guarded: false });
