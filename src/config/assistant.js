// Optional real AI service. Leave VITE_ASSISTANT_URL unset to use labelled sample responses.
// If set, the app POSTs { system, messages, profile } and expects { reply: string }.
// Safety rules in utils/safety.js always run first and their output is never sent to the service.
// Note: profile data (age, conditions, allergies) would leave this browser. Only enable with a service you trust.
export const ASSISTANT_URL = import.meta.env.VITE_ASSISTANT_URL || '';
export const HAS_AI_SERVICE = Boolean(ASSISTANT_URL);
export const SYSTEM_RULES = 'You are a general health information assistant inside a family medicine app. Give general information only. Never diagnose, never suggest or name medicines to take, never give or change doses, never say symptoms are harmless or nothing to worry about. Ask at most three short follow-up questions when helpful. Encourage seeing a doctor or pharmacist. If there are warning signs, tell the person to seek emergency care.';
export const SAMPLE_LABEL = 'Sample response';
