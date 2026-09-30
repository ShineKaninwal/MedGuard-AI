// MedGuard AI colour identity: forest, emerald, sage, ivory, charcoal, terracotta and gold.
// The original token names (navy, teal, mint, ivory, coral, slate, amber, emerald) are kept so every page
// picks up the new palette without changing any logic; only the values changed.
//   navy    = deep forest green  (#123B32)  important sections, selected navigation
//   teal    = emerald            (#16876B)  primary buttons, positive indicators
//   mint    = soft sage          (#DCE9DF)  secondary cards and backgrounds
//   ivory   = warm ivory         (#F8F5EC)  page background
//   slate   = warm charcoal ramp (#242B29)  text and neutral surfaces
//   amber   = muted terracotta   (#D97855)  warnings and attention
//   gold    = soft gold          (#E8BD68)  highlights and selected details
//   coral   = emergency crimson             reserved for SOS, calling and cancelling an alert
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#0C2A23', 900: '#123B32', 800: '#1A4A3F', 700: '#245A4D', 600: '#2F6F60' },
        teal: { 50: '#EAF5F0', 100: '#D3EBE1', 200: '#A9D7C7', 400: '#3FA88A', 500: '#16876B', 600: '#127A61', 700: '#0F634E', 800: '#0C4D3D', 900: '#093B2F' },
        emerald: { 50: '#EAF5F0', 100: '#D3EBE1', 500: '#16876B', 600: '#127A61', 700: '#0F634E', 900: '#093B2F' },
        mint: { 50: '#F2F7F3', 100: '#DCE9DF', 200: '#C5D9CA', 300: '#A9C4B0', 500: '#5DBB9C', 700: '#0F634E' },
        ivory: { 50: '#FCFAF5', 100: '#F8F5EC', 200: '#EEE8D7', 300: '#E2DAC3' },
        slate: { 50: '#F6F4EE', 100: '#EDEAE0', 200: '#DEDACD', 300: '#C4C0B2', 400: '#9AA09A', 500: '#59615D', 600: '#454D49', 700: '#353C39', 800: '#2B3230', 900: '#242B29' },
        amber: { 50: '#FBEFE8', 100: '#F6DDD0', 200: '#EEC1AC', 300: '#E6A085', 400: '#D97855', 500: '#C9653F', 600: '#B25234', 700: '#94432A', 800: '#763720', 900: '#5B2A18' },
        gold: { 50: '#FCF6E6', 100: '#F8EAC5', 200: '#F2D89B', 300: '#EDC983', 400: '#E8BD68', 500: '#D8A84A', 600: '#B98A2E', 700: '#7F5F17' },
        red: { 50: '#FFF1F0', 100: '#FFDEDB', 200: '#FFBDB7', 300: '#FF9A92', 400: '#F0665D', 500: '#D92D2A', 600: '#C21A22', 700: '#A0131B', 800: '#7C0E15', 900: '#570A0F' },
        coral: { 50: '#FFF1F0', 100: '#FFDEDB', 200: '#FFBDB7', 300: '#FF9A92', 400: '#F0665D', 500: '#D92D2A', 600: '#C21A22', 700: '#A0131B', 800: '#7C0E15', 900: '#570A0F' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'], display: ['Fraunces', 'Georgia', 'serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(18,59,50,.05), 0 8px 24px -10px rgba(18,59,50,.14)',
        lift: '0 2px 4px rgba(18,59,50,.06), 0 16px 32px -12px rgba(18,59,50,.22)',
        soft: '0 1px 2px rgba(18,59,50,.04)',
      },
      keyframes: {
        heartbeat: { '0%,100%': { transform: 'scale(1)' }, '14%': { transform: 'scale(1.07)' }, '28%': { transform: 'scale(1)' }, '42%': { transform: 'scale(1.05)' }, '70%': { transform: 'scale(1)' } },
        ecg: { to: { strokeDashoffset: '0' } },
        rise: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { heartbeat: 'heartbeat 1.6s ease-in-out infinite', rise: 'rise .45s ease-out both' },
    },
  },
  plugins: [],
};
