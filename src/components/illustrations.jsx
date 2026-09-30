// Decorative medical illustrations (inline SVG, no images to load). All are aria-hidden: they carry no information.
// Motion is CSS only (see index.css) and is switched off for people who ask their device for less motion.

// Welcome-section illustration: a heart with an ECG line, a stethoscope, a medical cross and capsules.
export function HeroIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mg-heart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E8BD68" /><stop offset="1" stopColor="#D97855" /></linearGradient>
        <linearGradient id="mg-cap" x1="0" y1="0" x2="1" y2="0"><stop offset="0.5" stopColor="#16876B" /><stop offset="0.5" stopColor="#F8F5EC" /></linearGradient>
      </defs>
      <circle cx="170" cy="104" r="84" fill="#DCE9DF" opacity="0.14" />
      <circle cx="170" cy="104" r="58" fill="#DCE9DF" opacity="0.14" />
      {/* stethoscope */}
      <path d="M96 40 v34 a26 26 0 0 0 52 0 V40" fill="none" stroke="#DCE9DF" strokeWidth="6" strokeLinecap="round" />
      <path d="M122 100 v22 a30 30 0 0 0 60 0 v-8" fill="none" stroke="#DCE9DF" strokeWidth="6" strokeLinecap="round" />
      <circle cx="182" cy="108" r="11" fill="#E8BD68" /><circle cx="182" cy="108" r="5" fill="#123B32" />
      <circle cx="96" cy="38" r="5" fill="#E8BD68" /><circle cx="148" cy="38" r="5" fill="#E8BD68" />
      {/* heart */}
      <g className="beat">
        <path d="M232 168 C 188 138, 186 108, 208 98 C 222 92, 232 100, 236 108 C 240 100, 250 92, 264 98 C 286 108, 284 138, 240 168 Z" fill="url(#mg-heart)" transform="translate(-6 -40) scale(1.05)" />
      </g>
      {/* ECG line */}
      <path className="ecg-line" d="M8 158 H70 l10 -22 l14 44 l14 -60 l14 76 l10 -38 H150 l12 -18 l10 18 H312" fill="none" stroke="#E8BD68" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* medical cross */}
      <g transform="translate(262 22)"><rect width="34" height="34" rx="9" fill="#F8F5EC" /><path d="M14 8h6v6h6v6h-6v6h-6v-6H8v-6h6z" fill="#16876B" /></g>
      {/* capsules */}
      <g transform="translate(20 84) rotate(-28)"><rect width="52" height="20" rx="10" fill="url(#mg-cap)" stroke="#DCE9DF" strokeWidth="1.5" /></g>
      <g transform="translate(228 138) rotate(32)"><rect width="42" height="16" rx="8" fill="#D97855" /><rect x="21" width="21" height="16" rx="8" fill="#F8F5EC" /></g>
    </svg>
  );
}

// Small heart-with-pulse mark used by the logo.
export function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="12" fill="#123B32" />
      <path d="M20 31 C 9 23, 9 14, 15.5 12.5 C 18 12, 19.6 13.4 20 14.6 C 20.4 13.4 22 12 24.5 12.5 C 31 14, 31 23, 20 31 Z" fill="#16876B" />
      <path d="M7 21 h7 l2.5 -5 l3.5 9 l3 -7 l1.5 3 H33" fill="none" stroke="#E8BD68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A quiet heartbeat line for card corners and empty states.
export function PulseLine({ className = '', loop = false, color = '#16876B' }) {
  return (
    <svg viewBox="0 0 200 40" className={className} aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <path className={loop ? 'ecg-loop' : 'ecg-line'} d="M0 22 H50 l8 -14 l10 30 l10 -34 l9 22 l5 -4 H200" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Faint pattern of crosses and capsules used behind dark panels.
export function MedPattern({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 200 120" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9">
        <path d="M30 20v16M22 28h16" /><path d="M150 84v16M142 92h16" /><path d="M96 12v10M91 17h10" />
        <rect x="120" y="22" width="34" height="14" rx="7" transform="rotate(-24 137 29)" /><rect x="38" y="70" width="30" height="12" rx="6" transform="rotate(28 53 76)" />
        <circle cx="180" cy="30" r="5" /><circle cx="14" cy="96" r="4" />
      </g>
    </svg>
  );
}
