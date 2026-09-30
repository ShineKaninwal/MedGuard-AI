// Phone helpers shared by contacts and SOS calling.
export const digits = (p) => String(p || '').replace(/\D/g, '');
// 7 to 15 digits (E.164 maximum), only digits, spaces, + - ( ) allowed.
export const validPhone = (p) => /^\+?[\d\s\-()]+$/.test(String(p || '').trim()) && digits(p).length >= 7 && digits(p).length <= 15;
export const telHref = (p) => { const t = String(p || '').trim(); return `tel:${t.startsWith('+') ? '+' : ''}${digits(t)}`; };
